/**
 * Pyodide executor for running subview Python code in the browser.
 * Loads Pyodide on first use, then runs functions with context and inputs.
 */
import { loadPyodide } from 'pyodide';
import type { PyodideInterface } from 'pyodide';

let pyodidePromise: Promise<PyodideInterface> | null = null;

export async function getPyodide(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide();
  }
  return pyodidePromise;
}

export interface RunResult {
  success: true;
  value: unknown;
  /** Captured stdout/stderr from print() and logging */
  log?: string;
}

export interface RunError {
  success: false;
  error: string;
  line?: number;
}

export type RunFunctionResult = RunResult | RunError;

/**
 * Run a Python function by name with context and inputs.
 * The pythonCode must define the function; we inject context and inputs as globals.
 */
export async function runPythonFunction(
  pythonCode: string,
  functionName: string,
  context: unknown,
  inputs: Record<string, unknown>
): Promise<RunFunctionResult> {
  try {
    const pyodide = await getPyodide();
    const logLines: string[] = [];
    const capture = (str: string) => logLines.push(str);
    pyodide.setStdout({ batched: capture });
    pyodide.setStderr({ batched: (str) => logLines.push(`[stderr] ${str}`) });
    try {
      // Normalize checkbox-like values (0/1) to booleans for reliable Python truthiness
      const normalizedInputs: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(inputs)) {
        normalizedInputs[k] = v === 0 || v === 1 ? v === 1 : v;
      }
      const pyContext = pyodide.toPy(context);
      const pyInputs = pyodide.toPy(normalizedInputs);
      // Use per-call unique keys so concurrent runPythonFunction calls don't overwrite each other's globals
      const callId = `_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      const ctxKey = `__py_ctx${callId}`;
      const inpKey = `__py_inp${callId}`;
      pyodide.globals.set(ctxKey, pyContext);
      pyodide.globals.set(inpKey, pyInputs);

      // Run the function definitions
      await pyodide.runPythonAsync(pythonCode);

      // Call with our per-call keys; no other caller can overwrite these
      const result = await pyodide.runPythonAsync(`${functionName}(${ctxKey}, ${inpKey})`);

      pyodide.globals.delete(ctxKey);
      pyodide.globals.delete(inpKey);

      return {
        success: true,
        value: result?.toJs ? result.toJs() : result,
        log: logLines.length > 0 ? logLines.join('\n') : undefined,
      };
    } finally {
      pyodide.setStdout();
      pyodide.setStderr();
    }
  } catch (e) {
    const err = e instanceof Error ? e : String(e);
    const msg = err.toString();
    const lineMatch = msg.match(/line (\d+)/);
    return {
      success: false,
      error: msg,
      line: lineMatch ? parseInt(lineMatch[1], 10) : undefined,
    };
  }
}

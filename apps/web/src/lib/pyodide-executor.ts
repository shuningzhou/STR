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
      // Convert JS objects to native Python dicts/lists so subscript access works
      pyodide.globals.set('context', pyodide.toPy(context));
      pyodide.globals.set('inputs', pyodide.toPy(inputs));

      // Run the function definitions
      await pyodide.runPythonAsync(pythonCode);

      // Call the function
      const result = await pyodide.runPythonAsync(`${functionName}(context, inputs)`);

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

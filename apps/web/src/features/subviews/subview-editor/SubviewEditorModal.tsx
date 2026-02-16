import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Trash2,
  Save,
  X,
  AlertCircle,
  Braces,
  FileCode,
  Receipt,
  Wallet,
  CheckCircle,
  Wand2,
  RotateCcw,
  FileText,
  Play,
  Loader2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Button } from '@/components/ui';
import { safeParseSubviewSpec, type SubviewSpec } from '@str/shared';
import { runPythonFunction } from '@/lib/pyodide-executor';
import { SEED_CONTEXT, SEED_INPUTS } from '@/lib/subview-seed-data';
import { BLANK_SPEC } from './BLANK_SPEC';
import { WIN_RATE_EXAMPLE } from './WIN_RATE_EXAMPLE';
import { MiniCanvasPreview } from './MiniCanvasPreview';
import { cn } from '@/lib/utils';

const DEFAULT_LEFT_WIDTH = 50;
const MIN_LEFT_WIDTH = 25;
const MAX_LEFT_WIDTH = 75;

export function SubviewEditorModal() {
  const strategies = useStrategyStore((s) => s.strategies);
  const removeSubview = useStrategyStore((s) => s.removeSubview);
  const updateSubviewSpec = useStrategyStore((s) => s.updateSubviewSpec);
  const { subviewSettingsOpen, setSubviewSettingsOpen } = useUIStore();

  const strategy = subviewSettingsOpen
    ? strategies.find((s) => s.id === subviewSettingsOpen.strategyId)
    : null;
  const subview = strategy?.subviews.find((sv) => sv.id === subviewSettingsOpen?.subviewId);

  const initialSpec = useMemo((): SubviewSpec => {
    if (subview?.spec) return subview.spec;
    return BLANK_SPEC as unknown as SubviewSpec;
  }, [subview?.spec]);

  const [jsonText, setJsonText] = useState(() => JSON.stringify(initialSpec, null, 2));
  const [pythonText, setPythonText] = useState(initialSpec.python_code);
  const [parseResult, setParseResult] = useState<
    { success: true; data: SubviewSpec } | { success: false; error: string }
  >({ success: true, data: initialSpec });
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState<'json' | 'python' | 'transactions' | 'wallet'>('json');
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [seedDataKey, setSeedDataKey] = useState(0);
  const [previewInputs, setPreviewInputs] = useState<Record<string, unknown>>(
    () => SEED_INPUTS as Record<string, unknown>
  );
  const splitterRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleSplitterPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (ev: PointerEvent) => {
      const container = bodyRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(MAX_LEFT_WIDTH, Math.max(MIN_LEFT_WIDTH, pct)));
    };
    const handlePointerUp = (ev: PointerEvent) => {
      splitterRef.current?.releasePointerCapture(ev.pointerId);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, []);

  const handleClose = useCallback(() => {
    setSubviewSettingsOpen(null);
    setDeleteConfirm(false);
    setTestResult(null);
  }, [setSubviewSettingsOpen]);

  const validateJson = useCallback(() => {
    const result = safeParseSubviewSpec(jsonText);
    if (result.success) {
      setParseResult({ success: true, data: result.data });
    } else {
      setParseResult({
        success: false,
        error: result.error.issues.map((i) => `${String(i.path?.join?.('.') ?? '')}: ${i.message ?? ''}`).join('\n'),
      });
    }
  }, [jsonText]);

  const handleJsonChange = useCallback(
    (value: string | undefined) => {
      setJsonText(value ?? '');
      const result = safeParseSubviewSpec(value ?? '');
      if (result.success) setParseResult({ success: true, data: result.data });
      else setParseResult({ success: false, error: 'Invalid JSON or schema' });
    },
    []
  );

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      setJsonText(JSON.stringify(parsed, null, 2));
    } catch {
      setParseResult({ success: false, error: 'Invalid JSON - cannot format' });
    }
  }, [jsonText]);

  const handleReset = useCallback(() => {
    if (!window.confirm('Reset JSON and Python to blank spec? Unsaved changes will be lost.')) return;
    setJsonText(JSON.stringify(BLANK_SPEC, null, 2));
    setPythonText((BLANK_SPEC as unknown as SubviewSpec).python_code);
    setParseResult({ success: true, data: BLANK_SPEC as unknown as SubviewSpec });
  }, []);

  const handleLoadExample = useCallback(() => {
    if (!window.confirm('Load example? Current spec will be replaced.')) return;
    setJsonText(JSON.stringify(WIN_RATE_EXAMPLE, null, 2));
    setPythonText((WIN_RATE_EXAMPLE as unknown as SubviewSpec).python_code);
    setParseResult({ success: true, data: WIN_RATE_EXAMPLE as unknown as SubviewSpec });
  }, []);

  const handleResetSeedData = useCallback(() => {
    if (!window.confirm('Reset seed data to default?')) return;
    setSeedDataKey((k) => k + 1);
  }, []);

  const handleTestFunctions = useCallback(async () => {
    const result = safeParseSubviewSpec(jsonText);
    if (!result.success) {
      setTestResult('Fix JSON validation errors first');
      return;
    }
    const spec = result.data;
    setTestLoading(true);
    setTestResult(null);
    try {
      const outputs: string[] = [];
      for (const fn of spec.functions) {
        const run = await runPythonFunction(
          pythonText,
          fn,
          SEED_CONTEXT,
          SEED_INPUTS as Record<string, unknown>
        );
        if (run.success) {
          outputs.push(`${fn}() => ${JSON.stringify(run.value)}`);
        } else {
          outputs.push(`${fn}() ERROR: ${run.error}`);
          break;
        }
      }
      setTestResult(outputs.length > 0 ? outputs.join('\n') : 'No functions to test');
    } catch (e) {
      setTestResult(String(e));
    } finally {
      setTestLoading(false);
    }
  }, [jsonText, pythonText]);

  const handleSave = useCallback(() => {
    const result = safeParseSubviewSpec(jsonText);
    if (!result.success || !subviewSettingsOpen || !strategy) return;
    updateSubviewSpec(subviewSettingsOpen.strategyId, subviewSettingsOpen.subviewId, {
      ...result.data,
      python_code: pythonText,
    });
    setSubviewSettingsOpen(null);
  }, [jsonText, pythonText, subviewSettingsOpen, strategy, updateSubviewSpec, setSubviewSettingsOpen]);

  const handleDelete = useCallback(() => {
    if (!subviewSettingsOpen || !strategy) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    removeSubview(subviewSettingsOpen.strategyId, subviewSettingsOpen.subviewId);
    setSubviewSettingsOpen(null);
  }, [subviewSettingsOpen, strategy, deleteConfirm, removeSubview, setSubviewSettingsOpen]);

  useEffect(() => {
    if (subview) {
      const spec = subview.spec ?? (BLANK_SPEC as unknown as SubviewSpec);
      setJsonText(JSON.stringify(spec, null, 2));
      setPythonText(spec.python_code);
      setParseResult({ success: true, data: spec });
    }
  }, [subview?.id]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  if (!subviewSettingsOpen || !subview) return null;

  const canSave = parseResult.success;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2"
      role="dialog"
      aria-modal="true"
      aria-label="Subview editor"
    >
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} aria-hidden />
      <div
        className={cn(
          'relative flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)]',
          'w-full max-w-[95vw] h-[90vh]'
        )}
        style={{
          backgroundColor: 'var(--color-bg-card)',
          boxShadow: '0 4px 24px var(--color-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between shrink-0 py-2 pr-4 border-b"
          style={{ borderColor: 'var(--color-border)', paddingLeft: 10 }}
        >
          <span
            className="font-medium"
            style={{ fontSize: 'var(--font-size-title)', color: 'var(--color-text-primary)' }}
          >
            Subview Editor
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              title={deleteConfirm ? 'Confirm delete' : 'Delete'}
              className="!p-2"
              style={deleteConfirm ? { color: 'var(--color-negative)' } : undefined}
            >
              <Trash2 size={16} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSave}
              disabled={!canSave}
              title="Save"
              className="!p-2"
            >
              <Save size={16} strokeWidth={2} />
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose} title="Close" className="!p-2">
              <X size={16} strokeWidth={2} />
            </Button>
          </div>
        </div>

        {/* Two columns with draggable splitter */}
        <div
          ref={bodyRef}
          className="flex-1 flex min-h-0 overflow-hidden"
          data-subview-editor-body
        >
          {/* Left: Editor (JSON or Python) */}
          <div
            className="flex flex-col shrink-0 overflow-hidden"
            style={{ width: `${leftWidth}%`, minWidth: 200 }}
          >
            {/* Tabs — dark IDE style (VS Code–like), fixed height, separators with gap */}
            <div
              className="flex items-center shrink-0 h-9"
              style={{
                backgroundColor: '#252526',
                borderBottom: '1px solid #444446',
                paddingRight: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setEditMode('json')}
                className="flex items-center gap-2 py-2.5 text-sm font-medium transition-colors"
                style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  color: editMode === 'json' ? '#ffffff' : '#8f8f8f',
                  backgroundColor: editMode === 'json' ? '#1e1e1e' : 'transparent',
                  ...(editMode === 'json' && {
                    marginBottom: -1,
                    borderBottom: '1px solid #1e1e1e',
                  }),
                }}
              >
                <Braces size={14} className="shrink-0" style={{ color: '#6c9dcb' }} />
                JSON
              </button>
              <div className="w-px h-4 shrink-0 self-center bg-[#444446]" role="separator" aria-hidden />
              <button
                type="button"
                onClick={() => setEditMode('python')}
                className="flex items-center gap-2 py-2.5 text-sm font-medium transition-colors"
                style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  color: editMode === 'python' ? '#ffffff' : '#8f8f8f',
                  backgroundColor: editMode === 'python' ? '#1e1e1e' : 'transparent',
                  ...(editMode === 'python' && {
                    marginBottom: -1,
                    borderBottom: '1px solid #1e1e1e',
                  }),
                }}
              >
                <FileCode size={14} className="shrink-0" style={{ color: '#6c9dcb' }} />
                Python
              </button>
              <div className="w-px h-4 shrink-0 self-center bg-[#444446]" role="separator" aria-hidden />
              <button
                type="button"
                onClick={() => setEditMode('transactions')}
                className="flex items-center gap-2 py-2.5 text-sm font-medium transition-colors"
                style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  color: editMode === 'transactions' ? '#ffffff' : '#8f8f8f',
                  backgroundColor: editMode === 'transactions' ? '#1e1e1e' : 'transparent',
                  ...(editMode === 'transactions' && {
                    marginBottom: -1,
                    borderBottom: '1px solid #1e1e1e',
                  }),
                }}
              >
                <Receipt size={14} className="shrink-0" style={{ color: '#6c9dcb' }} />
                Transactions
              </button>
              <div className="w-px h-4 shrink-0 self-center bg-[#444446]" role="separator" aria-hidden />
              <button
                type="button"
                onClick={() => setEditMode('wallet')}
                className="flex items-center gap-2 py-2.5 text-sm font-medium transition-colors"
                style={{
                  paddingLeft: 10,
                  paddingRight: 10,
                  color: editMode === 'wallet' ? '#ffffff' : '#8f8f8f',
                  backgroundColor: editMode === 'wallet' ? '#1e1e1e' : 'transparent',
                  ...(editMode === 'wallet' && {
                    marginBottom: -1,
                    borderBottom: '1px solid #1e1e1e',
                  }),
                }}
              >
                <Wallet size={14} className="shrink-0" style={{ color: '#6c9dcb' }} />
                Wallet
              </button>
              <div className="flex-1" />
              {editMode === 'json' && (
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    onClick={validateJson}
                    title="Validate"
                    className="p-2 cursor-pointer bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center text-[#c0c0c0] hover:text-white active:text-[var(--color-active)]"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleFormat}
                    title="Format"
                    className="p-2 cursor-pointer bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center text-[#c0c0c0] hover:text-white active:text-[var(--color-active)]"
                  >
                    <Wand2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reset"
                    className="p-2 cursor-pointer bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center text-[#c0c0c0] hover:text-white active:text-[var(--color-active)]"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadExample}
                    title="Example"
                    className="p-2 cursor-pointer bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center text-[#c0c0c0] hover:text-white active:text-[var(--color-active)]"
                  >
                    <FileText size={16} />
                  </button>
                </div>
              )}
              {editMode === 'python' && (
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    onClick={handleTestFunctions}
                    disabled={testLoading || !parseResult.success}
                    title="Test Functions"
                    className="p-2 cursor-pointer bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center text-[#c0c0c0] hover:text-white active:text-[var(--color-active)]"
                  >
                    {testLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Play size={16} />
                    )}
                  </button>
                </div>
              )}
              {editMode === 'transactions' && (
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    onClick={handleResetSeedData}
                    title="Reset"
                    className="p-2 cursor-pointer bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center text-[#c0c0c0] hover:text-white active:text-[var(--color-active)]"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
              {editMode === 'wallet' && (
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    onClick={handleResetSeedData}
                    title="Reset"
                    className="p-2 cursor-pointer bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center text-[#c0c0c0] hover:text-white active:text-[var(--color-active)]"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {editMode === 'json' && (
                <>
                  <div className="flex-1 min-h-0">
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      value={jsonText}
                      onChange={handleJsonChange}
                      onMount={(editor) => editor.getModel()?.updateOptions({ tabSize: 2 })}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                      }}
                      theme="vs-dark"
                    />
                  </div>
                  {!parseResult.success && (
                    <div
                      className="flex items-start gap-2 px-2 py-1.5 text-xs shrink-0"
                      style={{ backgroundColor: 'var(--color-negative)', color: 'white' }}
                    >
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <pre className="whitespace-pre-wrap overflow-auto max-h-16">{parseResult.error}</pre>
                    </div>
                  )}
                </>
              )}
              {editMode === 'python' && (
                <>
                  <div className="flex-1 min-h-0">
                    <Editor
                      height="100%"
                      defaultLanguage="python"
                      value={pythonText}
                      onChange={(v) => setPythonText(v ?? '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                      }}
                      theme="vs-dark"
                    />
                  </div>
                  {testResult && (
                    <div
                      className="px-2 py-1.5 text-xs font-mono shrink-0 overflow-auto max-h-24"
                      style={{
                        backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-primary)',
                        borderTop: '1px solid var(--color-border)',
                      }}
                    >
                      <pre className="whitespace-pre-wrap">{testResult}</pre>
                    </div>
                  )}
                </>
              )}
              {editMode === 'transactions' && (
                <div className="flex-1 min-h-0" key={`transactions-${seedDataKey}`}>
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={JSON.stringify(SEED_CONTEXT.transactions, null, 2)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                    theme="vs-dark"
                  />
                </div>
              )}
              {editMode === 'wallet' && (
                <div className="flex-1 min-h-0" key={`wallet-${seedDataKey}`}>
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={JSON.stringify(SEED_CONTEXT.wallet, null, 2)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                    }}
                    theme="vs-dark"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Draggable splitter */}
          <div
            ref={splitterRef}
            role="separator"
            aria-orientation="vertical"
            onPointerDown={handleSplitterPointerDown}
            className="shrink-0 w-2 cursor-col-resize flex items-center justify-center hover:bg-[var(--color-bg-hover)] transition-colors"
            style={{
              backgroundColor: 'var(--color-border)',
            }}
          >
            <div
              className="w-0.5 h-10 rounded-full"
              style={{ backgroundColor: 'var(--color-text-muted)' }}
            />
          </div>

          {/* Right: Preview — matches strategy canvas (padding, background) */}
          <div
            className="flex-1 flex flex-col min-w-0 overflow-auto"
            style={{
              padding: 'var(--space-section)',
              backgroundColor: 'var(--color-bg-page)',
            }}
          >
            <MiniCanvasPreview
                spec={parseResult.success ? parseResult.data : null}
                pythonCode={pythonText}
                context={SEED_CONTEXT}
                inputs={previewInputs}
                onInputChange={(key, value) => {
                  setPreviewInputs((prev) => {
                    if (key === 'timeRange' && typeof value === 'string') {
                      try {
                        return { ...prev, [key]: JSON.parse(value) as { start: string; end: string } };
                      } catch {
                        return prev;
                      }
                    }
                    return { ...prev, [key]: value };
                  });
                }}
                onPreviewResize={(preferredSize) => {
                  if (parseResult.success) {
                    const updatedSpec = { ...parseResult.data, preferredSize };
                    setJsonText(JSON.stringify(updatedSpec, null, 2));
                    setParseResult({ success: true, data: updatedSpec });
                  }
                }}
              />
          </div>
        </div>

        {/* Status bar */}
        <div
          className="flex items-center gap-4 px-4 py-1.5 text-xs shrink-0"
          style={{
            backgroundColor: 'var(--color-bg-input)',
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {parseResult.success ? (
            <span style={{ color: 'var(--color-positive)' }}>Valid JSON</span>
          ) : (
            <span style={{ color: 'var(--color-negative)' }}>Invalid JSON</span>
          )}
        </div>
      </div>
    </div>
  );
}


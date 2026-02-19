import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Trash2,
  Save,
  X,
  AlertCircle,
  Braces,
  ChevronDown,
  ChevronUp,
  FileCode,
  Receipt,
  Search,
  Wallet,
  Wand2,
  RotateCcw,
  Play,
  Loader2,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Button } from '@/components/ui';
import { safeParseSubviewSpec, type SubviewSpec } from '@str/shared';
import { runPythonFunction } from '@/lib/pyodide-executor';
import { SEED_CONTEXT, SEED_INPUTS, type SeedContext } from '@/lib/subview-seed-data';
import { generateStockTransactions, generateOptionTransactions } from '@/lib/subview-seed-generators';
import { IconPicker } from '@/components/IconPicker';
import { BLANK_SPEC } from './BLANK_SPEC';
import { MiniCanvasPreview } from './MiniCanvasPreview';
import { cn } from '@/lib/utils';

const DEFAULT_LEFT_WIDTH = 50;
const MIN_LEFT_WIDTH = 25;
const MAX_LEFT_WIDTH = 75;

export function SubviewEditorModal() {
  const strategies = useStrategyStore((s) => s.strategies);
  const removeSubview = useStrategyStore((s) => s.removeSubview);
  const updateSubviewSpec = useStrategyStore((s) => s.updateSubviewSpec);
  const updateStrategyInputValue = useStrategyStore((s) => s.updateStrategyInputValue);
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
  const [generateTxnCount, setGenerateTxnCount] = useState(16);
  const [logPanelCollapsed, setLogPanelCollapsed] = useState(false);
  const [logPanelHeight, setLogPanelHeight] = useState(120);
  const [seedContext, setSeedContext] = useState<SeedContext>(() => ({ ...SEED_CONTEXT, transactions: [...SEED_CONTEXT.transactions] }));
  const [previewInputs, setPreviewInputs] = useState<Record<string, unknown>>(
    () => SEED_INPUTS as Record<string, unknown>
  );
  const splitterRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0] | null>(null);

  const triggerEditorSearch = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const e = ed as { getContribution?: (id: string) => { start?: (opts?: object) => void }; trigger?: (a: string, b: string, c: unknown) => void };
    const findController = e.getContribution?.('editor.contrib.findController');
    if (findController?.start) {
      findController.start({ seedSearchStringFromSelection: true });
    } else {
      e.trigger?.('keyboard', 'actions.find', null);
    }
  }, []);

  // When spec has inputs, merge defaults into previewInputs so all inputs have values
  useEffect(() => {
    if (!parseResult.success || !parseResult.data?.inputs) return;
    const specInputs = parseResult.data.inputs as Record<string, { default?: unknown }>;
    setPreviewInputs((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [key, cfg] of Object.entries(specInputs)) {
        if (cfg?.default !== undefined && !(key in next)) {
          next[key] = cfg.default;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [parseResult.success, parseResult.data?.inputs]);
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

  const handleLogPanelResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const startY = e.clientY;
    const startH = logPanelHeight;

    const handlePointerMove = (ev: PointerEvent) => {
      const delta = ev.clientY - startY;
      setLogPanelHeight(Math.min(400, Math.max(48, startH - delta)));
    };
    const handlePointerUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [logPanelHeight]);

  const handleClose = useCallback(() => {
    setSubviewSettingsOpen(null);
    setDeleteConfirm(false);
    setTestResult(null);
  }, [setSubviewSettingsOpen]);

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

  const syncTimeRangeFromTransactions = useCallback((txs: { timestamp?: string }[]) => {
    if (txs.length === 0) return;
    const dates = txs.map((t) => (t.timestamp || '').slice(0, 10)).filter(Boolean);
    if (dates.length === 0) return;
    const start = dates.reduce((a, b) => (a < b ? a : b));
    const end = dates.reduce((a, b) => (a > b ? a : b));
    setPreviewInputs((prev) => ({ ...prev, timeRange: { start, end } }));
  }, []);

  const handleResetSeedData = useCallback(() => {
    if (!window.confirm('Reset seed data to default?')) return;
    const ctx = { ...SEED_CONTEXT, transactions: [...SEED_CONTEXT.transactions] };
    setSeedContext(ctx);
    syncTimeRangeFromTransactions(ctx.transactions);
    setSeedDataKey((k) => k + 1);
  }, [syncTimeRangeFromTransactions]);

  const handleGenerateStockTransactions = useCallback(() => {
    const txs = generateStockTransactions(generateTxnCount);
    setSeedContext((prev) => ({ ...prev, transactions: txs }));
    syncTimeRangeFromTransactions(txs);
    setSeedDataKey((k) => k + 1);
  }, [generateTxnCount, syncTimeRangeFromTransactions]);

  const handleGenerateOptionTransactions = useCallback(() => {
    const txs = generateOptionTransactions(generateTxnCount);
    setSeedContext((prev) => ({ ...prev, transactions: txs }));
    syncTimeRangeFromTransactions(txs);
    setSeedDataKey((k) => k + 1);
  }, [generateTxnCount, syncTimeRangeFromTransactions]);

  const handleTestFunctions = useCallback(async () => {
    const result = safeParseSubviewSpec(jsonText);
    if (!result.success) {
      const details = result.error.issues.map((i) => {
        const path = i.path?.length ? i.path.join('.') : 'root';
        return `${path}: ${i.message}`;
      }).join('\n');
      setTestResult(`Fix JSON validation errors first:\n${details}`);
      return;
    }
    const spec = result.data;
    setTestLoading(true);
    setTestResult(null);
    try {
      const globalValues: Record<string, unknown> = {};
      if (strategy?.inputs?.length) {
        const vals = strategy.inputValues ?? {};
        for (const inp of strategy.inputs) {
          const raw = vals[inp.id] ?? inp.default;
          globalValues[inp.id] =
            inp.type === 'time_range' && typeof raw === 'string'
              ? (() => {
                  try {
                    const p = JSON.parse(raw) as { start?: string; end?: string };
                    return p && typeof p === 'object' ? p : raw;
                  } catch {
                    return raw;
                  }
                })()
              : raw;
        }
      }
      const mergedInputs: Record<string, unknown> =
        Object.keys(globalValues).length > 0
          ? { ...previewInputs, global: globalValues }
          : { ...previewInputs };
      if (strategy?.inputs?.length) {
        mergedInputs.globalInputConfig = strategy.inputs.map((i) => ({ id: i.id, type: i.type }));
      }
      const outputs: string[] = [];
      for (const fn of spec.functions) {
        const run = await runPythonFunction(
          pythonText,
          fn,
          seedContext,
          mergedInputs
        );
        if (run.success) {
          let line = `${fn}() => ${JSON.stringify(run.value)}`;
          if (run.log?.trim()) {
            line += `\n${run.log.trim()}`;
          }
          outputs.push(line);
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
  }, [jsonText, pythonText, seedContext, previewInputs, strategy]);

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
          className="flex items-center shrink-0 pr-4 border-b gap-4"
          style={{ borderColor: 'var(--color-border)', paddingLeft: 10, paddingTop: 7, paddingBottom: 8 }}
        >
          <span
            className="font-medium shrink-0"
            style={{ fontSize: 'var(--font-size-title)', color: 'var(--color-text-primary)' }}
          >
            Subview Editor
          </span>
          <IconPicker
            value={(parseResult.success && parseResult.data ? (parseResult.data as { icon?: string }).icon : undefined) ?? undefined}
            color={parseResult.success && parseResult.data ? (parseResult.data as { iconColor?: string }).iconColor : undefined}
            onChange={(iconVal, colorVal) => {
              if (!parseResult.success || !parseResult.data) return;
              const spec = parseResult.data as Record<string, unknown>;
              const updated = { ...spec, icon: iconVal ?? undefined, iconColor: colorVal ?? undefined };
              setJsonText(JSON.stringify(updated, null, 2));
              setParseResult({ success: true, data: updated as SubviewSpec });
            }}
            label=""
            placeholder="Icon"
            compact
          />
          <div className="flex-1" />
          <div className="flex items-center gap-2 shrink-0">
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
                    onClick={triggerEditorSearch}
                    title="Search (Ctrl+F)"
                    className="p-2 cursor-pointer bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center text-[#c0c0c0] hover:text-white active:text-[var(--color-active)]"
                  >
                    <Search size={16} />
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
                </div>
              )}
              {editMode === 'python' && (
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    onClick={triggerEditorSearch}
                    title="Search (Ctrl+F)"
                    className="p-2 cursor-pointer bg-transparent hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center text-[#c0c0c0] hover:text-white active:text-[var(--color-active)]"
                  >
                    <Search size={16} />
                  </button>
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
                  <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Count</span>
                    <input
                      type="number"
                      min={4}
                      max={128}
                      value={generateTxnCount}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v)) setGenerateTxnCount(Math.max(4, Math.min(128, v)));
                      }}
                      className="w-14 px-1.5 py-0.5 rounded text-right"
                      style={{
                        backgroundColor: 'var(--color-bg-input)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                        fontSize: 12,
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateStockTransactions}
                    title="Generate stock transactions (5 stocks, 1 year)"
                    className="px-2 py-1 text-xs cursor-pointer rounded transition-colors hover:bg-[var(--color-bg-hover)]"
                    style={{
                      backgroundColor: 'var(--color-bg-input)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Generate stocks
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateOptionTransactions}
                    title="Generate option transactions (5 stocks, 1 year)"
                    className="px-2 py-1 text-xs cursor-pointer rounded transition-colors hover:bg-[var(--color-bg-hover)]"
                    style={{
                      backgroundColor: 'var(--color-bg-input)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Generate options
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSeedData}
                    title="Reset to default"
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
                      onMount={(editor) => {
                        editorRef.current = editor;
                        editor.getModel()?.updateOptions({ tabSize: 2 });
                      }}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        folding: true,
                        showFoldingControls: 'always',
                        foldingStrategy: 'auto',
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
                      onMount={(editor) => { editorRef.current = editor; }}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        folding: true,
                        showFoldingControls: 'always',
                        foldingStrategy: 'auto',
                      }}
                      theme="vs-dark"
                    />
                  </div>
                  {testResult && (
                    <div
                      className="flex flex-col shrink-0 border-t"
                      style={{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-bg-input)',
                        height: logPanelCollapsed ? 32 : logPanelHeight,
                        minHeight: logPanelCollapsed ? 32 : 48,
                      }}
                    >
                      <div
                        className="flex items-center justify-between shrink-0 px-2 py-1"
                        style={{
                          borderBottom: logPanelCollapsed ? 'none' : '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-bg-hover)',
                        }}
                      >
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          Output
                        </span>
                        <button
                          type="button"
                          onClick={() => setLogPanelCollapsed((c) => !c)}
                          className="p-1 rounded hover:bg-[var(--color-bg-input)] transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}
                          title={logPanelCollapsed ? 'Expand' : 'Collapse'}
                        >
                          {logPanelCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      {!logPanelCollapsed && (
                        <>
                          <div
                            role="separator"
                            onPointerDown={handleLogPanelResizePointerDown}
                            className="h-1 shrink-0 cursor-row-resize flex items-center justify-center hover:bg-[var(--color-border)] transition-colors"
                            style={{ backgroundColor: 'var(--color-border)' }}
                            title="Drag to resize"
                          >
                            <div
                              className="w-8 h-0.5 rounded-full"
                              style={{ backgroundColor: 'var(--color-text-muted)' }}
                            />
                          </div>
                          <div
                            className="flex-1 min-h-0 overflow-auto px-2 py-1.5 text-xs font-mono"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            <pre className="whitespace-pre-wrap">{testResult}</pre>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
              {editMode === 'transactions' && (
                <div className="flex-1 min-h-0" key={`transactions-${seedDataKey}`}>
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={JSON.stringify(seedContext.transactions, null, 2)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      folding: true,
                      showFoldingControls: 'always',
                      foldingStrategy: 'auto',
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
                    value={JSON.stringify(seedContext.wallet, null, 2)}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      folding: true,
                      showFoldingControls: 'always',
                      foldingStrategy: 'auto',
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
                context={seedContext}
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
                strategy={strategy}
                onGlobalInputChange={strategy ? (key, value) => updateStrategyInputValue(strategy.id, key, value) : undefined}
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


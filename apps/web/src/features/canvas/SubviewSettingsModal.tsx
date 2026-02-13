import { useState, useCallback, useEffect, useRef } from 'react';
import { Trash2, Save, X } from 'lucide-react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Button, Input, Label } from '@/components/ui';
import { PipelineEditor, type PipelineEditorHandle } from '@/features/pipeline/PipelineEditor';
import { cn } from '@/lib/utils';

export function SubviewSettingsModal() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const pipelineEditorRef = useRef<PipelineEditorHandle | null>(null);

  const strategies = useStrategyStore((s) => s.strategies);
  const removeSubview = useStrategyStore((s) => s.removeSubview);
  const updateSubviewName = useStrategyStore((s) => s.updateSubviewName);
  const updateSubviewPipeline = useStrategyStore((s) => s.updateSubviewPipeline);

  const { subviewSettingsOpen, setSubviewSettingsOpen } = useUIStore();

  const strategy = subviewSettingsOpen
    ? strategies.find((s) => s.id === subviewSettingsOpen.strategyId)
    : null;
  const subview = strategy?.subviews.find(
    (sv) => sv.id === subviewSettingsOpen?.subviewId
  );

  useEffect(() => {
    if (subview) {
      setName(subview.name);
    }
    setDeleteConfirm(false);
    setError(null);
  }, [subview, subviewSettingsOpen]);

  const handleClose = useCallback(() => {
    setSubviewSettingsOpen(null);
    setDeleteConfirm(false);
    setError(null);
  }, [setSubviewSettingsOpen]);

  const handleSave = useCallback(() => {
    if (!subviewSettingsOpen || !strategy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    setError(null);
    updateSubviewName(subviewSettingsOpen.strategyId, subviewSettingsOpen.subviewId, trimmed);
    const pipeline = pipelineEditorRef.current?.save();
    if (pipeline) {
      updateSubviewPipeline(subviewSettingsOpen.strategyId, subviewSettingsOpen.subviewId, pipeline);
    }
    setSubviewSettingsOpen(null);
  }, [name, subviewSettingsOpen, strategy, updateSubviewName, updateSubviewPipeline, setSubviewSettingsOpen]);

  const handleDelete = useCallback(() => {
    if (!subviewSettingsOpen || !strategy) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    removeSubview(subviewSettingsOpen.strategyId, subviewSettingsOpen.subviewId);
    setSubviewSettingsOpen(null);
  }, [subviewSettingsOpen, strategy, deleteConfirm, removeSubview, setSubviewSettingsOpen]);

  const handleCancel = useCallback(() => {
    if (deleteConfirm) {
      setDeleteConfirm(false);
    } else {
      handleClose();
    }
  }, [deleteConfirm, handleClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleCancel]);

  if (!subviewSettingsOpen || !subview) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Subview settings"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        aria-hidden
      />

      <div
        className={cn(
          'relative flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border)]',
          'w-full max-w-[90vw] h-[85vh] max-h-[900px]'
        )}
        style={{
          backgroundColor: 'var(--color-bg-card)',
          boxShadow: '0 4px 24px var(--color-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating title - same padding as subview card (top: 6, left: 10) */}
        <div
          className="absolute top-0 left-0 z-10"
          style={{ top: 6, left: 10 }}
        >
          <Label htmlFor="subview-name-edit" className="sr-only">
            Subview title
          </Label>
          <Input
            id="subview-name-edit"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Subview title"
            error={error ?? undefined}
            className="w-48"
            style={{ height: 'var(--control-height)' }}
          />
        </div>

        {/* Floating buttons - same padding as subview card pencil (top: 6, right: 5) */}
        <div
          className="absolute top-0 right-0 z-10 flex items-center"
          style={{ top: 6, right: 5, gap: 'var(--space-gap)' }}
        >
          <Button
            type="button"
            variant={deleteConfirm ? 'danger' : 'secondary'}
            onClick={handleDelete}
            title={deleteConfirm ? 'Confirm delete' : 'Delete'}
            className="!p-2"
          >
            <Trash2 size={16} strokeWidth={2} />
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSave}
            title="Save"
            className="!p-2"
          >
            <Save size={16} strokeWidth={2} />
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            title={deleteConfirm ? 'Cancel delete' : 'Close'}
            className="!p-2"
          >
            <X size={16} strokeWidth={2} />
          </Button>
        </div>

        {/* Pipeline editor - padding-top to clear floating elements */}
        <div className="flex-1 min-h-0 pt-12 px-4 pb-4 flex flex-col">
          <PipelineEditor
            ref={pipelineEditorRef}
            initialPipeline={subview.pipeline}
            onSave={() => {}}
            fullHeight
            hideButtons
          />
        </div>
      </div>
    </div>
  );
}

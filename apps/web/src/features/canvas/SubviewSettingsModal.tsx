import { useState, useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label } from '@/components/ui';

export function SubviewSettingsModal() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const strategies = useStrategyStore((s) => s.strategies);
  const removeSubview = useStrategyStore((s) => s.removeSubview);
  const updateSubviewName = useStrategyStore((s) => s.updateSubviewName);

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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!subviewSettingsOpen || !strategy) return;
      const trimmed = name.trim();
      if (!trimmed) {
        setError('Name is required');
        return;
      }
      setError(null);
      updateSubviewName(subviewSettingsOpen.strategyId, subviewSettingsOpen.subviewId, trimmed);
      setSubviewSettingsOpen(null);
    },
    [name, subviewSettingsOpen, strategy, updateSubviewName, setSubviewSettingsOpen]
  );

  const handleDelete = useCallback(() => {
    if (!subviewSettingsOpen || !strategy) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    removeSubview(subviewSettingsOpen.strategyId, subviewSettingsOpen.subviewId);
    setSubviewSettingsOpen(null);
  }, [subviewSettingsOpen, strategy, deleteConfirm, removeSubview, setSubviewSettingsOpen]);

  const handleClose = useCallback(() => {
    setSubviewSettingsOpen(null);
    setDeleteConfirm(false);
    setError(null);
  }, [setSubviewSettingsOpen]);

  if (!subviewSettingsOpen || !subview) return null;

  return (
    <Modal title="Subview settings" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <Label htmlFor="subview-name-edit">Subview title</Label>
          <Input
            id="subview-name-edit"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Subview"
            error={error ?? undefined}
          />
        </div>

        <div className="flex gap-3" style={{ marginBottom: 20 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Save
          </Button>
        </div>
      </form>

      <div
        style={{
          paddingTop: 20,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Button
          type="button"
          variant={deleteConfirm ? 'danger' : 'secondary'}
          onClick={handleDelete}
          className="w-full gap-2"
        >
          <Trash2 size={16} strokeWidth={2} />
          {deleteConfirm ? 'Confirm delete' : 'Delete subview'}
        </Button>
      </div>
    </Modal>
  );
}

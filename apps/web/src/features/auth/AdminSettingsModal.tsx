import { useEffect, useState } from 'react';
import { Modal, Button, Label } from '@/components/ui';
import { useUIStore } from '@/store/ui-store';
import { useSettings, useUpdateSettings } from '@/api/hooks';

export function AdminSettingsModal() {
  const { adminSettingsModalOpen, setAdminSettingsModalOpen } = useUIStore();
  const { data: settings, isLoading } = useSettings();
  const updateMut = useUpdateSettings();
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    if (settings != null) setAllowRegistration(settings.allowRegistration);
  }, [settings]);

  const handleClose = () => setAdminSettingsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMut.mutateAsync({ allowRegistration });
      setAdminSettingsModalOpen(false);
    } catch {
      // Error shown by mutation; keep modal open for retry
    }
  };

  if (!adminSettingsModalOpen) return null;

  return (
    <Modal title="Admin Settings" onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          {isLoading ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)' }}>
              Loading...
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="admin-allow-registration"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                disabled={updateMut.isPending}
              />
              <Label htmlFor="admin-allow-registration" className="!mb-0 cursor-pointer">
                Allow new users to register
              </Label>
            </div>
          )}
        </div>

        <div className="flex gap-3" style={{ marginTop: 20 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isLoading || updateMut.isPending}
          >
            {updateMut.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

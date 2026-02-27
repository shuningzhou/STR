import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { useAuthStore } from './auth-store';
import { useUIStore } from '@/store/ui-store';

export function UserModal() {
  const navigate = useNavigate();
  const clearToken = useAuthStore((s) => s.clearToken);
  const { userModalOpen, setUserModalOpen } = useUIStore();

  const handleLogout = () => {
    clearToken();
    setUserModalOpen(false);
    navigate('/login');
  };

  const handleClose = () => {
    setUserModalOpen(false);
  };

  if (!userModalOpen) return null;

  return (
    <Modal title="Account" onClose={handleClose}>
      <div className="flex flex-col" style={{ gap: 'var(--space-section)' }}>
        <div>
          <Button
            type="button"
            variant="danger"
            className="w-full justify-center gap-2"
            onClick={handleLogout}
          >
            <LogOut size={16} strokeWidth={1.5} />
            Sign out
          </Button>
        </div>
      </div>
    </Modal>
  );
}

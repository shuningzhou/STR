import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Link2, Trash2, RefreshCw } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { useAuthStore } from './auth-store';
import { useUIStore } from '@/store/ui-store';
import {
  useSnaptradeConnections,
  useSnaptradeRegister,
  useSnaptradeConnect,
  useSnaptradeRefreshConnections,
  useSnaptradeDisconnect,
} from '@/api/hooks';

export function UserModal() {
  const navigate = useNavigate();
  const clearToken = useAuthStore((s) => s.clearToken);
  const { userModalOpen, setUserModalOpen } = useUIStore();

  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const { data: connections = [], isLoading: loadingConns } = useSnaptradeConnections();
  const registerMut = useSnaptradeRegister();
  const connectMut = useSnaptradeConnect();
  const refreshMut = useSnaptradeRefreshConnections();
  const disconnectMut = useSnaptradeDisconnect();

  const handleLogout = () => {
    clearToken();
    setUserModalOpen(false);
    navigate('/login');
  };

  const handleClose = () => {
    setPortalUrl(null);
    setUserModalOpen(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await registerMut.mutateAsync();
      const res = await connectMut.mutateAsync();
      if (res.redirectURI) setPortalUrl(res.redirectURI);
    } catch {
      // silently fail; user can retry
    } finally {
      setConnecting(false);
    }
  };

  const handlePortalMessage = useCallback(
    (e: MessageEvent) => {
      if (!e.data) return;
      const data = typeof e.data === 'string' ? e.data : e.data;

      if (data.status === 'SUCCESS' || data === 'CLOSE_MODAL' || data === 'ABANDONED') {
        setPortalUrl(null);
        refreshMut.mutate();
      }
      if (data.status === 'ERROR') {
        setPortalUrl(null);
      }
    },
    [refreshMut],
  );

  useEffect(() => {
    if (!portalUrl) return;
    window.addEventListener('message', handlePortalMessage);
    return () => window.removeEventListener('message', handlePortalMessage);
  }, [portalUrl, handlePortalMessage]);

  if (!userModalOpen) return null;

  if (portalUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setPortalUrl(null)}
          aria-hidden
        />
        <div
          className="relative rounded-[var(--radius-card)] overflow-hidden"
          style={{
            width: 450,
            backgroundColor: 'var(--color-bg-card)',
            boxShadow: '0 4px 24px var(--color-shadow)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <iframe
            src={portalUrl}
            title="SnapTrade Connection Portal"
            className="w-full border-0 block"
            style={{ minHeight: 600 }}
          />
        </div>
      </div>
    );
  }

  return (
    <Modal title="Account" onClose={handleClose}>
      <div className="flex flex-col" style={{ gap: 'var(--space-section)' }}>
        {/* Connected Brokerages */}
        <div>
          <h3
            className="font-semibold"
            style={{
              fontSize: 'var(--font-size-title)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-gap)',
            }}
          >
            Connected Brokerages
          </h3>
          {loadingConns ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)' }}>Loading...</p>
          ) : connections.length === 0 ? (
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-body)',
                marginBottom: 'var(--space-gap)',
              }}
            >
              No brokerages connected yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {connections.map((conn) => (
                <div
                  key={conn.authorizationId}
                  className="flex items-center justify-between rounded-[var(--radius-medium)] px-3"
                  style={{
                    backgroundColor: 'var(--color-bg-input)',
                    height: 'var(--control-height)',
                    minHeight: 'var(--control-height)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0" style={{ padding: 5 }}>
                      <Link2 size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} />
                    </span>
                    <span
                      className="text-[13px] truncate"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {conn.institutionName || 'Unknown'}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      ({conn.accounts.length} account{conn.accounts.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="w-6 h-6 shrink-0 flex items-center justify-center rounded-[var(--radius-medium)] cursor-pointer transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onClick={() => disconnectMut.mutate(conn.authorizationId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--color-negative)';
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Disconnect"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div
            className="flex flex-col gap-2"
            style={{ marginTop: 'var(--space-gap)' }}
          >
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect brokerage'}
            </Button>
            {connections.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => refreshMut.mutate()}
                disabled={refreshMut.isPending}
                className="gap-1 self-start"
              >
                <RefreshCw size={14} strokeWidth={1.5} className={refreshMut.isPending ? 'animate-spin' : ''} />
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Sign out */}
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

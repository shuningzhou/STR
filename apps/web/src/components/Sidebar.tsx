import {
  LayoutDashboard,
  Plus,
  ChevronLeft,
  Sun,
  Moon,
  User,
  Settings,
} from 'lucide-react';
import { useThemeStore } from '@/store/theme-store';
import { useUIStore } from '@/store/ui-store';
import { useStrategyStore } from '@/store/strategy-store';
import { cn } from '@/lib/utils';

const CURRENCIES = ['USD', 'CAD'] as const;

export function Sidebar() {
  const { mode, toggleMode, viewingCurrency, setViewingCurrency } = useThemeStore();
  const { sidebarCollapsed, toggleSidebar, setAddStrategyModalOpen } = useUIStore();
  const {
    strategies,
    activeStrategyId,
    setActiveStrategy,
  } = useStrategyStore();

  return (
    <aside
      className="relative h-full flex flex-col shrink-0 transition-[width] duration-200 ease-out"
      style={{
        width: sidebarCollapsed ? 56 : 240,
        backgroundColor: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div
        className={cn('flex flex-col h-full overflow-hidden', sidebarCollapsed ? 'gap-4' : 'gap-6')}
        style={{
          paddingTop: 'var(--space-modal)',
          paddingBottom: 'var(--space-modal)',
          paddingLeft: sidebarCollapsed ? 8 : 20,
          paddingRight: sidebarCollapsed ? 8 : 'var(--space-sidebar)',
        }}
      >
        {/* STR Logo + collapse toggle */}
        <div className={cn('flex items-center gap-3 shrink-0', sidebarCollapsed && 'justify-center')}>
          <button
            type="button"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-[var(--radius-medium)] transition-colors"
            style={{
              backgroundColor: 'var(--color-text-primary)',
              color: 'var(--color-bg-card)',
            }}
            onClick={sidebarCollapsed ? toggleSidebar : undefined}
            onMouseEnter={(e) => sidebarCollapsed && (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            title={sidebarCollapsed ? 'Expand sidebar' : undefined}
          >
            <LayoutDashboard size={18} />
          </button>
          {!sidebarCollapsed && (
            <>
              <span
                className="text-base font-semibold truncate flex-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                STR
              </span>
              <button
                type="button"
                className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-tab)',
                  color: 'var(--color-text-secondary)',
                }}
                onClick={toggleSidebar}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-tab)';
                }}
                title="Collapse sidebar"
              >
                <ChevronLeft size={14} strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* Strategy list */}
        <nav className={cn('flex flex-col gap-2 flex-1 min-h-0 overflow-auto', sidebarCollapsed && 'items-center')}>
          {strategies.map((s) => {
            const isActive = activeStrategyId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                className={cn(
                  'flex items-center gap-3 text-left cursor-pointer transition-colors',
                  sidebarCollapsed ? 'w-10 h-10 min-w-10 min-h-10 shrink-0 justify-center rounded-full p-0 overflow-hidden' : 'w-full',
                  !sidebarCollapsed && 'rounded-[var(--radius-medium)]'
                )}
                style={{
                  padding: sidebarCollapsed ? 0 : '10px 12px 10px 16px',
                  width: sidebarCollapsed ? 40 : undefined,
                  height: sidebarCollapsed ? 40 : undefined,
                  backgroundColor: isActive ? 'var(--color-active)' : 'var(--color-bg-tab)',
                  color: isActive ? 'var(--color-text-active)' : 'var(--color-text-secondary)',
                }}
                onClick={() => setActiveStrategy(s.id)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-tab)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
                title={sidebarCollapsed ? s.name : undefined}
              >
                <LayoutDashboard size={20} className="shrink-0" strokeWidth={1.5} />
                {!sidebarCollapsed && <span className="text-sm font-medium truncate">{s.name}</span>}
              </button>
            );
          })}

          {/* Add Strategy — looks like a tab, primary CTA when no strategies */}
          <button
            type="button"
            className={cn(
              'flex items-center gap-3 text-left cursor-pointer transition-colors',
              sidebarCollapsed ? 'w-10 h-10 min-w-10 min-h-10 shrink-0 justify-center rounded-full p-0 overflow-hidden' : 'w-full rounded-[var(--radius-medium)]',
            )}
            style={{
              padding: sidebarCollapsed ? 0 : '10px 12px',
              width: sidebarCollapsed ? 40 : undefined,
              height: sidebarCollapsed ? 40 : undefined,
              backgroundColor: 'var(--color-bg-tab)',
              color: 'var(--color-text-secondary)',
            }}
            onClick={() => setAddStrategyModalOpen(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-tab)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            title={sidebarCollapsed ? 'Add Strategy' : undefined}
          >
            <Plus size={20} className="shrink-0" strokeWidth={2} />
            {!sidebarCollapsed && <span className="text-sm font-medium">Add Strategy</span>}
          </button>
        </nav>

        {/* Bottom: currency, theme, account, settings */}
        <div
          className={cn('flex flex-col gap-3 shrink-0', sidebarCollapsed ? 'items-center pt-0 -mt-4' : 'pt-4')}
        >
          {sidebarCollapsed ? (
            <div
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-xs font-medium"
              style={{
                width: 40,
                height: 40,
                backgroundColor: 'var(--color-active)',
                color: 'var(--color-text-active)',
              }}
              title={`Viewing: ${viewingCurrency}`}
            >
              {viewingCurrency}
            </div>
          ) : (
            <div
              className="flex p-0.5 rounded-[var(--radius-medium)]"
              style={{ backgroundColor: 'var(--color-bg-input)' }}
            >
              {CURRENCIES.map((c) => {
                const isSelected = viewingCurrency === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className="flex-1 min-h-[calc(var(--control-height)-4px)] flex items-center justify-center text-[13px] font-medium cursor-pointer transition-colors rounded-[6px]"
                    style={{
                      backgroundColor: isSelected ? 'var(--color-active)' : 'transparent',
                      color: isSelected ? 'var(--color-text-active)' : 'var(--color-text-secondary)',
                    }}
                    onClick={() => setViewingCurrency(c)}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}

          <div className={cn('flex', sidebarCollapsed ? 'flex-col gap-3' : 'flex-row justify-center gap-2')}>
            <button
              type="button"
              className={cn(
                'flex items-center justify-center cursor-pointer transition-colors rounded-[var(--radius-medium)]',
                sidebarCollapsed ? 'w-full py-2' : 'w-9 h-9 shrink-0',
              )}
              style={{ color: 'var(--color-text-secondary)' }}
              onClick={toggleMode}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
              title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {mode === 'dark' ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
            </button>

            <button
              type="button"
              className={cn(
                'flex items-center justify-center cursor-pointer transition-colors rounded-[var(--radius-medium)]',
                sidebarCollapsed ? 'w-full py-2' : 'w-9 h-9 shrink-0',
              )}
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
              title="Account"
            >
              <User size={20} strokeWidth={1.5} />
            </button>

            <button
              type="button"
              className={cn(
                'flex items-center justify-center cursor-pointer transition-colors rounded-[var(--radius-medium)]',
                sidebarCollapsed ? 'w-full py-2' : 'w-9 h-9 shrink-0',
              )}
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
              title="Settings"
            >
              <Settings size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

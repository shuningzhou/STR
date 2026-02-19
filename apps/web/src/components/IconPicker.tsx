import { useState } from 'react';
import { getIconComponent, AVAILABLE_ICONS, ICONS_BY_CATEGORY } from '@/lib/icons';

const ICON_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Green', value: 'var(--color-active)' },
  { label: 'Blue', value: '#6c9dcb' },
  { label: 'Purple', value: '#a78bfa' },
  { label: 'Amber', value: '#f59e0b' },
];

interface IconPickerProps {
  value: string | undefined;
  color?: string;
  onChange: (icon: string | undefined, color?: string) => void;
  label?: string;
  placeholder?: string;
  /** When false, hides the color picker (e.g. for strategy icon which cannot be tinted) */
  showColorPicker?: boolean;
  /** Icon to display when value is empty (e.g. LayoutDashboard for strategy default) */
  defaultIcon?: string;
}

export function IconPicker({ value, color, onChange, label = 'Icon', placeholder = 'None', showColorPicker = true, defaultIcon }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const effectiveValue = value && value.trim() && value !== placeholder ? value : undefined;
  const IconComp = effectiveValue ? getIconComponent(effectiveValue) : null;
  const DefaultIconComp = defaultIcon && !IconComp ? getIconComponent(defaultIcon) : null;

  const hasSearch = !!search.trim().toLowerCase();
  const searchLower = search.trim().toLowerCase();
  const filteredFlat = hasSearch
    ? AVAILABLE_ICONS.filter((n) => n.toLowerCase().includes(searchLower))
    : null;
  const categoriesToShow = hasSearch ? null : ICONS_BY_CATEGORY;

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          className="flex items-center gap-2 min-w-[100px] rounded-[var(--radius-medium)] border text-left"
          style={{
            backgroundColor: 'var(--color-bg-input)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            height: 'var(--control-height)',
            paddingLeft: 5,
            paddingRight: 5,
          }}
          onClick={() => setOpen((o) => !o)}
        >
          {IconComp || DefaultIconComp ? (
            (() => {
              const Ic = IconComp || DefaultIconComp!;
              return <Ic size={18} strokeWidth={1.5} style={{ color: color || 'inherit', flexShrink: 0 }} />;
            })()
          ) : (
            <span className="text-xs opacity-60">{placeholder}</span>
          )}
          <span className="flex-1 truncate text-sm">{effectiveValue || placeholder}</span>
        </button>
        {effectiveValue && (
          <button
            type="button"
            className="px-2 py-1 rounded text-xs"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => onChange(undefined)}
            title="Clear icon"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute z-50 mt-1 p-2 rounded-[var(--radius-medium)] border max-h-[420px] overflow-auto"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
              minWidth: 280,
            }}
          >
            <input
              type="text"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded mb-2"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
            <div style={{ padding: 10 }}>
              {categoriesToShow ? (
                categoriesToShow.map((cat) => (
                  <div key={cat.id} style={{ marginBottom: 12 }}>
                    <div
                      className="text-xs font-medium mb-2"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {cat.label}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cat.icons.map((name) => {
                        const Ic = getIconComponent(name);
                        const isSelected = value === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            className="p-1.5 rounded shrink-0"
                            style={{
                              backgroundColor: isSelected ? 'var(--color-bg-hover)' : 'transparent',
                              color: color || 'var(--color-text-primary)',
                            }}
                            onClick={() => {
                              onChange(name);
                              setOpen(false);
                            }}
                            title={name}
                          >
                            {Ic && <Ic size={20} strokeWidth={1.5} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : filteredFlat && filteredFlat.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {filteredFlat.map((name) => {
                    const Ic = getIconComponent(name);
                    const isSelected = value === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        className="p-1.5 rounded shrink-0"
                        style={{
                          backgroundColor: isSelected ? 'var(--color-bg-hover)' : 'transparent',
                          color: color || 'var(--color-text-primary)',
                        }}
                        onClick={() => {
                          onChange(name);
                          setOpen(false);
                        }}
                        title={name}
                      >
                        {Ic && <Ic size={20} strokeWidth={1.5} />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs py-4" style={{ color: 'var(--color-text-muted)' }}>
                  No icons match
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showColorPicker && effectiveValue && (
        <div className="mt-2">
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Icon color
          </label>
          <div className="flex flex-wrap gap-1">
            {ICON_COLORS.map((c) => (
              <button
                key={c.value || 'default'}
                type="button"
                className="px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: c.value || 'var(--color-bg-input)',
                  color: c.value ? '#fff' : 'var(--color-text-primary)',
                  border: !c.value ? '1px solid var(--color-border)' : undefined,
                }}
                onClick={() => onChange(effectiveValue, c.value || undefined)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

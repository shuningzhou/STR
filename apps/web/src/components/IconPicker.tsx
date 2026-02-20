import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getIconComponent, AVAILABLE_ICONS, ICONS_BY_CATEGORY } from '@/lib/icons';
import { BUILT_IN_COLORS, resolveColor } from '@/features/subviews/SubviewSpecRenderer';

const COLOR_OPTIONS: { label: string; value: string; token?: string }[] = [
  { label: 'Default', value: '' },
  ...Object.entries(BUILT_IN_COLORS).map(([name, hex]) => ({
    label: name.charAt(0).toUpperCase() + name.slice(1),
    value: hex,
    token: name,
  })),
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
  /** When true, uses reduced height (31px) for compact layouts */
  compact?: boolean;
}

export function IconPicker({ value, color, onChange, label = 'Icon', placeholder = 'None', showColorPicker = true, defaultIcon, compact }: IconPickerProps) {
  const controlHeight = compact ? 31 : undefined;
  const [open, setOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [search, setSearch] = useState('');
  const effectiveValue = value && value.trim() && value !== placeholder ? value : undefined;
  const IconComp = effectiveValue ? getIconComponent(effectiveValue) : null;
  const resolvedColor = color ? (resolveColor(color) ?? color) : undefined;
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
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          className="flex items-center gap-2 min-w-[100px] rounded-[var(--radius-medium)] border text-left shrink-0"
          style={{
            backgroundColor: 'var(--color-bg-input)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            height: controlHeight ? `${controlHeight}px` : 'var(--control-height)',
            paddingLeft: 5,
            paddingRight: 5,
          }}
          onClick={() => setOpen((o) => !o)}
        >
          {IconComp || DefaultIconComp ? (
            (() => {
              const Ic = IconComp || DefaultIconComp!;
              return <Ic size={18} strokeWidth={1.5} style={{ color: resolvedColor || color || 'inherit', flexShrink: 0 }} />;
            })()
          ) : (
            <span className="text-xs opacity-60">{placeholder}</span>
          )}
          <span className="flex-1 truncate text-sm">{effectiveValue || placeholder}</span>
        </button>
        {effectiveValue && (
          <button
            type="button"
            className="px-2 py-1 rounded text-xs shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => onChange(undefined)}
            title="Clear icon"
          >
            Clear
          </button>
        )}
        {showColorPicker && effectiveValue && (
          <div className="relative shrink-0">
            <button
              type="button"
              className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-medium)] border text-left min-w-[90px]"
              style={{
                backgroundColor: 'var(--color-bg-input)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                height: controlHeight ? `${controlHeight}px` : 'var(--control-height)',
              }}
              onClick={() => setColorOpen((o) => !o)}
            >
              <span className="shrink-0" style={{ padding: 5 }}>
                <span
                  className="w-4 h-4 rounded border block"
                  style={{
                    backgroundColor: resolvedColor || color || 'var(--color-bg-hover)',
                    borderColor: 'var(--color-border)',
                  }}
                />
              </span>
              <span className="flex-1 truncate text-xs">
                {COLOR_OPTIONS.find((c) => c.token === color || (c.value || '') === (resolvedColor || color || ''))?.label ?? 'Default'}
              </span>
              <ChevronDown size={14} className="shrink-0 opacity-60" />
            </button>
            {colorOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setColorOpen(false)} aria-hidden="true" />
                <div
                  className="absolute z-50 mt-1 py-1 rounded-[var(--radius-medium)] border max-h-[240px] overflow-auto"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                    minWidth: 140,
                  }}
                >
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value || 'default'}
                      type="button"
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
                      onClick={() => {
                        onChange(effectiveValue, c.token ?? (c.value || undefined));
                        setColorOpen(false);
                      }}
                    >
                      <span className="shrink-0" style={{ padding: 5 }}>
                        <span
                          className="w-4 h-4 rounded border block"
                          style={{
                            backgroundColor: c.value || 'var(--color-bg-hover)',
                            borderColor: 'var(--color-border)',
                          }}
                        />
                      </span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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
            <div style={{ padding: 5 }}>
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

    </div>
  );
}

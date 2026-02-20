import { useMemo } from 'react';
import { Pencil, Plus, Minus } from 'lucide-react';
import { getIconComponent } from '@/lib/icons';
import type { Strategy, Subview } from '@/store/strategy-store';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';
import { getPipelineInputs } from '@/features/pipeline/pipelineInputs';
import { Input } from '@/components/ui';
import { SubviewSpecRenderer, BUILT_IN_COLORS } from '@/features/subviews/SubviewSpecRenderer';
import { InputControl } from '@/features/subviews/InputControl';
import { SUBVIEW_TEMPLATES } from '@/features/subviews/templates';
import { buildStrategyContext, SEED_INPUTS } from '@/lib/subview-seed-data';
import { useStrategyPrices } from '@/hooks/useStrategyPrices';
import type { SubviewSpec } from '@str/shared';

interface SubviewCardProps {
  subview: Subview;
  strategyId: string;
  strategy?: Strategy | null;
  isEditMode?: boolean;
}

/** Normalize input value (parse time_range JSON, etc.) */
function normalizeInputValueForKey(
  key: string,
  val: unknown,
  type?: string
): unknown {
  const isTimeRange = type === 'time_range' || key === 'timeRange';
  if (isTimeRange && typeof val === 'string') {
    try {
      const parsed = JSON.parse(val) as { start?: string; end?: string };
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      return val;
    }
  }
  return val;
}

/** Build inputs for Python/InputControl from inputValues + SEED_INPUTS + spec.inputs defaults */
function buildInputs(
  inputValues: Record<string, string | number>,
  specInputs?: Record<string, { default?: unknown }> | null
): Record<string, unknown> {
  const base = { ...SEED_INPUTS } as Record<string, unknown>;
  // Merge defaults from spec.inputs so all spec inputs have initial values
  if (specInputs) {
    for (const [key, cfg] of Object.entries(specInputs)) {
      if (!(key in base) && cfg?.default !== undefined) {
        base[key] = cfg.default;
      }
    }
  }
  for (const [key, val] of Object.entries(inputValues)) {
    base[key] = normalizeInputValueForKey(key, val);
  }
  return base;
}

/** Build strategy inputs config and values for global.xxx refs */
function buildGlobalInputs(strategy: Strategy | null | undefined): {
  config: Record<string, { type: string; title: string; default?: unknown; options?: { value: string; label: string }[]; min?: number; max?: number }>;
  values: Record<string, unknown>;
} {
  const config: Record<string, { type: string; title: string; default?: unknown; options?: { value: string; label: string }[]; min?: number; max?: number }> = {};
  const values: Record<string, unknown> = {};
  const inputs = strategy?.inputs ?? [];
  const inputValues = strategy?.inputValues ?? {};
  for (const inp of inputs) {
    config[inp.id] = {
      type: inp.type,
      title: inp.title,
      default: inp.default,
      options: inp.options,
      min: inp.min,
      max: inp.max,
    };
    const raw = inputValues[inp.id] ?? inp.default;
    values[inp.id] = normalizeInputValueForKey(inp.id, raw, inp.type);
  }
  return { config, values };
}

export function SubviewCard({ subview, strategyId, strategy, isEditMode = true }: SubviewCardProps) {
  const setSubviewSettingsOpen = useUIStore((s) => s.setSubviewSettingsOpen);
  const setAddTransactionModalOpen = useUIStore((s) => s.setAddTransactionModalOpen);
  const setDepositWithdrawModalOpen = useUIStore((s) => s.setDepositWithdrawModalOpen);
  const updateSubviewInputValue = useStrategyStore((s) => s.updateSubviewInputValue);
  const updateStrategyInputValue = useStrategyStore((s) => s.updateStrategyInputValue);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSubviewSettingsOpen({ strategyId, subviewId: subview.id });
  };

  const pipelineInputs = getPipelineInputs(subview.pipeline);
  const inputValues = subview.inputValues ?? {};

  // Resolve spec: templateId → latest from templates; else use stored spec
  const effectiveSpec = useMemo((): SubviewSpec | undefined => {
    if (subview.templateId) {
      const template = SUBVIEW_TEMPLATES.find((t) => t.id === subview.templateId);
      const spec = template?.spec;
      return spec ? (spec as SubviewSpec) : undefined;
    }
    const s = subview.spec;
    return s ? (s as SubviewSpec) : undefined;
  }, [subview.templateId, subview.spec]);

  const specInputs = useMemo(() => {
    if (!effectiveSpec) return null;
    const specWithInputs = effectiveSpec as SubviewSpec & { inputs?: Record<string, { default?: unknown }> };
    return buildInputs(inputValues, specWithInputs.inputs);
  }, [effectiveSpec, inputValues]);

  const globalInputs = useMemo(
    () => buildGlobalInputs(strategy),
    [strategy]
  );

  const currentPrices = useStrategyPrices(strategy?.transactions);
  const strategyContext = useMemo(
    () => ({ ...buildStrategyContext(strategy ?? null, currentPrices), currentPrices }),
    [strategy, currentPrices]
  );

  const hasSpec = !!effectiveSpec;
  type SpecLike = { headerActions?: { title: string; icon: string; handler: string }[]; type?: string; python_code?: string; icon?: string; iconColor?: string; titleColor?: string };
  const specLike = effectiveSpec as SpecLike | undefined;
  const subviewIcon = subview.icon ?? specLike?.icon;
  const subviewIconColor =
    (subview.templateId ? specLike?.iconColor ?? subview.iconColor : subview.iconColor ?? specLike?.iconColor) ??
    'var(--color-text-primary)';
  const subviewTitleColor = subviewIcon ? subviewIconColor : (specLike?.titleColor ?? 'var(--color-text-primary)');
  const SubviewIconComp = subviewIcon ? getIconComponent(subviewIcon) : null;
  const headerActions =
    specLike?.headerActions ??
    (specLike?.type === 'readwrite'
      ? [{ title: 'Add', icon: 'plus', handler: 'addTransactionModal' as const }]
      : []);

  const topbarInputs = useMemo(() => {
    const inputs = (effectiveSpec as SubviewSpec & { inputs?: Record<string, { topbar?: number; topbarShowTitle?: boolean; type?: string; title?: string; default?: unknown; options?: { value: string; label: string }[]; min?: number; max?: number }> })?.inputs ?? {};
    return Object.entries(inputs)
      .filter(([, cfg]) => cfg?.topbar != null)
      .sort(([, a], [, b]) => (a?.topbar ?? 0) - (b?.topbar ?? 0))
      .map(([key, cfg]) => ({ key, cfg }));
  }, [effectiveSpec]);

  const handleHeaderAction = (handler: string) => {
    if (handler === 'addTransactionModal') {
      setAddTransactionModalOpen({ strategyId, mode: 'stock-etf' });
    } else if (handler === 'addOptionTransactionModal') {
      setAddTransactionModalOpen({ strategyId, mode: 'option' });
    } else if (handler === 'depositWallet') {
      setDepositWithdrawModalOpen({ strategyId, mode: 'deposit' });
    } else if (handler === 'withdrawWallet') {
      setDepositWithdrawModalOpen({ strategyId, mode: 'withdraw' });
    }
  };

  return (
    <div
      className={cn(
        'subview-card h-full flex flex-col rounded-[var(--radius-card)] overflow-hidden relative',
        'border border-[var(--color-border)]'
      )}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        padding: 0,
      }}
    >
      {/* Top bar - draggable, no background; above content */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center w-full"
        style={{ minHeight: 'var(--subview-top-bar-height)', height: 'var(--subview-top-bar-height)', paddingLeft: 5, paddingRight: 5 }}
      >
        <div
          className={cn(
            'subview-drag-handle flex-1 flex items-center gap-2 min-w-0 h-full',
            isEditMode && 'cursor-grab active:cursor-grabbing'
          )}
          style={{ paddingLeft: 5, paddingRight: 4 }}
        >
          {SubviewIconComp && (
            <SubviewIconComp
              size={16}
              strokeWidth={1.5}
              className="shrink-0"
              style={{ color: subviewIconColor }}
            />
          )}
          <span
            className="min-w-0 flex-1 truncate text-[13px] font-medium"
            style={{ color: subviewTitleColor }}
          >
            {subview.name}
          </span>
        </div>
        {headerActions.map((action: { title: string; icon?: string; label?: string; color?: string; handler: string }, i: number) => {
          const iconName = action.icon?.toLowerCase();
          const isSecondary = action.handler === 'withdrawWallet' || iconName === 'minus';
          const IconComp = action.label ? null : getIconComponent(action.icon);
          const isTextButton = !!action.label;
          const actionColor = action.color ? BUILT_IN_COLORS[action.color] : undefined;
          const bgColor = actionColor ?? (isSecondary ? 'transparent' : 'var(--color-active)');
          const hoverBg = actionColor ? BUILT_IN_COLORS[`${action.color.replace(/-[0-9]$/, '')}-3`] ?? actionColor : (isSecondary ? 'var(--color-bg-hover)' : 'var(--color-bg-primary-hover)');
          const textColor = actionColor ? 'white' : (isSecondary ? 'var(--color-text-secondary)' : 'var(--color-text-on-primary)');
          return (
            <button
              key={i}
              type="button"
              className={isTextButton ? 'h-6 shrink-0 flex items-center justify-center self-center rounded-[var(--radius-medium)] transition-colors text-[12px] font-medium' : 'w-6 h-6 shrink-0 flex items-center justify-center self-center rounded-[var(--radius-medium)] transition-colors'}
              style={{
                marginRight: 5,
                ...(isTextButton && { width: 65 }),
                backgroundColor: bgColor,
                color: textColor,
                border: !actionColor && isSecondary ? '1px solid var(--color-border)' : undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = bgColor;
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleHeaderAction(action.handler);
              }}
              title={action.title}
            >
              {isTextButton ? action.label : IconComp ? <IconComp size={12} strokeWidth={1.5} /> : iconName === 'minus' ? <Minus size={12} strokeWidth={1.5} /> : <Plus size={12} strokeWidth={1.5} />}
            </button>
          );
        })}
        {hasSpec && specInputs && topbarInputs.length > 0 && (
          <div
            className="flex flex-wrap items-center justify-end shrink-0"
            style={{
              gap: 5,
              marginRight: isEditMode ? 5 : 0,
              marginLeft: 'auto',
              ...(!isEditMode && { flex: 1 }),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {topbarInputs.map(({ key, cfg }, i) => (
              <span key={key} className="flex items-end" style={{ gap: 5 }}>
                {i > 0 && (
                  <div
                    style={{
                      width: 1,
                      alignSelf: 'stretch',
                      backgroundColor: 'var(--color-border)',
                    }}
                    aria-hidden
                  />
                )}
                <InputControl
                  compact
                  showTitleInCompact={cfg.topbarShowTitle !== false}
                  inputKey={key}
                  cfg={{
                    type: cfg.type ?? 'select',
                    title: cfg.title ?? key,
                    default: cfg.default,
                    options: cfg.options,
                    min: cfg.min,
                    max: cfg.max,
                  }}
                  inputs={specInputs}
                  onInputChange={(k, v) => updateSubviewInputValue(strategyId, subview.id, k, v)}
                  context={strategyContext}
                />
              </span>
            ))}
          </div>
        )}
        {isEditMode ? (
          <button
            type="button"
            onClick={handleMenuClick}
            className="w-6 h-6 shrink-0 flex items-center justify-center self-center rounded-[var(--radius-medium)] transition-colors"
            style={{
              marginRight: 5,
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            title="Subview settings"
          >
            <Pencil size={12} strokeWidth={1.5} />
          </button>
        ) : null}
      </div>

      {/* Spec-based body or pipeline placeholder */}
      {hasSpec && effectiveSpec && specInputs ? (
        <SubviewSpecRenderer
          spec={effectiveSpec as SubviewSpec}
          pythonCode={specLike!.python_code ?? ''}
          context={strategyContext}
          inputs={specInputs}
          onInputChange={(key, value) =>
            updateSubviewInputValue(strategyId, subview.id, key, value)
          }
          globalInputsConfig={globalInputs.config}
          globalInputConfig={strategy?.inputs?.map((i) => ({ id: i.id, type: i.type }))}
          globalInputValues={globalInputs.values}
          onGlobalInputChange={(key, value) =>
            updateStrategyInputValue(strategyId, key, value)
          }
          strategyId={strategyId}
          editTransactionMode={subview.templateId === 'option-income' ? 'option' : 'stock-etf'}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0" style={{ paddingTop: 'var(--subview-top-bar-height)' }}>
          {pipelineInputs.length > 0 && (
            <div
              className="flex flex-wrap gap-2 p-2 shrink-0"
              style={{ gap: 'var(--space-gap)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {pipelineInputs.map((inp) => (
                <div key={inp.inputKey} className="flex flex-col gap-0.5 min-w-[80px]">
                  <label
                    className="text-[11px] font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {inp.label}
                  </label>
                  <Input
                    value={String(inputValues[inp.inputKey] ?? inp.defaultValue)}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateSubviewInputValue(strategyId, subview.id, inp.inputKey, v);
                    }}
                    className="text-[11px]"
                    style={{ height: 26 }}
                  />
                </div>
              ))}
            </div>
          )}
          <div
            className={cn(
              'flex-1 flex items-center justify-center p-4 min-h-[60px] gap-1',
              pipelineInputs.length === 0 && 'flex'
            )}
            style={{ color: 'var(--color-text-muted)' }}
          >
            {pipelineInputs.length === 0 ? (
              isEditMode ? (
                <>
                  <span className="text-xs">Click</span>
                  <Pencil size={14} strokeWidth={1.5} className="shrink-0" />
                  <span className="text-xs">to get started</span>
                </>
              ) : (
                <span className="text-xs">No spec configured</span>
              )
            ) : (
              <span className="text-xs">Legacy pipeline</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

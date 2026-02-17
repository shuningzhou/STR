/**
 * Renders strategy-scoped inputs at the top of the strategy canvas.
 */
import { useMemo } from 'react';
import type { Strategy } from '@/store/strategy-store';
import { useStrategyStore } from '@/store/strategy-store';
import { InputControl } from '@/features/subviews/InputControl';
import { buildStrategyContext } from '@/lib/subview-seed-data';

function normalizeInputValue(inp: { id: string; type: string }, val: unknown): unknown {
  if (inp.type === 'time_range' && typeof val === 'string') {
    try {
      const parsed = JSON.parse(val) as { start?: string; end?: string };
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      return val;
    }
  }
  return val;
}

function buildValues(strategy: Strategy): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const inputs = strategy?.inputs ?? [];
  const inputValues = strategy?.inputValues ?? {};
  for (const inp of inputs) {
    const raw = inputValues[inp.id] ?? inp.default;
    values[inp.id] = normalizeInputValue(inp, raw);
  }
  return values;
}

export function StrategyInputsBar({ strategy }: { strategy: Strategy | null }) {
  const updateStrategyInputValue = useStrategyStore((s) => s.updateStrategyInputValue);

  const values = useMemo(() => (strategy ? buildValues(strategy) : {}), [strategy]);
  const context = useMemo(() => buildStrategyContext(strategy), [strategy]);
  const inputs = strategy?.inputs ?? [];

  if (inputs.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-end shrink-0"
      style={{
        gap: 5,
        padding: 5,
        backgroundColor: 'var(--color-bg-page)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {inputs.map((inp, i) => (
        <span key={inp.id} className="flex items-end" style={{ gap: 5 }}>
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
            inputKey={inp.id}
            cfg={{
              type: inp.type,
              title: inp.title,
              default: inp.default,
              options: inp.options,
            }}
            inputs={values}
            onInputChange={(key, value) =>
              strategy && updateStrategyInputValue(strategy.id, key, value)
            }
            context={context}
          />
        </span>
      ))}
    </div>
  );
}

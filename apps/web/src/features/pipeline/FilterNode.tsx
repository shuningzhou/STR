import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { getFilterableAttributes, type SchemaAttribute } from './nodeSchemas';
import { FilterOperator } from '@str/shared';

export type ValueType = 'static' | 'input';

export interface FilterCondition {
  field: string;
  operator: string;
  value: string;
  valueType?: ValueType;
  /** When valueType is 'input': label shown on subview card */
  inputLabel?: string;
}

const VALUE_TYPE_OPTIONS = ['Static', 'Input'] as const;
type ValueTypeDisplay = (typeof VALUE_TYPE_OPTIONS)[number];

const CONDITION_LAYOUT = {
  fieldWidth: 150,
  operatorWidth: 75,
  segmentWidth: 100,
  valueWidth: 150,
  deleteButtonWidth: 26,
  gap: 8,
  cardPadding: 20,
} as const;

const CONDITION_ROW_WIDTH =
  CONDITION_LAYOUT.fieldWidth +
  CONDITION_LAYOUT.operatorWidth +
  CONDITION_LAYOUT.segmentWidth +
  CONDITION_LAYOUT.valueWidth +
  CONDITION_LAYOUT.deleteButtonWidth +
  CONDITION_LAYOUT.gap * 4;

const FILTER_NODE_WIDTH = CONDITION_ROW_WIDTH + CONDITION_LAYOUT.cardPadding * 2;

const OPERATOR_OPTIONS = [
  { value: FilterOperator.EQUALS, label: '=' },
  { value: FilterOperator.NOT_EQUALS, label: '!=' },
  { value: FilterOperator.GREATER_THAN, label: '>' },
  { value: FilterOperator.LESS_THAN, label: '<' },
  { value: FilterOperator.GREATER_THAN_OR_EQUAL, label: '>=' },
  { value: FilterOperator.LESS_THAN_OR_EQUAL, label: '<=' },
];

export interface FilterNodeData {
  label?: string;
  conditions?: FilterCondition[];
}

const valueInputStyle = {
  width: '100%',
  height: 'var(--control-height)',
  fontSize: 'var(--font-size-body)',
};

function ConditionValueInput({
  attr,
  value,
  onChange,
}: {
  attr: SchemaAttribute | undefined;
  value: string;
  onChange: (v: string) => void;
}) {
  if (!attr) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Value"
        style={valueInputStyle}
      />
    );
  }
  if (attr.type === 'number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Value"
        style={valueInputStyle}
      />
    );
  }
  if (attr.type === 'enum' && attr.enumValues?.length) {
    const options = attr.enumValues.map((v) => ({ value: v, label: v }));
    return (
      <Select
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Value"
        style={valueInputStyle}
      />
    );
  }
  if (attr.type === 'date') {
    return (
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Value"
        style={valueInputStyle}
      />
    );
  }
  if (attr.type === 'instrument') {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Instrument ID (search in Phase 7)"
        style={valueInputStyle}
      />
    );
  }
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value"
      style={valueInputStyle}
    />
  );
}

function FilterNodeBase(props: NodeProps) {
  const { id, data, selected } = props;
  const conditions: FilterCondition[] = (data?.conditions as FilterCondition[]) ?? [];
  const reactFlow = useReactFlow();
  const nodes = reactFlow.getNodes();
  const edges = reactFlow.getEdges();
  const attributes = getFilterableAttributes(id, nodes, edges);

  const setConditions = useCallback(
    (next: FilterCondition[]) => {
      reactFlow.setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, conditions: next } } : n))
      );
    },
    [id, reactFlow]
  );

  const addCondition = useCallback(() => {
    const firstAttr = attributes[0]?.key ?? 'type';
    setConditions([
      ...conditions,
      { field: firstAttr, operator: FilterOperator.EQUALS, value: '', valueType: 'static' },
    ]);
  }, [conditions, attributes, setConditions]);

  const updateCondition = useCallback(
    (index: number, patch: Partial<FilterCondition>) => {
      const next = [...conditions];
      next[index] = { ...next[index], ...patch };
      setConditions(next);
    },
    [conditions, setConditions]
  );

  const removeCondition = useCallback(
    (index: number) => {
      setConditions(conditions.filter((_, i) => i !== index));
    },
    [conditions, setConditions]
  );

  const attrOptions = attributes.map((a) => ({ value: a.key, label: a.label }));
  const optionsWithCurrent = (opts: { value: string; label: string }[], current: string) =>
    opts.length > 0
      ? opts
      : current
        ? [{ value: current, label: current }]
        : [];

  const getAttr = (fieldKey: string): SchemaAttribute | undefined =>
    attributes.find((a) => a.key === fieldKey);

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border transition-colors w-fit'
      )}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: selected ? 'var(--color-active)' : 'var(--color-border)',
        borderWidth: selected ? 2 : 1,
        padding: 'var(--space-modal)',
        boxShadow: '0 4px 24px var(--color-shadow)',
        width: FILTER_NODE_WIDTH,
        minWidth: FILTER_NODE_WIDTH,
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[var(--color-border)]" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-gap)' }}>
        <span
          className="block font-medium"
          style={{ fontSize: 'var(--font-size-title)', color: 'var(--color-text-primary)', marginBottom: 4 }}
        >
          Filter
        </span>
        {conditions.length === 0 && attributes.length === 0 && (
          <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--color-text-muted)' }}>
            Connect to Source first
          </p>
        )}
        {conditions.length === 0 && attributes.length > 0 && (
          <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--color-text-muted)' }}>
            No conditions
          </p>
        )}
        {conditions.map((cond, i) => {
          const isInput = (cond.valueType ?? 'static') === 'input';
          const valueTypeDisplay: ValueTypeDisplay = isInput ? 'Input' : 'Static';
          const attr = getAttr(cond.field);
          return (
            <div
              key={i}
              className="flex items-center flex-nowrap"
              style={{ gap: 'var(--space-gap)' }}
            >
              <Select
                options={optionsWithCurrent(attrOptions, cond.field)}
                value={cond.field}
                onChange={(v) => updateCondition(i, { field: v })}
                placeholder="Field"
                className="shrink-0"
                style={{ width: CONDITION_LAYOUT.fieldWidth, height: 'var(--control-height)', fontSize: 'var(--font-size-body)' }}
              />
              <Select
                options={OPERATOR_OPTIONS}
                value={cond.operator}
                onChange={(v) => updateCondition(i, { operator: v })}
                className="shrink-0"
                style={{ width: CONDITION_LAYOUT.operatorWidth, height: 'var(--control-height)', fontSize: 'var(--font-size-body)' }}
              />
              <div className="shrink-0" style={{ width: CONDITION_LAYOUT.segmentWidth }}>
                <SegmentControl<ValueTypeDisplay>
                  value={valueTypeDisplay}
                  options={VALUE_TYPE_OPTIONS}
                  onChange={(v) =>
                    updateCondition(i, {
                      valueType: v === 'Input' ? 'input' : 'static',
                      inputLabel: v === 'Input' ? cond.inputLabel || `Value ${i + 1}` : undefined,
                    })
                  }
                />
              </div>
              <div className="shrink-0" style={{ width: CONDITION_LAYOUT.valueWidth, minWidth: CONDITION_LAYOUT.valueWidth, maxWidth: CONDITION_LAYOUT.valueWidth }}>
                {isInput ? (
                  <Input
                    value={cond.inputLabel ?? ''}
                    onChange={(e) => updateCondition(i, { inputLabel: e.target.value })}
                    placeholder="Input name"
                    style={{ width: '100%', height: 'var(--control-height)', fontSize: 'var(--font-size-body)' }}
                  />
                ) : (
                  <ConditionValueInput
                    attr={attr}
                    value={cond.value}
                    onChange={(v) => updateCondition(i, { value: v })}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeCondition(i)}
                className="shrink-0 p-1.5 rounded-[var(--radius-medium)] transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                title="Remove condition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {attributes.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={addCondition}
            className="shrink-0 gap-1"
          >
            <Plus size={16} />
            Add condition
          </Button>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[var(--color-border)]" />
    </div>
  );
}

export const FilterNode = memo(FilterNodeBase);

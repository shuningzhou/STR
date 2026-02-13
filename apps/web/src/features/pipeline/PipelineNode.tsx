import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

/** Base pipeline node - card style with label and handles */
function PipelineNodeBase({ data, selected, type }: NodeProps) {
  const label = (data?.label as string) ?? type ?? 'Node';
  const hasInput = type !== 'source';
  const hasOutput = type !== 'output';

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border transition-colors',
        'w-fit min-w-[100px]'
      )}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: selected ? 'var(--color-active)' : 'var(--color-border)',
        borderWidth: selected ? 2 : 1,
        padding: 'var(--space-modal)',
        boxShadow: '0 4px 24px var(--color-shadow)',
      }}
    >
      {hasInput && (
        <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[var(--color-border)]" />
      )}
      <span
        className="block font-medium"
        style={{ fontSize: 'var(--font-size-body)', color: 'var(--color-text-primary)' }}
      >
        {label}
      </span>
      {hasOutput && (
        <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[var(--color-border)]" />
      )}
    </div>
  );
}

export const PipelineNode = memo(PipelineNodeBase);

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

/** Base pipeline node - simple box with label and handles */
function PipelineNodeBase({ data, selected, type }: NodeProps) {
  const label = (data?.label as string) ?? type ?? 'Node';
  const hasInput = type !== 'source';
  const hasOutput = type !== 'output';

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-[var(--radius-medium)] min-w-[100px]',
        'border transition-colors'
      )}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: selected ? 'var(--color-active)' : 'var(--color-border)',
        borderWidth: selected ? 2 : 1,
      }}
    >
      {hasInput && (
        <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[var(--color-border)]" />
      )}
      <span
        className="text-xs font-medium block"
        style={{ color: 'var(--color-text-primary)' }}
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

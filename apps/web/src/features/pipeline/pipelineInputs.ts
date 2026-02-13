/**
 * Extracts pipeline inputs (user-editable values) from filter conditions.
 * Used by SubviewCard to render inputs on the canvas.
 */

import type { PipelineGraph } from '@/store/strategy-store';

export interface PipelineInputDef {
  inputKey: string;
  label: string;
  defaultValue: string;
  /** Node id + condition index for stable key when pipeline changes */
  nodeId: string;
  condIndex: number;
}

export function getPipelineInputs(pipeline: PipelineGraph | null | undefined): PipelineInputDef[] {
  const inputs: PipelineInputDef[] = [];
  if (!pipeline?.nodes) return inputs;

  for (const node of pipeline.nodes) {
    if (node.type !== 'filter') continue;
    const conditions = (node.data as { conditions?: Array<{ valueType?: string; value?: string; inputLabel?: string }> })?.conditions ?? [];
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      const valueType = c.valueType ?? 'static';
      if (valueType === 'input') {
        inputs.push({
          inputKey: `${node.id}_${i}`,
          label: c.inputLabel ?? `Filter ${i + 1}`,
          defaultValue: String(c.value ?? ''),
          nodeId: node.id,
          condIndex: i,
        });
      }
    }
  }
  return inputs;
}

/** Pipeline node types for React Flow */
export const NODE_TYPE_LIST = [
  { type: 'source', label: 'Source' },
  { type: 'filter', label: 'Filter' },
  { type: 'groupBy', label: 'Group By' },
  { type: 'aggregate', label: 'Aggregate' },
  { type: 'calculate', label: 'Calculate' },
  { type: 'sort', label: 'Sort' },
  { type: 'output', label: 'Output' },
] as const;

export type NodeTypeId = (typeof NODE_TYPE_LIST)[number]['type'];

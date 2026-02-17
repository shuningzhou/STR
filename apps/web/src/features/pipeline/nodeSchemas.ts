/**
 * Node input/output schemas and filterable attributes.
 * Used to populate dropdowns and validate pipeline connections.
 */

export type AttributeType = 'string' | 'number' | 'date' | 'enum' | 'instrument';

export interface SchemaAttribute {
  key: string;
  label: string;
  type: AttributeType;
  /** For enum type, optional list of allowed values */
  enumValues?: string[];
}

/** Transaction filterable attributes (Source node output) */
export const TRANSACTION_ATTRIBUTES: SchemaAttribute[] = [
  { key: 'type', label: 'Type', type: 'enum', enumValues: ['buy', 'sell', 'dividend', 'deposit', 'withdrawal', 'fee', 'interest', 'option_exercise', 'option_assign', 'option_expire'] },
  { key: 'quantity', label: 'Quantity', type: 'number' },
  { key: 'price', label: 'Price', type: 'number' },
  { key: 'cashDelta', label: 'Cash Delta', type: 'number' },
  { key: 'timestamp', label: 'Timestamp', type: 'date' },
  { key: 'fee', label: 'Fee', type: 'number' },
  { key: 'instrumentId', label: 'Instrument', type: 'instrument' },
];

/** Output schema for each node type */
export type NodeOutputSchema = SchemaAttribute[] | null;

const SOURCE_OUTPUT = TRANSACTION_ATTRIBUTES;
/** Filter passes through same schema as input */
const FILTER_OUTPUT = TRANSACTION_ATTRIBUTES; // same as input for now

export function getOutputSchema(nodeType: string): NodeOutputSchema {
  switch (nodeType) {
    case 'source':
      return SOURCE_OUTPUT;
    case 'filter':
    case 'groupBy':
    case 'aggregate':
    case 'sort':
      return FILTER_OUTPUT; // list-in list-out nodes pass through item schema for now
    case 'calculate':
    case 'output':
      return null; // different output shape
    default:
      return TRANSACTION_ATTRIBUTES; // fallback
  }
}

/** Get filterable attributes for a node based on its upstream connection */
export function getFilterableAttributes(
  nodeId: string,
  nodes: Array<{ id: string; type?: string }>,
  edges: Array<{ source: string; target: string }>
): SchemaAttribute[] {
  const inboundEdge = edges.find((e) => e.target === nodeId);
  if (!inboundEdge) return [];
  const upstreamNode = nodes.find((n) => n.id === inboundEdge.source);
  if (!upstreamNode) return [];
  return getOutputSchema(upstreamNode.type ?? 'source') ?? [];
}

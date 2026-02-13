import { useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type ReactFlowInstance,
  Background,
  Controls,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { PipelineNode } from './PipelineNode';
import { NODE_TYPE_LIST } from './nodeTypes';
import type { PipelineGraph } from '@/store/strategy-store';

function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const nodeTypes = {
  source: PipelineNode,
  filter: PipelineNode,
  groupBy: PipelineNode,
  aggregate: PipelineNode,
  calculate: PipelineNode,
  sort: PipelineNode,
  output: PipelineNode,
};

function graphToFlow(pipeline: PipelineGraph | null | undefined): { nodes: Node[]; edges: Edge[] } {
  if (!pipeline?.nodes?.length) return { nodes: [], edges: [] };
  const nodes: Node[] = pipeline.nodes.map((n) => ({
    id: n.id,
    type: (n.type as keyof typeof nodeTypes) ?? 'source',
    position: n.position ?? { x: 0, y: 0 },
    data: { label: (n.data as { label?: string })?.label ?? n.type },
  }));
  const edges: Edge[] = (pipeline.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));
  return { nodes, edges };
}

function flowToGraph(nodes: Node[], edges: Edge[], viewport?: { x: number; y: number; zoom: number }): PipelineGraph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type ?? 'source',
      position: n.position,
      data: n.data,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
    viewport,
  };
}

export interface PipelineEditorProps {
  initialPipeline: PipelineGraph | null | undefined;
  onClose?: () => void;
  onSave?: (pipeline: PipelineGraph) => void;
  /** When true, Cancel button shows "Back" and layout can be flexible */
  embedMode?: boolean;
  /** When true, use flexible height (flex-1) instead of fixed 400px */
  fullHeight?: boolean;
  /** When true, hide the bottom Back/Save buttons (use with ref for external save) */
  hideButtons?: boolean;
}

export interface PipelineEditorHandle {
  save: () => PipelineGraph | null;
}

const PipelineEditorInner = forwardRef<PipelineEditorHandle, PipelineEditorProps>(function PipelineEditorInner({
  initialPipeline,
  onClose,
  onSave,
  embedMode = false,
  fullHeight = false,
  hideButtons = false,
}, ref) {
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const { nodes: initialNodes, edges: initialEdges } = graphToFlow(initialPipeline);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow') as keyof typeof nodeTypes;
      if (!type || !nodeTypes[type]) return;
      if (!reactFlowRef.current) return;
      const position = reactFlowRef.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const label = NODE_TYPE_LIST.find((n) => n.type === type)?.label ?? type;
      const newNode: Node = {
        id: generateNodeId(),
        type,
        position,
        data: { label },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const getCurrentGraph = useCallback((): PipelineGraph | null => {
    if (!reactFlowRef.current) return null;
    const viewport = reactFlowRef.current.getViewport();
    return flowToGraph(nodes, edges, { x: viewport.x, y: viewport.y, zoom: viewport.zoom });
  }, [nodes, edges]);

  useImperativeHandle(ref, () => ({
    save: getCurrentGraph,
  }), [getCurrentGraph]);

  const handleSave = useCallback(() => {
    const graph = getCurrentGraph();
    if (!graph) return;
    onSave?.(graph);
    if (!embedMode && onClose) onClose();
  }, [getCurrentGraph, onSave, onClose, embedMode]);

  return (
    <div
      className={cn(
        'rounded-[var(--radius-medium)] overflow-hidden flex flex-col',
        fullHeight && 'flex-1 min-h-0'
      )}
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-input)',
        ...(fullHeight ? {} : { height: 400 }),
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div className={cn('flex-1 min-h-0', fullHeight && 'min-h-[300px]')}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(inst) => { reactFlowRef.current = inst; }}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'var(--color-bg-input)' }}
      >
        <Background gap={12} size={1} color="var(--color-border)" />
        <Controls showZoom showFitView showInteractive={false} />
        <Panel position="top-left" className="m-2">
          <div
            className="p-2 rounded-[var(--radius-medium)] flex flex-col gap-1"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Add node</span>
            {NODE_TYPE_LIST.map(({ type, label }) => (
              <div
                key={type}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('application/reactflow', type)}
                className="px-2 py-1 rounded cursor-grab text-xs"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {label}
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
      </div>

      {!hideButtons && (
        <div
          className="flex gap-2 p-3"
          style={{ borderTop: '1px solid var(--color-border)', gap: 'var(--space-gap)' }}
        >
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {embedMode ? 'Back' : 'Cancel'}
          </Button>
          <Button type="button" variant="primary" onClick={handleSave} className="flex-1">
            Save
          </Button>
        </div>
      )}
    </div>
  );
});

export const PipelineEditor = forwardRef<PipelineEditorHandle, PipelineEditorProps>(function PipelineEditor(props, ref) {
  return (
    <ReactFlowProvider>
      <PipelineEditorInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

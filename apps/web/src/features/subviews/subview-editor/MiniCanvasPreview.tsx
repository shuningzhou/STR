import { useState, useCallback, useEffect } from 'react';
import ReactGridLayout, { useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import type { SubviewSpec } from '@str/shared';
import { CANVAS_GRID_CONFIG, CANVAS_LAYOUT_CONSTRAINTS } from '@/features/canvas/canvas-grid-config';
import { LivePreview } from './LivePreview';

interface MiniCanvasPreviewProps {
  spec: SubviewSpec | null;
  pythonCode: string;
  context: unknown;
  inputs: Record<string, unknown>;
}

/** Parse spec.size "2x1" or "4x2" -> { w, h } — same grid units as strategy canvas */
function parseSize(size: string): { w: number; h: number } {
  const match = size.match(/^(\d+)x(\d+)$/);
  if (match) {
    return {
      w: Math.min(CANVAS_LAYOUT_CONSTRAINTS.maxW, Math.max(1, parseInt(match[1], 10))),
      h: Math.min(CANVAS_LAYOUT_CONSTRAINTS.maxH, Math.max(1, parseInt(match[2], 10))),
    };
  }
  return { w: 8, h: 2 };
}

export function MiniCanvasPreview({ spec, pythonCode, context, inputs }: MiniCanvasPreviewProps) {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([]);

  useEffect(() => {
    if (spec) {
      const { w, h } = parseSize(spec.size);
      setLayout([{ i: 'preview-card', x: 0, y: 0, w, h, ...CANVAS_LAYOUT_CONSTRAINTS }]);
    } else {
      setLayout([]);
    }
  }, [spec?.size]);

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    setLayout(newLayout);
  }, []);

  if (!spec) {
    return (
      <div
        className="flex items-center justify-center h-32 rounded-[var(--radius-card)] border"
        style={{ backgroundColor: 'var(--color-bg-input)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
      >
        Fix JSON to see preview
      </div>
    );
  }

  const { w, h } = parseSize(spec.size);
  const gridLayout =
    layout.length > 0 ? layout : [{ i: 'preview-card', x: 0, y: 0, w, h, ...CANVAS_LAYOUT_CONSTRAINTS }];

  return (
    <div ref={containerRef} className="h-full min-h-[400px] w-full">
      <ReactGridLayout
        layout={gridLayout}
        width={width}
        gridConfig={CANVAS_GRID_CONFIG}
        compactor={verticalCompactor}
        dragConfig={{ handle: '.subview-drag-handle' }}
        onLayoutChange={handleLayoutChange}
      >
        <div key="preview-card" className="overflow-hidden">
          <LivePreview spec={spec} pythonCode={pythonCode} context={context} inputs={inputs} />
        </div>
      </ReactGridLayout>
    </div>
  );
}

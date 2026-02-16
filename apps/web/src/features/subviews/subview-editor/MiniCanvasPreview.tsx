import { useState, useCallback, useEffect } from 'react';
import ReactGridLayout, { useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import type { SubviewSpec } from '@str/shared';
import { CANVAS_GRID_CONFIG, CANVAS_LAYOUT_CONSTRAINTS, REFERENCE_WIDTH, pixelsToGrid, gridToPixels } from '@/features/canvas/canvas-grid-config';
import { LivePreview } from './LivePreview';

interface MiniCanvasPreviewProps {
  spec: SubviewSpec | null;
  pythonCode: string;
  context: unknown;
  inputs: Record<string, unknown>;
  onInputChange?: (key: string, value: unknown) => void;
  /** When user resizes the preview card, called with new size in pixels (stored as preferredSize in spec) */
  onPreviewResize?: (preferredSize: { w: number; h: number }) => void;
}

function parseSizeStr(s: string): { w: number; h: number } {
  const m = s.match(/^(\d+)x(\d+)$/);
  if (m) return { w: parseInt(m[1], 10) * 25, h: parseInt(m[2], 10) * 20 };
  return { w: 400, h: 100 };
}

/** Effective pixel size: preferredSize or defaultSize (both in px) */
function getEffectivePixelSize(spec: {
  preferredSize?: { w: number; h: number };
  defaultSize?: { w: number; h: number } | string;
  size?: string;
}): { w: number; h: number } {
  if (spec.preferredSize) return spec.preferredSize;
  const ds = spec.defaultSize;
  if (ds != null) return typeof ds === 'object' ? ds : parseSizeStr(ds);
  if (spec.size) return parseSizeStr(spec.size);
  return { w: 400, h: 100 };
}

export function MiniCanvasPreview({ spec, pythonCode, context, inputs, onInputChange, onPreviewResize }: MiniCanvasPreviewProps) {
  const { width, containerRef } = useContainerWidth();
  const [layout, setLayout] = useState<Layout>([]);

  useEffect(() => {
    if (spec) {
      const pixelSize = getEffectivePixelSize(spec);
      const { w, h } = pixelsToGrid(pixelSize.w, pixelSize.h, REFERENCE_WIDTH);
      setLayout([{ i: 'preview-card', x: 0, y: 0, w, h, ...CANVAS_LAYOUT_CONSTRAINTS }]);
    } else {
      setLayout([]);
    }
  }, [spec?.preferredSize, spec?.defaultSize, spec?.size]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      setLayout(newLayout);
      const item = newLayout.find((l) => l.i === 'preview-card');
      if (item && onPreviewResize && spec) {
        const pixelSize = gridToPixels(item.w, item.h, REFERENCE_WIDTH);
        const currentPixel = getEffectivePixelSize(spec);
        if (pixelSize.w !== currentPixel.w || pixelSize.h !== currentPixel.h) {
          onPreviewResize(pixelSize);
        }
      }
    },
    [onPreviewResize, spec]
  );

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

  const pixelSize = getEffectivePixelSize(spec);
  const { w, h } = pixelsToGrid(pixelSize.w, pixelSize.h, REFERENCE_WIDTH);
  const gridLayout =
    layout.length > 0 ? layout : [{ i: 'preview-card', x: 0, y: 0, w, h, ...CANVAS_LAYOUT_CONSTRAINTS }];

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[400px] overflow-auto"
      style={{ width: REFERENCE_WIDTH, minWidth: REFERENCE_WIDTH }}
    >
      <ReactGridLayout
        layout={gridLayout}
        width={width}
        gridConfig={CANVAS_GRID_CONFIG}
        compactor={verticalCompactor}
        dragConfig={{ handle: '.subview-drag-handle' }}
        onLayoutChange={handleLayoutChange}
      >
        <div key="preview-card" className="overflow-hidden">
          <LivePreview spec={spec} pythonCode={pythonCode} context={context} inputs={inputs} onInputChange={onInputChange} />
        </div>
      </ReactGridLayout>
    </div>
  );
}

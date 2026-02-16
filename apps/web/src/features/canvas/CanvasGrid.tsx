import { useCallback } from 'react';
import ReactGridLayout, { useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { useStrategyStore } from '@/store/strategy-store';
import { CANVAS_GRID_CONFIG, CANVAS_LAYOUT_CONSTRAINTS, REFERENCE_WIDTH } from './canvas-grid-config';
import { SubviewCard } from './SubviewCard';

interface CanvasGridProps {
  strategyId: string;
}

export function CanvasGrid({ strategyId }: CanvasGridProps) {
  const strategy = useStrategyStore((s) =>
    s.strategies.find((st) => st.id === strategyId)
  );
  const updateSubviewLayout = useStrategyStore((s) => s.updateSubviewLayout);
  const { containerRef, mounted } = useContainerWidth();

  const layout: Layout = (strategy?.subviews ?? []).map((sv) => ({
    i: sv.id,
    x: sv.position.x,
    y: sv.position.y,
    w: sv.position.w,
    h: sv.position.h,
    ...CANVAS_LAYOUT_CONSTRAINTS,
  }));

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      updateSubviewLayout(strategyId, newLayout, REFERENCE_WIDTH);
    },
    [strategyId, updateSubviewLayout]
  );

  if (!strategy || !mounted) return null;
  if (strategy.subviews.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      style={{ width: REFERENCE_WIDTH, minWidth: REFERENCE_WIDTH }}
    >
      <ReactGridLayout
        layout={layout}
        width={REFERENCE_WIDTH}
        gridConfig={CANVAS_GRID_CONFIG}
        compactor={verticalCompactor}
        dragConfig={{ handle: '.subview-drag-handle' }}
        onLayoutChange={handleLayoutChange}
      >
        {strategy.subviews.map((sv) => (
          <div key={sv.id} className="overflow-hidden">
            <SubviewCard subview={sv} strategyId={strategyId} />
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}

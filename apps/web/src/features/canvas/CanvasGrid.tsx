import { useCallback } from 'react';
import ReactGridLayout, { useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { useStrategyStore } from '@/store/strategy-store';
import { SubviewCard } from './SubviewCard';

interface CanvasGridProps {
  strategyId: string;
}

export function CanvasGrid({ strategyId }: CanvasGridProps) {
  const strategy = useStrategyStore((s) =>
    s.strategies.find((st) => st.id === strategyId)
  );
  const updateSubviewLayout = useStrategyStore((s) => s.updateSubviewLayout);
  const { width, containerRef, mounted } = useContainerWidth();

  const layout: Layout = (strategy?.subviews ?? []).map((sv) => ({
    i: sv.id,
    x: sv.position.x,
    y: sv.position.y,
    w: sv.position.w,
    h: sv.position.h,
    minW: 3,
    minH: 1,
    maxW: 24,
    maxH: 10,
  }));

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      updateSubviewLayout(strategyId, newLayout);
    },
    [strategyId, updateSubviewLayout]
  );

  if (!strategy || !mounted) return null;
  if (strategy.subviews.length === 0) return null;

  return (
    <div ref={containerRef} className="h-full w-full">
      <ReactGridLayout
        layout={layout}
        width={width}
        gridConfig={{ cols: 24, rowHeight: 80, margin: [12, 12], containerPadding: [0, 0] }}
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

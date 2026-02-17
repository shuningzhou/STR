import { useCallback } from 'react';
import ReactGridLayout, { useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { useStrategyStore } from '@/store/strategy-store';
import { CANVAS_GRID_CONFIG, CANVAS_LAYOUT_CONSTRAINTS, REFERENCE_WIDTH } from './canvas-grid-config';
import { SubviewCard } from './SubviewCard';

interface CanvasGridProps {
  strategyId: string;
  isEditMode?: boolean;
}

export function CanvasGrid({ strategyId, isEditMode = true }: CanvasGridProps) {
  const strategy = useStrategyStore((s) =>
    s.strategies.find((st) => st.id === strategyId)
  );
  const updateSubviewLayout = useStrategyStore((s) => s.updateSubviewLayout);
  const { width, containerRef, mounted } = useContainerWidth();

  const layout: Layout = (strategy?.subviews ?? []).map((sv) => ({
    i: sv.id,
    x: sv.position.x,
    y: sv.position.y,
    w: Math.max(CANVAS_LAYOUT_CONSTRAINTS.minW, Math.min(CANVAS_LAYOUT_CONSTRAINTS.maxW, sv.position.w)),
    h: Math.max(CANVAS_LAYOUT_CONSTRAINTS.minH, Math.min(CANVAS_LAYOUT_CONSTRAINTS.maxH, sv.position.h)),
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

  const gridWidth = width ?? REFERENCE_WIDTH;

  return (
    <div
      ref={containerRef}
      className="h-full min-h-0 w-full"
    >
      <ReactGridLayout
        layout={layout}
        width={gridWidth}
        gridConfig={CANVAS_GRID_CONFIG}
        compactor={verticalCompactor}
        dragConfig={{ enabled: isEditMode, handle: '.subview-drag-handle' }}
        resizeConfig={{ enabled: isEditMode }}
        onLayoutChange={handleLayoutChange}
      >
        {strategy.subviews.map((sv) => (
          <div key={sv.id} className="overflow-hidden">
            <SubviewCard subview={sv} strategyId={strategyId} strategy={strategy} isEditMode={isEditMode} />
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}

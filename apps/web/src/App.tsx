import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CanvasArea } from '@/components/CanvasArea';
import { AddStrategyModal } from '@/features/strategy/AddStrategyModal';
import { StrategySettingsModal } from '@/features/strategy/StrategySettingsModal';
import { SubviewSettingsModal } from '@/features/canvas/SubviewSettingsModal';
import { SubviewGalleryModal } from '@/features/subviews/SubviewGalleryModal';
import { initializeTheme } from '@/store/theme-store';

export default function App() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--color-bg-page)' }}>
      <Sidebar />
      <CanvasArea />
      <AddStrategyModal />
      <StrategySettingsModal />
      <SubviewSettingsModal />
      <SubviewGalleryModal />
    </div>
  );
}

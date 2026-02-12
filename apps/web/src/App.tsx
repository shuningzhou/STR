import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CanvasArea } from '@/components/CanvasArea';
import { initializeTheme } from '@/store/theme-store';

export default function App() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--color-bg-page)' }}>
      <Sidebar />
      <CanvasArea />
    </div>
  );
}

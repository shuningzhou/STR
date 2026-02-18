import { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CanvasArea } from '@/components/CanvasArea';
import { AddStrategyModal } from '@/features/strategy/AddStrategyModal';
import { StrategySettingsModal } from '@/features/strategy/StrategySettingsModal';
import { SubviewSettingsModal } from '@/features/canvas/SubviewSettingsModal';
import { SubviewGalleryModal } from '@/features/subviews/SubviewGalleryModal';
import { AddTransactionModal } from '@/features/transactions/AddTransactionModal';
import { EditTransactionModal } from '@/features/transactions/EditTransactionModal';
import { DepositWithdrawModal } from '@/features/transactions/DepositWithdrawModal';
import { WalletSettingsModal } from '@/features/transactions/WalletSettingsModal';
import { DeleteTransactionConfirmModal } from '@/features/transactions/DeleteTransactionConfirmModal';
import { TransactionListPanel } from '@/features/transactions/TransactionListPanel';
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
      <AddTransactionModal />
      <EditTransactionModal />
      <DepositWithdrawModal />
      <WalletSettingsModal />
      <DeleteTransactionConfirmModal />
      <TransactionListPanel />
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useStrategyStore } from '@/store/strategy-store';
import { useCreateStrategy, useSnaptradeAccounts, useSyncStrategy } from '@/api/hooks';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, SegmentControl } from '@/components/ui';
import { IconPicker } from '@/components/IconPicker';

const CURRENCIES = ['USD', 'CAD'] as const;
const MODES = ['Manual', 'Synced'] as const;

/** SnapTrade transaction types (tx.side). Option filtering is via Asset Type Filter. */
const TRANSACTION_TYPES = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'fee', label: 'Fee' },
  { value: 'interest', label: 'Interest' },
  { value: 'refund', label: 'Refund' },
  { value: 'split', label: 'Split' },
] as const;

const ASSET_TYPES = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'option', label: 'Options' },
] as const;

const OPTION_STRATEGIES = [
  { value: 'all', label: 'All options' },
  { value: 'income_only', label: 'Covered calls & Secured puts only' },
  { value: 'calls_puts', label: 'Long calls & puts' },
] as const;

export function AddStrategyModal() {
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'CAD'>('USD');
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'Manual' | 'Synced'>('Manual');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<string[]>([]);
  const [optionStrategy, setOptionStrategy] = useState<'all' | 'income_only' | 'calls_puts'>('all');

  const createStrategy = useCreateStrategy();
  const syncStrategy = useSyncStrategy();
  const setActiveStrategy = useStrategyStore((s) => s.setActiveStrategy);
  const { addStrategyModalOpen, setAddStrategyModalOpen } = useUIStore();
  const { data: snapAccounts = [] } = useSnaptradeAccounts();

  const isSynced = mode === 'Synced';

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) {
        setError('Name is required');
        return;
      }
      if (isSynced && selectedAccounts.length === 0) {
        setError('Select at least one account');
        return;
      }
      setError(null);

      const newStrategy = await createStrategy.mutateAsync({
        name: trimmed,
        baseCurrency,
        icon,
        ...(isSynced
          ? {
              mode: 'synced' as const,
              snaptradeConfig: {
                accountIds: selectedAccounts,
                transactionTypes: selectedTypes,
                currencies: selectedCurrencies,
                assetTypes: selectedAssetTypes,
                optionStrategy,
              },
            }
          : {}),
      });
      setActiveStrategy(newStrategy.id);

      if (isSynced) {
        try {
          await syncStrategy.mutateAsync(newStrategy.id);
        } catch {
          // sync can be retried later
        }
      }

      resetForm();
      setAddStrategyModalOpen(false);
    },
    [createStrategy, syncStrategy, setActiveStrategy, baseCurrency, icon, name, setAddStrategyModalOpen, isSynced, selectedAccounts, selectedTypes, selectedCurrencies, selectedAssetTypes, optionStrategy],
  );

  const resetForm = () => {
    setName('');
    setBaseCurrency('USD');
    setIcon(undefined);
    setError(null);
    setMode('Manual');
    setSelectedAccounts([]);
    setSelectedTypes([]);
    setSelectedCurrencies([]);
    setSelectedAssetTypes([]);
    setOptionStrategy('all');
  };

  const handleClose = useCallback(() => {
    setAddStrategyModalOpen(false);
    resetForm();
  }, [setAddStrategyModalOpen]);

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleCurrency = (ccy: string) => {
    setSelectedCurrencies((prev) =>
      prev.includes(ccy) ? prev.filter((c) => c !== ccy) : [...prev, ccy],
    );
  };

  const toggleAssetType = (at: string) => {
    setSelectedAssetTypes((prev) =>
      prev.includes(at) ? prev.filter((a) => a !== at) : [...prev, at],
    );
  };

  if (!addStrategyModalOpen) return null;

  return (
    <Modal title="Create strategy" onClose={handleClose} size={isSynced ? 'lg' : 'default'}>
      <form onSubmit={handleSubmit}>
        {/* Mode selector */}
        <div style={{ marginBottom: 20 }} className="flex items-center gap-3">
          <Label inline>Type</Label>
          <div style={{ width: 180 }}>
            <SegmentControl value={mode} options={MODES} onChange={(m) => setMode(m)} />
          </div>
        </div>

        {/* Name and Icon on same row */}
        <div style={{ marginBottom: 20 }} className="flex gap-3 items-end">
          <div className="flex-1 min-w-0">
            <Label htmlFor="strategy-name">Name</Label>
            <div className="mt-1">
              <Input
                id="strategy-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder={isSynced ? 'e.g. My Questrade TFSA' : 'e.g. Growth Portfolio'}
                autoFocus
                error={error ?? undefined}
              />
            </div>
          </div>
          <div style={{ minWidth: 160 }}>
            <IconPicker value={icon} onChange={(v) => setIcon(v)} label="Icon" placeholder="Default" showColorPicker={false} defaultIcon="LayoutDashboard" />
          </div>
        </div>

        {/* Base currency */}
        <div style={{ marginBottom: 20 }} className="flex items-center gap-3">
          <Label htmlFor="base-currency" inline>Base currency</Label>
          <div style={{ width: 150 }}>
            <SegmentControl
              value={baseCurrency}
              options={CURRENCIES}
              onChange={(c) => setBaseCurrency(c)}
            />
          </div>
        </div>

        {/* Synced-specific: account picker + type filter */}
        {isSynced && (
          <>
            <div style={{ marginBottom: 20 }}>
              <Label>Brokerage Accounts</Label>
              {snapAccounts.length === 0 ? (
                <p
                  className="mt-1"
                  style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-body)' }}
                >
                  No connected accounts. Connect a brokerage in Account settings first.
                </p>
              ) : (
                <div
                  className="mt-1 overflow-auto"
                  style={{
                    maxHeight: 480,
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-medium)',
                    fontSize: 'var(--font-size-body)',
                  }}
                >
                  <table className="w-full border-collapse" style={{ tableLayout: 'auto', minWidth: 400 }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={{ backgroundColor: 'var(--color-table-header-bg)' }}>
                        <th style={{ width: 36, padding: 6, borderBottom: '1px solid var(--color-table-border)', textAlign: 'left', color: 'var(--color-table-header-text)', fontWeight: 500 }} />
                        <th style={{ padding: 6, borderBottom: '1px solid var(--color-table-border)', textAlign: 'left', color: 'var(--color-table-header-text)', fontWeight: 500 }}>Institution</th>
                        <th style={{ padding: 6, borderBottom: '1px solid var(--color-table-border)', textAlign: 'left', color: 'var(--color-table-header-text)', fontWeight: 500 }}>Name</th>
                        <th style={{ padding: 6, borderBottom: '1px solid var(--color-table-border)', textAlign: 'left', color: 'var(--color-table-header-text)', fontWeight: 500 }}>Currency</th>
                        <th style={{ padding: 6, borderBottom: '1px solid var(--color-table-border)', textAlign: 'left', color: 'var(--color-table-header-text)', fontWeight: 500 }}>Type</th>
                        <th style={{ padding: 6, borderBottom: '1px solid var(--color-table-border)', textAlign: 'right', color: 'var(--color-table-header-text)', fontWeight: 500 }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapAccounts.map((acct) => {
                        const checked = selectedAccounts.includes(acct.accountId);
                        return (
                          <tr
                            key={acct.accountId}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleAccount(acct.accountId)}
                            onKeyDown={(e) => e.key === 'Enter' && toggleAccount(acct.accountId)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: checked ? 'var(--color-bg-hover)' : 'transparent',
                              borderBottom: '1px solid var(--color-table-border)',
                            }}
                          >
                            <td style={{ padding: 6, width: 36, verticalAlign: 'middle' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAccount(acct.accountId)}
                                onClick={(e) => e.stopPropagation()}
                                className="accent-[var(--color-active)]"
                              />
                            </td>
                            <td style={{ padding: 6, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{acct.institutionName || '—'}</td>
                            <td style={{ padding: 6, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{acct.name || '—'}</td>
                            <td style={{ padding: 6, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{acct.currency || '—'}</td>
                            <td style={{ padding: 6, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{acct.type || '—'}</td>
                            <td style={{ padding: 6, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                              {acct.balanceAmount != null ? acct.balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <Label>Transaction Types</Label>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, marginBottom: 4 }}>
                Select which transaction types to sync. Empty = all. All filters disabled by default.
              </p>
              <div
                className="flex flex-wrap mt-1"
                style={{ gap: 'var(--space-gap)' }}
              >
                {TRANSACTION_TYPES.map((t) => {
                  const checked = selectedTypes.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleType(t.value)}
                      className="font-medium transition-colors cursor-pointer shrink-0"
                      style={{
                        minHeight: 'var(--control-height)',
                        paddingLeft: 'var(--space-gap)',
                        paddingRight: 'var(--space-gap)',
                        fontSize: 'var(--font-size-body)',
                        borderRadius: 'var(--radius-medium)',
                        backgroundColor: checked ? 'var(--color-active)' : 'var(--color-bg-input)',
                        color: checked ? 'var(--color-text-active)' : 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!checked) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!checked) e.currentTarget.style.backgroundColor = 'var(--color-bg-input)';
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Label>Currency Filter</Label>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, marginBottom: 4 }}>
                Only sync transactions in these currencies. Empty = all.
              </p>
              <div
                className="flex flex-wrap mt-1"
                style={{ gap: 'var(--space-gap)' }}
              >
                {CURRENCIES.map((ccy) => {
                  const checked = selectedCurrencies.includes(ccy);
                  return (
                    <button
                      key={ccy}
                      type="button"
                      onClick={() => toggleCurrency(ccy)}
                      className="font-medium transition-colors cursor-pointer shrink-0"
                      style={{
                        minHeight: 'var(--control-height)',
                        paddingLeft: 'var(--space-gap)',
                        paddingRight: 'var(--space-gap)',
                        fontSize: 'var(--font-size-body)',
                        borderRadius: 'var(--radius-medium)',
                        backgroundColor: checked ? 'var(--color-active)' : 'var(--color-bg-input)',
                        color: checked ? 'var(--color-text-active)' : 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        if (!checked) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!checked) e.currentTarget.style.backgroundColor = 'var(--color-bg-input)';
                      }}
                    >
                      {ccy}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-6" style={{ marginBottom: 20 }}>
              <div className="shrink-0">
                <Label>Asset Type Filter</Label>
                <div
                  className="flex flex-wrap mt-1"
                  style={{ gap: 'var(--space-gap)' }}
                >
                  {ASSET_TYPES.map((at) => {
                    const checked = selectedAssetTypes.includes(at.value);
                    return (
                      <button
                        key={at.value}
                        type="button"
                        onClick={() => toggleAssetType(at.value)}
                        className="font-medium transition-colors cursor-pointer shrink-0"
                        style={{
                          minHeight: 'var(--control-height)',
                          paddingLeft: 'var(--space-gap)',
                          paddingRight: 'var(--space-gap)',
                          fontSize: 'var(--font-size-body)',
                          borderRadius: 'var(--radius-medium)',
                          backgroundColor: checked ? 'var(--color-active)' : 'var(--color-bg-input)',
                          color: checked ? 'var(--color-text-active)' : 'var(--color-text-secondary)',
                        }}
                        onMouseEnter={(e) => {
                          if (!checked) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          if (!checked) e.currentTarget.style.backgroundColor = 'var(--color-bg-input)';
                        }}
                      >
                        {at.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedAssetTypes.includes('option') && (
                <div className="flex-1 min-w-[240px] flex flex-col items-stretch" style={{ maxWidth: '100%' }}>
                  <Label>Option Strategy Filter</Label>
                  <SegmentControl
                    className="mt-1 w-full"
                    optionsWithLabels={OPTION_STRATEGIES}
                    value={optionStrategy}
                    onChange={(v) => setOptionStrategy(v as 'all' | 'income_only' | 'calls_puts')}
                    flexWeights={[1, 2, 1]}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex gap-3" style={{ marginTop: 20 }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

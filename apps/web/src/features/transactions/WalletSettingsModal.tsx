import { useState, useCallback, useEffect, useMemo } from 'react';
import { useStrategies, useTransactions, useUpdateStrategy } from '@/api/hooks';
import { useUIStore } from '@/store/ui-store';
import { useStrategyPrices } from '@/hooks/useStrategyPrices';
import { computeEquity } from '@/lib/compute-equity';
import { Modal, Button, Input, Label } from '@/components/ui';

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  padding: '5px 0',
  borderBottom: '1px solid var(--color-border)',
} as const;

const valueColumnStyle = {
  minWidth: 140,
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  paddingLeft: 16,
} as const;

const equationStyle = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  marginTop: 2,
  opacity: 0.85,
} as const;

function Row({ label, equation, value }: { label: string; equation?: string; value: string }) {
  return (
    <div style={rowStyle}>
      <div>
        <div style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>{label}</div>
        {equation && <div style={equationStyle}>{equation}</div>}
      </div>
      <div style={valueColumnStyle}>
        <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
    </div>
  );
}

function FieldWithInput({
  label,
  equation,
  id,
  children,
}: {
  label: string;
  equation?: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div style={rowStyle}>
      <div>
        <Label htmlFor={id} className="!mb-0" style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
          {label}
        </Label>
        {equation && <div style={equationStyle}>{equation}</div>}
      </div>
      <div style={valueColumnStyle}>{children}</div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{children}</div>
    </div>
  );
}

export function WalletSettingsModal() {
  const walletSettingsModalOpen = useUIStore((s) => s.walletSettingsModalOpen);
  const setWalletSettingsModalOpen = useUIStore((s) => s.setWalletSettingsModalOpen);
  const { data: strategies = [] } = useStrategies();
  const updateStrategyMut = useUpdateStrategy();

  const strategyId = walletSettingsModalOpen;
  const strategy = strategies.find((s) => s.id === strategyId);
  const { data: transactions = [] } = useTransactions(strategyId);

  const [loanInterest, setLoanInterest] = useState('');
  const [marginRequirement, setMarginRequirement] = useState('');
  const [collateralSecurities, setCollateralSecurities] = useState('');
  const [collateralCash, setCollateralCash] = useState('');
  const [collateralRequirement, setCollateralRequirement] = useState('');

  const currentPrices = useStrategyPrices(transactions);

  const { computedBalance, currency, equity } = useMemo(() => {
    if (!strategy) return { computedBalance: 0, currency: 'USD', equity: 0 };
    const txs = transactions;
    const initial = strategy.initialBalance ?? 0;
    const balance =
      initial +
      txs.reduce((sum, tx) => sum + ((tx as { cashDelta?: number }).cashDelta ?? 0), 0);
    const equity = computeEquity(txs, currentPrices);
    return { computedBalance: balance, currency: strategy.baseCurrency ?? 'USD', equity };
  }, [strategy, currentPrices, transactions]);

  useEffect(() => {
    if (strategy) {
      setLoanInterest(String(strategy.loanInterest ?? ''));
      setMarginRequirement(String(strategy.marginRequirement ?? ''));
      setCollateralSecurities(String(strategy.collateralSecurities ?? ''));
      setCollateralCash(String(strategy.collateralCash ?? ''));
      setCollateralRequirement(String(strategy.collateralRequirement ?? ''));
    }
  }, [strategy]);

  const handleSave = useCallback(() => {
    if (!strategyId) return;
    updateStrategyMut.mutate({
      id: strategyId,
      loanInterest: loanInterest === '' ? undefined : parseFloat(loanInterest) || 0,
      marginRequirement: marginRequirement === '' ? undefined : parseFloat(marginRequirement) || 0,
      collateralSecurities: collateralSecurities === '' ? undefined : parseFloat(collateralSecurities) || 0,
      collateralCash: collateralCash === '' ? undefined : parseFloat(collateralCash) || 0,
      collateralRequirement: collateralRequirement === '' ? undefined : parseFloat(collateralRequirement) || 0,
    });
    setWalletSettingsModalOpen(null);
  }, [strategyId, loanInterest, marginRequirement, collateralSecurities, collateralCash, collateralRequirement, updateStrategyMut, setWalletSettingsModalOpen]);

  const handleClose = useCallback(() => {
    setWalletSettingsModalOpen(null);
  }, [setWalletSettingsModalOpen]);

  if (!walletSettingsModalOpen || !strategyId || !strategy) return null;

  const marginAccountEnabled = strategy.marginAccountEnabled ?? false;
  // For margin: wallet never goes below 0; negative cash becomes loan (matches Portfolio Growth chart)
  const displayLoan = marginAccountEnabled ? Math.max(0, -computedBalance) : (strategy?.loanAmount ?? 0);
  const currentBalance = marginAccountEnabled ? Math.max(0, computedBalance) : computedBalance;

  const loanAmountNum = displayLoan;
  const marginReqNum = parseFloat(marginRequirement) || 0;
  const collateralSecuritiesNum = parseFloat(collateralSecurities) || 0;
  const collateralCashNum = parseFloat(collateralCash) || 0;
  const collateralReqNum = parseFloat(collateralRequirement) || 0;
  const collateralLimit = collateralSecuritiesNum * (collateralReqNum / 100);
  const collateralEnabled = strategy.collateralEnabled ?? false;
  const collateralAvailable =
    collateralEnabled ? (collateralSecuritiesNum - collateralLimit) + collateralCashNum : 0;

  const marginLimit = equity * (marginReqNum / 100);
  const marginAvailable =
    collateralAvailable + equity + currentBalance - loanAmountNum - marginLimit;
  const buyingPower =
    marginReqNum > 0 ? marginAvailable / (marginReqNum / 100) : 0;

  const inputStyle = { padding: '8px 12px', textAlign: 'right' as const, width: 120, minWidth: 120 };

  return (
    <Modal
      title="Wallet"
      onClose={handleClose}
      size="lg"
      className="max-w-[538px]"
      headerRight={
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-medium)',
            backgroundColor: 'var(--color-bg-hover)',
          }}
        >
          {currency}
        </span>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <Row label="Balance" value={formatCurrency(currentBalance, currency)} />

        {marginAccountEnabled && (
        <Group title="Margin">
          <Row label="Loan amount" value={formatCurrency(loanAmountNum, currency)} />
          <FieldWithInput label="Loan interest" id="wallet-loan-interest">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                id="wallet-loan-interest"
                type="number"
                value={loanInterest}
                onChange={(e) => setLoanInterest(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>%</span>
            </div>
          </FieldWithInput>
          <FieldWithInput label="Margin requirement" id="wallet-margin-req">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                id="wallet-margin-req"
                type="number"
                value={marginRequirement}
                onChange={(e) => setMarginRequirement(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>%</span>
            </div>
          </FieldWithInput>
          <Row
            label="Equity"
            equation="Σ(holdings × price)"
            value={formatCurrency(equity, currency)}
          />
          <Row
            label="Margin limit"
            equation="equity × (margin requirement / 100)"
            value={formatCurrency(marginLimit, currency)}
          />
          <Row
            label="Margin available"
            equation="collateral available + equity + balance − loan − margin limit"
            value={formatCurrency(marginAvailable, currency)}
          />
          <Row
            label="Buying power"
            equation="margin available ÷ (margin requirement / 100)"
            value={formatCurrency(buyingPower, currency)}
          />
        </Group>
        )}

        {marginAccountEnabled && collateralEnabled && (
        <Group title="Collateral">
          <FieldWithInput label="Securities" id="wallet-collateral-securities">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                id="wallet-collateral-securities"
                type="number"
                step="0.01"
                min={0}
                value={collateralSecurities}
                onChange={(e) => setCollateralSecurities(e.target.value)}
                placeholder="0.00"
                style={inputStyle}
              />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{currency}</span>
            </div>
          </FieldWithInput>
          <FieldWithInput label="Cash" id="wallet-collateral-cash">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                id="wallet-collateral-cash"
                type="number"
                step="0.01"
                min={0}
                value={collateralCash}
                onChange={(e) => setCollateralCash(e.target.value)}
                placeholder="0.00"
                style={inputStyle}
              />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{currency}</span>
            </div>
          </FieldWithInput>
          <FieldWithInput label="Collateral requirement" id="wallet-collateral-req">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                id="wallet-collateral-req"
                type="number"
                value={collateralRequirement}
                onChange={(e) => setCollateralRequirement(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>%</span>
            </div>
          </FieldWithInput>
          <Row
            label="Collateral limit"
            equation="securities × (collateral requirement / 100)"
            value={formatCurrency(collateralLimit, currency)}
          />
          <Row
            label="Collateral available"
            equation="(securities − collateral limit) + cash"
            value={formatCurrency(collateralAvailable, currency)}
          />
        </Group>
        )}
      </div>

      <div className="flex gap-3" style={{ marginTop: 20 }}>
        <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
          Close
        </Button>
        <Button type="button" variant="primary" onClick={handleSave} className="flex-1">
          Save
        </Button>
      </div>
    </Modal>
  );
}

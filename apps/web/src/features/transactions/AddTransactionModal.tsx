import { useState, useCallback, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { useStrategyStore } from '@/store/strategy-store';
import { useUIStore } from '@/store/ui-store';
import { Modal, Button, Input, Label, Select, SegmentControl } from '@/components/ui';

const SIDES_SIMPLE = ['buy', 'sell'] as const;

const SIDE_OPTIONS_FULL = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'sell_short', label: 'Sell Short' },
  { value: 'buy_to_cover', label: 'Buy to Cover' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'fee', label: 'Fee' },
  { value: 'interest', label: 'Interest' },
];

const CALL_PUT_OPTIONS = [
  { value: 'call', label: 'Call' },
  { value: 'put', label: 'Put' },
];

const OPTION_TYPE_OPTIONS = [
  { value: 'call', label: 'Covered Call' },
  { value: 'put', label: 'Secured Put' },
];

const INPUT_WIDTH = { width: 200 };

export function AddTransactionModal() {
  const addTransactionModalOpen = useUIStore((s) => s.addTransactionModalOpen);
  const setAddTransactionModalOpen = useUIStore((s) => s.setAddTransactionModalOpen);
  const addTransaction = useStrategyStore((s) => s.addTransaction);
  const strategies = useStrategyStore((s) => s.strategies);

  const strategyId = addTransactionModalOpen?.strategyId ?? null;
  const mode = addTransactionModalOpen?.mode ?? 'stock-etf';
  const isFull = mode === 'full';
  const isOption = mode === 'option';

  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [cashDelta, setCashDelta] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hasOption, setHasOption] = useState(false);
  const [optExpiration, setOptExpiration] = useState('');
  const [optStrike, setOptStrike] = useState('');
  const [optCallPut, setOptCallPut] = useState('call');
  const [customDataJson, setCustomDataJson] = useState('{}');
  const [error, setError] = useState<string | null>(null);

  const strategy = useMemo(
    () => strategies.find((s) => s.id === strategyId),
    [strategies, strategyId]
  );

  const title = isFull ? 'Add Transaction' : isOption ? 'Sell Option' : 'Add Stock/ETF Transaction';

  const resetForm = useCallback(() => {
    setSymbol('');
    setSide('buy');
    setQuantity('');
    setPrice('');
    setCashDelta('');
    setDate(new Date().toISOString().slice(0, 10));
    setHasOption(false);
    setOptExpiration('');
    setOptStrike('');
    setOptCallPut('call');
    setCustomDataJson('{}');
    setError(null);
  }, []);

  const handleSubmitSimple = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId) return;

      const sym = symbol.trim().toUpperCase();
      if (!sym) {
        setError('Symbol is required');
        return;
      }
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        setError('Quantity must be a positive number');
        return;
      }
      const pr = parseFloat(price);
      if (isNaN(pr) || pr < 0) {
        setError('Price must be a non-negative number');
        return;
      }

      setError(null);
      const cashDeltaVal = Math.round(-qty * pr * (side === 'buy' ? 1 : -1) * 100) / 100;
      const timestamp = `${date}T12:00:00Z`;

      try {
        addTransaction(strategyId, {
          side: side as 'buy' | 'sell',
          cashDelta: cashDeltaVal,
          timestamp,
          instrumentSymbol: sym,
          option: null,
          customData: {},
          quantity: qty,
          price: pr,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add transaction');
        return;
      }

      resetForm();
      setAddTransactionModalOpen(null);
    },
    [strategyId, symbol, side, quantity, price, date, addTransaction, setAddTransactionModalOpen, resetForm]
  );

  const handleSubmitFull = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId) return;

      const needsSymbol = !['deposit', 'withdrawal', 'interest', 'fee'].includes(side);
      const sym = needsSymbol
        ? symbol.trim().toUpperCase()
        : (strategy?.baseCurrency ?? 'USD');
      if (needsSymbol && !sym) {
        setError('Symbol is required');
        return;
      }
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty < 0) {
        setError('Quantity must be a non-negative number');
        return;
      }
      const pr = parseFloat(price);
      if (isNaN(pr) || pr < 0) {
        setError('Price must be a non-negative number');
        return;
      }
      const cd = cashDelta.trim() ? parseFloat(cashDelta) : null;
      if (cashDelta.trim() !== '' && isNaN(parseFloat(cashDelta))) {
        setError('Cash Delta must be a valid number');
        return;
      }

      let parsedCustomData: Record<string, unknown> = {};
      if (customDataJson.trim()) {
        try {
          parsedCustomData = JSON.parse(customDataJson) as Record<string, unknown>;
          if (typeof parsedCustomData !== 'object' || Array.isArray(parsedCustomData)) {
            setError('Custom data must be a JSON object');
            return;
          }
        } catch {
          setError('Invalid JSON in custom data');
          return;
        }
      }

      setError(null);
      const timestamp = `${date}T12:00:00Z`;

      const mult = hasOption ? 100 : 1; // options: premium per share × 100 shares/contract
      const computedCashDelta = (() => {
        if (side === 'deposit') {
          const amt = Math.abs((cd ?? qty * pr) || 0);
          return Math.round(amt * 100) / 100;
        }
        if (['withdrawal', 'interest', 'fee'].includes(side)) {
          const amt = Math.abs((cd ?? qty * pr) || 0);
          return -Math.round(amt * 100) / 100;
        }
        if (cd !== null) return Math.round(cd * 100) / 100;
        if (side === 'buy') return Math.round(-qty * pr * mult * 100) / 100;
        if (side === 'sell' || side === 'sell_short') return Math.round(qty * pr * mult * 100) / 100;
        if (side === 'buy_to_cover') return Math.round(-qty * pr * mult * 100) / 100;
        return 0;
      })();

      const option = hasOption
        ? {
            expiration: optExpiration ? `${optExpiration}T00:00:00Z` : '',
            strike: parseFloat(optStrike) || 0,
            callPut: optCallPut,
          }
        : null;

      try {
        addTransaction(strategyId, {
          side,
          cashDelta: computedCashDelta,
          timestamp,
          instrumentSymbol: sym,
          option,
          customData: parsedCustomData,
          quantity: qty,
          price: pr,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add transaction');
        return;
      }

      resetForm();
      setAddTransactionModalOpen(null);
    },
    [
      strategyId,
      strategy,
      symbol,
      side,
      quantity,
      price,
      cashDelta,
      date,
      hasOption,
      optExpiration,
      optStrike,
      optCallPut,
      customDataJson,
      addTransaction,
      setAddTransactionModalOpen,
      resetForm,
    ]
  );

  const handleSubmitOption = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId) return;

      const sym = symbol.trim().toUpperCase();
      if (!sym) {
        setError('Symbol is required');
        return;
      }
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        setError('Quantity must be a positive number');
        return;
      }
      if (!optExpiration) {
        setError('Expiration is required');
        return;
      }
      const strike = parseFloat(optStrike);
      if (isNaN(strike) || strike < 0) {
        setError('Strike must be non-negative');
        return;
      }
      const pr = parseFloat(price);
      if (isNaN(pr) || pr < 0) {
        setError('Premium must be non-negative');
        return;
      }

      setError(null);
      const premium = Math.round(qty * pr * 10000) / 100; // premium per share × 100 shares × qty; round to cents
      const timestamp = `${date}T12:00:00Z`;

      try {
        addTransaction(strategyId, {
          side: 'sell',
          cashDelta: premium,
          timestamp,
          instrumentSymbol: sym,
          option: {
            expiration: `${optExpiration}T00:00:00Z`,
            strike,
            callPut: optCallPut,
          },
          customData: {},
          quantity: qty,
          price: pr,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add option');
        return;
      }

      resetForm();
      setAddTransactionModalOpen(null);
    },
    [strategyId, symbol, quantity, optExpiration, optStrike, optCallPut, price, date, addTransaction, setAddTransactionModalOpen, resetForm]
  );

  const handleSubmit = isFull ? handleSubmitFull : isOption ? handleSubmitOption : handleSubmitSimple;

  const handleClose = useCallback(() => {
    setAddTransactionModalOpen(null);
    resetForm();
  }, [setAddTransactionModalOpen, resetForm]);

  if (!addTransactionModalOpen || !strategyId) return null;

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 10 }}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );

  return (
    <Modal title={title} onClose={handleClose} size={isFull ? 'lg' : 'default'}>
      <form onSubmit={handleSubmit}>
        {!isFull && !isOption && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Add transaction to <strong>{strategy?.name}</strong>
          </p>
        )}
        {isOption ? (
          <div style={{ marginBottom: 20 }}>
            <div className="mb-4">
              {field('Type', (
                <Select
                  options={OPTION_TYPE_OPTIONS}
                  value={optCallPut}
                  onChange={(v) => setOptCallPut(v)}
                  className="w-full"
                  autoFocus
                />
              ))}
            </div>
            <div className="grid grid-cols-[1fr_1fr] gap-4 mb-4">
              {field('Underlying', (
                <Input
                  type="text"
                  value={symbol}
                  onChange={(e) => {
                    setSymbol(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="e.g. AAPL, SPY"
                  className="w-full"
                  autoFocus
                />
              ))}
              {field('Expiration', (
                <Input type="date" value={optExpiration} onChange={(e) => setOptExpiration(e.target.value)} className="w-full" />
              ))}
              {field('Strike', (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={optStrike}
                  onChange={(e) => setOptStrike(e.target.value)}
                  placeholder="e.g. 180"
                  className="w-full"
                />
              ))}
              {field('Contracts', (
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setError(null);
                  }}
                  placeholder="1"
                  className="w-full"
                />
              ))}
              {field('Premium ($/share)', (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. 1"
                  error={error ?? undefined}
                  className="w-full"
                />
              ))}
              {field('Trade date', (
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
              ))}
            </div>
            {(() => {
              const q = parseFloat(quantity);
              const p = parseFloat(price);
              if (isNaN(q) || isNaN(p) || q <= 0 || p < 0) return null;
              return (
                <p className="text-[13px] mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Total premium received: <strong>${(q * p * 100).toFixed(2)}</strong>
                </p>
              );
            })()}
          </div>
        ) : isFull ? (
          <div className="overflow-y-auto max-h-[65vh] pr-1" style={{ marginBottom: 20 }}>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 mb-4">
              {field('Side', (
                <Select
                  options={SIDE_OPTIONS_FULL}
                  value={side}
                  onChange={(v) => setSide(v)}
                  style={INPUT_WIDTH}
                  autoFocus
                />
              ))}
              {!['deposit', 'withdrawal', 'interest', 'fee'].includes(side) &&
                field('Symbol', (
                  <Input
                    type="text"
                    value={symbol}
                    onChange={(e) => {
                      setSymbol(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="e.g. AAPL, VOO"
                    style={INPUT_WIDTH}
                  />
                ))}
              {field('Date', (
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={INPUT_WIDTH} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {field(hasOption ? 'Quantity (contracts)' : 'Quantity', (
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setError(null);
                  }}
                  placeholder={hasOption ? 'e.g. 1' : 'e.g. 10'}
                  error={error ?? undefined}
                  style={INPUT_WIDTH}
                />
              ))}
              {field(
                hasOption ? 'Price (premium/contract)' : 'Price',
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setError(null);
                  }}
                  placeholder={hasOption ? 'e.g. 3.50' : 'e.g. 180.50'}
                  style={INPUT_WIDTH}
                />
              )}
              {field('Cash Delta (override)', (
                <Input
                  type="number"
                  step="0.01"
                  value={cashDelta}
                  onChange={(e) => {
                    setCashDelta(e.target.value);
                    setError(null);
                  }}
                  placeholder="Auto from qty×price"
                  style={INPUT_WIDTH}
                />
              ))}
            </div>

            <div className="text-xs font-medium mt-4 mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Option
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="add-tx-has-option"
                checked={hasOption}
                onChange={(e) => setHasOption(e.target.checked)}
              />
              <Label htmlFor="add-tx-has-option" className="!mb-0 cursor-pointer">
                This is an option trade
              </Label>
            </div>
            {hasOption && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {field('Expiration', (
                  <Input
                    type="date"
                    value={optExpiration}
                    onChange={(e) => setOptExpiration(e.target.value)}
                    style={INPUT_WIDTH}
                  />
                ))}
                {field('Strike', (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={optStrike}
                    onChange={(e) => setOptStrike(e.target.value)}
                    placeholder="e.g. 180"
                    style={INPUT_WIDTH}
                  />
                ))}
                {field('Call/Put', (
                  <Select
                    options={CALL_PUT_OPTIONS}
                    value={optCallPut}
                    onChange={(v) => setOptCallPut(v)}
                    style={INPUT_WIDTH}
                  />
                ))}
              </div>
            )}

            <div style={{ paddingTop: 10 }}>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Custom Data (JSON)
              </div>
              <div
                className="rounded-[var(--radius-medium)] overflow-hidden border"
                style={{
                  borderColor: 'var(--color-border)',
                  minHeight: 120,
                }}
              >
                <Editor
                  height={120}
                  defaultLanguage="json"
                  value={customDataJson}
                  onChange={(v) => {
                    setCustomDataJson(v ?? '');
                    setError(null);
                  }}
                  onMount={(editor) => {
                    editor.getModel()?.updateOptions({ tabSize: 2 });
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    folding: true,
                    showFoldingControls: 'always',
                    foldingStrategy: 'auto',
                  }}
                  theme="vs-dark"
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            {field('Symbol', (
              <Input
                type="text"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="e.g. AAPL, VOO"
                autoFocus
              />
            ))}
            {field('Side', (
              <SegmentControl
                value={side as 'buy' | 'sell'}
                options={SIDES_SIMPLE}
                onChange={(v) => setSide(v)}
                className="flex-1 min-w-0 mt-1"
              />
            ))}
            {field('Quantity', (
              <Input
                type="number"
                min="0.0001"
                step="any"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. 10"
                error={error ?? undefined}
              />
            ))}
            {field('Price', (
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. 180.50"
              />
            ))}
            {field('Date', (
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            ))}
          </div>
        )}

        <div className="flex gap-3" style={{ marginTop: 'var(--space-modal)' }}>
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            {isOption ? 'Sell' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import { useState, useCallback, useEffect } from 'react';
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

const INPUT_WIDTH = { width: 200 };

export function EditTransactionModal() {
  const editTransactionModalOpen = useUIStore((s) => s.editTransactionModalOpen);
  const setEditTransactionModalOpen = useUIStore((s) => s.setEditTransactionModalOpen);
  const updateTransaction = useStrategyStore((s) => s.updateTransaction);
  const strategies = useStrategyStore((s) => s.strategies);

  const mode = editTransactionModalOpen?.mode ?? 'full';
  const isSimple = mode === 'stock-etf';
  const isOption = mode === 'option';

  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [cashDelta, setCashDelta] = useState('');
  const [date, setDate] = useState('');
  const [hasOption, setHasOption] = useState(false);
  const [optExpiration, setOptExpiration] = useState('');
  const [optStrike, setOptStrike] = useState('');
  const [optCallPut, setOptCallPut] = useState('call');
  const [hasOptionRoll, setHasOptionRoll] = useState(false);
  const [rollFromExp, setRollFromExp] = useState('');
  const [rollFromStrike, setRollFromStrike] = useState('');
  const [rollFromCallPut, setRollFromCallPut] = useState('call');
  const [rollToExp, setRollToExp] = useState('');
  const [rollToStrike, setRollToStrike] = useState('');
  const [rollToCallPut, setRollToCallPut] = useState('call');
  const [customDataJson, setCustomDataJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const strategyId = editTransactionModalOpen?.strategyId ?? null;
  const transaction = editTransactionModalOpen?.transaction;

  const strategy = strategies.find((s) => s.id === strategyId);

  useEffect(() => {
    if (transaction) {
      setSymbol((transaction.instrumentSymbol ?? '').toUpperCase());
      setSide(transaction.side === 'sell' ? 'sell' : 'buy');
      setQuantity(String(transaction.quantity ?? ''));
      setPrice(String(transaction.price ?? ''));
      setCashDelta(isSimple ? '' : String(transaction.cashDelta ?? ''));
      setDate((transaction.timestamp ?? '').slice(0, 10));
      if (!isSimple) {
        const opt = transaction.option;
        const hasOpt = !!opt;
        setHasOption(hasOpt);
        if (hasOpt) {
          setOptExpiration((opt.expiration ?? '').slice(0, 10));
          setOptStrike(String(opt.strike ?? ''));
          setOptCallPut(opt.callPut === 'put' ? 'put' : 'call');
        } else {
          setOptExpiration('');
          setOptStrike('');
          setOptCallPut('call');
        }
        const roll = transaction.optionRoll;
        const hasRoll = !!roll?.option && !!roll?.optionRolledTo;
        setHasOptionRoll(hasRoll);
        if (hasRoll) {
          setRollFromExp((roll.option.expiration ?? '').slice(0, 10));
          setRollFromStrike(String(roll.option.strike ?? ''));
          setRollFromCallPut(roll.option.callPut === 'put' ? 'put' : 'call');
          setRollToExp((roll.optionRolledTo.expiration ?? '').slice(0, 10));
          setRollToStrike(String(roll.optionRolledTo.strike ?? ''));
          setRollToCallPut(roll.optionRolledTo.callPut === 'put' ? 'put' : 'call');
        } else {
          setRollFromExp('');
          setRollFromStrike('');
          setRollFromCallPut('call');
          setRollToExp('');
          setRollToStrike('');
          setRollToCallPut('call');
        }
        try {
          const d = transaction.customData;
          setCustomDataJson(d && Object.keys(d).length > 0 ? JSON.stringify(d, null, 2) : '{}');
        } catch {
          setCustomDataJson('{}');
        }
      }
      setError(null);
    }
  }, [transaction, isSimple]);

  const handleSubmitSimple = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId || !transaction) return;

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
      const timestamp = `${date}T12:00:00Z`;
      const sideVal = side as 'buy' | 'sell';
      const cashDeltaVal = Math.round(-qty * pr * (sideVal === 'buy' ? 1 : -1) * 100) / 100;

      updateTransaction(strategyId, transaction.id, {
        side: sideVal,
        cashDelta: cashDeltaVal,
        timestamp,
        instrumentSymbol: sym,
        quantity: qty,
        price: pr,
      });
      setEditTransactionModalOpen(null);
    },
    [strategyId, transaction, symbol, side, quantity, price, date, updateTransaction, setEditTransactionModalOpen]
  );

  const handleSubmitFull = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!strategyId || !transaction) return;

      const sym = symbol.trim().toUpperCase();
      if (!sym) {
        setError('Symbol is required');
        return;
      }
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty < 0) {
        setError('Quantity must be a non-negative number');
        return;
      }
      const pr = parseFloat(price);
      const allowNegativePrice = hasOptionRoll;
      if (isNaN(pr) || (!allowNegativePrice && pr < 0)) {
        setError(allowNegativePrice ? 'Price must be a number' : 'Price must be a non-negative number');
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

      const computedCashDelta = (() => {
        if (side === 'deposit') {
          const amt = Math.abs((cd ?? qty * pr) ?? transaction.cashDelta ?? 0);
          return Math.round(amt * 100) / 100;
        }
        if (['withdrawal', 'interest', 'fee'].includes(side)) {
          const amt = Math.abs((cd ?? qty * pr) ?? 0) || Math.abs(transaction.cashDelta ?? 0);
          return -Math.round(amt * 100) / 100;
        }
        if (cd !== null) return Math.round(cd * 100) / 100;
        if (hasOptionRoll) return Math.round(qty * pr * 100) / 100;
        if (side === 'buy') return Math.round(-qty * pr * 100) / 100;
        if (side === 'sell' || side === 'sell_short') return Math.round(qty * pr * 100) / 100;
        if (side === 'buy_to_cover') return Math.round(-qty * pr * 100) / 100;
        return transaction.cashDelta ?? 0;
      })();

      const option = hasOption
        ? hasOptionRoll && rollFromExp
          ? {
              expiration: `${rollFromExp}T00:00:00Z`,
              strike: parseFloat(rollFromStrike) || 0,
              callPut: rollFromCallPut,
            }
          : {
              expiration: optExpiration ? `${optExpiration}T00:00:00Z` : '',
              strike: parseFloat(optStrike) || 0,
              callPut: optCallPut,
            }
        : null;

      const optionRoll =
        hasOptionRoll && rollFromExp && rollToExp
          ? {
              option: {
                expiration: `${rollFromExp}T00:00:00Z`,
                strike: parseFloat(rollFromStrike) || 0,
                callPut: rollFromCallPut,
              },
              optionRolledTo: {
                expiration: `${rollToExp}T00:00:00Z`,
                strike: parseFloat(rollToStrike) || 0,
                callPut: rollToCallPut,
              },
            }
          : undefined;

      const updates: Parameters<typeof updateTransaction>[2] = {
        side: hasOptionRoll ? 'option_roll' : side,
        cashDelta: computedCashDelta,
        timestamp,
        instrumentSymbol: sym,
        quantity: qty,
        price: pr,
        option,
        customData: parsedCustomData,
      };
      if (optionRoll) {
        updates.optionRoll = optionRoll;
      } else {
        updates.optionRoll = undefined;
      }
      updateTransaction(strategyId, transaction.id, updates);

      setEditTransactionModalOpen(null);
    },
    [
      strategyId,
      transaction,
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
      hasOptionRoll,
      rollFromExp,
      rollFromStrike,
      rollFromCallPut,
      rollToExp,
      rollToStrike,
      rollToCallPut,
      customDataJson,
      updateTransaction,
      setEditTransactionModalOpen,
    ]
  );

  const handleSubmit = isSimple ? handleSubmitSimple : handleSubmitFull;

  const handleClose = useCallback(() => {
    setEditTransactionModalOpen(null);
    setError(null);
  }, [setEditTransactionModalOpen]);

  if (!editTransactionModalOpen || !strategyId || !transaction) return null;

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 10 }}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );

  return (
    <Modal title={isSimple ? 'Edit Stock/ETF Transaction' : isOption ? 'Edit Option' : 'Edit Transaction'} onClose={handleClose} size={isSimple ? 'default' : 'lg'}>
      <form onSubmit={handleSubmit}>
        {(isSimple || isOption) && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Edit {isOption ? 'option' : 'transaction'} in <strong>{strategy?.name}</strong>
          </p>
        )}
        {isSimple ? (
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
        ) : (
          <div className="overflow-y-auto max-h-[65vh] pr-1" style={{ marginBottom: 20 }}>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 mb-4">
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
                  style={INPUT_WIDTH}
                />
              ))}
              {field('Side', (
                <Select
                  options={SIDE_OPTIONS_FULL}
                  value={side}
                  onChange={(v) => setSide(v)}
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
                hasOptionRoll
                  ? 'Price (delta premium)'
                  : hasOption
                    ? 'Price (premium/contract)'
                    : 'Price',
                <Input
                  type="number"
                  min={hasOptionRoll ? undefined : '0'}
                  step="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setError(null);
                  }}
                  placeholder={
                    hasOptionRoll
                      ? 'e.g. 0.50 (positive when roll pays you)'
                      : hasOption
                        ? 'e.g. 3.50'
                        : 'e.g. 180.50'
                  }
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
                  placeholder={hasOptionRoll ? 'Auto: qty × delta premium' : 'Auto from qty×price'}
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
              id="edit-tx-has-option"
              checked={hasOption}
              onChange={(e) => {
                const v = e.target.checked;
                setHasOption(v);
                if (!v) setHasOptionRoll(false);
              }}
            />
            <Label htmlFor="edit-tx-has-option" className="!mb-0 cursor-pointer">
              This is an option trade
            </Label>
          </div>
          {hasOption && !hasOptionRoll && (
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

          {hasOption && (
            <>
          <div className="text-xs font-medium mt-4 mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Option Roll
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="edit-tx-has-roll"
              checked={hasOptionRoll}
              onChange={(e) => setHasOptionRoll(e.target.checked)}
            />
            <Label htmlFor="edit-tx-has-roll" className="!mb-0 cursor-pointer">
              This is an option roll (close one, open another)
            </Label>
          </div>
          {hasOptionRoll && (
            <>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                From (closing)
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input
                  type="date"
                  value={rollFromExp}
                  onChange={(e) => setRollFromExp(e.target.value)}
                  placeholder="Exp"
                  style={INPUT_WIDTH}
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rollFromStrike}
                  onChange={(e) => setRollFromStrike(e.target.value)}
                  placeholder="Strike"
                  style={INPUT_WIDTH}
                />
                <Select
                  options={CALL_PUT_OPTIONS}
                  value={rollFromCallPut}
                  onChange={(v) => setRollFromCallPut(v)}
                  style={INPUT_WIDTH}
                />
              </div>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                To (opening)
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Input
                  type="date"
                  value={rollToExp}
                  onChange={(e) => setRollToExp(e.target.value)}
                  placeholder="Exp"
                  style={INPUT_WIDTH}
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rollToStrike}
                  onChange={(e) => setRollToStrike(e.target.value)}
                  placeholder="Strike"
                  style={INPUT_WIDTH}
                />
                <Select
                  options={CALL_PUT_OPTIONS}
                  value={rollToCallPut}
                  onChange={(v) => setRollToCallPut(v)}
                  style={INPUT_WIDTH}
                />
              </div>
            </>
          )}
            </>
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
        )}

        <div className="flex gap-3" style={{ marginTop: 20 }}>
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

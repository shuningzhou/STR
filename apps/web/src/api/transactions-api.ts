import { apiFetch, normalizeId } from './api-client';
import type { StrategyTransaction } from '@/store/strategy-store';

export async function listTransactions(strategyId: string): Promise<StrategyTransaction[]> {
  const raw = await apiFetch<Record<string, unknown>[]>(
    `/strategies/${strategyId}/transactions`,
  );
  return raw.map(mapTransaction);
}

export async function createTransaction(
  strategyId: string,
  dto: Omit<StrategyTransaction, 'id'>,
): Promise<StrategyTransaction> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/strategies/${strategyId}/transactions`,
    { method: 'POST', body: JSON.stringify(dto) },
  );
  return mapTransaction(raw);
}

export async function updateTransaction(
  id: string,
  dto: Partial<Omit<StrategyTransaction, 'id'>>,
): Promise<StrategyTransaction> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/transactions/${id}`,
    { method: 'PATCH', body: JSON.stringify(dto) },
  );
  return mapTransaction(raw);
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
}

function mapTransaction(raw: Record<string, unknown>): StrategyTransaction {
  const doc = normalizeId(raw);
  return {
    id: doc.id as string,
    side: doc.side as string,
    cashDelta: (doc.cashDelta as number) ?? 0,
    timestamp: doc.timestamp as string,
    instrumentSymbol: (doc.instrumentSymbol as string) ?? '',
    option: doc.option as StrategyTransaction['option'],
    customData: (doc.customData as Record<string, unknown>) ?? {},
    quantity: (doc.quantity as number) ?? 0,
    price: (doc.price as number) ?? 0,
  };
}

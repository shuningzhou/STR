import { apiFetch, normalizeId } from './api-client';

export interface WalletData {
  id: string;
  strategyId: string;
  baseCurrency: string;
  initialBalance: number;
  marginAccountEnabled: boolean;
  collateralEnabled: boolean;
  loanInterest?: number;
  marginRequirement?: number;
  collateralAmount?: number;
  collateralRequirement?: number;
}

export async function getWallet(strategyId: string): Promise<WalletData> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/strategies/${strategyId}/wallet`,
  );
  return mapWallet(raw);
}

export async function updateWallet(
  strategyId: string,
  dto: Partial<Omit<WalletData, 'id' | 'strategyId'>>,
): Promise<WalletData> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/strategies/${strategyId}/wallet`,
    { method: 'PATCH', body: JSON.stringify(dto) },
  );
  return mapWallet(raw);
}

function mapWallet(raw: Record<string, unknown>): WalletData {
  const doc = normalizeId(raw);
  return {
    id: doc.id,
    strategyId: doc.strategyId as string,
    baseCurrency: (doc.baseCurrency as string) ?? 'USD',
    initialBalance: (doc.initialBalance as number) ?? 0,
    marginAccountEnabled: (doc.marginAccountEnabled as boolean) ?? false,
    collateralEnabled: (doc.collateralEnabled as boolean) ?? false,
    loanInterest: doc.loanInterest as number | undefined,
    marginRequirement: doc.marginRequirement as number | undefined,
    collateralAmount: doc.collateralAmount as number | undefined,
    collateralRequirement: doc.collateralRequirement as number | undefined,
  };
}

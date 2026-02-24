import { apiFetch } from './api-client';

export interface SnaptradeAccount {
  accountId: string;
  name: string;
  number: string;
  institutionName: string;
  authorizationId: string;
  displayLabel?: string;
  currency?: string;
  type?: string;
  rawType?: string;
  status?: string;
  metaStatus?: string;
  balanceAmount?: number;
  isPaper?: boolean;
  createdDate?: string;
}

export interface SnaptradeConnection {
  _id: string;
  authorizationId: string;
  institutionName: string;
  status: string;
  accounts: Array<{
    accountId: string;
    name: string;
    number: string;
    institutionName: string;
  }>;
}

export async function snaptradeRegister(): Promise<{ snaptradeUserId: string; snaptradeUserSecret: string }> {
  return apiFetch('/snaptrade/register', { method: 'POST' });
}

export async function snaptradeConnect(): Promise<{ redirectURI: string; sessionId: string }> {
  return apiFetch('/snaptrade/connect', { method: 'POST' });
}

export async function snaptradeListConnections(): Promise<SnaptradeConnection[]> {
  return apiFetch('/snaptrade/connections');
}

export async function snaptradeRefreshConnections(): Promise<SnaptradeConnection[]> {
  return apiFetch('/snaptrade/connections/refresh', { method: 'POST' });
}

export async function snaptradeDeleteConnection(authorizationId: string): Promise<void> {
  await apiFetch(`/snaptrade/connections/${authorizationId}`, { method: 'DELETE' });
}

export async function snaptradeListAccounts(): Promise<SnaptradeAccount[]> {
  return apiFetch('/snaptrade/accounts');
}

export async function snaptradeSyncStrategy(strategyId: string): Promise<{ synced: number }> {
  return apiFetch(`/snaptrade/sync/${strategyId}`, { method: 'POST' });
}

export interface AdjustedTransaction {
  _id: string;
  side: string;
  quantity: number;
  price: number;
  cashDelta: number;
  currency: string;
  timestamp: string;
  instrumentSymbol: string;
  option: { expiration: string; strike: number; callPut: string; underlyingSymbol?: string } | null;
  snaptradeActivityId?: string;
  synthetic: boolean;
}

export interface HoldingsPosition {
  symbol: string;
  quantity: number;
  averagePrice?: number;
  currency?: string;
  isOption?: boolean;
}

export interface AccountHoldings {
  positions: HoldingsPosition[];
  cash: number;
}

export interface AccountTransactionsResponse {
  transactions: AdjustedTransaction[];
  rawHoldings: AccountHoldings | null;
  derivedHoldings: AccountHoldings;
}

export async function snaptradeGetAccountTransactions(accountId: string): Promise<AccountTransactionsResponse> {
  return apiFetch(`/snaptrade/accounts/${accountId}/transactions`);
}

export async function snaptradeRebuildAccount(accountId: string): Promise<{ rebuilt: boolean; activities: number }> {
  return apiFetch(`/snaptrade/accounts/${accountId}/rebuild`, { method: 'POST' });
}

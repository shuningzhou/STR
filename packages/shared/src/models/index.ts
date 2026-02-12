import { TransactionType, AssetType, CacheStatus, SubscriptionStatus } from '../enums';

// ── User ──────────────────────────────────────────────
export interface IUser {
  _id: string;
  email: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
}

// ── Subview (embedded in Strategy) ────────────────────
export interface ISubviewPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ISubview {
  id: string;
  name: string;
  position: ISubviewPosition;
  pipeline: Record<string, unknown> | null; // serialized React Flow graph
  cacheData: unknown | null;
  cachedAt: string | null;
  cacheVersion: number;
  cacheStatus: CacheStatus;
}

// ── Strategy ──────────────────────────────────────────
export interface IStrategy {
  _id: string;
  userId: string;
  name: string;
  walletId: string | null;
  customData: Record<string, unknown>;
  transactionsVersion: number;
  subviews: ISubview[];
  createdAt: string;
  updatedAt: string;
}

// ── Wallet ────────────────────────────────────────────
export interface IWallet {
  _id: string;
  strategyId: string;
  baseCurrency: string;
  balance: number;
  margin: number;
  collateralValue: number;
  collateralMarginRequirement: number;
}

// ── Instrument ────────────────────────────────────────
export interface IInstrument {
  _id: string;
  symbol: string;
  assetType: AssetType;
  currency: string;
  contractMetadata: Record<string, unknown>;
  marginRequirement: number;
}

// ── Transaction ───────────────────────────────────────
export interface IOptionData {
  strike?: number;
  expiration?: string;
  contractType?: 'call' | 'put';
  multiplier?: number;
  [key: string]: unknown;
}

export interface ITransaction {
  _id: string;
  strategyId: string;
  instrumentId: string;
  type: TransactionType;
  quantity: number;
  price: number;
  cashDelta: number;
  timestamp: string;
  metadata: Record<string, unknown>;
  fee: number;
  optionData: IOptionData | null;
  createdAt: string;
}

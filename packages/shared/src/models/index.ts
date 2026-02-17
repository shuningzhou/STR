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
/** Option-specific data; present when transaction involves an option contract */
export interface IOption {
  /** Expiration date (YYYY-MM-DD) */
  expiration: string;
  /** Strike price */
  strike: number;
  /** Call or put */
  callPut: 'call' | 'put';
  /** Contract multiplier (default 100 for equity options) */
  multiplier?: number;
  /** Underlying symbol (e.g. "AAPL") */
  underlyingSymbol?: string;
}

/**
 * Option roll: close one contract and open another (e.g. March 150 call → April 160 call).
 * Present when type is OPTION_ROLL.
 * - option: the contract being closed
 * - optionRolledTo: the contract being opened
 * - cashDelta on the transaction = net P&L (close proceeds − open cost)
 */
export interface IOptionRoll {
  option: IOption;
  optionRolledTo: IOption;
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
  customData: Record<string, unknown>;
  fee: number;
  /** Option contract details; present when transaction involves an option */
  option: IOption | null;
  /** Present when type is OPTION_ROLL: closed and opened contracts */
  optionRoll?: IOptionRoll;
  createdAt: string;
}

/** @deprecated Use option instead */
export type IOptionData = IOption;

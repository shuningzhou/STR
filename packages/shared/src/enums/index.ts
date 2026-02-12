export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  SELL_SHORT = 'sell_short',
  BUY_TO_COVER = 'buy_to_cover',
  DIVIDEND = 'dividend',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  FEE = 'fee',
  INTEREST = 'interest',
  OPTION_EXERCISE = 'option_exercise',
  OPTION_ASSIGN = 'option_assign',
  OPTION_EXPIRE = 'option_expire',
}

export enum AssetType {
  STOCK = 'stock',
  ETF = 'etf',
  OPTION = 'option',
  BOND = 'bond',
  CRYPTO = 'crypto',
  CASH = 'cash',
  OTHER = 'other',
}

export enum CacheStatus {
  VALID = 'valid',
  INVALID = 'invalid',
}

export enum SubscriptionStatus {
  FREE = 'free',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
}

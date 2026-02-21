import { Injectable } from '@nestjs/common';
import type { IMarketDataProvider, IOptionsDataProvider } from './market-data-provider.interface';
import { EodhdProvider } from './eodhd-provider';
import { MassiveProvider } from './massive-provider';

interface ProviderRule {
  match: { assetType?: string; market?: string };
  provider: string;
}

const RULES: ProviderRule[] = [
  { match: { assetType: 'option' }, provider: 'massive' },
  { match: { market: 'US', assetType: 'stock' }, provider: 'eodhd' },
  { match: { market: 'US', assetType: 'etf' }, provider: 'eodhd' },
  { match: { market: 'CA' }, provider: 'eodhd' },
  { match: {}, provider: 'eodhd' },
];

@Injectable()
export class ProviderRegistry {
  private providers: Map<string, IMarketDataProvider> = new Map();

  constructor(
    private readonly eodhd: EodhdProvider,
    private readonly massive: MassiveProvider,
  ) {
    this.providers.set('eodhd', eodhd);
    this.providers.set('massive', massive);
  }

  resolve(symbol?: string, assetType?: string): IMarketDataProvider {
    const market = this.inferMarket(symbol);
    for (const rule of RULES) {
      if (rule.match.assetType && rule.match.assetType !== assetType) continue;
      if (rule.match.market && rule.match.market !== market) continue;
      const p = this.providers.get(rule.provider);
      if (p) return p;
    }
    return this.eodhd;
  }

  resolveOptions(): IOptionsDataProvider {
    return this.massive;
  }

  private inferMarket(symbol?: string): string {
    if (!symbol) return 'US';
    if (symbol.endsWith('.TO') || symbol.endsWith('.V') || symbol.endsWith('.CN')) return 'CA';
    return 'US';
  }
}

import { useRef, useCallback, useEffect } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import * as strategiesApi from './strategies-api';
import * as transactionsApi from './transactions-api';
import * as walletsApi from './wallets-api';
import * as marketDataApi from './market-data-api';
import * as instrumentsApi from './instruments-api';
import type { Strategy, Subview, SubviewPosition, StrategyTransaction } from '@/store/strategy-store';
import type { WalletData } from './wallets-api';
import type { QuoteResult, HistoryBar, SymbolMatch } from './market-data-api';

/* ────────────────────────────────────────────────────
   Query Keys
   ──────────────────────────────────────────────────── */

export const queryKeys = {
  strategies: ['strategies'] as const,
  strategy: (id: string) => ['strategies', id] as const,
  transactions: (strategyId: string) => ['transactions', strategyId] as const,
  wallet: (strategyId: string) => ['wallet', strategyId] as const,
  quotes: (symbols: string[]) => ['quotes', symbols.join(',')] as const,
  optionQuotes: (contracts: string[]) => ['optionQuotes', contracts.join(',')] as const,
  history: (symbol: string, from?: string, to?: string) => ['history', symbol, from, to] as const,
  symbolSearch: (q: string) => ['symbolSearch', q] as const,
  instrumentMarginReqs: (symbols: string[]) => ['instrumentMarginReqs', symbols.join(',')] as const,
};

/* ────────────────────────────────────────────────────
   Strategy Queries
   ──────────────────────────────────────────────────── */

export function useStrategies() {
  return useQuery<Strategy[]>({
    queryKey: queryKeys.strategies,
    queryFn: strategiesApi.listStrategies,
  });
}

export function useStrategy(id: string | null) {
  return useQuery<Strategy>({
    queryKey: queryKeys.strategy(id!),
    queryFn: () => strategiesApi.listStrategies().then(
      (list) => {
        const found = list.find((s) => s.id === id);
        if (!found) throw new Error(`Strategy ${id} not found`);
        return found;
      },
    ),
    enabled: !!id,
  });
}

/* ────────────────────────────────────────────────────
   Strategy Mutations
   ──────────────────────────────────────────────────── */

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: strategiesApi.createStrategy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.strategies }); },
  });
}

export function useUpdateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & Record<string, unknown>) =>
      strategiesApi.updateStrategy(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.strategies }); },
  });
}

export function useDeleteStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: strategiesApi.deleteStrategy,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.strategies }); },
  });
}

export function useMoveStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const strategies = qc.getQueryData<Strategy[]>(queryKeys.strategies) ?? [];
      const idx = strategies.findIndex((s) => s.id === id);
      if (idx < 0) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= strategies.length) return;
      const reordered = [...strategies];
      [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
      qc.setQueryData(queryKeys.strategies, reordered);
    },
  });
}

/* ────────────────────────────────────────────────────
   Debounced Strategy Mutation (optimistic + debounced API call)
   ──────────────────────────────────────────────────── */

export function useDebouncedUpdateStrategy(delay = 300) {
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingRef = useRef<{ id: string } & Record<string, unknown>>();

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const mutate = useCallback(
    (args: { id: string } & Record<string, unknown>) => {
      const { id, ...dto } = args;
      const prev = qc.getQueryData<Strategy[]>(queryKeys.strategies);
      if (prev) {
        qc.setQueryData(
          queryKeys.strategies,
          prev.map((s) => (s.id === id ? { ...s, ...dto } : s)),
        );
      }
      pendingRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const latest = pendingRef.current;
        if (!latest) return;
        pendingRef.current = undefined;
        const { id: latestId, ...latestDto } = latest;
        try {
          await strategiesApi.updateStrategy(latestId, latestDto);
        } finally {
          qc.invalidateQueries({ queryKey: queryKeys.strategies });
        }
      }, delay);
    },
    [qc, delay],
  );

  return { mutate };
}

/* ────────────────────────────────────────────────────
   Subview Mutations
   ──────────────────────────────────────────────────── */

export function useAddSubview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, ...dto }: {
      strategyId: string;
      id: string;
      name: string;
      position: SubviewPosition;
      templateId?: string;
      spec?: Record<string, unknown>;
      icon?: string;
      iconColor?: string;
    }) => strategiesApi.addSubview(strategyId, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.strategies }); },
  });
}

export function useUpdateSubview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, subviewId, ...dto }: {
      strategyId: string;
      subviewId: string;
    } & Record<string, unknown>) =>
      strategiesApi.updateSubview(strategyId, subviewId, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.strategies }); },
  });
}

export function useRemoveSubview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, subviewId }: { strategyId: string; subviewId: string }) =>
      strategiesApi.removeSubview(strategyId, subviewId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.strategies }); },
  });
}

export function useBatchUpdatePositions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, subviews }: {
      strategyId: string;
      subviews: { id: string; position: SubviewPosition }[];
    }) => strategiesApi.batchUpdatePositions(strategyId, subviews),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.strategies }); },
  });
}

/* ────────────────────────────────────────────────────
   Debounced Subview Mutation (optimistic + debounced API call)
   ──────────────────────────────────────────────────── */

export function useDebouncedUpdateSubview(delay = 300) {
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingRef = useRef<{ strategyId: string; subviewId: string } & Record<string, unknown>>();

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const mutate = useCallback(
    (args: { strategyId: string; subviewId: string } & Record<string, unknown>) => {
      const { strategyId, subviewId, ...dto } = args;
      const prev = qc.getQueryData<Strategy[]>(queryKeys.strategies);
      if (prev) {
        qc.setQueryData(
          queryKeys.strategies,
          prev.map((s) => {
            if (s.id !== strategyId) return s;
            return {
              ...s,
              subviews: s.subviews.map((sv) =>
                sv.id === subviewId ? { ...sv, ...dto } : sv,
              ),
            };
          }),
        );
      }
      pendingRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const latest = pendingRef.current;
        if (!latest) return;
        pendingRef.current = undefined;
        const { strategyId: sid, subviewId: svid, ...latestDto } = latest;
        try {
          await strategiesApi.updateSubview(sid, svid, latestDto);
        } finally {
          qc.invalidateQueries({ queryKey: queryKeys.strategies });
        }
      }, delay);
    },
    [qc, delay],
  );

  return { mutate };
}

/* ────────────────────────────────────────────────────
   Debounced Batch Position Update (optimistic + debounced API call)
   ──────────────────────────────────────────────────── */

export function useDebouncedBatchUpdatePositions(delay = 300) {
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingRef = useRef<{ strategyId: string; subviews: { id: string; position: SubviewPosition }[] }>();

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const mutate = useCallback(
    (args: { strategyId: string; subviews: { id: string; position: SubviewPosition }[] }) => {
      const { strategyId, subviews } = args;
      const prev = qc.getQueryData<Strategy[]>(queryKeys.strategies);
      if (prev) {
        qc.setQueryData(
          queryKeys.strategies,
          prev.map((s) => {
            if (s.id !== strategyId) return s;
            return {
              ...s,
              subviews: s.subviews.map((sv) => {
                const upd = subviews.find((u) => u.id === sv.id);
                return upd ? { ...sv, position: upd.position } : sv;
              }),
            };
          }),
        );
      }
      pendingRef.current = args;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const latest = pendingRef.current;
        if (!latest) return;
        pendingRef.current = undefined;
        try {
          await strategiesApi.batchUpdatePositions(latest.strategyId, latest.subviews);
        } finally {
          qc.invalidateQueries({ queryKey: queryKeys.strategies });
        }
      }, delay);
    },
    [qc, delay],
  );

  return { mutate };
}

export function useSaveSubviewCache() {
  return useMutation({
    mutationFn: ({ strategyId, subviewId, ...dto }: {
      strategyId: string;
      subviewId: string;
      cacheData?: unknown;
      cacheVersion?: number;
    }) => strategiesApi.saveSubviewCache(strategyId, subviewId, dto),
  });
}

/* ────────────────────────────────────────────────────
   Transaction Queries & Mutations
   ──────────────────────────────────────────────────── */

export function useTransactions(strategyId: string | null) {
  return useQuery<StrategyTransaction[]>({
    queryKey: queryKeys.transactions(strategyId!),
    queryFn: () => transactionsApi.listTransactions(strategyId!),
    enabled: !!strategyId,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, ...dto }: {
      strategyId: string;
    } & Omit<StrategyTransaction, 'id'>) =>
      transactionsApi.createTransaction(strategyId, dto),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions(vars.strategyId) });
      qc.invalidateQueries({ queryKey: queryKeys.strategies });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, strategyId, ...dto }: {
      id: string;
      strategyId: string;
    } & Partial<Omit<StrategyTransaction, 'id'>>) =>
      transactionsApi.updateTransaction(id, dto),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions(vars.strategyId) });
      qc.invalidateQueries({ queryKey: queryKeys.strategies });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, strategyId }: { id: string; strategyId: string }) =>
      transactionsApi.deleteTransaction(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.transactions(vars.strategyId) });
      qc.invalidateQueries({ queryKey: queryKeys.strategies });
    },
  });
}

/* ────────────────────────────────────────────────────
   Wallet Queries & Mutations
   ──────────────────────────────────────────────────── */

export function useWallet(strategyId: string | null) {
  return useQuery<WalletData>({
    queryKey: queryKeys.wallet(strategyId!),
    queryFn: () => walletsApi.getWallet(strategyId!),
    enabled: !!strategyId,
  });
}

export function useUpdateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ strategyId, ...dto }: { strategyId: string } & Partial<Omit<WalletData, 'id' | 'strategyId'>>) =>
      walletsApi.updateWallet(strategyId, dto),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet(vars.strategyId) });
    },
  });
}

/* ────────────────────────────────────────────────────
   Market Data Queries
   ──────────────────────────────────────────────────── */

export function useQuotes(symbols: string[]) {
  return useQuery<QuoteResult[]>({
    queryKey: queryKeys.quotes(symbols),
    queryFn: () => marketDataApi.getQuotes(symbols),
    enabled: symbols.length > 0,
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
}

export function useOptionQuotes(contracts: string[]) {
  return useQuery<QuoteResult[]>({
    queryKey: queryKeys.optionQuotes(contracts),
    queryFn: () => marketDataApi.getOptionQuotes(contracts),
    enabled: contracts.length > 0,
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
}

export function useHistory(symbol: string, from?: string, to?: string) {
  return useQuery<HistoryBar[]>({
    queryKey: queryKeys.history(symbol, from, to),
    queryFn: () => marketDataApi.getHistory(symbol, from, to),
    enabled: !!symbol,
    staleTime: 60 * 60 * 1000,
  });
}

/** EOD price history: { [symbol]: { [date]: close } } for portfolio growth chart */
export function usePriceHistory(
  symbols: string[],
  fromDate?: string,
  toDate?: string,
): Record<string, Record<string, number>> {
  const results = useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: queryKeys.history(symbol, fromDate, toDate),
      queryFn: () => marketDataApi.getHistory(symbol, fromDate, toDate),
      enabled: !!symbol && !!fromDate && !!toDate,
      staleTime: 60 * 60 * 1000,
    })),
  });

  const out: Record<string, Record<string, number>> = {};
  for (let i = 0; i < symbols.length; i++) {
    const bars = results[i]?.data ?? [];
    out[symbols[i]] = {};
    for (const b of bars) {
      if (b?.date) out[symbols[i]][b.date] = b.close;
    }
  }
  return out;
}

export function useSymbolSearch(query: string) {
  return useQuery<SymbolMatch[]>({
    queryKey: queryKeys.symbolSearch(query),
    queryFn: () => marketDataApi.searchSymbols(query),
    enabled: query.length >= 1,
    staleTime: 5 * 60 * 1000,
  });
}

/* ────────────────────────────────────────────────────
   Instrument Queries
   ──────────────────────────────────────────────────── */

export function useInstrumentMarginRequirements(symbols: string[]) {
  return useQuery<Record<string, number>>({
    queryKey: queryKeys.instrumentMarginReqs(symbols),
    queryFn: () => instrumentsApi.getMarginRequirements(symbols),
    enabled: symbols.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}

/* ────────────────────────────────────────────────────
   Bridge Hook: Active Strategy with Transactions
   ──────────────────────────────────────────────────── */

import { useStrategyStore } from '@/store/strategy-store';

export function useActiveStrategy() {
  const activeStrategyId = useStrategyStore((s) => s.activeStrategyId);
  const { data: strategies } = useStrategies();
  const strategy = strategies?.find((s) => s.id === activeStrategyId) ?? null;
  return { strategy, strategyId: activeStrategyId, strategies };
}

export function useActiveStrategyTransactions() {
  const activeStrategyId = useStrategyStore((s) => s.activeStrategyId);
  return useTransactions(activeStrategyId);
}

export { type WalletData } from './wallets-api';
export { type QuoteResult, type HistoryBar, type SymbolMatch } from './market-data-api';

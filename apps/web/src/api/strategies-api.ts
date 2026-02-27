import { apiFetch, normalizeId } from './api-client';
import type { Strategy, Subview, SubviewPosition } from '@/store/strategy-store';

/* ── Strategies ───────────────────────────────────── */

export async function listStrategies(): Promise<Strategy[]> {
  const raw = await apiFetch<Record<string, unknown>[]>('/strategies');
  return raw.map(mapStrategy);
}

export async function createStrategy(dto: {
  name: string;
  baseCurrency?: string;
  icon?: string;
  initialBalance?: number;
  marginAccountEnabled?: boolean;
  collateralEnabled?: boolean;
}): Promise<Strategy> {
  const raw = await apiFetch<Record<string, unknown>>('/strategies', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return mapStrategy(raw);
}

export async function updateStrategy(
  id: string,
  dto: Record<string, unknown>,
): Promise<Strategy> {
  const raw = await apiFetch<Record<string, unknown>>(`/strategies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  return mapStrategy(raw);
}

export async function deleteStrategy(id: string): Promise<void> {
  await apiFetch(`/strategies/${id}`, { method: 'DELETE' });
}

/* ── Subviews ─────────────────────────────────────── */

export async function addSubview(
  strategyId: string,
  dto: {
    id: string;
    name: string;
    position: SubviewPosition;
    templateId?: string;
    spec?: Record<string, unknown>;
    icon?: string;
    iconColor?: string;
  },
): Promise<Subview> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/strategies/${strategyId}/subviews`,
    { method: 'POST', body: JSON.stringify(dto) },
  );
  return mapSubview(raw);
}

export async function updateSubview(
  strategyId: string,
  subviewId: string,
  dto: Record<string, unknown>,
): Promise<Subview> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/strategies/${strategyId}/subviews/${subviewId}`,
    { method: 'PATCH', body: JSON.stringify(dto) },
  );
  return mapSubview(raw);
}

export async function removeSubview(
  strategyId: string,
  subviewId: string,
): Promise<void> {
  await apiFetch(`/strategies/${strategyId}/subviews/${subviewId}`, {
    method: 'DELETE',
  });
}

export async function batchUpdatePositions(
  strategyId: string,
  subviews: { id: string; position: SubviewPosition }[],
): Promise<Subview[]> {
  const raw = await apiFetch<Record<string, unknown>[]>(
    `/strategies/${strategyId}/subviews`,
    { method: 'PATCH', body: JSON.stringify({ subviews }) },
  );
  return raw.map(mapSubview);
}

export async function saveSubviewCache(
  strategyId: string,
  subviewId: string,
  dto: { cacheData?: unknown; cacheVersion?: number },
): Promise<void> {
  await apiFetch(`/strategies/${strategyId}/subviews/${subviewId}/cache`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

/* ── Mappers ──────────────────────────────────────── */

function mapSubview(raw: Record<string, unknown>): Subview {
  return {
    id: (raw.id ?? raw._id ?? '') as string,
    name: raw.name as string,
    position: raw.position as SubviewPosition,
    ...(raw.templateId && { templateId: raw.templateId as string }),
    ...(raw.spec && { spec: raw.spec as Subview['spec'] }),
    ...(raw.icon && { icon: raw.icon as string }),
    ...(raw.iconColor && { iconColor: raw.iconColor as string }),
    ...(raw.inputValues && { inputValues: raw.inputValues as Record<string, string | number> }),
  };
}

function mapStrategy(raw: Record<string, unknown>): Strategy {
  const doc = normalizeId(raw);
  return {
    id: doc.id,
    name: doc.name as string,
    baseCurrency: (doc.baseCurrency as string) ?? 'USD',
    icon: doc.icon as string | undefined,
    initialBalance: doc.initialBalance as number | undefined,
    marginAccountEnabled: doc.marginAccountEnabled as boolean | undefined,
    collateralEnabled: doc.collateralEnabled as boolean | undefined,
    loanAmount: doc.loanAmount as number | undefined,
    loanInterest: doc.loanInterest as number | undefined,
    marginRequirement: doc.marginRequirement as number | undefined,
    collateralSecurities: doc.collateralSecurities as number | undefined,
    collateralCash: doc.collateralCash as number | undefined,
    collateralRequirement: doc.collateralRequirement as number | undefined,
    inputs: (doc.inputs as Strategy['inputs']) ?? [],
    inputValues: (doc.inputValues as Record<string, string | number>) ?? {},
    transactionsVersion: (doc.transactionsVersion as number) ?? 0,
    subviews: ((doc.subviews as Record<string, unknown>[]) ?? []).map(mapSubview),
  };
}

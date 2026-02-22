import { apiFetch } from './api-client';

export async function getMarginRequirements(
  symbols: string[],
): Promise<Record<string, number>> {
  if (!symbols.length) return {};
  const raw = await apiFetch<Record<string, number>>(
    `/instruments/margin-requirements?symbols=${symbols.join(',')}`,
  );
  return raw;
}

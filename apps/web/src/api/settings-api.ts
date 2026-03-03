import { apiFetch } from './api-client';

export interface AppSettings {
  allowRegistration: boolean;
}

export async function getSettings(): Promise<AppSettings> {
  return apiFetch<AppSettings>('/settings');
}

export async function updateSettings(dto: Partial<AppSettings>): Promise<AppSettings> {
  return apiFetch<AppSettings>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

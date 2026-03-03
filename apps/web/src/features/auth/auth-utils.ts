/** Super admin email – only this user sees app settings (gear icon) in sidebar */
export const SUPER_ADMIN_EMAIL = 'zhoushuning@gmail.com';

interface JwtPayload {
  sub?: string;
  email?: string;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Returns true if the current user (from token) is the super admin */
export function isSuperAdmin(accessToken: string | null): boolean {
  if (!accessToken) return false;
  const payload = decodeJwtPayload(accessToken);
  const email = payload?.email?.toLowerCase();
  return email === SUPER_ADMIN_EMAIL.toLowerCase();
}

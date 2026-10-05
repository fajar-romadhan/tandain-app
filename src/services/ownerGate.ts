/**
 * Secret owner URL gate.
 *
 * Only the SHA-256 hash of the secret key ships in the JS bundle, so the key
 * itself can't be read from the source. This only HIDES the owner login screen;
 * real protection is server-side (is_app_admin() in 002_owner_admin.sql).
 */

const OWNER_KEY_HASH = '3e898ea44e1ef64aa076670f5379374b78628a8c97c39d629e2540745a661fab';
const OWNER_PARAM = 'owner';
const SESSION_KEY = 'tandain_owner_gate_v1';

const sha256Hex = async (value: string): Promise<string> => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const readCandidate = (): string | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  // A client gallery link always wins, even inside an owner tab.
  if (params.get('p')) return null;
  return params.get(OWNER_PARAM) || sessionStorage.getItem(SESSION_KEY);
};

/** Cheap sync check: is there anything worth hashing? (avoids flashing the landing page) */
export const hasOwnerCandidate = (): boolean => !!readCandidate();

export const resolveOwnerRoute = async (): Promise<boolean> => {
  const candidate = readCandidate();
  if (!candidate || typeof crypto === 'undefined' || !crypto.subtle) return false;
  try {
    const ok = (await sha256Hex(candidate)) === OWNER_KEY_HASH;
    if (ok) sessionStorage.setItem(SESSION_KEY, candidate);
    else sessionStorage.removeItem(SESSION_KEY);
    return ok;
  } catch {
    return false;
  }
};

/** Where Google should send the owner back to after login. */
export const ownerReturnUrl = (): string => {
  const key = sessionStorage.getItem(SESSION_KEY) || readCandidate() || '';
  return `${window.location.origin}/?${OWNER_PARAM}=${encodeURIComponent(key)}`;
};

export const leaveOwnerRoute = () => {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = '/';
};

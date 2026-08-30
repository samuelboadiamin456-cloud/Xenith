import { Player, Submission, AuditLog } from '../types';

/**
 * Safe local storage utility to prevent QuotaExceededError crashes
 * and ensure seamless operation on both desktop and mobile devices.
 */

export function safeStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to read ${key}:`, err);
    return fallback;
  }
}

export function safeStorageGetString(key: string, fallback: string = ''): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to read string ${key}:`, err);
    return fallback;
  }
}

export function safeStorageRemove(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Failed to remove ${key}:`, err);
  }
}

/**
 * Strips huge base64 data URLs from submissions before caching in localStorage.
 * The full image is always preserved on the server database.
 */
export function sanitizeSubmissionsForStorage(submissions: Submission[]): Submission[] {
  if (!Array.isArray(submissions)) return [];
  // Keep only the most recent 30 submissions for offline cache
  const recent = submissions.slice(0, 30);
  return recent.map(sub => {
    // If evidenceUrl is a large base64 data string, strip it from localStorage cache
    const isLargeDataUrl = sub.evidenceUrl && sub.evidenceUrl.startsWith('data:image/') && sub.evidenceUrl.length > 500;
    if (isLargeDataUrl) {
      return {
        ...sub,
        evidenceUrl: undefined // Kept in memory and server DB, stripped from localStorage
      };
    }
    return sub;
  });
}

/**
 * Sanitizes player records for local storage cache.
 */
export function sanitizePlayersForStorage(players: Player[]): Player[] {
  if (!Array.isArray(players)) return [];
  return players.map(p => {
    const isLargeAvatar = p.avatarUrl && p.avatarUrl.startsWith('data:image/') && p.avatarUrl.length > 5000;
    if (isLargeAvatar) {
      return {
        ...p,
        avatarUrl: undefined
      };
    }
    return p;
  });
}

/**
 * Sanitizes audit logs for storage (caps at 50).
 */
export function sanitizeLogsForStorage(logs: AuditLog[]): AuditLog[] {
  if (!Array.isArray(logs)) return [];
  return logs.slice(0, 50);
}

/**
 * Safely sets an item in localStorage with quota recovery fallback.
 */
export function safeStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] Quota or storage write error on ${key}:`, err);

    // If quota exceeded, clean up non-essential cached entries and retry
    try {
      if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.code === 1014 || err?.number === -2147024882) {
        console.warn('[SafeStorage] Quota exceeded. Evicting bloated offline caches...');
        // Remove known large caches
        localStorage.removeItem('xn_academy_submissions_v1');
        localStorage.removeItem('xn_academy_logs_v1');

        // Retry saving minimal version
        if (key === 'xn_academy_submissions_v1' && Array.isArray(value)) {
          const minimal = sanitizeSubmissionsForStorage(value).slice(0, 10);
          localStorage.setItem(key, JSON.stringify(minimal));
          return true;
        } else if (key === 'xn_academy_players_v1' && Array.isArray(value)) {
          const minimal = sanitizePlayersForStorage(value);
          localStorage.setItem(key, JSON.stringify(minimal));
          return true;
        }
      }
    } catch (recoveryErr) {
      console.warn('[SafeStorage] Storage recovery write failed, continuing safely in-memory:', recoveryErr);
    }
    return false;
  }
}

/**
 * Emergency purge for contaminated storage on startup
 */
export function initializeStorageHealthCheck(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const rawSubs = localStorage.getItem('xn_academy_submissions_v1');
    if (rawSubs && rawSubs.length > 50000) {
      // Over 50KB in submissions cache means data URLs are stored; sanitize immediately
      try {
        const parsed = JSON.parse(rawSubs);
        if (Array.isArray(parsed)) {
          const sanitized = sanitizeSubmissionsForStorage(parsed);
          localStorage.setItem('xn_academy_submissions_v1', JSON.stringify(sanitized));
        }
      } catch {
        localStorage.removeItem('xn_academy_submissions_v1');
      }
    }
  } catch (err) {
    console.warn('[SafeStorage] Storage health check auto-purge:', err);
    try {
      localStorage.removeItem('xn_academy_submissions_v1');
    } catch {}
  }
}

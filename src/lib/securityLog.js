import { supabase } from './supabaseClient';

export async function logSecurityEvent(event_type, details = {}) {
  try {
    await supabase.from('security_logs').insert({
      event_type,
      identifier: details.identifier || null,
      detail: details.detail || null,
      meta: details,
    });
  } catch {
    // best-effort — không chặn luồng
  }
}

const RATE_KEY = 'kinbook_rl';
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export async function isRateLimited(identifier) {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const rec = map[identifier] || { count: 0, first: now };
    if (now - rec.first > WINDOW_MS) {
      map[identifier] = { count: 1, first: now };
    } else {
      rec.count += 1;
      map[identifier] = rec;
    }
    localStorage.setItem(RATE_KEY, JSON.stringify(map));
    return map[identifier].count > MAX_ATTEMPTS;
  } catch {
    return false;
  }
}

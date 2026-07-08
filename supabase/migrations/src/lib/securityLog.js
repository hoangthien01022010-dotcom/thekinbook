import { supabase } from './supabaseClient';

const IP_LOOKUP_URL = 'https://api.ipify.org?format=json';
const IP_TIMEOUT_MS = 3000;

async function getClientIP() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IP_TIMEOUT_MS);
    const res = await fetch(IP_LOOKUP_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ip || null;
  } catch {
    return null;
  }
}

export async function logSecurityEvent(eventType, { identifier = null, detail = null } = {}) {
  try {
    const ip = await getClientIP();
    const { error } = await supabase.from('security_logs').insert({
      event_type: eventType,
      identifier,
      ip_address: ip,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      detail,
    });
    if (error) console.error('[securityLog] insert error:', error);
  } catch (e) {
    console.error('[securityLog] failed:', e);
  }
}

export async function isRateLimited(identifier, { windowMinutes = 10, maxAttempts = 5 } = {}) {
  if (!identifier) return false;
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_window_minutes: windowMinutes,
      p_max_attempts: maxAttempts,
    });
    if (error) {
      console.error('[securityLog] rate-limit check error:', error);
      return false;
    }
    return !!data;
  } catch (e) {
    console.error('[securityLog] rate-limit check failed:', e);
    return false;
  }
  }

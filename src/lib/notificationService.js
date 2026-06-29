// Lightweight in-app notification helpers:
// - Soft "ting" via WebAudio (no asset needed)
// - Browser Notification API (after permission)
// - Sonner toast wrapper
import { toast } from 'sonner';

let _audioCtx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!_audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    _audioCtx = new AC();
  }
  return _audioCtx;
}

export function playTing() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t0);
    o.frequency.exponentialRampToValueAtTime(1320, t0 + 0.12);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + 0.4);
  } catch (e) { /* ignore */ }
}

export async function ensureNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

export function showBrowserNotification(title, body, { icon, tag } = {}) {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return; // don't double-notify when focused
    new Notification(title, { body, icon, tag, silent: false });
  } catch (e) { /* ignore */ }
}

export function notifyNewMessage({ from, content, avatar }) {
  playTing();
  toast(`💬 Bạn có tin nhắn mới từ ${from || 'ai đó'}`, {
    description: content ? String(content).slice(0, 80) : undefined,
  });
  showBrowserNotification(`Tin nhắn mới từ ${from || 'Kinbook'}`, content || '', { icon: avatar, tag: 'kb-msg' });
}

export function notifyGeneric(title, content) {
  playTing();
  toast(title, { description: content });
  showBrowserNotification(title, content || '', { tag: 'kb-notif' });
}

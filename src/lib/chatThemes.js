// 8 Messenger-style chat themes. Each theme defines bubble backgrounds and text.
// "own" = current user (right side), "other" = peer (left side).
// Backgrounds may be CSS color or gradient strings.

export const CHAT_THEMES = {
  classic: {
    name: 'Cổ điển',
    swatch: 'linear-gradient(135deg,#0084ff,#00c6ff)',
    ownBubble: 'linear-gradient(135deg,#0084ff,#00c6ff)',
    ownText: '#ffffff',
    otherBubble: '#e4e6eb',
    otherText: '#0b0f19',
    otherBubbleDark: '#262b33',
    otherTextDark: '#f1f5f9',
  },
  love: {
    name: 'Tình yêu',
    swatch: 'linear-gradient(135deg,#ff4d6d,#ff8fa3)',
    ownBubble: 'linear-gradient(135deg,#ff4d6d,#ff8fa3)',
    ownText: '#ffffff',
    otherBubble: '#fde7ec',
    otherText: '#3b0a14',
    otherBubbleDark: '#3a1820',
    otherTextDark: '#ffe1e8',
  },
  ocean: {
    name: 'Đại dương',
    swatch: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
    ownBubble: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
    ownText: '#ffffff',
    otherBubble: '#e0f2fe',
    otherText: '#082f49',
    otherBubbleDark: '#0c2a3a',
    otherTextDark: '#dbeafe',
  },
  sunset: {
    name: 'Hoàng hôn',
    swatch: 'linear-gradient(135deg,#f97316,#ec4899)',
    ownBubble: 'linear-gradient(135deg,#f97316,#ec4899)',
    ownText: '#ffffff',
    otherBubble: '#fff1e6',
    otherText: '#431407',
    otherBubbleDark: '#3a1f14',
    otherTextDark: '#ffe9d6',
  },
  forest: {
    name: 'Rừng xanh',
    swatch: 'linear-gradient(135deg,#10b981,#22c55e)',
    ownBubble: 'linear-gradient(135deg,#10b981,#22c55e)',
    ownText: '#ffffff',
    otherBubble: '#dcfce7',
    otherText: '#052e16',
    otherBubbleDark: '#0f2a1d',
    otherTextDark: '#d1fae5',
  },
  lavender: {
    name: 'Lavender',
    swatch: 'linear-gradient(135deg,#a78bfa,#c084fc)',
    ownBubble: 'linear-gradient(135deg,#a78bfa,#c084fc)',
    ownText: '#ffffff',
    otherBubble: '#ede9fe',
    otherText: '#2e1065',
    otherBubbleDark: '#2a1f47',
    otherTextDark: '#ede9fe',
  },
  midnight: {
    name: 'Đêm tối',
    swatch: 'linear-gradient(135deg,#1e293b,#475569)',
    ownBubble: 'linear-gradient(135deg,#334155,#0f172a)',
    ownText: '#ffffff',
    otherBubble: '#e2e8f0',
    otherText: '#0f172a',
    otherBubbleDark: '#1f2937',
    otherTextDark: '#f1f5f9',
  },
  candy: {
    name: 'Kẹo ngọt',
    swatch: 'linear-gradient(135deg,#fbbf24,#f472b6)',
    ownBubble: 'linear-gradient(135deg,#fbbf24,#f472b6)',
    ownText: '#ffffff',
    otherBubble: '#fef3c7',
    otherText: '#451a03',
    otherBubbleDark: '#3a2a14',
    otherTextDark: '#fef3c7',
  },
};

export const DEFAULT_THEME_KEY = 'classic';

export function getThemeKey(conversationId, dbTheme) {
  if (typeof window === 'undefined') return dbTheme || DEFAULT_THEME_KEY;
  const local = window.localStorage.getItem(`chat-theme:${conversationId}`);
  return local || dbTheme || DEFAULT_THEME_KEY;
}

export function setThemeKey(conversationId, key) {
  try {
    window.localStorage.setItem(`chat-theme:${conversationId}`, key);
  } catch {}
}

export function getTheme(key) {
  return CHAT_THEMES[key] || CHAT_THEMES[DEFAULT_THEME_KEY];
}

export const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

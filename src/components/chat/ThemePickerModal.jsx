import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { CHAT_THEMES } from '@/lib/chatThemes';

export default function ThemePickerModal({ currentKey, onSelect, onClose }) {
  // Lock body scroll while open, always restore on unmount.
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody || '';
      document.documentElement.style.overflow = prevHtml || '';
    };
  }, []);

  // Click theme = apply ngay + close
  const pick = (key) => {
    try { onSelect && onSelect(key); } finally { onClose && onClose(); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="modal-content bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col"
        style={{ maxHeight: '85dvh', WebkitOverflowScrolling: 'touch' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 shrink-0">
          <h3 className="font-bold text-lg dark:text-white">Chọn chủ đề chat</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={20} className="dark:text-gray-300" />
          </button>
        </div>

        <div
          className="p-4 grid grid-cols-2 gap-3 overflow-y-auto flex-1"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {Object.entries(CHAT_THEMES).map(([key, t]) => {
            const active = key === currentKey;
            return (
              <button
                key={key}
                onClick={() => pick(key)}
                className={`relative rounded-2xl p-4 border-2 transition-all text-left ${active ? 'border-blue-500 scale-[1.02]' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                style={{ background: t.swatch }}
              >
                <div className="flex flex-col items-end gap-1.5">
                  <div className="px-3 py-1.5 rounded-full bg-white/30 backdrop-blur text-white text-xs font-medium">Xin chào 👋</div>
                  <div className="px-3 py-1.5 rounded-full bg-white text-gray-800 text-xs self-start font-medium shadow">Hi bạn!</div>
                </div>
                <p className="text-white text-sm font-semibold mt-2 drop-shadow">{t.name}</p>
                {active && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/95 text-blue-600 flex items-center justify-center shadow">
                    <Check size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 sticky bottom-0"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}

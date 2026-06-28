import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CHAT_THEMES } from '@/lib/chatThemes';

export default function ThemePickerModal({ currentKey, onSelect, onClose }) {
  const [selected, setSelected] = useState(currentKey);

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="font-bold text-lg dark:text-white">Chọn chủ đề chat</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={20} className="dark:text-gray-300" />
          </button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto">
          {Object.entries(CHAT_THEMES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`relative rounded-2xl p-4 border-2 transition-all ${selected === key ? 'border-blue-500 scale-[1.02]' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
              style={{ background: t.swatch }}
            >
              <div className="flex flex-col items-end gap-1.5">
                <div className="px-3 py-1.5 rounded-full bg-white/30 backdrop-blur text-white text-xs font-medium">Xin chào 👋</div>
                <div className="px-3 py-1.5 rounded-full bg-white text-gray-800 text-xs self-start font-medium shadow">Hi bạn!</div>
              </div>
              <p className="text-white text-sm font-semibold mt-2 text-left drop-shadow">{t.name}</p>
            </button>
          ))}
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-xl text-sm font-medium">
            Hủy
          </button>
          <button
            onClick={() => onSelect(selected)}
            className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}

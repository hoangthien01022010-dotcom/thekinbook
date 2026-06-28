import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import Avatar from './Avatar';

export default function NicknamesModal({ conversation, profiles, currentUserId, onSave, onClose }) {
  const [nicknames, setNicknames] = useState({ ...(conversation.nicknames || {}) });
  const [saving, setSaving] = useState(false);

  const ids = conversation.participant_ids || [];

  const save = async () => {
    setSaving(true);
    try { await onSave(nicknames); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="font-bold text-lg dark:text-white">Biệt danh</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={20} className="dark:text-gray-300" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ids.map(uid => {
            const p = profiles?.[uid];
            const realName = p?.display_name || (uid === currentUserId ? 'Bạn' : 'Người dùng');
            return (
              <div key={uid} className="flex items-center gap-3">
                <Avatar src={p?.avatar_url} name={realName} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{realName}</p>
                  <input
                    value={nicknames[uid] || ''}
                    onChange={e => setNicknames({ ...nicknames, [uid]: e.target.value })}
                    placeholder="Đặt biệt danh..."
                    className="w-full mt-0.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-xl text-sm font-medium">Hủy</button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Check size={16} /> Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

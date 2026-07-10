import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { Search, Users, MessageCircle, Sparkles } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');


export default function ConversationList({ currentUserId, profile, selectedId, onSelect, onNewChat, onNewGroup, onOpenVibai }) {
  const [conversations, setConversations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [search, setSearch] = useState('');
  const [hidden, setHidden] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kb_hidden_convs') || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(true);


  const loadConversations = async () => {
    try {
      const all = await base44.entities.Conversation.list('-last_message_time', 200);
      const mine = all.filter(c => c.participant_ids?.includes(currentUserId));
      setConversations(mine);

      // Load profiles for direct chats
      const allProfiles = await base44.entities.UserProfile.list('-created_date', 500);
      const map = {};
      allProfiles.forEach(p => { map[p.user_id] = p; });
      setProfiles(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const unsub = base44.entities.Conversation.subscribe(() => loadConversations());
    const unsubMsg = base44.entities.Message.subscribe(() => loadConversations());
    return () => { unsub(); unsubMsg(); };
  }, [currentUserId]);

  const computeOnline = (profile) => {
    if (!profile) return false;
    if (profile.last_active) {
      const diff = Date.now() - new Date(profile.last_active).getTime();
      return diff < 2 * 60 * 1000;
    }
    return profile.is_online || false;
  };

  const getConvDisplay = (conv) => {
    if (conv.type === 'group') {
      return { name: conv.name || 'Nhóm chat', avatar: conv.avatar_url, isOnline: null };
    }
    const otherId = conv.participant_ids?.find(id => id !== currentUserId);
    const otherProfile = profiles[otherId];
    return {
      name: otherProfile?.display_name || 'Người dùng',
      avatar: otherProfile?.avatar_url,
      isOnline: computeOnline(otherProfile)
    };
  };

  const hideConv = (id, e) => {
    e?.stopPropagation();
    setHidden(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try { localStorage.setItem('kb_hidden_convs', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const filtered = conversations.filter(c => {
    const display = getConvDisplay(c);
    const matchesSearch = !search || display.name.toLowerCase().includes(search.toLowerCase());
    if (hidden.includes(c.id) && !search) return false;
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold dark:text-white">Đoạn chat</h1>
          <button
            onClick={onNewGroup}
            className="kin-action kin-icon-btn p-2"
            title="Tạo nhóm trò chuyện"
          >
            <Users size={20} className="dark:text-gray-300" />
          </button>
        </div>
        <div className="kin-search relative rounded-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm đoạn chat"
            className="w-full pl-9 pr-3 py-2 bg-transparent dark:text-white rounded-full text-sm outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {/* ViBai always pinned first */}
        <button
          onClick={() => onOpenVibai && onOpenVibai()}
          className="kin-action w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800/60"
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 via-fuchsia-500 to-blue-500 flex items-center justify-center shrink-0 shadow-md">
            <img src="/kinbook-logo.svg" alt="ViBai" className="w-9 h-9"/>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm truncate dark:text-white">ViBai</span>
              <span className="text-[10px] uppercase tracking-wider text-violet-500 font-bold">AI</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">Trợ lý AI luôn sẵn sàng tâm sự</p>
          </div>
        </button>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          filtered.map(conv => {
            const display = getConvDisplay(conv);
            const isActive = selectedId === conv.id;
            return (
              <div
                key={conv.id}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isActive ? 'bg-blue-50 dark:bg-gray-800' : ''}`}
              >
                <button
                  onClick={() => onSelect(conv)}
                  className="kin-action flex-1 flex items-center gap-3 min-w-0 text-left rounded-xl"
                >
                  <Avatar
                    src={display.avatar}
                    name={display.name}
                    size={48}
                    isOnline={conv.type === 'direct' ? display.isOnline : undefined}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate dark:text-white">{display.name}</span>
                      {conv.last_message_time && (
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {moment(conv.last_message_time).utcOffset(420).fromNow()}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {conv.last_message_sender === currentUserId ? 'Bạn: ' : ''}
                        {conv.last_message}
                      </p>
                    )}
                  </div>
                </button>
                <button
                  onClick={(e) => hideConv(conv.id, e)}
                  title="Ẩn đoạn chat (tìm tên để mở lại)"
                  className="opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 p-1.5 mr-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


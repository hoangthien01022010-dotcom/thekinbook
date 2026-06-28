import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { UserPlus, Check, X, Search, MessageCircle, Users as UsersIcon, Mail } from 'lucide-react';

const TABS = [
  { key: 'requests', label: 'Lời mời' },
  { key: 'suggestions', label: 'Gợi ý' },
  { key: 'friends', label: 'Bạn bè' },
];

export default function FriendsPanel({ currentUserId, profile, onStartChat }) {
  const [profiles, setProfiles] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('requests');

  const reload = useCallback(async () => {
    try {
      const [allProfiles, allFriendships] = await Promise.all([
        base44.entities.UserProfile.list('-created_date', 500),
        base44.entities.Friendship.list('-created_date', 1000),
      ]);
      setProfiles(allProfiles || []);
      setFriendships(allFriendships || []);
    } catch (e) {
      console.error(e);
      setMsg('Lỗi tải dữ liệu: ' + (e?.message || ''));
    }
  }, []);

  useEffect(() => {
    reload();
    const unsubF = base44.entities.Friendship.subscribe(() => reload());
    const unsubP = base44.entities.UserProfile.subscribe(() => reload());
    return () => { unsubF(); unsubP(); };
  }, [reload]);

  const incomingRequests = useMemo(
    () => friendships.filter(f => f.to_user_id === currentUserId && f.status === 'pending'),
    [friendships, currentUserId]
  );

  const outgoingPendingIds = useMemo(() => {
    const s = new Set();
    friendships.forEach(f => {
      if (f.from_user_id === currentUserId && f.status === 'pending') s.add(f.to_user_id);
    });
    return s;
  }, [friendships, currentUserId]);

  const friendIds = useMemo(() => {
    const s = new Set();
    friendships.forEach(f => {
      if (f.status !== 'accepted') return;
      if (f.from_user_id === currentUserId) s.add(f.to_user_id);
      if (f.to_user_id === currentUserId) s.add(f.from_user_id);
    });
    return s;
  }, [friendships, currentUserId]);

  const filterQ = (list) => {
    if (!q.trim()) return list;
    const qq = q.trim().toLowerCase();
    return list.filter(p => (p.display_name || '').toLowerCase().includes(qq));
  };

  const suggestions = useMemo(() => {
    const list = profiles.filter(p =>
      p.user_id && p.user_id !== currentUserId && !friendIds.has(p.user_id)
    );
    return filterQ(list);
    // eslint-disable-next-line
  }, [profiles, currentUserId, friendIds, q]);

  const friendsList = useMemo(() => {
    const list = profiles.filter(p => friendIds.has(p.user_id));
    return filterQ(list);
    // eslint-disable-next-line
  }, [profiles, friendIds, q]);

  const sendRequest = async (toUser) => {
    if (busyId || !currentUserId) return;
    setBusyId(toUser.user_id);
    setMsg('');
    try {
      const fr = await base44.entities.Friendship.create({
        from_user_id: currentUserId,
        from_user_name: profile?.display_name || 'User',
        from_user_avatar: profile?.avatar_url || '',
        to_user_id: toUser.user_id,
        to_user_name: toUser.display_name || 'User',
        to_user_avatar: toUser.avatar_url || '',
        status: 'pending',
      });
      await base44.entities.Notification.create({
        user_id: toUser.user_id,
        type: 'friend_request',
        title: `${profile?.display_name || 'Ai đó'} đã gửi lời mời kết bạn`,
        content: 'Bấm để xem và phản hồi',
        is_read: false,
        related_id: fr.id,
        from_user_id: currentUserId,
        from_user_name: profile?.display_name || 'User',
        from_user_avatar: profile?.avatar_url || '',
      });
      setMsg('Đã gửi lời mời!');
      reload();
    } catch (e) {
      console.error(e);
      setMsg('Lỗi: ' + (e?.message || ''));
    } finally {
      setBusyId(null);
    }
  };

  const respond = async (fr, accept) => {
    if (busyId) return;
    setBusyId(fr.id);
    try {
      await base44.entities.Friendship.update(fr.id, {
        status: accept ? 'accepted' : 'rejected',
      });
      if (accept) {
        await base44.entities.Notification.create({
          user_id: fr.from_user_id,
          type: 'friend_accepted',
          title: `${profile?.display_name || 'Ai đó'} đã chấp nhận lời mời kết bạn`,
          content: 'Hai bạn đã trở thành bạn bè',
          is_read: false,
          related_id: fr.id,
          from_user_id: currentUserId,
          from_user_name: profile?.display_name || 'User',
          from_user_avatar: profile?.avatar_url || '',
        });
      }
      reload();
    } catch (e) {
      console.error(e);
      setMsg('Lỗi: ' + (e?.message || ''));
    } finally {
      setBusyId(null);
    }
  };

  const renderUserRow = (u, action) => (
    <div key={u.user_id || u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
      <Avatar src={u.avatar_url} name={u.display_name} size={44} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm dark:text-white truncate">{u.display_name || 'Người dùng'}</p>
        {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
      </div>
      {action}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="font-bold text-lg dark:text-white">Bạn bè</h2>
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Tìm người dùng..."
            className="w-full pl-9 pr-3 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm dark:text-white outline-none"
          />
        </div>

        <div className="flex gap-1 mt-3 p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
          {TABS.map(t => {
            const count = t.key === 'requests' ? incomingRequests.length
              : t.key === 'friends' ? friendsList.length
              : suggestions.length;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  active
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t.label}
                {count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {msg && (
        <div className="px-4 py-2 text-xs text-blue-600 dark:text-blue-400">{msg}</div>
      )}

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'requests' && (
          <>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-40" />
                Không có lời mời nào
              </div>
            ) : incomingRequests.map(fr => (
              <div key={fr.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                <Avatar src={fr.from_user_avatar} name={fr.from_user_name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm dark:text-white truncate">{fr.from_user_name}</p>
                  <p className="text-xs text-gray-500">Muốn kết bạn với bạn</p>
                </div>
                <button
                  onClick={() => respond(fr, true)}
                  disabled={busyId === fr.id}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full disabled:opacity-50"
                  title="Chấp nhận"
                ><Check size={16} /></button>
                <button
                  onClick={() => respond(fr, false)}
                  disabled={busyId === fr.id}
                  className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-full disabled:opacity-50"
                  title="Từ chối"
                ><X size={16} className="dark:text-white" /></button>
              </div>
            ))}
          </>
        )}

        {tab === 'suggestions' && (
          <>
            {suggestions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <UsersIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                Không có gợi ý
              </div>
            ) : suggestions.map(u => {
              const sent = outgoingPendingIds.has(u.user_id);
              return renderUserRow(u, (
                <button
                  onClick={() => sendRequest(u)}
                  disabled={busyId === u.user_id || sent}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus size={14} />
                  {sent ? 'Đã gửi' : 'Kết bạn'}
                </button>
              ));
            })}
          </>
        )}

        {tab === 'friends' && (
          <>
            {friendsList.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                <UsersIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                Chưa có bạn bè
              </div>
            ) : friendsList.map(u => renderUserRow(u, (
              <button
                onClick={() => onStartChat?.(u.user_id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <MessageCircle size={14} /> Nhắn
              </button>
            )))}
          </>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { UserPlus, Check, X, Search } from 'lucide-react';

export default function FriendsPanel({ currentUserId, profile }) {
  const [profiles, setProfiles] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');

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
    return () => unsubF();
  }, [reload]);

  const profileMap = useMemo(
    () => Object.fromEntries(profiles.map(p => [p.user_id, p])),
    [profiles]
  );

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

  const suggestions = useMemo(() => {
    const list = profiles.filter(p =>
      p.user_id && p.user_id !== currentUserId && !friendIds.has(p.user_id)
    );
    if (!q.trim()) return list;
    const qq = q.trim().toLowerCase();
    return list.filter(p => (p.display_name || '').toLowerCase().includes(qq));
  }, [profiles, currentUserId, friendIds, q]);

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
      setMsg('Đã gửi lời mời kết bạn!');
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
      </div>

      {msg && (
        <div className="px-4 py-2 text-xs text-blue-600 dark:text-blue-400">{msg}</div>
      )}

      <div className="flex-1 overflow-y-auto">
        {incomingRequests.length > 0 && (
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-1 mb-2">
              LỜI MỜI KẾT BẠN ({incomingRequests.length})
            </p>
            {incomingRequests.map(fr => (
              <div key={fr.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
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
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => respond(fr, false)}
                  disabled={busyId === fr.id}
                  className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-full disabled:opacity-50"
                  title="Từ chối"
                >
                  <X size={16} className="dark:text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-1 mb-2">
            GỢI Ý ({suggestions.length})
          </p>
          {suggestions.map(u => {
            const sent = outgoingPendingIds.has(u.user_id);
            return (
              <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                <Avatar src={u.avatar_url} name={u.display_name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm dark:text-white truncate">{u.display_name || 'Người dùng'}</p>
                  {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
                </div>
                <button
                  onClick={() => sendRequest(u)}
                  disabled={busyId === u.user_id || sent}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus size={14} />
                  {sent ? 'Đã gửi' : 'Kết bạn'}
                </button>
              </div>
            );
          })}
          {suggestions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">Không có gợi ý</p>
          )}
        </div>
      </div>
    </div>
  );
}

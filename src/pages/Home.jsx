import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import FriendsPanel from '@/components/chat/FriendsPanel';
import NotificationsPanel from '@/components/chat/NotificationsPanel';
import ProfilePanel from '@/components/chat/ProfilePanel';
import AIBotChat from '@/components/chat/AIBotChat';
import NewChatModal from '@/components/chat/NewChatModal';
import NewGroupModal from '@/components/chat/NewGroupModal';
import ConversationInfo from '@/components/chat/ConversationInfo';
import SocialFeed from '@/components/social/SocialFeed';
import { MessageCircle, Users, Bell, Settings, Bot, Shield, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notifyNewMessage, notifyGeneric, ensureNotificationPermission } from '@/lib/notificationService';

export default function Home() {
  const { user, profile, setProfile, loading } = useCurrentUser();
  const navigate = useNavigate();
  const [selectedConv, setSelectedConv] = useState(null);
  const [activeTab, setActiveTab] = useState('chats');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showConvInfo, setShowConvInfo] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [mobileView, setMobileView] = useState('list');
  const seenNotifIds = useRef(new Set());
  const seenMsgIds = useRef(new Set());
  const bootRef = useRef(true);
  const selectedConvRef = useRef(null);
  const profilesRef = useRef({});

  useEffect(() => { selectedConvRef.current = selectedConv; }, [selectedConv]);
  useEffect(() => { profilesRef.current = profiles; }, [profiles]);

  useEffect(() => {
    if (!user) return;
    ensureNotificationPermission();

    const loadProfiles = async () => {
      const all = await base44.entities.UserProfile.list('-created_date', 500);
      const map = {};
      all.forEach(p => { map[p.user_id] = p; });
      setProfiles(map);
    };
    loadProfiles();

    const loadNotifs = async () => {
      const notifs = await base44.entities.Notification.filter({ user_id: user.id, is_read: false });
      setUnreadNotifs(notifs.length);
      notifs.forEach(n => seenNotifIds.current.add(n.id));
    };
    const loadUnreadChats = async () => {
      try {
        const convs = await base44.entities.Conversation.list('-last_message_time', 200);
        let count = 0;
        for (const c of convs) {
          if (!c.participant_ids?.includes(user.id)) continue;
          if (c.last_message_sender && c.last_message_sender !== user.id) {
            const unreadKey = c.unread_by || [];
            // Heuristic: count any conv whose last sender isn't me and I'm in unread_by (or no read flag)
            if (Array.isArray(unreadKey) ? unreadKey.includes(user.id) : true) count++;
          }
        }
        setUnreadChats(count);
      } catch (e) { /* ignore */ }
    };
    loadNotifs();
    loadUnreadChats();
    // First snapshot done — subsequent realtime events should fire toasts.
    setTimeout(() => { bootRef.current = false; }, 1500);

    const u1 = base44.entities.UserProfile.subscribe(() => loadProfiles());
    const u2 = base44.entities.Notification.subscribe((evt) => {
      loadNotifs();
      if (bootRef.current) return;
      const n = evt?.data;
      if (!n || n.user_id !== user.id || n.is_read) return;
      if (seenNotifIds.current.has(n.id)) return;
      seenNotifIds.current.add(n.id);
      notifyGeneric(n.title || '🔔 Thông báo mới', n.body || n.content || '');
    });
    const u3 = base44.entities.Message.subscribe((evt) => {
      const m = evt?.data;
      if (!m || evt.type !== 'INSERT') return;
      if (m.sender_id === user.id) return;
      if (seenMsgIds.current.has(m.id)) return;
      seenMsgIds.current.add(m.id);
      // If chat is currently open & visible, don't toast — ChatWindow handles read
      const openId = selectedConvRef.current?.id;
      const isOpen = openId && openId === m.conversation_id && document.visibilityState === 'visible';
      if (isOpen) return;
      setUnreadChats(c => c + 1);
      if (bootRef.current) return;
      const sender = profilesRef.current?.[m.sender_id];
      notifyNewMessage({
        from: m.sender_name || sender?.display_name || 'Bạn bè',
        content: m.content || (m.type === 'image' ? '📷 Ảnh' : m.type === 'file' ? '📎 Tệp' : ''),
        avatar: sender?.avatar_url,
      });
    });
    return () => { u1(); u2(); u3(); };
  }, [user?.id]);

  const selectConversation = (conv) => {
    setSelectedConv(conv);
    setMobileView('chat');
    setActiveTab('chats');
  };

  const startChatWith = async (friendId) => {
    if (!user) return;
    const convs = await base44.entities.Conversation.filter({ type: 'direct' });
    const existing = convs.find(c =>
      c.participant_ids?.includes(user.id) && c.participant_ids?.includes(friendId)
    );
    if (existing) { selectConversation(existing); return; }
    const friendProfile = profiles[friendId];
    const conv = await base44.entities.Conversation.create({
      type: 'direct',
      participant_ids: [user.id, friendId],
      participant_names: [profile?.display_name || 'Bạn', friendProfile?.display_name || 'Bạn bè']
    });
    selectConversation(conv);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (profile?.is_banned) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold dark:text-white mb-2">Tài khoản bị khóa</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {profile.ban_type === 'permanent'
          ? 'Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy tắc cộng đồng.'
              : `Tài khoản bị khóa tạm thời đến ${profile.ban_until? new Date(profile.ban_until).toLocaleDateString('vi-VN') : 'khi có thông báo mới'}.`}
          </p>
          <button onClick={() => base44.auth.logout('/login')} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-lg text-sm">
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: 'chats', icon: MessageCircle, label: 'Chat', badge: unreadChats },
    { key: 'feed', icon: Newspaper, label: 'Bảng tin' },
    { key: 'friends', icon: Users, label: 'Bạn bè' },
    { key: 'bot', icon: Bot, label: 'AI Bot' },
    { key: 'notifications', icon: Bell, label: 'Thông báo', badge: unreadNotifs },
    { key: 'profile', icon: Settings, label: 'Cài đặt' },
 ...(profile?.is_admin? [{ key: 'admin', icon: Shield, label: 'Quản trị' }] : []),
  ];

  const renderSidebar = () => {
    switch (activeTab) {
      case 'feed':
        return <SocialFeed />;
      case 'friends':
        return <FriendsPanel currentUserId={user.id} profile={profile} onClose={() => { setActiveTab('chats'); setMobileView('list'); }} onStartChat={startChatWith} />;
      case 'bot':
        return <AIBotChat currentUserId={user.id} profile={profile} onClose={() => { setActiveTab('chats'); setMobileView('list'); }} />;
      case 'notifications':
        return <NotificationsPanel currentUserId={user.id} onClose={() => { setActiveTab('chats'); setMobileView('list'); }} />;
      case 'profile':
        return <ProfilePanel user={user} profile={profile} setProfile={setProfile} onClose={() => { setActiveTab('chats'); setMobileView('list'); }} onAdmin={() => navigate('/admin')} />;
      default:
        return (
          <ConversationList
            currentUserId={user.id}
            profile={profile}
            selectedId={selectedConv?.id}
            onSelect={selectConversation}
            onNewChat={() => setShowNewChat(true)}
            onNewGroup={() => setShowNewGroup(true)}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900">
      <div className="flex flex-1 overflow-hidden">
        <div className={`w-full md:w-[360px] md:border-r dark:border-gray-700 flex flex-col ${mobileView === 'chat'? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 overflow-hidden">
            {renderSidebar()}
          </div>
          <div className="flex items-center justify-around border-t dark:border-gray-700 bg-white dark:bg-gray-900 py-1 px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.key === 'admin') { navigate('/admin'); return; }
                    setActiveTab(item.key);
                    if (item.key === 'chats') setUnreadChats(0);
                    if (item.key !== 'chats') setMobileView('list');
                  }}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive? 'text-blue-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-0.5 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                      {item.badge > 9? '9+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 ${mobileView === 'list'? 'hidden md:flex' : 'flex'} flex-col`}>
          {selectedConv? (
            <ChatWindow
              conversation={selectedConv}
              currentUserId={user.id}
              profile={profile}
              profiles={profiles}
              onBack={() => setMobileView('list')}
              onShowInfo={() => setShowConvInfo(true)}
            />
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center text-gray-500 dark:text-gray-400">
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
          )}
        </div>
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={startChatWith}
          currentUserId={user.id}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          currentUserId={user.id}
          onCreated={selectConversation}
        />
      )}
      {showConvInfo && selectedConv && (
        <ConversationInfo
          conversation={selectedConv}
          onClose={() => setShowConvInfo(false)}
        />
      )}
    </div>
  );
      }

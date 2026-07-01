import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';
import Avatar from '@/components/chat/Avatar';
import { ArrowLeft, MessageCircle, UserPlus, Check, Edit3, Loader2, MapPin, Calendar, Heart } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');

export default function Profile() {
  const { user_id } = useParams();
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ friends: 0, posts: 0 });
  const [friendState, setFriendState] = useState('none'); // none | pending | accepted
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const meU = await base44.auth.me().catch(() => null);
        setMe(meU);

        const ps = await base44.entities.UserProfile.filter({ user_id });
        const p = ps[0];
        setProfile(p);

        if (p) {
          const myPosts = await base44.entities.Post.filter({ author_id: user_id }, '-created_at', 50);
          setPosts(myPosts || []);

          const { count: friendsCount } = await supabase
            .from('friendships').select('*', { count: 'exact', head: true })
            .eq('status', 'accepted')
            .or(`from_user_id.eq.${user_id},to_user_id.eq.${user_id}`);
          setStats({ friends: friendsCount || 0, posts: (myPosts || []).length });

          if (meU && meU.id !== user_id) {
            const { data: rel } = await supabase.from('friendships').select('*')
              .or(`and(from_user_id.eq.${meU.id},to_user_id.eq.${user_id}),and(from_user_id.eq.${user_id},to_user_id.eq.${meU.id})`)
              .maybeSingle();
            setFriendState(rel?.status === 'accepted' ? 'accepted' : rel ? 'pending' : 'none');
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user_id]);

  const sendFriendRequest = async () => {
    if (!me || !profile) return;
    try {
      await base44.entities.Friendship.create({
        from_user_id: me.id, to_user_id: user_id,
        from_user_name: me.full_name, to_user_name: profile.display_name,
        status: 'pending',
      });
      await base44.entities.Notification.create({
        user_id, type: 'friend_request',
        title: `${me.full_name} đã gửi lời mời kết bạn`, content: '', is_read: false,
        from_user_id: me.id, from_user_name: me.full_name,
      });
      setFriendState('pending');
      toast.success('Đã gửi lời mời kết bạn');
    } catch (e) { toast.error(e?.message || 'Không gửi được'); }
  };

  const startChat = async () => {
    if (!me) return;
    const convs = await base44.entities.Conversation.filter({ type: 'direct' });
    let conv = convs.find(c => c.participant_ids?.includes(me.id) && c.participant_ids?.includes(user_id));
    if (!conv) {
      conv = await base44.entities.Conversation.create({
        type: 'direct', participant_ids: [me.id, user_id],
        participant_names: [me.full_name, profile.display_name],
      });
    }
    nav('/', { state: { openConversationId: conv.id } });
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-950">
      <Loader2 className="animate-spin text-violet-500"/>
    </div>
  );
  if (!profile) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-gray-950">
      <p className="text-gray-500 dark:text-gray-400">Không tìm thấy người dùng.</p>
      <Link to="/" className="mt-3 text-violet-600 font-medium">Về trang chủ</Link>
    </div>
  );

  const isSelf = me?.id === user_id;

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 pb-16">
      <header className="sticky top-0 z-20 bg-white/85 dark:bg-gray-900/85 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <button onClick={() => nav(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft size={20} className="dark:text-gray-200"/>
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold dark:text-white truncate">{profile.display_name}</h1>
            <p className="text-xs text-gray-500">{stats.posts} bài viết</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 sm:mt-4 sm:rounded-2xl sm:border sm:border-gray-200 dark:sm:border-gray-800 overflow-hidden shadow-sm">
        <div className="relative">
          <div className="h-40 sm:h-56 bg-gradient-to-br from-violet-500 to-blue-600">
            {profile.cover_url && <img src={profile.cover_url} alt="cover" className="w-full h-full object-cover"/>}
          </div>
          <div className="absolute -bottom-12 left-5 ring-4 ring-white dark:ring-gray-900 rounded-full">
            <Avatar src={profile.avatar_url} name={profile.display_name} size={96}/>
          </div>
        </div>
        <div className="pt-14 px-5 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold dark:text-white">{profile.display_name}</h2>
              {profile.username && <p className="text-sm text-gray-500">@{profile.username}</p>}
            </div>
            <div className="flex gap-2">
              {isSelf ? (
                <button onClick={() => nav('/settings?tab=ho_so')} className="h-10 px-4 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1.5">
                  <Edit3 size={15}/>Chỉnh sửa hồ sơ
                </button>
              ) : (
                <>
                  <button onClick={startChat} className="h-10 px-4 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1.5">
                    <MessageCircle size={15}/>Nhắn tin
                  </button>
                  <button
                    onClick={friendState === 'none' ? sendFriendRequest : undefined}
                    disabled={friendState !== 'none'}
                    className={`h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 ${
                      friendState === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : friendState === 'pending' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      : 'text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow'
                    }`}>
                    {friendState === 'accepted' ? <><Check size={15}/>Bạn bè</> : friendState === 'pending' ? 'Đã gửi lời mời' : <><UserPlus size={15}/>Kết bạn</>}
                  </button>
                </>
              )}
            </div>
          </div>

          {profile.bio && <p className="mt-3 text-sm dark:text-gray-200 whitespace-pre-wrap">{profile.bio}</p>}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            {profile.location && <span className="flex items-center gap-1"><MapPin size={14}/>{profile.location}</span>}
            {profile.birthday && !profile.hide_birthday && <span className="flex items-center gap-1"><Calendar size={14}/>{moment(profile.birthday).format('DD/MM/YYYY')}</span>}
          </div>

          <div className="mt-4 flex gap-6 text-sm">
            <div><span className="font-bold dark:text-white">{stats.posts}</span> <span className="text-gray-500">bài viết</span></div>
            <div><span className="font-bold dark:text-white">{stats.friends}</span> <span className="text-gray-500">bạn bè</span></div>
          </div>
        </div>
      </div>

      <section className="max-w-2xl mx-auto mt-4 space-y-3 px-2 sm:px-0">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-3">Bài viết</h3>
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800">Chưa có bài viết nào.</div>
        ) : posts.map(p => (
          <article key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span className="font-semibold dark:text-white">{profile.display_name}</span>
              <span>· {moment(p.created_at).fromNow()}</span>
            </div>
            <p className="whitespace-pre-wrap dark:text-gray-100 text-[15px]">{p.content}</p>
            {p.image_url && <img src={p.image_url} alt="" className="mt-2 rounded-xl w-full object-cover max-h-[500px]"/>}
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><Heart size={13}/>{p.likes_count || 0}</div>
          </article>
        ))}
      </section>
    </div>
  );
}

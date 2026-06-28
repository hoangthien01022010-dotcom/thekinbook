import React, { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Repeat2, Image as ImageIcon, Loader2 } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const MAX_LEN = 280;

function Avatar({ src, name, size = 44 }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold flex items-center justify-center shrink-0"
    >
      {initial}
    </div>
  );
}

export default function SocialFeed() {
  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    const list = await base44.entities.Post.list('-created_at', 100);
    setPosts(list || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setCurrentUserId(me.id);
        const ps = await base44.entities.UserProfile.filter({ user_id: me.id });
        setProfile(ps[0] || null);
      } catch {}
      loadPosts();
    })();
    const unsub = base44.entities.Post.subscribe(() => loadPosts());
    return () => unsub();
  }, [loadPosts]);

  const createPost = async () => {
    const text = content.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await base44.entities.Post.create({
        author_id: currentUserId,
        author_name: profile?.display_name || 'Người dùng',
        author_avatar: profile?.avatar_url || '',
        content: text.slice(0, MAX_LEN),
        likes_count: 0,
        liked_by: [],
      });
      setContent('');
    } catch (e) {
      console.error(e);
      alert('Đăng bài lỗi: ' + (e?.message || ''));
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (p) => {
    if (!currentUserId) return;
    const liked = (p.liked_by || []).includes(currentUserId);
    const newLikedBy = liked
      ? (p.liked_by || []).filter(id => id !== currentUserId)
      : [...(p.liked_by || []), currentUserId];
    // Optimistic
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, liked_by: newLikedBy, likes_count: newLikedBy.length } : x));
    try {
      await base44.entities.Post.update(p.id, {
        liked_by: newLikedBy,
        likes_count: newLikedBy.length,
      });
    } catch (e) {
      console.error(e);
      loadPosts();
    }
  };

  const remaining = MAX_LEN - content.length;
  const overLimit = remaining < 0;

  return (
    <div className="max-w-xl mx-auto min-h-screen border-x border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="sticky top-0 z-10 backdrop-blur bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <h1 className="font-bold text-xl dark:text-white">Bảng tin</h1>
      </div>

      {/* Composer */}
      <div className="flex gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <Avatar src={profile?.avatar_url} name={profile?.display_name} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Có gì mới?"
            rows={2}
            className="w-full bg-transparent text-lg outline-none resize-none placeholder-gray-500 dark:text-white"
          />
          <div className="flex items-center justify-between mt-2">
            <button className="text-blue-500 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950" disabled title="Sắp ra mắt">
              <ImageIcon size={18} />
            </button>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${overLimit ? 'text-red-500' : 'text-gray-500'}`}>{remaining}</span>
              <button
                onClick={createPost}
                disabled={!content.trim() || overLimit || posting}
                className="px-4 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Đang đăng...' : 'Đăng'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Chưa có bài viết nào.</div>
      ) : (
        posts.map(p => {
          const liked = (p.liked_by || []).includes(currentUserId);
          return (
            <article key={p.id} className="flex gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors">
              <Avatar src={p.author_avatar} name={p.author_name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-bold dark:text-white truncate">{p.author_name || 'Người dùng'}</span>
                  <span className="text-gray-500">· {moment(p.created_at).fromNow()}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-[15px] mt-1 dark:text-gray-100">{p.content}</p>
                {p.image_url && (
                  <img src={p.image_url} alt="" className="mt-2 rounded-2xl border border-gray-200 dark:border-gray-800 max-h-96 object-cover w-full" />
                )}
                <div className="flex items-center justify-between mt-3 max-w-xs text-gray-500">
                  <button className="flex items-center gap-1.5 hover:text-blue-500 group" title="Trả lời">
                    <span className="p-1.5 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950"><MessageCircle size={16} /></span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-green-500 group" title="Repost">
                    <span className="p-1.5 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-950"><Repeat2 size={16} /></span>
                  </button>
                  <button
                    onClick={() => toggleLike(p)}
                    className={`flex items-center gap-1.5 group ${liked ? 'text-pink-500' : 'hover:text-pink-500'}`}
                    title="Thích"
                  >
                    <span className="p-1.5 rounded-full group-hover:bg-pink-50 dark:group-hover:bg-pink-950">
                      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                    </span>
                    <span className="text-xs">{p.likes_count || 0}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}

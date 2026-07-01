import React, { useEffect, useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import Avatar from '@/components/chat/Avatar';
import { compressImage } from '@/lib/imageCompress';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');

const MAX_LEN = 280;
const PAGE = 15;

function timeAgo(d) { return moment(d).fromNow(); }

function CommentThread({ postId, currentUserId, profile, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('post_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
      setComments(data || []);
      setLoaded(true);
    })();
  }, [postId]);

  const send = async () => {
    const t = text.trim(); if (!t || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.from('post_comments').insert({
        post_id: postId, parent_id: replyTo?.id || null,
        author_id: currentUserId,
        author_name: profile?.display_name || 'Người dùng',
        author_avatar: profile?.avatar_url || '',
        content: t,
      }).select().single();
      if (error) throw error;
      setComments(c => [...c, data]);
      setText(''); setReplyTo(null);
      onCountChange?.(1);
    } catch (e) { toast.error('Không gửi được bình luận'); }
    finally { setBusy(false); }
  };

  const roots = comments.filter(c =>!c.parent_id);
  const childrenOf = (id) => comments.filter(c => c.parent_id === id);

  return (
    <div className="mt-3 rounded-2xl bg-[#f9f6f1] dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div ref={listRef} className="max-h-80 overflow-y-auto px-3 py-3 space-y-3">
        {!loaded? (
          <div className="py-2 flex justify-center"><Loader2 size={16} className="animate-spin text-zinc-400"/></div>
        ) : roots.length === 0? (
          <div className="text-xs text-zinc-500 text-center py-1">Chưa có bình luận</div>
        ) : roots.map(c => (
          <div key={c.id}>
            <CommentRow c={c} onReply={() => setReplyTo(c)} currentUserId={currentUserId}/>
            {childrenOf(c.id).length > 0 && (
              <div className="mt-2 ml-6 space-y-2 border-l-2 border-zinc-200 dark:border-zinc-800 pl-3">
                {childrenOf(c.id).map(ch => (
                  <CommentRow key={ch.id} c={ch} small currentUserId={currentUserId}/>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-2">
        {replyTo && (
          <div className="text-xs text-violet-600 px-2 pb-1 flex items-center gap-1">
            Trả lời {replyTo.author_name}
            <button onClick={() => setReplyTo(null)} className="p-0.5 hover:opacity-70"><X size={12}/></button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Avatar src={profile?.avatar_url} name={profile?.display_name} size={30}/>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' &&!e.shiftKey && (e.preventDefault(), send())}
            placeholder="Viết bình luận…"
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 outline-none text-sm dark:text-white"
          />
          <button
            onClick={send}
            disabled={!text.trim() || busy}
            className="p-2.5 rounded-xl bg-violet-500 text-white disabled:opacity-40 active:scale-95 transition shadow-sm"
          >
            <Send size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentRow({ c, onReply, small, currentUserId }) {
  const isMine = c.author_id === currentUserId;
  return (
    <div className={`flex gap-2 ${isMine? 'justify-start' : 'justify-end'}`}>
      {isMine && (
        <Link to={`/profile/${c.author_id}`} className="shrink-0 mt-0.5">
          <Avatar src={c.author_avatar} name={c.author_name} size={small? 26 : 30}/>
        </Link>
      )}
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-sm
        ${isMine
        ? 'bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'
         : 'bg-[#f1eaff] dark:bg-violet-900/30'
        }`}>
        <Link to={`/profile/${c.author_id}`} className={`text-xs font-semibold hover:underline ${isMine? 'text-zinc-500' : 'dark:text-white'}`}>
          {c.author_name}
        </Link>
        <p className="text-sm dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">{c.content}</p>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
          <span>{timeAgo(c.created_at)}</span>
          {onReply && <button onClick={onReply} className="font-semibold hover:text-violet-600">Trả lời</button>}
        </div>
      </div>
      {!isMine && (
        <Link to={`/profile/${c.author_id}`} className="shrink-0 mt-0.5">
          <Avatar src={c.author_avatar} name={c.author_name} size={small? 26 : 30}/>
        </Link>
      )}
    </div>
  );
}

export default function SocialFeed() {
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const fetchPage = useCallback(async (p) => {
    const from = p * PAGE;
    const to = from + PAGE - 1;
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).range(from, to);
    if (error) return { rows: [], done: true };
    return { rows: data || [], done: (data || []).length < PAGE };
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const { rows, done } = await fetchPage(0);
    setPosts(rows); setPage(0); setHasMore(!done);
    setLoading(false);
  }, [fetchPage]);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setCurrentUserId(me.id);
        const ps = await base44.entities.UserProfile.filter({ user_id: me.id });
        setProfile(ps[0] || null);
      } catch {}
      loadInitial();
    })();
    const unsub = base44.entities.Post.subscribe((evt) => {
      if (evt.type === 'INSERT' && evt.data) setPosts(prev => [evt.data,...prev.filter(p => p.id!== evt.data.id)]);
    });
    return () => unsub();
  }, [loadInitial]);

  useEffect(() => {
    if (!sentinelRef.current ||!hasMore || loading) return;
    const io = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting) {
        const next = page + 1;
        const { rows, done } = await fetchPage(next);
        setPosts(p => [...p,...rows.filter(r =>!p.some(x => x.id === r.id))]);
        setPage(next); setHasMore(!done);
      }
    }, { rootMargin: '400px' });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [page, hasMore, loading, fetchPage]);

  const pickImage = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      try {
        const c = await compressImage(f, { maxWidth: 1280, quality: 0.82 });
        setImageFile(c);
        setImagePreview(URL.createObjectURL(c));
      } catch { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
    };
    inp.click();
  };

  const createPost = async () => {
    const text = content.trim();
    if ((!text &&!imageFile) || posting) return;
    setPosting(true);
    try {
      let image_url = null;
      if (imageFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = file_url;
      }
      await base44.entities.Post.create({
        author_id: currentUserId,
        author_name: profile?.display_name || 'Người dùng',
        author_avatar: profile?.avatar_url || '',
        content: text.slice(0, MAX_LEN),
        image_url,
        likes_count: 0, liked_by: [], comment_count: 0,
      });
      setContent(''); setImageFile(null); setImagePreview(null);
    } catch (e) { toast.error('Đăng bài lỗi: ' + (e?.message || '')); }
    finally { setPosting(false); }
  };

  const toggleLike = async (p) => {
    if (!currentUserId) return;
    const liked = (p.liked_by || []).includes(currentUserId);
    const newLikedBy = liked? (p.liked_by || []).filter(id => id!== currentUserId) : [...(p.liked_by || []), currentUserId];
    setPosts(prev => prev.map(x => x.id === p.id? {...x, liked_by: newLikedBy, likes_count: newLikedBy.length } : x));
    try {
      await base44.entities.Post.update(p.id, { liked_by: newLikedBy, likes_count: newLikedBy.length });
      if (!liked && p.author_id!== currentUserId) {
        try {
          await base44.entities.Notification.create({
            user_id: p.author_id, type: 'post_like',
            title: `${profile?.display_name || 'Ai đó'} đã thích bài viết của bạn`,
            content: (p.content || '').slice(0, 80),
            related_id: p.id, from_user_id: currentUserId,
            from_user_name: profile?.display_name, from_user_avatar: profile?.avatar_url,
            is_read: false,
          });
        } catch {}
      }
    } catch { loadInitial(); }
  };

  const share = async (p) => {
    const url = `${window.location.origin}/?post=${p.id}`;
    const shareData = { title: 'KinBook', text: p.content?.slice(0, 100) || 'Bài viết trên KinBook', url };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Đã sao chép liên kết');
    } catch { toast.error('Không thể chia sẻ'); }
  };

  const remaining = MAX_LEN - content.length;
  const overLimit = remaining < 0;

  return (
    <div className="min-h-full bg-[#f9f6f1] dark:bg-zinc-950">
      <div className="max-w-xl mx-auto px-3 sm:px-4 py-4">
        <h1 className="font-bold text-xl mb-3 text-zinc-900 dark:text-white px-1">Cộng đồng</h1>

        {/* Composer - KinBook card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
          <div className="flex gap-3">
            <Avatar src={profile?.avatar_url} name={profile?.display_name} size={40}/>
            <div className="flex-1">
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Bạn đang nghĩ gì?" rows={2}
                className="w-full bg-transparent text-[15px] outline-none resize-none placeholder-zinc-500 dark:text-white"/>
              {imagePreview && (
                <div className="relative mt-2 inline-block">
                  <img src={imagePreview} alt="" className="rounded-xl max-h-64"/>
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center"><X size={14}/></button>
                </div>
              )}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button onClick={pickImage} className="text-violet-600 p-2 rounded-full hover:bg-violet-50 dark:hover:bg-violet-950" title="Thêm ảnh">
                  <ImageIcon size={18}/>
                </button>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${overLimit? 'text-red-500' : 'text-zinc-500'}`}>{remaining}</span>
                  <button onClick={createPost} disabled={(!content.trim() &&!imageFile) || overLimit || posting}
                    className="px-5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm disabled:opacity-50">
                    {posting? '…' : 'Đăng'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-violet-500"/></div>
        ) : posts.length === 0? (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">Chưa có bài viết nào.</div>
        ) : (
          <div className="space-y-3">
          {posts.map(p => {
          const liked = (p.liked_by || []).includes(currentUserId);
          const showC = openComments[p.id];
          return (
            <article key={p.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-3">
                <button onClick={() => nav(`/profile/${p.author_id}`)}>
                  <Avatar src={p.author_avatar} name={p.author_name} size={40}/>
                </button>
                <div className="min-w-0 flex-1">
                  <button onClick={() => nav(`/profile/${p.author_id}`)} className="font-bold text-sm dark:text-white truncate hover:underline">{p.author_name || 'Người dùng'}</button>
                  <p className="text-xs text-zinc-500">{timeAgo(p.created_at)}</p>
                </div>
              </div>
              {p.content && <p className="mt-2 whitespace-pre-wrap break-words text-[15px] dark:text-zinc-100">{p.content}</p>}
              {p.image_url && <img src={p.image_url} alt="" className="mt-3 rounded-xl w-full object-cover max-h-[600px]"/>}
              {p.video_url && <video src={p.video_url} controls className="mt-3 rounded-xl w-full max-h-[600px]"/>}

              <div className="flex items-center justify-around mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-zinc-500 text-sm">
                <button onClick={() => toggleLike(p)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 ${liked? 'text-pink-500' : ''}`}>
                  <Heart size={16} fill={liked? 'currentColor' : 'none'}/>
                  <span className="font-medium">{p.likes_count || 0}</span>
                </button>
                <button onClick={() => setOpenComments(o => ({...o, [p.id]:!o[p.id] }))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <MessageCircle size={16}/>
                  <span className="font-medium">{p.comment_count || 0}</span>
                </button>
                <button onClick={() => share(p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Share2 size={16}/>
                  <span className="font-medium">Chia sẻ</span>
                </button>
              </div>

              {showC && (
                <CommentThread postId={p.id} currentUserId={currentUserId} profile={profile}
                  onCountChange={(delta) => setPosts(prev => prev.map(x => x.id === p.id? {...x, comment_count: (x.comment_count || 0) + delta } : x))}/>
              )}
            </article>
          );
        })}
        </div>
        )}

        <div ref={sentinelRef} className="h-14 flex justify-center items-center">
          {hasMore &&!loading && <Loader2 className="animate-spin text-zinc-400" size={18}/>}
          {!hasMore && posts.length > 0 && <span className="text-xs text-zinc-400">Đã hết bài viết</span>}
        </div>
      </div>
    </div>
  );
        }

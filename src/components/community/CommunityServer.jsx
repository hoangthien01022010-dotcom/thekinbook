import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Avatar from '@/components/chat/Avatar';
import { Hash, Send, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import moment from 'moment';

export default function CommunityServer() {
  const { user, profile } = useCurrentUser();
  const [channels, setChannels] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [online, setOnline] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data: chs } = await supabase.from('community_channels').select('*').order('position');
      setChannels(chs || []);
      if (chs?.length) setActiveId(chs[0].id);
      const { data: profs } = await supabase.from('user_profiles').select('user_id,display_name,avatar_url,is_online').eq('is_online', true).limit(50);
      setOnline(profs || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('community_messages')
        .select('*')
        .eq('channel_id', activeId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (!cancelled) setMessages(data || []);
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
    })();

    const ch = supabase
      .channel(`cm-${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages', filter: `channel_id=eq.${activeId}` }, (payload) => {
        setMessages((m) => [...m, payload.new]);
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 30);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_messages', filter: `channel_id=eq.${activeId}` }, (payload) => {
        setMessages((m) => m.filter((x) => x.id !== payload.old.id));
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [activeId]);

  const send = async (e) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content || !user || !activeId) return;
    setText('');
    const { error } = await supabase.from('community_messages').insert({
      channel_id: activeId,
      user_id: user.id,
      user_name: profile?.display_name || user.email?.split('@')[0],
      user_avatar: profile?.avatar_url,
      content,
    });
    if (error) console.error(error);
  };

  const removeMsg = async (id) => {
    await supabase.from('community_messages').delete().eq('id', id);
  };

  const createChannel = async () => {
    const name = prompt('Tên kênh (không dấu, không cách):')?.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) return;
    const { data, error } = await supabase.from('community_channels').insert({
      name, description: '', icon: '#', position: channels.length + 1, created_by: user.id,
    }).select().single();
    if (error) return alert(error.message);
    setChannels((c) => [...c, data]);
    setActiveId(data.id);
  };

  const active = channels.find((c) => c.id === activeId);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Đang tải cộng đồng...</div>;
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 light:from-white light:via-slate-50 light:to-white">
      {/* Channels */}
      <aside className="w-56 shrink-0 hidden md:flex flex-col border-r border-white/5 bg-black/20 backdrop-blur">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-70">Kinbook Server</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all ${
                c.id === activeId ? 'bg-gradient-to-r from-teal-500/30 to-pink-500/20 text-white shadow-md' : 'hover:bg-white/5 opacity-75'
              }`}
            >
              <span className="text-base">{c.icon || '#'}</span>
              <span className="truncate">{c.name}</span>
            </button>
          ))}
          {profile?.is_admin && (
            <button onClick={createChannel} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-teal-400 hover:bg-teal-500/10 mt-2">
              <Plus size={14} /> Tạo kênh
            </button>
          )}
        </div>
      </aside>

      {/* Chat */}
      <section className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/10 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <Hash size={18} className="opacity-60 shrink-0" />
            <h3 className="font-semibold truncate">{active?.name || 'kênh'}</h3>
            {active?.description && <span className="text-xs opacity-50 truncate ml-2 hidden sm:inline">— {active.description}</span>}
          </div>
          <button onClick={() => setShowMembers((v) => !v)} className="kin-icon-btn md:hidden" aria-label="Thành viên">
            <UsersIcon size={18} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center opacity-50 text-sm py-10">Chưa có tin nhắn nào. Chào server nào!</p>
          ) : messages.map((m) => (
            <div key={m.id} className="flex items-start gap-3 group animate-in fade-in slide-in-from-bottom-1 duration-200">
              <Avatar src={m.user_avatar} name={m.user_name} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">{m.user_name || 'Ẩn danh'}</span>
                  <span className="text-[10px] opacity-40">{moment(m.created_at).fromNow()}</span>
                </div>
                <p className="text-sm break-words whitespace-pre-wrap opacity-90">{m.content}</p>
              </div>
              {(m.user_id === user?.id || profile?.is_admin) && (
                <button onClick={() => removeMsg(m.id)} className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity" aria-label="Xoá">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={send} className="p-3 border-t border-white/5 bg-black/10 backdrop-blur flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Nhắn tại #${active?.name || 'kênh'}...`}
            className="kin-search flex-1"
          />
          <button type="submit" className="kin-primary-btn" aria-label="Gửi">
            <Send size={16} />
          </button>
        </form>
      </section>

      {/* Members */}
      <aside className={`w-56 shrink-0 border-l border-white/5 bg-black/20 backdrop-blur ${showMembers ? 'flex' : 'hidden'} md:flex flex-col`}>
        <div className="p-4 border-b border-white/5 text-xs uppercase tracking-widest opacity-70 font-bold">
          Online — {online.length}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {online.map((p) => (
            <div key={p.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5">
              <Avatar src={p.avatar_url} name={p.display_name} size={28} isOnline />
              <span className="text-sm truncate">{p.display_name || 'User'}</span>
            </div>
          ))}
          {online.length === 0 && <p className="text-xs opacity-50 text-center py-4">Chưa ai online</p>}
        </div>
      </aside>
    </div>
  );
}

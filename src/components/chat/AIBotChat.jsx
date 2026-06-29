import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Bot, AlertTriangle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { withAIQueue } from '@/lib/aiQueue';

const SYSTEM_PROMPT = `Bạn là ViBai, bạn thân AI, giỏi tâm sự, lắng nghe, trả lời tự nhiên bằng tiếng Việt. Vẫn trả lời được mọi câu hỏi kiến thức / soạn bài / viết content khi user yêu cầu. Trả lời thông minh, đầy đủ.

Quy tắc:
- Mặc định nói chuyện ấm áp, gần gũi như bạn thân, dùng tiếng Việt tự nhiên.
- Khi người dùng yêu cầu kiến thức, viết bài, soạn nội dung, lập kế hoạch — trả lời ĐẦY ĐỦ, có cấu trúc markdown rõ ràng, không cắt ngắn.
- Không từ chối các câu hỏi học tập / công việc hợp lệ.
- Trả lời bằng tiếng Việt, trừ khi user yêu cầu ngôn ngữ khác.`;

const WELCOME_MSG = {
  role: 'bot',
  content: 'Xin chào! Mình là **ViBai** 🤖 — bạn thân AI của bạn.\n\nKể cho mình nghe đi, hoặc hỏi mình bất cứ điều gì: tâm sự, kiến thức, soạn bài, viết content... mình giúp tất 💪',
};

export default function AIBotChat({ currentUserId, profile, onClose }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`vibai_chat_${currentUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter(m => m.content && m.content.trim()).map(m => ({ role: m.role, content: m.content }));
      }
    } catch (e) { /* ignore */ }
    return [WELCOME_MSG];
  });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportUser, setReportUser] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    try {
      localStorage.setItem(`vibai_chat_${currentUserId}`, JSON.stringify(messages));
    } catch (e) { /* ignore */ }
  }, [messages, currentUserId]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    const userMsg = text.trim();
    const history = [...messages, { role: 'user', content: userMsg }];
    setMessages(history);
    setText('');
    setSending(true);
    setThinking(true);

    try {
      // Send last 16 turns as messages array (system prompt added by edge function)
      const chatMessages = history.slice(-16).map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content,
      }));

      const response = await withAIQueue(() => base44.integrations.Core.InvokeLLM({
        system: SYSTEM_PROMPT,
        messages: chatMessages,
        max_tokens: 4096,
      }));

      setThinking(false);
      let full = typeof response === 'string' ? response : (response?.response || response?.text || '');
      if (!full) full = 'Xin lỗi, mình chưa nghĩ ra. Bạn hỏi lại nhé?';
      setMessages(prev => [...prev, { role: 'bot', content: full }]);
    } catch (e) {
      setThinking(false);
      setMessages(prev => [...prev, { role: 'bot', content: `⚠️ Có lỗi xảy ra: ${e?.message || 'Không xác định'}. Vui lòng thử lại.` }]);
    } finally {
      setSending(false);
    }
  };

  const submitReport = async () => {
    if (!reportUser.trim() || !reportReason.trim()) return;
    setSending(true);
    try {
      const profiles = await base44.entities.UserProfile.list('-created_date', 500);
      const target = profiles.find(p => p.display_name?.toLowerCase().includes(reportUser.toLowerCase()));
      await base44.entities.Report.create({
        reporter_id: currentUserId,
        reporter_name: profile?.display_name,
        reported_user_id: target?.user_id || 'unknown',
        reported_user_name: reportUser,
        reason: reportReason,
        details: reportDetails,
        status: 'pending',
      });
      setMessages(prev => [...prev, { role: 'bot', content: `✅ Báo cáo đã được gửi!\n\n**Người bị báo cáo:** ${reportUser}\n**Lý do:** ${reportReason}` }]);
      setShowReport(false); setReportUser(''); setReportReason(''); setReportDetails('');
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Có lỗi khi gửi báo cáo.' }]);
    } finally { setSending(false); }
  };

  const clearChat = () => {
    if (confirm('Xóa toàn bộ lịch sử chat với ViBai?')) setMessages([WELCOME_MSG]);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900" style={{ minHeight: '100dvh' }}>
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <button onClick={onClose} className="md:hidden p-1 hover:bg-white/20 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Bot size={22} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm flex items-center gap-1.5">
            ViBai <Sparkles size={12} className="opacity-80" />
          </p>
          <p className="text-xs opacity-80">Bạn thân AI · Trò chuyện & trợ giúp</p>
        </div>
        <button onClick={clearChat} className="text-xs px-2 py-1 hover:bg-white/15 rounded-full">Xóa</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-100'}`}>
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <ReactMarkdown className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>pre]:my-2">
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-2 shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-400">ViBai đang nghĩ...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showReport && (
        <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-t dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-2 dark:text-white flex items-center gap-1"><AlertTriangle size={14} className="text-yellow-500" /> Báo cáo vi phạm</h4>
          <input value={reportUser} onChange={e => setReportUser(e.target.value)} placeholder="Tên người vi phạm" className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-white border dark:border-gray-600 rounded text-sm mb-2 outline-none" />
          <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-white border dark:border-gray-600 rounded text-sm mb-2 outline-none">
            <option value="">-- Chọn lý do --</option>
            <option value="Quấy rối">Quấy rối</option>
            <option value="Spam">Spam</option>
            <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
            <option value="Mạo danh">Mạo danh</option>
            <option value="Lý do khác">Lý do khác</option>
          </select>
          <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="Chi tiết (không bắt buộc)" className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-white border dark:border-gray-600 rounded text-sm mb-2 outline-none resize-none" rows={2} />
          <div className="flex gap-2">
            <button onClick={submitReport} disabled={!reportUser || !reportReason || sending} className="px-4 py-1.5 bg-red-500 text-white rounded text-sm disabled:opacity-50">Gửi báo cáo</button>
            <button onClick={() => setShowReport(false)} className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded text-sm">Hủy</button>
          </div>
        </div>
      )}

      <div className="px-3 py-2 border-t dark:border-gray-700">
        <div className="flex items-end gap-2">
          <button onClick={() => setShowReport(!showReport)} className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full shrink-0" title="Báo cáo vi phạm">
            <AlertTriangle size={18} className="text-yellow-500" />
          </button>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Nhắn cho ViBai..."
            rows={1}
            className="flex-1 resize-none px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none max-h-32"
          />
          <button onClick={sendMessage} disabled={!text.trim() || sending} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full disabled:opacity-40">
            <Send size={18} className={text.trim() ? 'text-blue-500' : 'text-gray-400'} />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { MoreHorizontal, Trash2, RotateCcw, Download, Check, CheckCheck, SmilePlus } from 'lucide-react';
import moment from 'moment';
import { getTheme, REACTION_EMOJIS } from '@/lib/chatThemes';

export default function MessageBubble({ message, isOwn, showAvatar, currentUserId, participantCount, themeKey = 'classic', nicknames = {} }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [imgPreview, setImgPreview] = useState(false);
  const theme = getTheme(themeKey);

  const handleRecall = async () => {
    await base44.entities.Message.update(message.id, {
      is_recalled: true,
      recalled_at: new Date().toISOString(),
      content: ''
    });
    setShowMenu(false);
  };

  const handleDelete = async () => {
    await base44.entities.Message.update(message.id, {
      deleted_by: [...(message.deleted_by || []), currentUserId]
    });
    setShowMenu(false);
  };

  const handleReact = async (emoji) => {
    const next = { ...(message.reactions || {}) };
    if (next[currentUserId] === emoji) delete next[currentUserId];
    else next[currentUserId] = emoji;
    await base44.entities.Message.update(message.id, { reactions: next });
    setShowReactions(false);
  };

  if (message.is_recalled) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className="px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 italic text-sm">
          Tin nhắn đã được thu hồi
        </div>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const isRead = message.read_by?.length > 1 || (participantCount <= 2 && message.read_by?.some(id => id !== message.sender_id));
  const displayName = nicknames[message.sender_id] || message.sender_name;

  // Aggregate reactions
  const reactionList = Object.values(message.reactions || {});
  const reactionCounts = reactionList.reduce((acc, e) => { acc[e] = (acc[e] || 0) + 1; return acc; }, {});

  const isMedia = message.type === 'image' || message.type === 'video';
  const ownStyle = { background: theme.ownBubble, color: theme.ownText };
  const otherStyle = {
    background: `light-dark(${theme.otherBubble}, ${theme.otherBubbleDark})`,
    color: `light-dark(${theme.otherText}, ${theme.otherTextDark})`,
  };
  // Fallback for browsers without light-dark()
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const otherStyleFallback = isOwn ? ownStyle : {
    background: isDark ? theme.otherBubbleDark : theme.otherBubble,
    color: isDark ? theme.otherTextDark : theme.otherText,
  };

  const bubbleStyle = isMedia ? {} : (isOwn ? ownStyle : otherStyleFallback);

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-0.5 ${showAvatar ? 'mt-2' : ''}`}>
        {!isOwn && showAvatar && (
          <Avatar src={message.sender_avatar} name={displayName} size={28} className="mr-2 mt-auto" />
        )}
        {!isOwn && !showAvatar && <div className="w-[28px] mr-2" />}

        <div className="relative max-w-[75%]">
          {!isOwn && showAvatar && displayName && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 ml-3 mb-0.5">{displayName}</p>
          )}

          <div className="flex items-center gap-1">
            {isOwn && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setShowReactions(v => !v)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  title="Cảm xúc"
                >
                  <SmilePlus size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <MoreHorizontal size={14} className="text-gray-400" />
                </button>
              </div>
            )}

            <div
              className={`rounded-2xl overflow-hidden shadow-sm ${isMedia ? 'p-0.5' : 'px-3.5 py-2'}`}
              style={bubbleStyle}
            >
              {message.type === 'text' && (
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              )}
              {message.type === 'image' && message.file_url && (
                <img
                  src={message.file_url}
                  alt="ảnh"
                  className="max-w-[260px] rounded-2xl cursor-pointer"
                  onClick={() => setImgPreview(true)}
                />
              )}
              {message.type === 'video' && message.file_url && (
                <video src={message.file_url} controls className="max-w-[260px] rounded-2xl" />
              )}
              {message.type === 'file' && message.file_url && (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm underline"
                  style={{ color: isOwn ? theme.ownText : undefined }}
                >
                  <Download size={14} />
                  {message.file_name || 'Tải tệp'}
                </a>
              )}
            </div>

            {!isOwn && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setShowReactions(v => !v)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  title="Cảm xúc"
                >
                  <SmilePlus size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <MoreHorizontal size={14} className="text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* Reactions display */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className="flex items-center gap-0.5 px-2 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-full shadow text-xs">
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="hover:scale-110 transition-transform"
                  >
                    <span>{emoji}</span>
                    {reactionList.length > 1 && <span className="ml-0.5 text-gray-500 dark:text-gray-400">{count}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time & read */}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'} px-2`}>
            <span className="text-[10px] text-gray-400">{moment(message.created_date).utcOffset(420).format('HH:mm')}</span>
            {isOwn && (
              isRead
                ? <CheckCheck size={12} className="text-blue-400" />
                : <Check size={12} className="text-gray-400" />
            )}
          </div>

          {/* Reaction picker */}
          {showReactions && (
            <div className={`absolute z-50 ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-white dark:bg-gray-800 rounded-full shadow-xl border dark:border-gray-700 px-2 py-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2`}>
              {REACTION_EMOJIS.map(em => (
                <button
                  key={em}
                  onClick={() => handleReact(em)}
                  className="text-xl hover:scale-125 transition-transform p-0.5"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Context menu */}
          {showMenu && (
            <div className={`absolute z-50 ${isOwn ? 'right-0' : 'left-0'} top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 min-w-[160px]`}>
              {isOwn && (
                <button onClick={handleRecall} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                  <RotateCcw size={14} /> Thu hồi
                </button>
              )}
              <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
                <Trash2 size={14} /> Xóa phía bạn
              </button>
            </div>
          )}
        </div>
      </div>

      {imgPreview && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setImgPreview(false)}>
          <img src={message.file_url} alt="preview" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, ChevronLeft, ChevronRight, Send, MapPin } from 'lucide-react';

const QUICK_EMOJIS = ['🔥', '❤️', '😂', '👏', '🇨🇴', '☕', '😍', '🥳'];

export const StoryViewerModal: React.FC = () => {
  const {
    stories,
    activeStoryIndex,
    setActiveStoryIndex,
    reactToStory,
    currentUser,
    startPrivateChat,
    sendMessage
  } = useApp();

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);

  const timerRef = useRef<number | null>(null);

  const currentStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  const handleNextStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setProgress(0);
    } else {
      setActiveStoryIndex(null);
      setProgress(0);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  // Keep a ref to handleNextStory so setInterval doesn't close over stale handlers
  const handleNextStoryRef = useRef(handleNextStory);
  handleNextStoryRef.current = handleNextStory;

  // Auto-progress story
  useEffect(() => {
    if (activeStoryIndex === null || !currentStory) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const intervalTime = 50; // ms
    const step = 100 / (5000 / intervalTime); // 5 seconds per story

    timerRef.current = window.setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev >= 100) {
            // Schedule story change outside the current render / state updater cycle
            setTimeout(() => {
              handleNextStoryRef.current();
            }, 0);
            return 100;
          }
          return prev + step;
        });
      }
    }, intervalTime);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeStoryIndex, isPaused, currentStory?.id]);

  // Lock background window scroll when viewing stories
  useEffect(() => {
    if (activeStoryIndex !== null) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [activeStoryIndex]);

  if (activeStoryIndex === null || !currentStory) return null;

  const handleQuickReaction = (emoji: string) => {
    reactToStory(currentStory.id, emoji);
    
    // Add floating emoji animation
    const id = Date.now() + Math.random();
    const x = 30 + Math.random() * 40; // random % from left
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);

    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 1500);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    if (currentStory.userId !== currentUser.id) {
      const chatId = startPrivateChat(currentStory.userId);
      if (chatId) {
        sendMessage(chatId, `Respondió a tu historia: "${replyText.trim()}"`);
      }
    }
    setReplyText('');
    handleQuickReaction('💬');
  };

  return (
    <div
      id="story-viewer-backdrop"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
    >
      {/* Navigation arrows for desktop */}
      <button
        id="btn-prev-story"
        onClick={handlePrevStory}
        disabled={activeStoryIndex === 0}
        className="hidden md:flex absolute left-8 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center disabled:opacity-30 transition-all"
        title="Historia anterior"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        id="btn-next-story"
        onClick={handleNextStory}
        disabled={activeStoryIndex === stories.length - 1}
        className="hidden md:flex absolute right-8 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center disabled:opacity-30 transition-all"
        title="Siguiente historia"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Main Story Container */}
      <div
        id="story-viewer-canvas"
        className="relative w-full max-w-sm h-full max-h-[92vh] sm:rounded-3xl overflow-hidden bg-neutral-900 flex flex-col justify-between shadow-2xl border border-neutral-800"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bar Segments */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((story, i) => (
            <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    i < activeStoryIndex
                      ? '100%'
                      : i === activeStoryIndex
                      ? `${progress}%`
                      : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStory.userAvatar || undefined}
              alt={currentStory.username}
              className="w-9 h-9 rounded-full object-cover border border-white/40"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold drop-shadow">{currentStory.username}</span>
                <span className="text-xs text-white/70">· {currentStory.timestamp}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-300">
                <MapPin className="w-3 h-3" />
                <span>{currentStory.userCity}, España</span>
              </div>
            </div>
          </div>

          <button
            id="btn-close-story"
            onClick={() => setActiveStoryIndex(null)}
            className="p-2 text-white hover:text-neutral-300 rounded-full bg-black/30 backdrop-blur-sm"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Touch zones for mobile tap navigation */}
        <div
          className="absolute inset-y-16 left-0 w-1/3 z-20 cursor-pointer"
          onClick={handlePrevStory}
          title="Toca para ir atrás"
        />
        <div
          className="absolute inset-y-16 right-0 w-1/3 z-20 cursor-pointer"
          onClick={handleNextStory}
          title="Toca para avanzar"
        />

        {/* Story Media */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img
            src={currentStory.mediaUrl || undefined}
            alt={currentStory.caption || 'Historia'}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {/* Optional Caption Overlay */}
          {currentStory.caption && (
            <div className="absolute bottom-28 left-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white p-3 rounded-2xl text-center text-sm font-medium border border-white/10 shadow-lg">
              {currentStory.caption}
            </div>
          )}

          {/* Floating Emoji Reactions Layer */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            {floatingEmojis.map(item => (
              <div
                key={item.id}
                className="absolute bottom-24 text-4xl animate-bounce"
                style={{
                  left: `${item.x}%`,
                  animation: 'floatUp 1.4s ease-out forwards',
                  opacity: 0.95
                }}
              >
                {item.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Story Bottom Interactions: Quick Emoji Reactions & Reply Input */}
        <div className="relative z-30 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-6 text-white">
          {/* Quick Reaction Emoji Row */}
          <div className="flex items-center justify-between gap-1 mb-3 px-1">
            {QUICK_EMOJIS.map(emoji => {
              const reactionData = currentStory.reactions?.find(r => r.emoji === emoji);
              const count = reactionData?.count || 0;
              return (
                <button
                  key={emoji}
                  onClick={() => handleQuickReaction(emoji)}
                  className="flex flex-col items-center justify-center p-1.5 hover:scale-125 transition-transform active:scale-95 group"
                  title={`Reaccionar con ${emoji}`}
                >
                  <span className="text-2xl filter drop-shadow">{emoji}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-bold text-amber-300 mt-0.5">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Reply DM Input */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Responder a @${currentStory.username}...`}
              className="flex-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center disabled:opacity-40 transition-all"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

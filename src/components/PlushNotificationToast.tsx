import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, MessageSquare, Users, Heart, Sparkles, X, ShieldCheck } from 'lucide-react';

export const PlushNotificationToast: React.FC = () => {
  const { plushToast, dismissPlushToast, setActiveTab, setActiveChatId } = useApp();

  useEffect(() => {
    if (!plushToast) return;
    const timer = setTimeout(() => {
      dismissPlushToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [plushToast, dismissPlushToast]);

  if (!plushToast) return null;

  const getIcon = () => {
    switch (plushToast.type) {
      case 'chat_general':
      case 'chat_city':
      case 'chat_private':
        return <MessageSquare className="w-5 h-5 text-amber-500" />;
      case 'group_invite':
      case 'group_activity':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'like':
      case 'story_reaction':
        return <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />;
      case 'follow':
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'system':
      default:
        return <ShieldCheck className="w-5 h-5 text-amber-600" />;
    }
  };

  const handleClick = () => {
    if (plushToast.data?.chatId) {
      setActiveTab('chats');
      setActiveChatId(plushToast.data.chatId);
    } else if (plushToast.type === 'group_invite') {
      setActiveTab('notifications');
    }
    dismissPlushToast();
  };

  return (
    <aside
      aria-label="Notificaciones del sistema"
      className="fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 transform translate-y-0"
    >
      <div
        id="plush-toast-card"
        onClick={handleClick}
        className="bg-neutral-900/95 backdrop-blur-md text-white border border-neutral-700/80 rounded-2xl p-4 shadow-2xl flex items-start gap-3 cursor-pointer hover:border-amber-500/50 transition-all group"
      >
        <div className="relative shrink-0 mt-0.5">
          {plushToast.avatar ? (
            <img
              src={plushToast.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-neutral-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700">
              {getIcon()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-neutral-900 rounded-full p-0.5 shadow">
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              {plushToast.title}
            </span>
            <span className="text-[11px] text-neutral-400">{plushToast.timestamp}</span>
          </div>
          <p className="text-sm text-neutral-200 mt-1 line-clamp-2 leading-snug">
            {plushToast.message}
          </p>
        </div>

        <button
          id="btn-dismiss-toast"
          onClick={(e) => {
            e.stopPropagation();
            dismissPlushToast();
          }}
          className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition-colors"
          title="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

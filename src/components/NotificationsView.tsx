import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Heart,
  MessageSquare,
  Users,
  UserPlus,
  Check,
  Trash2
} from 'lucide-react';
import { NotificationType } from '../types';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationAsRead,
    clearNotifications,
    respondToGroupInvite,
    setActiveTab,
    setActiveChatId,
    setSelectedUserProfile,
    otherUsers
  } = useApp();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
      case 'story_reaction':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-amber-400" />;
      case 'group_invite':
      case 'group_activity':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'chat_city':
      case 'chat_general':
      case 'chat_private':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-white/60" />;
    }
  };

  const handleNotificationClick = (item: typeof notifications[0]) => {
    markNotificationAsRead(item.id);

    if (item.data?.chatId) {
      setActiveChatId(item.data.chatId);
      setActiveTab('chats');
    } else if (item.data?.userId) {
      const u = otherUsers.find(user => user.id === item.data?.userId);
      if (u) {
        setSelectedUserProfile(u);
        setActiveTab('profile');
      }
    }
  };

  return (
    <div
      id="notifications-container"
      className="w-full max-w-2xl mx-auto text-white"
      style={{
        background: 'linear-gradient(180deg, #003087 0%, #1A2436 100%)'
      }}
    >
      {/* Header */}
      <div className="sticky top-14 z-20 px-4 py-3 bg-[#003087]/85 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <span>Centro de Notificaciones</span>
        </h2>

        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="text-xs font-semibold text-white/60 hover:text-rose-400 flex items-center gap-1 transition-colors"
            title="Borrar todas las notificaciones"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Notifications List (Directly shows all notifications without category buttons) */}
      <div className="divide-y divide-white/10">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-white/60">
            <Bell className="w-10 h-10 mx-auto text-white/30 mb-2" />
            <p className="text-sm font-bold text-white">
              No tienes notificaciones
            </p>
            <p className="text-xs text-white/60 mt-1">
              Aquí aparecerán las reacciones a tus historias, nuevos seguidores, mensajes de ciudad e invitaciones a grupos.
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 flex items-start gap-3.5 hover:bg-white/5 cursor-pointer transition-colors ${
                !notif.read ? 'bg-amber-400/10' : ''
              }`}
            >
              {/* Avatar + Sub-icon */}
              <div className="relative shrink-0 mt-0.5">
                {notif.avatar ? (
                  <img
                    src={notif.avatar}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-white/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white/60" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-[#0c2454] rounded-full p-1 shadow border border-white/10">
                  {getNotificationIcon(notif.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white truncate">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-white/50 shrink-0">
                    {notif.timestamp}
                  </span>
                </div>

                <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
                  {notif.message}
                </p>

                {/* Direct Action for Group Invites */}
                {notif.type === 'group_invite' && (
                  <div className="mt-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        respondToGroupInvite('inv-1', true);
                        markNotificationAsRead(notif.id);
                      }}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aceptar Ingreso</span>
                    </button>
                    <button
                      onClick={() => {
                        respondToGroupInvite('inv-1', false);
                        markNotificationAsRead(notif.id);
                      }}
                      className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </div>

              {/* Unread indicator */}
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-2"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

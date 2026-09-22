import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DEFAULT_SILHOUETTE_AVATAR } from '../context/AuthContext';
import {
  UserProfile,
  ChatRoom,
  ChatMessage,
  SpanishCity,
  StaffRole
} from '../types';
import {
  MapPin,
  Lock,
  Users,
  Search,
  Plus,
  Send,
  ArrowLeft,
  ShieldAlert,
  UserX,
  UserPlus,
  UserCheck,
  Trash2,
  Ban,
  Smile,
  MoreHorizontal,
  Check,
  X,
  ShieldCheck,
  MoreVertical,
  MessageCircle,
  BadgeCheck
} from 'lucide-react';
import { SPANISH_CITIES } from '../data/mockData';
import { FlagColombia, FlagSpain, CountryFlag } from './CountryFlag';

// Component for rendering verified checkmark badge and staff role labels (MOD, Soporte, ADMIN)
const UserBadges: React.FC<{
  isVerified?: boolean;
  staffRole?: StaffRole;
  className?: string;
}> = ({ isVerified, staffRole, className = '' }) => {
  if (!isVerified && (!staffRole || staffRole === 'Usuario')) return null;

  return (
    <span className={`inline-flex items-center gap-1 shrink-0 ${className}`}>
      {isVerified && (
        <span title="Usuario Verificado" className="inline-flex shrink-0">
          <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20 shrink-0 inline-block" />
        </span>
      )}
      {staffRole && staffRole !== 'Usuario' && (
        <span
          className={`px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase inline-flex items-center shadow-xs border leading-none shrink-0 ${
            staffRole === 'ADMIN'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 border-amber-300/40'
              : staffRole === 'Soporte'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
          }`}
          title={`Personal de La Tierrita: ${staffRole}`}
        >
          {staffRole}
        </span>
      )}
    </span>
  );
};

// Palette of distinct, accessible colors for user names in group, city, and general chats
const USER_NAME_COLORS = [
  'text-blue-600 dark:text-blue-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-purple-600 dark:text-purple-400',
  'text-pink-600 dark:text-pink-400',
  'text-amber-600 dark:text-amber-400',
  'text-indigo-600 dark:text-indigo-400',
  'text-teal-600 dark:text-teal-400',
  'text-orange-600 dark:text-orange-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-rose-600 dark:text-rose-400',
];

const getUserColor = (userId: string, name: string) => {
  const str = (userId || '') + (name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_NAME_COLORS.length;
  return USER_NAME_COLORS[index];
};

export const ChatsView: React.FC = () => {
  const {
    currentUser,
    chatRooms,
    activeChatId,
    setActiveChatId,
    sendMessage,
    createGroupChat,
    startPrivateChat,
    groupInvites,
    respondToGroupInvite,
    openReportModal,
    blockUser,
    blockedUserIds,
    otherUsers,
    updateProfile,
    chatTypeTab,
    setChatTypeTab,
    followingIds,
    followUser,
    unfollowUser,
    reactToMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
    deletedMessageIdsForMe,
    setSelectedUserProfile,
    setActiveTab,
    deleteChatRoom,
    leaveGroupChat,
    toggleGroupAdmin,
    removeGroupMember,
    addMembersToGroup,
    notifications
  } = useApp();

  const getUserInfo = (userId?: string) => {
    if (!userId) return undefined;
    if (userId === currentUser.id) return currentUser;
    return otherUsers.find(u => u.id === userId);
  };

  const getOtherUserInPrivateChat = (room: ChatRoom): UserProfile | undefined => {
    if (room.type !== 'private') return undefined;
    const myId = (currentUser?.id || '').toLowerCase();
    const myUsername = (currentUser?.username || '').toLowerCase();
    const myEmail = (currentUser?.email || '').toLowerCase();
    const myName = (currentUser?.name || '').toLowerCase();
    const strippedId = myId.replace(/^user-/, '');
    const cleanUsername = myUsername.replace(/^@/, '');
    const myIdentifiers = [myId, myUsername, myEmail, myName, strippedId, cleanUsername].filter(Boolean);

    let otherId: string | undefined = undefined;

    // 1. Check room.members for an id that is NOT me
    if (Array.isArray(room.members)) {
      otherId = room.members.find(id => id && !myIdentifiers.some(my => {
        const cleanId = String(id).toLowerCase();
        return cleanId === my || cleanId.includes(my) || my.includes(cleanId);
      }));
    }

    // 2. Extract from canonical room id: chat-priv_{p1}__{p2}
    if (!otherId && (room.id.startsWith('chat-priv') || room.id.startsWith('priv-'))) {
      const raw = room.id.replace(/^chat-priv[_-]|^priv[_-]|^chat-priv/, '');
      const parts = raw.split('__');
      if (parts.length === 2) {
        otherId = parts.find(id => !myIdentifiers.some(my => {
          const cleanId = String(id).toLowerCase();
          return cleanId === my || cleanId.includes(my) || my.includes(cleanId);
        }));
      }
    }

    // 3. From targetUserId if not me
    if (!otherId && room.targetUserId && !myIdentifiers.some(my => {
      const cleanTarget = String(room.targetUserId).toLowerCase();
      return cleanTarget === my || cleanTarget.includes(my) || my.includes(cleanTarget);
    })) {
      otherId = room.targetUserId;
    }

    // 4. From non-self sender in messages
    if (!otherId && Array.isArray(room.messages)) {
      const nonSelfMsg = room.messages.find(m => m.senderId && m.senderId !== 'system' && !myIdentifiers.some(my => (m.senderId || '').toLowerCase() === my));
      if (nonSelfMsg) {
        otherId = nonSelfMsg.senderId;
      }
    }

    // Look up in otherUsers
    if (otherId) {
      const cleanOther = otherId.toLowerCase();
      const found = otherUsers.find(u =>
        u.id.toLowerCase() === cleanOther ||
        u.username.toLowerCase() === cleanOther ||
        (u.email && u.email.toLowerCase() === cleanOther) ||
        u.id.toLowerCase().includes(cleanOther) ||
        cleanOther.includes(u.id.toLowerCase())
      );
      if (found) return found;
      if (room.targetUser && (room.targetUser.id.toLowerCase() === cleanOther || room.targetUser.username.toLowerCase() === cleanOther)) return room.targetUser;
    }

    // Extract other user profile from messages if sender information exists
    if (Array.isArray(room.messages)) {
      const senderMsg = room.messages.find(m => m.senderId && m.senderId !== 'system' && !myIdentifiers.some(my => (m.senderId || '').toLowerCase() === my));
      if (senderMsg) {
        return {
          id: senderMsg.senderId,
          username: (senderMsg.senderName || senderMsg.senderId).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          name: senderMsg.senderName || 'Parcero',
          avatar: senderMsg.senderAvatar || DEFAULT_SILHOUETTE_AVATAR,
          city: 'Madrid',
          originCity: 'Colombia',
          bio: 'Usuario de La Tierrita',
          website: '',
          followersCount: 1,
          followingCount: 1,
          postsCount: 0,
          isVerified: false
        };
      }
    }

    // If otherId was found (e.g. from canonical ID) create a fallback user profile
    if (otherId) {
      const cleanName = otherId.replace(/^user-/, '').replace(/_/g, ' ');
      return {
        id: otherId,
        username: otherId.replace(/^user-/, ''),
        name: (room.name && room.name !== 'Chat' && room.name !== 'Chat Privado' && !myIdentifiers.includes(room.name.toLowerCase()))
          ? room.name
          : cleanName,
        avatar: room.avatar || DEFAULT_SILHOUETTE_AVATAR,
        city: 'Madrid',
        originCity: 'Colombia',
        bio: 'Usuario de La Tierrita',
        website: '',
        followersCount: 1,
        followingCount: 1,
        postsCount: 0,
        isVerified: false
      };
    }

    return undefined;
  };

  const [selectedPrivateOrGroupId, setSelectedPrivateOrGroupId] = useState<string | null>(null);
  const [activeMinimizedMenuId, setActiveMinimizedMenuId] = useState<string | null>(null);

  // Group Info and Member Addition Modal States
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [groupInfoTarget, setGroupInfoTarget] = useState<ChatRoom | null>(null);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [addMembersSearchQuery, setAddMembersSearchQuery] = useState('');
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([]);
  const [createGroupUserSearch, setCreateGroupUserSearch] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [showQuickEmojis, setShowQuickEmojis] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showNewPrivateModal, setShowNewPrivateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showE2EModal, setShowE2EModal] = useState(false);

  // Floating User Menu & Message Context Menu State
  const [activeUserMenu, setActiveUserMenu] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string;
    userCity?: string;
  } | null>(null);

  const [activeMessageMenu, setActiveMessageMenu] = useState<{
    message: ChatMessage;
    chatId: string;
    rect?: DOMRect;
    isMe?: boolean;
  } | null>(null);

  const [showExtendedEmojis, setShowExtendedEmojis] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStartMessage = (msg: ChatMessage, e: React.TouchEvent<HTMLDivElement>) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const isMe = msg.senderId === currentUser.id;

    longPressTimerRef.current = setTimeout(() => {
      if (activeChat) {
        setActiveMessageMenu({ message: msg, chatId: activeChat.id, rect, isMe });
        setShowExtendedEmojis(false);
      }
    }, 450);
  };

  const handleTouchEndMessage = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleOpenUserProfileFromMenu = (userId: string, userName: string, userAvatar?: string, userCity?: string) => {
    if (userId === currentUser.id) {
      setSelectedUserProfile(currentUser);
    } else {
      const found = otherUsers.find(u => u.id === userId || u.username === userName);
      if (found) {
        setSelectedUserProfile(found);
      } else {
        setSelectedUserProfile({
          id: userId,
          username: userName.toLowerCase().replace(/\s+/g, '_'),
          name: userName,
          avatar: userAvatar || DEFAULT_SILHOUETTE_AVATAR,
          city: (userCity as SpanishCity) || 'Madrid',
          originCity: 'Colombia',
          bio: 'Parcero en España 🇨🇴',
          website: '',
          followersCount: 15,
          followingCount: 10,
          postsCount: 3,
          isVerified: false
        });
      }
    }
    setActiveTab('profile');
    setActiveUserMenu(null);
  };

  // New Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedInviteUserIds, setSelectedInviteUserIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize if external code set activeChatId (e.g., from push notifications or places)
  useEffect(() => {
    if (activeChatId) {
      const room = chatRooms.find(r => r.id === activeChatId || (r.type === 'private' && (r.id.includes(activeChatId) || activeChatId.includes(r.id.replace(/^chat-priv_/, '')))));
      if (room) {
        if (room.type === 'general') {
          setChatTypeTab('general');
        } else if (room.type === 'city') {
          setChatTypeTab('city');
        } else {
          setChatTypeTab('messages');
          setSelectedPrivateOrGroupId(room.id);
        }
      }
    } else {
      if (chatTypeTab === 'messages') {
        setSelectedPrivateOrGroupId(null);
      }
    }
  }, [activeChatId, chatRooms, chatTypeTab]);

  // 1. General chat: public for all
  const generalChat = useMemo(() => {
    return chatRooms.find(r => r.type === 'general') || null;
  }, [chatRooms]);

  // 2. City chat: ONLY shows the chat according to the user's current city!
  const currentCityChat = useMemo(() => {
    return (
      chatRooms.find(r => r.type === 'city' && r.city === currentUser.city) ||
      chatRooms.find(r => r.type === 'city') ||
      null
    );
  }, [chatRooms, currentUser.city]);

  // Determine active conversation room depending on current tab
  const activeChat = useMemo<ChatRoom | null>(() => {
    if (chatTypeTab === 'general') {
      return generalChat;
    }
    if (chatTypeTab === 'city') {
      return currentCityChat;
    }
    if (chatTypeTab === 'messages' && selectedPrivateOrGroupId) {
      return chatRooms.find(r => r.id === selectedPrivateOrGroupId) || null;
    }
    return null;
  }, [chatTypeTab, selectedPrivateOrGroupId, generalChat, currentCityChat, chatRooms]);

  // Scroll to bottom when messages change or chat is switched
  useEffect(() => {
    if (activeChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.id, activeChat?.messages.length]);

  // Unified list of private and group chats for the "messages" session
  const unifiedChatsList = useMemo(() => {
    const myId = (currentUser?.id || '').toLowerCase();
    const myUsername = (currentUser?.username || '').toLowerCase();
    const myEmail = (currentUser?.email || '').toLowerCase();
    const myName = (currentUser?.name || '').toLowerCase();
    const strippedId = myId.replace(/^user-/, '');
    const cleanUsername = myUsername.replace(/^@/, '');
    const myIdentifiers = [myId, myUsername, myEmail, myName, strippedId, cleanUsername].filter(Boolean);

    const notifiedChatIds = new Set(
      notifications
        .map(n => n.data?.chatId)
        .filter(Boolean) as string[]
    );

    return chatRooms
      .filter(r => {
        if (r.type !== 'private' && r.type !== 'group') return false;

        // Private chats: display if currentUser is one of the participants
        if (r.type === 'private') {
          // If a notification was sent for this chat, it definitely belongs in this user's inbox
          let isParticipant = notifiedChatIds.has(r.id);

          if (!isParticipant) {
            const hasMessages = Array.isArray(r.messages) && r.messages.length > 0;
            const hasUserMessages = hasMessages && r.messages.some(m => m && m.senderId && m.senderId !== 'system');

            const isExplicitParticipant =
              (Array.isArray(r.members) && r.members.some(m => {
                if (!m) return false;
                const cleanM = String(m).toLowerCase();
                return myIdentifiers.some(id => cleanM === id || cleanM.includes(id) || id.includes(cleanM));
              })) ||
              (r.id && myIdentifiers.some(id => r.id.toLowerCase().includes(id))) ||
              (r.targetUserId && myIdentifiers.some(id => String(r.targetUserId).toLowerCase().includes(id))) ||
              (r.createdBy && myIdentifiers.some(id => String(r.createdBy).toLowerCase().includes(id))) ||
              (hasMessages && r.messages.some(m => m && myIdentifiers.some(id => (m.senderId || '').toLowerCase() === id)));

            isParticipant = isExplicitParticipant || hasUserMessages || (Array.isArray(r.members) && r.members.length >= 1);
          }

          if (!isParticipant) return false;

          const otherUser = getOtherUserInPrivateChat(r);
          if (otherUser && blockedUserIds.includes(otherUser.id)) {
            return false;
          }
          if (r.targetUserId && blockedUserIds.includes(r.targetUserId)) {
            return false;
          }

          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          const displayName = otherUser ? otherUser.name : (r.name || '');
          const matchesName = displayName.toLowerCase().includes(query);
          const matchesDesc = (r.description || '').toLowerCase().includes(query);
          const matchesMsg = (r.messages || []).some(m => (m.text || '').toLowerCase().includes(query));
          return matchesName || matchesDesc || matchesMsg;
        }

        // Group chats: only display if currentUser is a member or creator
        if (r.type === 'group') {
          const isMember = (Array.isArray(r.members) && r.members.some(m => myIdentifiers.some(id => String(m).toLowerCase().includes(id)))) || (r.createdBy && myIdentifiers.some(id => String(r.createdBy).toLowerCase().includes(id)));
          if (!isMember) return false;

          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          const matchesName = (r.name || '').toLowerCase().includes(query);
          const matchesDesc = (r.description || '').toLowerCase().includes(query);
          const matchesMsg = (r.messages || []).some(m => (m.text || '').toLowerCase().includes(query));
          return matchesName || matchesDesc || matchesMsg;
        }

        return false;
      })
      .sort((a, b) => {
        const lastA = a.messages[a.messages.length - 1];
        const lastB = b.messages[b.messages.length - 1];
        const timeA = lastA ? (lastA.timestamp || lastA.id) : a.createdAt;
        const timeB = lastB ? (lastB.timestamp || lastB.id) : b.createdAt;
        return (timeB || '').localeCompare(timeA || '');
      });
  }, [chatRooms, blockedUserIds, searchQuery, currentUser, otherUsers, notifications]);

  // Handle Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChat) return;
    sendMessage(activeChat.id, inputMessage);
    setInputMessage('');
  };

  // Handle Group Creation (from same session as private chats)
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroupChat(newGroupName.trim(), newGroupDesc.trim(), selectedInviteUserIds);
    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedInviteUserIds([]);
    setShowCreateGroupModal(false);
  };

  const toggleInviteUser = (userId: string) => {
    setSelectedInviteUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Unread or pending indicators
  const pendingInvitesCount = groupInvites.filter(i => i.status === 'pending').length;

  return (
    <div
      id="chats-root-container"
      className="fixed top-14 bottom-15 left-0 right-0 max-w-2xl mx-auto flex flex-col bg-[#001428] border-x border-white/10 z-20 overflow-hidden"
    >
      {/* RENDER CONTENT BASED ON TAB */}
      {chatTypeTab === 'messages' && !selectedPrivateOrGroupId ? (
        /* ========================================================================= */
        /* SESSION: LISTA DE CHATS PRIVADOS Y GRUPALES (Unificada con creación)     */
        /* ========================================================================= */
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Top actions within the private & groups session */}
          <div className="p-3 bg-neutral-50/80 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 space-y-2.5">
            {/* Search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-chat-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar parceros o grupos colombianos..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Direct creation action buttons in the same session */}
            <div className="flex items-center gap-2">
              <button
                id="btn-open-create-group"
                onClick={() => setShowCreateGroupModal(true)}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Users className="w-3.5 h-3.5" />
                <span>+ Crear Grupo</span>
              </button>

              <button
                id="btn-open-new-private"
                onClick={() => setShowNewPrivateModal(true)}
                className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Nuevo Chat Privado</span>
              </button>
            </div>
          </div>

          {/* Pending Group Invites Section (Accept / Reject) */}
          {pendingInvitesCount > 0 && (
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Solicitudes de ingreso a grupos pendientes:
              </span>

              <div className="space-y-2">
                {groupInvites
                  .filter(i => i.status === 'pending')
                  .map(invite => (
                    <div
                      key={invite.id}
                      className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={invite.groupAvatar || undefined}
                          alt={invite.groupName}
                          className="w-9 h-9 rounded-xl object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                            {invite.groupName}
                          </h4>
                          <p className="text-[10px] text-neutral-500 truncate">
                            De @{invite.invitedBy.username} · {invite.timestamp}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          id={`btn-reject-invite-${invite.id}`}
                          onClick={() => respondToGroupInvite(invite.id, false)}
                          className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 text-xs"
                          title="Rechazar solicitud"
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                        <button
                          id={`btn-accept-invite-${invite.id}`}
                          onClick={() => respondToGroupInvite(invite.id, true)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                          title="Aceptar solicitud de ingreso"
                        >
                          <Check className="w-3 h-3" />
                          <span>Aceptar</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Unified Private & Group Chats List */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 flex-1">
            {unifiedChatsList.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                <MessageCircle className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  No hay conversaciones que coincidan
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  Crea tu propio grupo o inicia una conversación privada con otro parcero usando los botones superiores.
                </p>
              </div>
            ) : (
              unifiedChatsList.map(room => {
                const lastMsg = room.messages[room.messages.length - 1];
                const isGroup = room.type === 'group';
                const otherUser = room.type === 'private' ? getOtherUserInPrivateChat(room) : undefined;
                const displayName = isGroup ? room.name : (otherUser ? otherUser.name : (room.name || 'Chat Privado'));
                const avatarSrc = isGroup ? (room.avatar || DEFAULT_SILHOUETTE_AVATAR) : (otherUser?.avatar || room.avatar || DEFAULT_SILHOUETTE_AVATAR);

                return (
                  <div
                    key={room.id}
                    id={`chat-item-${room.id}`}
                    onClick={() => {
                      setSelectedPrivateOrGroupId(room.id);
                      setActiveChatId(room.id);
                    }}
                    className={`px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer flex items-center justify-between transition-colors ${
                      activeMinimizedMenuId === room.id ? 'relative z-30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={avatarSrc}
                          alt={displayName}
                          className={`w-12 h-12 object-cover border border-neutral-200 dark:border-neutral-700 ${
                            isGroup ? 'rounded-2xl' : 'rounded-full'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                        <div
                          className={`absolute -bottom-1 -right-1 rounded-full p-1 text-white ring-2 ring-white dark:ring-neutral-900 ${
                            isGroup ? 'bg-blue-600' : 'bg-emerald-500'
                          }`}
                        >
                          {isGroup ? <Users className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {displayName}
                          </span>
                          {room.type === 'private' && (
                            <UserBadges isVerified={otherUser?.isVerified} staffRole={otherUser?.staffRole} />
                          )}
                          {isGroup ? (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded font-bold shrink-0">
                              Grupo · {room.members.length}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded font-bold shrink-0">
                              E2E
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {lastMsg ? (
                            <>
                              {lastMsg.senderId === currentUser.id ? 'Tú: ' : ''}
                              {lastMsg.text}
                            </>
                          ) : (
                            room.description || 'Conversación iniciada'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[11px] text-neutral-400">
                        {lastMsg?.timestamp || ''}
                      </span>

                      {/* Three-dots options button for minimized chat */}
                      <div className="relative">
                        <button
                          id={`btn-minimized-menu-${room.id}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMinimizedMenuId(activeMinimizedMenuId === room.id ? null : room.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                          title="Opciones de la conversación"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMinimizedMenuId === room.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMinimizedMenuId(null);
                              }}
                            />
                            <div
                              className="absolute right-0 top-8 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {!isGroup ? (
                                /* 1:1 Direct Chat Options */
                                <>
                                  {/* Seguir / Dejar de seguir */}
                                  {room.targetUserId && followingIds.includes(room.targetUserId) ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (room.targetUserId) unfollowUser(room.targetUserId);
                                        setActiveMinimizedMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium"
                                    >
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>Dejar de seguir</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (room.targetUserId) followUser(room.targetUserId);
                                        setActiveMinimizedMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium"
                                    >
                                      <UserPlus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span>Seguir</span>
                                    </button>
                                  )}

                                  {/* Reportar usuario */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (room.targetUserId) {
                                        openReportModal({
                                          id: room.targetUserId,
                                          type: 'user',
                                          title: `Usuario: ${room.name}`,
                                          chatId: room.id
                                        });
                                      }
                                      setActiveMinimizedMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>Reportar usuario</span>
                                  </button>

                                  {/* Bloquear usuario */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (room.targetUserId) {
                                        blockUser(room.targetUserId, room.name);
                                      }
                                      setActiveMinimizedMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium"
                                  >
                                    <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>Bloquear usuario</span>
                                  </button>

                                  {/* Eliminar chat */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteChatRoom(room.id);
                                      setActiveMinimizedMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 font-medium border-t border-neutral-100 dark:border-neutral-800 pt-1 mt-0.5"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>Eliminar chat</span>
                                  </button>
                                </>
                              ) : (
                                /* Group Chat Options */
                                <>
                                  {/* Información del grupo */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGroupInfoTarget(room);
                                      setShowGroupInfoModal(true);
                                      setActiveMinimizedMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium"
                                  >
                                    <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span>Información del grupo</span>
                                  </button>

                                  {/* Reportar grupo */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openReportModal({
                                        id: room.id,
                                        type: 'post',
                                        title: `Grupo: ${room.name}`,
                                        chatId: room.id
                                      });
                                      setActiveMinimizedMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-amber-600 font-medium"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>Reportar grupo</span>
                                  </button>

                                  {/* Salir del grupo */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      leaveGroupChat(room.id);
                                      setActiveMinimizedMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 font-medium border-t border-neutral-100 dark:border-neutral-800 pt-1 mt-0.5"
                                  >
                                    <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>Salir del grupo</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* ACTIVE CONVERSATION SCREEN (General, City, or Selected Private/Group)     */
        /* ========================================================================= */
        activeChat && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
            {/* Conversation Header */}
            <div className="relative z-40 px-4 py-2.5 border-b border-white/10 bg-[#003087]/70 backdrop-blur-md flex items-center justify-between shrink-0 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Back button only when within a private or group chat */}
                {chatTypeTab === 'messages' && (
                  <button
                    id="btn-back-to-messages-list"
                    onClick={() => {
                      setSelectedPrivateOrGroupId(null);
                      setActiveChatId(null);
                    }}
                    className="p-1 -ml-1 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Volver a la lista de chats"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Hide avatar image for General Chat and City Chats */}
                {activeChat.type !== 'general' && activeChat.type !== 'city' && (() => {
                  const otherUser = activeChat.type === 'private' ? getOtherUserInPrivateChat(activeChat) : undefined;
                  const avatarSrc = activeChat.type === 'group'
                    ? (activeChat.avatar || DEFAULT_SILHOUETTE_AVATAR)
                    : (otherUser?.avatar || activeChat.avatar || DEFAULT_SILHOUETTE_AVATAR);
                  const headerTitle = activeChat.type === 'group'
                    ? activeChat.name
                    : (otherUser ? otherUser.name : (activeChat.name || 'Chat Privado'));

                  return (
                    <div className="relative shrink-0">
                      <img
                        src={avatarSrc}
                        alt={headerTitle}
                        className={`w-9 h-9 object-cover border border-neutral-200 dark:border-neutral-700 ${
                          activeChat.type === 'group' ? 'rounded-xl' : 'rounded-full'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                      {activeChat.type === 'private' && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 text-white">
                          <Lock className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[200px] sm:max-w-sm flex items-center gap-1.5">
                    <span className="truncate">
                      {activeChat.type === 'general'
                        ? 'Parceros en España.'
                        : activeChat.type === 'private'
                        ? (() => {
                            const otherUser = getOtherUserInPrivateChat(activeChat);
                            return otherUser ? otherUser.name : (activeChat.name || 'Chat Privado');
                          })()
                        : activeChat.name}
                    </span>
                    {activeChat.type === 'private' && (() => {
                      const otherUser = getOtherUserInPrivateChat(activeChat);
                      return <UserBadges isVerified={otherUser?.isVerified} staffRole={otherUser?.staffRole} />;
                    })()}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                    {activeChat.type === 'general' && (
                      <span className="text-amber-300 font-semibold truncate flex items-center gap-1">
                        <span>Comunidad Colombiana en España</span>
                        <FlagColombia size="xs" />
                        <FlagSpain size="xs" />
                      </span>
                    )}
                    {activeChat.type === 'city' && (
                      <span className="text-rose-200 font-semibold truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-300 shrink-0" />
                        <span>Chat de residentes en {activeChat.city}</span>
                        <FlagSpain size="xs" />
                      </span>
                    )}
                    {activeChat.type === 'private' && (
                      <span className="text-emerald-300 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Cifrado E2E · En línea
                      </span>
                    )}
                    {activeChat.type === 'group' && (
                      <span className="text-blue-200 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {activeChat.members.length} miembros
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat options & Encryption info */}
              <div className="flex items-center gap-1">
                <button
                  id="btn-e2e-info"
                  onClick={() => setShowE2EModal(true)}
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  title="Cifrado E2E de extremo a extremo"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>

                {/* Hide three-dots options for General Chat and City Chats */}
                {activeChat.type !== 'general' && activeChat.type !== 'city' && (
                  <div className="relative">
                    <button
                      id="btn-chat-more-options"
                      onClick={() => setShowChatOptions(!showChatOptions)}
                      className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      title="Opciones del chat"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {showChatOptions && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowChatOptions(false)} />
                        <div className="absolute right-0 top-10 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden text-xs">
                          {activeChat.type === 'group' ? (
                            /* Options for Group Chat in header */
                            <>
                              {/* Información del grupo */}
                              <button
                                onClick={() => {
                                  setGroupInfoTarget(activeChat);
                                  setShowGroupInfoModal(true);
                                  setShowChatOptions(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-semibold cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span>Información del grupo</span>
                              </button>

                              {/* Reportar grupo */}
                              <button
                                onClick={() => {
                                  openReportModal({
                                    id: activeChat.id,
                                    type: 'post',
                                    title: `Grupo: ${activeChat.name}`,
                                    chatId: activeChat.id
                                  });
                                  setShowChatOptions(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold cursor-pointer"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Reportar grupo</span>
                              </button>

                              {/* Salir del grupo */}
                              <button
                                onClick={() => {
                                  leaveGroupChat(activeChat.id);
                                  setShowChatOptions(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold border-t border-neutral-100 dark:border-neutral-800 pt-1.5 mt-0.5 cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>Salir del grupo</span>
                              </button>
                            </>
                          ) : (
                            /* Options for Private Chat in header */
                            <>
                              {activeChat.targetUserId && followingIds.includes(activeChat.targetUserId) ? (
                                <button
                                  onClick={() => {
                                    if (activeChat.targetUserId) unfollowUser(activeChat.targetUserId);
                                    setShowChatOptions(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>Dejar de seguir</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (activeChat.targetUserId) followUser(activeChat.targetUserId);
                                    setShowChatOptions(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>Seguir</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (activeChat.targetUserId) {
                                    openReportModal({
                                      id: activeChat.targetUserId,
                                      type: 'user',
                                      title: `Usuario: ${activeChat.name}`,
                                      chatId: activeChat.id
                                    });
                                  }
                                  setShowChatOptions(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Reportar usuario</span>
                              </button>

                              {activeChat.targetUserId && (
                                <button
                                  onClick={() => {
                                    blockUser(activeChat.targetUserId!, activeChat.name);
                                    setShowChatOptions(false);
                                  }}
                                  className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium cursor-pointer"
                                >
                                  <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>Bloquear usuario</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  deleteChatRoom(activeChat.id);
                                  setShowChatOptions(false);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium border-t border-neutral-100 dark:border-neutral-800 pt-1.5 mt-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>Eliminar chat</span>
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick City Switcher if on city tab */}
            {activeChat.type === 'city' && (
              <div className="px-4 py-1.5 bg-rose-500/10 border-b border-rose-500/20 text-[11px] flex items-center justify-between text-rose-800 dark:text-rose-300">
                <span className="font-semibold truncate">
                  Estás chateando en el canal de {currentUser.city}
                </span>
                <span className="text-[10px] opacity-75 shrink-0 ml-2">
                  (Cambia tu ciudad en Perfil)
                </span>
              </div>
            )}

            {/* Messages Stream with User Background Images */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3 relative"
              style={(() => {
                const isGeneral = chatTypeTab === 'general' || activeChat.type === 'general' || activeChat.id === 'chat-general-es' || activeChat.id === 'general-spain';
                const isCity = chatTypeTab === 'city' || activeChat.type === 'city' || activeChat.id.startsWith('chat-city-') || activeChat.id.startsWith('city-');
                const isSupport = activeChat.name?.toLowerCase().includes('soporte') || activeChat.id.includes('soporte') || activeChat.targetUser?.staffRole === 'Soporte';

                let bgUrl = '/chat_privado.png';
                let overlayColor = 'rgba(10, 15, 28, 0.68)';

                if (isGeneral) {
                  bgUrl = '/chat_general.png';
                  overlayColor = 'rgba(0, 10, 30, 0.70)';
                } else if (isCity) {
                  bgUrl = '/chat_por_ciudad.png';
                  overlayColor = 'rgba(20, 12, 6, 0.68)';
                } else if (isSupport) {
                  bgUrl = '/chat_soporte.png';
                  overlayColor = 'rgba(10, 18, 28, 0.70)';
                }

                return {
                  backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url('${bgUrl}')`,
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center'
                };
              })()}
            >
              {activeChat.messages
                .map(msg => {
                  const isMe = msg.senderId === currentUser.id;
                  const isSystem = msg.senderId === 'system';
                  const isDeletedForMe = deletedMessageIdsForMe.includes(msg.id);
                  const isDeletedForEveryone = msg.deletedForEveryone;
                  const isDeletedAny = isDeletedForMe || isDeletedForEveryone;

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="max-w-xs bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] px-3 py-1.5 rounded-xl text-center leading-tight flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{msg.text}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 items-end group ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                                      {!isMe && (() => {
                        const senderUser = otherUsers.find(u => u.id === msg.senderId || u.username === msg.senderName) || null;
                        const displayAvatar = senderUser?.avatar || msg.senderAvatar || DEFAULT_SILHOUETTE_AVATAR;

                        return (
                          <img
                            src={displayAvatar}
                            alt={msg.senderName}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveUserMenu({
                                userId: msg.senderId,
                                userName: msg.senderName,
                                userAvatar: displayAvatar,
                                userCity: senderUser?.city || msg.senderCity
                              });
                            }}
                            className="w-7 h-7 rounded-full object-cover mb-1 border border-neutral-200 dark:border-neutral-700 shrink-0 cursor-pointer hover:scale-110 transition-transform"
                            referrerPolicy="no-referrer"
                            title={`Ver opciones de ${msg.senderName}`}
                          />
                        );
                      })()}

                      <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <div className="flex items-center gap-1.5 px-1 mb-0.5 text-[11px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveUserMenu({
                                  userId: msg.senderId,
                                  userName: msg.senderName,
                                  userAvatar: msg.senderAvatar,
                                  userCity: msg.senderCity
                                });
                              }}
                              className="text-left font-black drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] hover:underline cursor-pointer flex items-center gap-1 flex-wrap"
                            >
                              <span
                                className={
                                  activeChat.type !== 'private'
                                    ? getUserColor(msg.senderId, msg.senderName)
                                    : 'text-white dark:text-white'
                                }
                              >
                                {msg.senderName}
                              </span>
                              {(() => {
                                const u = getUserInfo(msg.senderId);
                                return <UserBadges isVerified={u?.isVerified} staffRole={u?.staffRole} />;
                              })()}
                            </button>
                          </div>
                        )}

                        {/* Message Bubble with Long-Press and Context Menu */}
                        <div className="relative">
                          <div
                            onTouchStart={(e) => !isDeletedAny && handleTouchStartMessage(msg, e)}
                            onTouchEnd={handleTouchEndMessage}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (!isDeletedAny && activeChat) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const isMeMsg = msg.senderId === currentUser.id;
                                setActiveMessageMenu({ message: msg, chatId: activeChat.id, rect, isMe: isMeMsg });
                                setShowExtendedEmojis(false);
                              }
                            }}
                            className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm select-none cursor-pointer transition-all ${
                              isMe
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-medium rounded-br-none hover:brightness-105'
                                : isDeletedAny
                                ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 italic rounded-bl-none border border-neutral-200 dark:border-neutral-700/50'
                                : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700/70 rounded-bl-none hover:brightness-105'
                            }`}
                            title={isDeletedAny ? undefined : "Mantén pulsado o haz clic derecho para opciones"}
                          >
                            {isDeletedForEveryone ? (
                              <div className={`flex items-center gap-1.5 py-0.5 font-medium ${isMe ? 'text-neutral-950/85 italic' : 'text-neutral-500 dark:text-neutral-400 italic'}`}>
                                <Ban className={`w-3.5 h-3.5 shrink-0 ${isMe ? 'text-neutral-950/70' : 'text-neutral-400'}`} />
                                <span>Este mensaje se elimino para todos.</span>
                              </div>
                            ) : isDeletedForMe ? (
                              <div className={`flex items-center gap-1.5 py-0.5 font-medium ${isMe ? 'text-neutral-950/85 italic' : 'text-neutral-500 dark:text-neutral-400 italic'}`}>
                                <Ban className={`w-3.5 h-3.5 shrink-0 ${isMe ? 'text-neutral-950/70' : 'text-neutral-400'}`} />
                                <span>Este mensaje fue eliminado solo para ti.</span>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            )}

                            <div
                              className={`flex items-center justify-end gap-1 mt-0.5 text-[9px] ${
                                isMe
                                  ? 'text-neutral-950/70 font-semibold'
                                  : 'text-neutral-400'
                              }`}
                            >
                              <span>{msg.timestamp}</span>
                              <Lock className="w-2.5 h-2.5 opacity-60" />
                            </div>
                          </div>
                        </div>

                        {/* Reactions List */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {msg.reactions.map((r, idx) => {
                              const hasMyReaction = r.users.includes(currentUser.id);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => reactToMessage(activeChat.id, msg.id, r.emoji)}
                                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border shadow-xs transition-transform active:scale-95 ${
                                    hasMyReaction
                                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 font-bold'
                                      : 'bg-neutral-900/80 text-neutral-200 border-neutral-700/80'
                                  }`}
                                >
                                  {r.emoji === '🇨🇴' ? (
                                    <FlagColombia size="xs" />
                                  ) : r.emoji === '🇪🇸' ? (
                                    <FlagSpain size="xs" />
                                  ) : (
                                    <span>{r.emoji}</span>
                                  )}
                                  <span>{r.count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveMessageMenu({ message: msg, chatId: activeChat.id })}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white transition-opacity shrink-0"
                        title="Opciones de mensaje"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input - Always pinned at bottom flush above the bottom navigation */}
            <div className="shrink-0 bg-[#001428]/95 backdrop-blur-xl border-t border-white/15 px-3 py-2 sm:py-2.5 shadow-2xl relative z-30">
              {/* Quick Colombian & Reaction Emoji Tray */}
              {showQuickEmojis && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowQuickEmojis(false)} />
                  <div className="absolute bottom-full left-3 mb-2 p-2 bg-[#001c38]/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-1.5 z-40 overflow-x-auto max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 duration-150">
                    {['🇨🇴', '🇪🇸', '☕', '💛', '💙', '❤️', '🔥', '👏', '😂', '😍', '🥟', '🙌', '✨', '👍', '🎉', '💃', '🍻', '🥑', '🥳', '😎', '🙏'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputMessage(prev => prev + emoji);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/15 rounded-xl transition-transform active:scale-90 shrink-0"
                        title={emoji === '🇨🇴' ? 'Colombia' : emoji === '🇪🇸' ? 'España' : emoji}
                      >
                        {emoji === '🇨🇴' ? <FlagColombia size="sm" /> : emoji === '🇪🇸' ? <FlagSpain size="sm" /> : emoji}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowQuickEmojis(false)}
                      className="p-1 text-white/50 hover:text-white rounded-lg ml-1"
                      title="Cerrar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}

              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 max-w-2xl mx-auto"
              >
                <button
                  type="button"
                  onClick={() => setShowQuickEmojis(prev => !prev)}
                  className={`p-2 rounded-full transition-colors shrink-0 ${
                    showQuickEmojis
                      ? 'text-amber-400 bg-amber-400/15'
                      : 'text-white/60 hover:text-amber-400 hover:bg-white/10'
                  }`}
                  title="Emojis colombianos rápidos"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder={`Escribe un mensaje en ${activeChat.name}...`}
                    className="w-full bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.15] text-white placeholder-white/45 px-4 py-2 text-xs sm:text-sm rounded-full border border-white/15 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40 transition-all shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 flex items-center justify-center disabled:opacity-30 disabled:scale-95 transition-all active:scale-90 shadow-md shadow-amber-500/25 shrink-0 font-bold"
                  title="Enviar mensaje"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. Modal: Crear Nuevo Grupo (enlistados y creados desde sesión privados) */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Crear Nuevo Grupo de Parceros
                </h3>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nombre del grupo *
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="ej. Parceros Fútbol Retiro Madrid ⚽"
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  placeholder="¿De qué trata este grupo para la comunidad?"
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Invitar parceros (podrán aceptar o rechazar la solicitud)
                </label>

                {/* Search Bar for Inviting Users */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={createGroupUserSearch}
                    onChange={e => setCreateGroupUserSearch(e.target.value)}
                    placeholder="Buscar parceros por nombre o username..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-xl p-2">
                  {otherUsers
                    .filter(u =>
                      u.name.toLowerCase().includes(createGroupUserSearch.toLowerCase()) ||
                      u.username.toLowerCase().includes(createGroupUserSearch.toLowerCase())
                    )
                    .map(user => {
                      const isSelected = selectedInviteUserIds.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleInviteUser(user.id)}
                          className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={user.avatar || undefined}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-xs font-semibold">{user.name}</span>
                            <UserBadges isVerified={user.isVerified} staffRole={user.staffRole} />
                            <span className="text-[10px] text-neutral-400">@{user.username}</span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-neutral-950'
                                : 'border-neutral-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-black text-xs rounded-xl shadow-md disabled:opacity-40"
                >
                  Crear Grupo e Invitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Nuevo Chat Privado 1:1 */}
      {showNewPrivateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Iniciar Chat Privado 1:1
                </h3>
              </div>
              <button onClick={() => setShowNewPrivateModal(false)} className="text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              Selecciona un parcero para iniciar un chat privado con cifrado de extremo a extremo.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {otherUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => {
                    const newChatId = startPrivateChat(user.id, user.name, user.avatar);
                    setSelectedPrivateOrGroupId(newChatId);
                    setActiveChatId(newChatId);
                    setShowNewPrivateModal(false);
                  }}
                  className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar || undefined}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        @{user.username} · {user.city}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg">
                    Chatear
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: E2E Encryption Details */}
      {showE2EModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Cifrado de Extremo a Extremo
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
              Tus mensajes están protegidos criptográficamente con claves simétricas SHA-256 únicas por conversación. Ni los administradores ni terceros pueden leerlos.
            </p>
            <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-2xl font-mono text-[11px] text-neutral-700 dark:text-neutral-300 mt-4 break-all border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                Huella de Seguridad SHA-256:
              </span>
              b9a4-7f12-04e8-88cd-1123-fe90-41ab
            </div>
            <button
              onClick={() => setShowE2EModal(false)}
              className="w-full mt-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-xl"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* 4. Modal: Invitar Parceros al Grupo existente */}
      {showInviteModal && activeChat && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Invitar parceros a {activeChat.name}
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              Los usuarios invitados recibirán una solicitud de ingreso que podrán aceptar o rechazar.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {otherUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={user.avatar || undefined}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">{user.name}</div>
                      <div className="text-[10px] text-neutral-400">
                        @{user.username} · {user.city}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                    }}
                    className="px-3 py-1 bg-amber-500 text-neutral-950 text-xs font-bold rounded-lg"
                  >
                    Invitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4.5. Floating WhatsApp Popover Options (Anchored near message) */}
      {activeMessageMenu && !activeMessageMenu.message.deletedForEveryone && !deletedMessageIdsForMe.includes(activeMessageMenu.message.id) && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] animate-in fade-in duration-150"
            onClick={() => {
              setActiveMessageMenu(null);
              setShowExtendedEmojis(false);
            }}
          />

          {/* Floating Popover Container */}
          <div
            style={(() => {
              const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
              const menuWidth = Math.min(290, windowWidth - 24);

              if (!activeMessageMenu.rect) {
                return {
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${menuWidth}px`,
                };
              }

              const { rect, isMe } = activeMessageMenu;
              const openBelow = rect.top < 220; // If message is near top of screen, open below

              let leftPos: number;
              if (isMe) {
                leftPos = Math.min(windowWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth));
              } else {
                leftPos = Math.min(windowWidth - menuWidth - 12, Math.max(12, rect.left));
              }

              if (openBelow) {
                return {
                  position: 'fixed',
                  top: `${Math.max(12, rect.bottom + 8)}px`,
                  left: `${leftPos}px`,
                  width: `${menuWidth}px`,
                  maxHeight: `calc(100vh - ${rect.bottom + 20}px)`,
                };
              } else {
                return {
                  position: 'fixed',
                  top: `${rect.top - 8}px`,
                  transform: 'translateY(-100%)',
                  left: `${leftPos}px`,
                  width: `${menuWidth}px`,
                  maxHeight: `${rect.top - 20}px`,
                };
              }
            })()}
            className="z-[101] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 rounded-2xl shadow-2xl p-2 text-xs animate-in fade-in zoom-in-95 duration-150 overflow-x-hidden overflow-y-auto custom-scrollbar"
          >
            {/* Quick Emoji Bar + Plus button */}
            <div className="p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl mb-1.5 flex items-center justify-between gap-0.5 border border-neutral-200/50 dark:border-neutral-700/50 overflow-x-hidden">
              {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'].map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    reactToMessage(activeMessageMenu.chatId, activeMessageMenu.message.id, emoji);
                    setActiveMessageMenu(null);
                    setShowExtendedEmojis(false);
                  }}
                  className="text-base hover:scale-125 active:scale-90 transition-transform p-1 rounded-full hover:bg-white dark:hover:bg-neutral-700 cursor-pointer shrink-0"
                  title={`Reaccionar con ${emoji}`}
                >
                  {emoji}
                </button>
              ))}

              {/* Plus Button for WhatsApp Emoji Selector */}
              <button
                type="button"
                onClick={() => setShowExtendedEmojis(!showExtendedEmojis)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 font-bold ${
                  showExtendedEmojis
                    ? 'bg-amber-500 text-neutral-950'
                    : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-amber-500 hover:text-neutral-950 text-neutral-700 dark:text-neutral-200'
                }`}
                title="Elegir cualquier emoji"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Extended Emoji Selector Grid */}
            {showExtendedEmojis && (
              <div className="p-2 mb-1.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 grid grid-cols-6 gap-1 max-h-36 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
                {[
                  '👍', '👎', '❤️', '🔥', '😂', '😮', '😢', '🙏',
                  '😍', '🎉', '👏', '🥳', '😎', '💯', '🇨🇴', '🇪🇸',
                  '🤝', '🙌', '✨', '🤩', '💩', '🤡', '💪', '🙈',
                  '🚀', '☕', '🍺', '💃', '🕺', '💖', '⭐', '🎈'
                ].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      reactToMessage(activeMessageMenu.chatId, activeMessageMenu.message.id, emoji);
                      setActiveMessageMenu(null);
                      setShowExtendedEmojis(false);
                    }}
                    className="text-lg hover:scale-125 active:scale-90 transition-transform p-1 rounded-lg hover:bg-white dark:hover:bg-neutral-700 flex items-center justify-center cursor-pointer"
                    title={emoji === '🇨🇴' ? 'Colombia' : emoji === '🇪🇸' ? 'España' : emoji}
                  >
                    {emoji === '🇨🇴' ? <FlagColombia size="xs" /> : emoji === '🇪🇸' ? <FlagSpain size="xs" /> : emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  openReportModal({
                    id: activeMessageMenu.message.id,
                    type: 'message',
                    title: `Mensaje de ${activeMessageMenu.message.senderName}`,
                    chatId: activeMessageMenu.chatId
                  });
                  setActiveMessageMenu(null);
                  setShowExtendedEmojis(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Reportar mensaje</span>
              </button>

              <button
                onClick={() => {
                  deleteMessageForMe(activeMessageMenu.message.id);
                  setActiveMessageMenu(null);
                  setShowExtendedEmojis(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Eliminar para mí</span>
              </button>

              {activeMessageMenu.message.senderId === currentUser.id && (
                <button
                  onClick={() => {
                    deleteMessageForEveryone(activeMessageMenu.chatId, activeMessageMenu.message.id);
                    setActiveMessageMenu(null);
                    setShowExtendedEmojis(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium border-t border-neutral-100 dark:border-neutral-800 pt-1 mt-0.5 transition-colors cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Eliminar para todos</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Floating User Menu Modal */}
      {activeUserMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setActiveUserMenu(null)} />
          <div className="relative w-full max-w-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl z-10 overflow-hidden">
            {/* Clickable User Header to Go to Profile */}
            <button
              type="button"
              onClick={() => handleOpenUserProfileFromMenu(activeUserMenu.userId, activeUserMenu.userName, activeUserMenu.userAvatar, activeUserMenu.userCity)}
              className="w-full p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3 text-left hover:bg-amber-500/15 transition-colors group cursor-pointer"
            >
              {(() => {
                const foundUser = activeUserMenu.userId === currentUser.id
                  ? currentUser
                  : otherUsers.find(u => u.id === activeUserMenu.userId || u.username === activeUserMenu.userName);
                const resolvedAvatar = foundUser?.avatar || activeUserMenu.userAvatar || DEFAULT_SILHOUETTE_AVATAR;

                return (
                  <img
                    src={resolvedAvatar}
                    alt={activeUserMenu.userName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/40 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                );
              })()}
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-neutral-900 dark:text-white text-sm truncate group-hover:text-amber-500 transition-colors flex items-center gap-1.5">
                  <span className="truncate">{activeUserMenu.userName}</span>
                  {(() => {
                    const u = getUserInfo(activeUserMenu.userId);
                    return <UserBadges isVerified={u?.isVerified} staffRole={u?.staffRole} />;
                  })()}
                </h4>
                {activeUserMenu.userCity ? (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{activeUserMenu.userCity}, España</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-500 font-semibold mt-0.5">Ver perfil completo →</p>
                )}
              </div>
              <div className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-lg shrink-0 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                Perfil
              </div>
            </button>

            {/* User Action Options */}
            <div className="p-2 space-y-1 text-xs">
              {/* Seguir / Dejar de seguir */}
              {followingIds.includes(activeUserMenu.userId) ? (
                <button
                  onClick={() => {
                    unfollowUser(activeUserMenu.userId);
                    setActiveUserMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 font-semibold transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dejar de seguir</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    followUser(activeUserMenu.userId);
                    setActiveUserMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 text-neutral-800 dark:text-white font-semibold transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Seguir</span>
                </button>
              )}

              {/* Mensaje directo */}
              <button
                onClick={() => {
                  const privateId = startPrivateChat(activeUserMenu.userId, activeUserMenu.userName, activeUserMenu.userAvatar);
                  setChatTypeTab('messages');
                  setSelectedPrivateOrGroupId(privateId);
                  setActiveUserMenu(null);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30 flex items-center gap-2.5 text-sky-600 dark:text-sky-400 font-semibold transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Mensaje directo</span>
              </button>

              {/* Reportar */}
              <button
                onClick={() => {
                  openReportModal({
                    id: activeUserMenu.userId,
                    type: 'user',
                    title: `Usuario: ${activeUserMenu.userName}`
                  });
                  setActiveUserMenu(null);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-semibold transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Reportar</span>
              </button>

              {/* Bloquear */}
              <button
                onClick={() => {
                  blockUser(activeUserMenu.userId, activeUserMenu.userName);
                  setActiveUserMenu(null);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-semibold border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-2 transition-colors cursor-pointer"
              >
                <UserX className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Bloquear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Full-Screen Group Info View */}
      {showGroupInfoModal && groupInfoTarget && (
        <div className="fixed inset-0 z-[120] bg-neutral-900/95 dark:bg-black/95 backdrop-blur-md text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Top Navigation Bar */}
          <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowGroupInfoModal(false);
                setGroupInfoTarget(null);
              }}
              className="p-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center gap-2 font-bold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al chat</span>
            </button>

            <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">
              Información del Grupo
            </h2>

            <button
              type="button"
              onClick={() => {
                setShowGroupInfoModal(false);
                setGroupInfoTarget(null);
              }}
              className="p-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Group Info Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6 custom-scrollbar">
            {/* Header Card */}
            <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-3xl p-6 text-center shadow-xl space-y-3">
              <img
                src={groupInfoTarget.avatar || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80'}
                alt={groupInfoTarget.name}
                className="w-24 h-24 rounded-3xl object-cover mx-auto border-4 border-amber-500/40 shadow-lg"
                referrerPolicy="no-referrer"
              />

              <div>
                <h1 className="text-xl font-black text-white">{groupInfoTarget.name}</h1>
                <p className="text-xs text-amber-400 font-bold mt-1">
                  {groupInfoTarget.members.length} parceros en la comunidad
                </p>
              </div>

              {/* Descripcion */}
              <div className="bg-neutral-900/80 p-4 rounded-2xl border border-neutral-700/60 text-left space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500/80 block">
                  Descripción
                </span>
                <p className="text-xs text-neutral-200 leading-relaxed">
                  {groupInfoTarget.description || 'Sin descripción configurada.'}
                </p>
              </div>
            </div>

            {/* Members Section */}
            <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Lista de Miembros ({groupInfoTarget.members.length})</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Administra los integrantes y permisos del grupo
                  </p>
                </div>

                {/* + Button to Add Users */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUsersToAdd([]);
                    setAddMembersSearchQuery('');
                    setShowAddMembersModal(true);
                  }}
                  className="w-9 h-9 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
                  title="Agregar más parceros al grupo"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Members List */}
              <div className="space-y-2.5">
                {(() => {
                  const admins = groupInfoTarget.admins || (groupInfoTarget.createdBy ? [groupInfoTarget.createdBy] : [currentUser.id]);
                  const isCurrentAppAdmin = admins.includes(currentUser.id) || groupInfoTarget.createdBy === currentUser.id;

                  const allMembersList = groupInfoTarget.members.map(memberId => {
                    if (memberId === currentUser.id) return currentUser;
                    return (
                      otherUsers.find(u => u.id === memberId) || {
                        id: memberId,
                        name: memberId === 'user-me' ? currentUser.name : memberId.replace(/^user-/, ''),
                        username: memberId.replace(/^user-/, ''),
                        avatar: DEFAULT_SILHOUETTE_AVATAR,
                        city: 'Madrid',
                        isVerified: false,
                        staffRole: undefined
                      }
                    );
                  });

                  return allMembersList.map(m => {
                    const isCreator = m.id === groupInfoTarget.createdBy;
                    const isAdmin = admins.includes(m.id) || isCreator;

                    return (
                      <div
                        key={m.id}
                        className="bg-neutral-900/90 p-3 rounded-2xl border border-neutral-700/60 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={m.avatar || undefined}
                            alt={m.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-neutral-700"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">
                                {m.name} {m.id === currentUser.id ? '(Tú)' : ''}
                              </span>
                              <UserBadges isVerified={m.isVerified} staffRole={m.staffRole} />
                              {isCreator && (
                                <span className="text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                                  👑 Creador
                                </span>
                              )}
                              {isAdmin && !isCreator && (
                                <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-md">
                                  ⭐ Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 truncate">
                              @{m.username} · {m.city || 'España'}
                            </p>
                          </div>
                        </div>

                        {/* Admin controls */}
                        {isCurrentAppAdmin && m.id !== currentUser.id && (
                          <div className="flex items-center gap-2 shrink-0">
                            {isCreator ? (
                              <span
                                className="text-[10px] text-neutral-500 italic px-2 py-1"
                                title="No se puede quitar el rango de administrador al creador"
                              >
                                Creador
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleGroupAdmin(groupInfoTarget.id, m.id);
                                  setGroupInfoTarget(prev => {
                                    if (!prev) return null;
                                    const currAdmins = prev.admins || [];
                                    const isNowAdmin = currAdmins.includes(m.id);
                                    return {
                                      ...prev,
                                      admins: isNowAdmin
                                        ? currAdmins.filter(a => a !== m.id)
                                        : [...currAdmins, m.id]
                                    };
                                  });
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                                  isAdmin
                                    ? 'bg-neutral-800 text-amber-400 hover:bg-neutral-700 border border-amber-500/30'
                                    : 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 border border-blue-500/40'
                                }`}
                              >
                                {isAdmin ? 'Quitar Admin' : 'Poner Admin'}
                              </button>
                            )}

                            {!isCreator && (
                              <button
                                type="button"
                                onClick={() => {
                                  removeGroupMember(groupInfoTarget.id, m.id);
                                  setGroupInfoTarget(prev => {
                                    if (!prev) return null;
                                    return {
                                      ...prev,
                                      members: prev.members.filter(id => id !== m.id)
                                    };
                                  });
                                }}
                                className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition-colors cursor-pointer"
                                title="Eliminar del grupo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Bottom Actions: Eliminar chat / Salir del grupo / Reportar */}
            <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-3xl p-5 shadow-xl space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  openReportModal({
                    id: groupInfoTarget.id,
                    type: 'post',
                    title: `Grupo: ${groupInfoTarget.name}`,
                    chatId: groupInfoTarget.id
                  });
                }}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-950 text-amber-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 border border-neutral-700/80 transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Reportar grupo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  leaveGroupChat(groupInfoTarget.id);
                  setShowGroupInfoModal(false);
                  setGroupInfoTarget(null);
                }}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-950 text-rose-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 border border-neutral-700/80 transition-colors cursor-pointer"
              >
                <UserX className="w-4 h-4 text-rose-500" />
                <span>Salir del grupo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteChatRoom(groupInfoTarget.id);
                  setShowGroupInfoModal(false);
                  setGroupInfoTarget(null);
                }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar chat grupal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal for Adding Members to Existing Group */}
      {showAddMembersModal && groupInfoTarget && (
        <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span>Agregar parceros a {groupInfoTarget.name}</span>
              </h3>
              <button onClick={() => setShowAddMembersModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search input for adding users */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={addMembersSearchQuery}
                onChange={e => setAddMembersSearchQuery(e.target.value)}
                placeholder="Buscar usuarios por nombre o username..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-4 custom-scrollbar">
              {otherUsers
                .filter(u => !groupInfoTarget.members.includes(u.id))
                .filter(u =>
                  u.name.toLowerCase().includes(addMembersSearchQuery.toLowerCase()) ||
                  u.username.toLowerCase().includes(addMembersSearchQuery.toLowerCase())
                )
                .map(user => {
                  const isSelected = selectedUsersToAdd.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedUsersToAdd(prev =>
                          prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                        );
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/50 text-amber-900 dark:text-amber-200'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar || undefined}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            <UserBadges isVerified={user.isVerified} staffRole={user.staffRole} />
                          </div>
                          <div className="text-[10px] text-neutral-400">@{user.username} · {user.city}</div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 border-amber-500 text-neutral-950' : 'border-neutral-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMembersModal(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={selectedUsersToAdd.length === 0}
                onClick={() => {
                  addMembersToGroup(groupInfoTarget.id, selectedUsersToAdd);
                  setGroupInfoTarget(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      members: [...prev.members, ...selectedUsersToAdd]
                    };
                  });
                  setSelectedUsersToAdd([]);
                  setShowAddMembersModal(false);
                }}
                className="px-5 py-2 bg-amber-500 text-neutral-950 text-xs font-bold rounded-xl disabled:opacity-40 shadow-sm cursor-pointer"
              >
                Agregar Parceros ({selectedUsersToAdd.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

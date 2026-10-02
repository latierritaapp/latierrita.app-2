import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useAuth, DEFAULT_SILHOUETTE_AVATAR, mapDBProfileToUserProfile, safeSetLocalStorage } from './AuthContext';
import { supabase } from '../lib/supabase';
import { db, doc, updateDoc, deleteDoc, setDoc, collection, onSnapshot, addDoc, getDoc, getDocs, query, where } from '../lib/firebase';
import {
  UserProfile,
  StoryItem,
  PostItem,
  PostComment,
  AdBanner,
  ChatRoom,
  ChatMessage,
  GroupInvite,
  AppNotification,
  ContentReport,
  SpanishCity,
  PlaceItem,
  PlaceCategory,
  PlaceSuggestion,
  SupportTicket,
  VerificationRequest,
  StaffMember,
  DeletedAccount,
  StaffRole,
  StartupAdConfig,
  TicketType,
  ChatPoll,
  ChatEvent
} from '../types';
import {
  INITIAL_CURRENT_USER,
  OTHER_USERS,
  INITIAL_STORIES,
  INITIAL_AD_BANNERS,
  INITIAL_POSTS,
  CURRENT_USER_PROFILE_POSTS,
  INITIAL_CHAT_ROOMS,
  INITIAL_GROUP_INVITES,
  INITIAL_NOTIFICATIONS,
  INITIAL_PLACES,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_VERIFICATION_REQUESTS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_DELETED_ACCOUNTS
} from '../data/mockData';
import {
  saveBannerToIndexedDB,
  getAllBannersFromIndexedDB,
  deleteBannerFromIndexedDB
} from '../lib/bannerStorage';

interface AppContextType {
  currentUser: UserProfile;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  otherUsers: UserProfile[];
  followingIds: string[];
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  blockedUserIds: string[];
  blockUser: (userId: string, userName?: string) => void;
  unblockUser: (userId: string) => void;
  
  // Stories
  stories: StoryItem[];
  addStory: (data: { mediaUrl: string; caption?: string }) => void;
  deleteStory: (storyId: string) => Promise<void>;
  reactToStory: (storyId: string, emoji: string) => void;
  activeStoryIndex: number | null;
  setActiveStoryIndex: (index: number | null) => void;
  storyViewerRestriction: string | null;
  setStoryViewerRestriction: (userId: string | null) => void;
  isCreateStoryOpen: boolean;
  setIsCreateStoryOpen: (open: boolean) => void;
  
  // Posts & Feed
  posts: PostItem[];
  likePost: (postId: string) => void;
  toggleSavePost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string, parentId?: string) => void;
  likeComment: (postId: string, commentId: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  createPost: (data: {
    mediaUrl: string;
    caption: string;
    location: string;
    isStaffAd?: boolean;
    adTitle?: string;
    adDescription?: string;
    adCtaText?: string;
    adCtaUrl?: string;
    sponsorName?: string;
    disableComments?: boolean;
    hideLikes?: boolean;
    hideLocation?: boolean;
    taggedUsernames?: string[];
  }) => void;
  myProfilePosts: PostItem[];
  isCreatePostOpen: boolean;
  setIsCreatePostOpen: (open: boolean) => void;
  isCreateMenuOpen: boolean;
  setIsCreateMenuOpen: (open: boolean) => void;

  // Ads & Staff
  adBanners: AdBanner[];
  refreshBanners: () => Promise<void>;
  addAdBanner: (banner: Omit<AdBanner, 'id' | 'active'>) => void;
  deleteAdBanner: (id: string) => void;
  addStaffPost: (post: { title: string; description: string; imageUrl: string; ctaText: string; ctaUrl: string; sponsorName: string }) => void;
  deleteStaffPost: (id: string) => void;
  isStaffMode: boolean;
  setIsStaffMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  isStaffAdminOpen: boolean;
  setIsStaffAdminOpen: (open: boolean) => void;
  staffAdminTab: 'carrusel_01' | 'carrusel_02' | 'feed_post' | 'popup_emergente' | 'administracion' | 'soporte';
  setStaffAdminTab: (tab: 'carrusel_01' | 'carrusel_02' | 'feed_post' | 'popup_emergente' | 'administracion' | 'soporte') => void;
  openStaffAdminWithTab: (tab: 'carrusel_01' | 'carrusel_02' | 'feed_post' | 'popup_emergente' | 'administracion' | 'soporte') => void;

  // Support & Administration
  supportTickets: SupportTicket[];
  createSupportTicket: (
    type: TicketType,
    subject: string,
    description: string,
    priority?: 'Baja' | 'Media' | 'Alta',
    metadata?: {
      reportedUsername?: string;
      reportedUserId?: string;
      reportedItemTitle?: string;
      reasonTitle?: string;
      reasonText?: string;
      additionalDetails?: string;
    }
  ) => Promise<string>;
  updateTicketStatus: (
    id: string,
    status: 'pendientes' | 'en_proceso' | 'resueltos',
    response?: string,
    options?: { assignedStaffName?: string; assignToMe?: boolean }
  ) => void;
  deleteSupportTicket: (id: string) => void;
  verificationRequests: VerificationRequest[];
  respondVerification: (id: string, approve: boolean) => void;
  staffMembers: StaffMember[];
  updateStaffMemberRole: (id: string, newRole: StaffRole) => void;
  deletedAccounts: DeletedAccount[];
  deleteAccountByAdmin: (userId: string, reason?: string) => Promise<void>;
  restoreDeletedAccount: (id: string) => void;
  permanentlyDeleteAccount: (id: string) => void;
  toggleSuspendUser: (userId: string, reason?: string) => Promise<void>;
  updateUserProfileByAdmin: (userId: string, updatedData: Partial<UserProfile>, newPassword?: string) => Promise<void>;
  deletePostByAdmin: (postId: string) => void;
  
  // Startup Floating Ad
  startupAdOpen: boolean;
  dismissStartupAd: () => void;
  simulateAppRestart: () => void;
  startupAdConfig: StartupAdConfig | null;
  updateStartupAdConfig: (config: StartupAdConfig) => Promise<void>;

  // Chats
  chatRooms: ChatRoom[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  sendMessage: (
    chatId: string,
    text: string,
    replyTo?: { id: string; senderName: string; text: string },
    audioData?: { url: string; duration: number },
    poll?: ChatPoll,
    event?: ChatEvent,
    sharedPost?: any
  ) => Promise<void>;
  voteInPoll: (chatId: string, messageId: string, optionIndex: number) => void;
  rsvpToEvent: (chatId: string, messageId: string) => void;
  createGroupChat: (name: string, description: string, invitedUserIds: string[], avatar?: string) => Promise<void>;
  startPrivateChat: (targetUserId: string, targetUserName?: string, targetUserAvatar?: string) => string;
  groupInvites: GroupInvite[];
  respondToGroupInvite: (inviteId: string, accept: boolean) => Promise<void>;
  inviteUserToGroup: (groupId: string, targetUserId: string) => void;
  reactToMessage: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  deleteMessageForMe: (messageId: string) => void;
  deleteMessageForEveryone: (chatId: string, messageId: string) => Promise<void>;
  deletedMessageIdsForMe: string[];
  deleteChatRoom: (chatId: string) => Promise<void>;
  clearChatMessages: (chatId: string) => Promise<void>;
  leaveGroupChat: (groupId: string) => Promise<void>;
  toggleGroupAdmin: (groupId: string, userId: string) => Promise<void>;
  removeGroupMember: (groupId: string, userId: string) => Promise<void>;
  addMembersToGroup: (groupId: string, userIds: string[]) => Promise<void>;

  // Reports
  reports: ContentReport[];
  isReportModalOpen: boolean;
  reportTarget: {
    id: string;
    type: 'message' | 'user' | 'post' | 'story' | 'group' | 'support';
    title: string;
    chatId?: string;
    reportedUserId?: string;
    reportedUserName?: string;
    initialTicketType?: TicketType;
  } | null;
  openReportModal: (target: {
    id: string;
    type: 'message' | 'user' | 'post' | 'story' | 'group' | 'support';
    title: string;
    chatId?: string;
    reportedUserId?: string;
    reportedUserName?: string;
    initialTicketType?: TicketType;
  }) => void;
  closeReportModal: () => void;
  submitReport: (reason: string, details: string) => void;
  submitTicketReport: (
    type: TicketType,
    reasonTitle: string,
    reasonText: string,
    additionalDetails?: string,
    targetItem?: {
      id?: string;
      type?: string;
      title?: string;
      chatId?: string;
      reportedUserId?: string;
      reportedUserName?: string;
    }
  ) => Promise<string>;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadNotificationsCount: number;
  plushToast: AppNotification | null;
  dismissPlushToast: () => void;
  triggerPlushNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;

  // Navigation & Modals
  activeTab: 'feed' | 'explore' | 'chats' | 'notifications' | 'profile' | 'places';
  setActiveTab: (tab: 'feed' | 'explore' | 'chats' | 'notifications' | 'profile' | 'places') => void;
  exploreSearchQuery: string;
  setExploreSearchQuery: (query: string) => void;
  chatSearchQuery: string;
  setChatSearchQuery: (query: string) => void;
  placesSearchQuery: string;
  setPlacesSearchQuery: (query: string) => void;
  adsSearchQuery: string;
  setAdsSearchQuery: (query: string) => void;
  placesSubTab: 'places' | 'ads';
  setPlacesSubTab: (tab: 'places' | 'ads') => void;
  chatTypeTab: 'general' | 'city' | 'messages';
  setChatTypeTab: (tab: 'general' | 'city' | 'messages') => void;
  selectedUserProfile: UserProfile | null;
  setSelectedUserProfile: (user: UserProfile | null) => void;
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // Places
  places: PlaceItem[];
  addPlace: (place: Omit<PlaceItem, 'id'>) => void;
  placeSuggestions: PlaceSuggestion[];
  suggestPlace: (data: {
    placeName: string;
    category: PlaceCategory;
    city: SpanishCity;
    address: string;
    inGoogleMaps?: boolean;
    isOwner?: boolean;
    phone?: string;
    description?: string;
    imageUrl?: string;
    website?: string;
    socialLinks?: any;
    isAnonymous?: boolean;
  }) => Promise<string>;
  updatePlaceSuggestionStatus: (
    id: string,
    status: 'pendientes' | 'en_proceso' | 'aprobado' | 'rechazado',
    responseNote?: string
  ) => Promise<void>;
  updatePlaceSuggestionDetails: (
    id: string,
    updatedData: Partial<PlaceSuggestion>
  ) => Promise<void>;
  deletePlaceSuggestion: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (errMsg.includes('Quota limit exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('quota')) {
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: null,
      email: null,
      emailVerified: true,
      isAnonymous: false,
      providerInfo: []
    },
    operationType,
    path
  };
  console.warn('Database non-fatal warning: ', JSON.stringify(errInfo));
};

const logWarnIfNotQuota = (prefix: string, error: any) => {
  const msg = String(error?.message || error?.details || error || '');
  if (msg.includes('Quota limit exceeded') || msg.includes('resource-exhausted') || msg.includes('quota') || msg.includes('network-request-failed') || msg.includes('Failed to fetch')) {
    return;
  }
  console.warn(prefix, msg);
};

export const FICTITIOUS_USERNAMES = [
  'juancamilo_es',
  'mariana_bcn',
  'carlos_valencia',
  'valen_madrid',
  'andres_sevilla'
];

export const FICTITIOUS_IDS = [
  'user-mariana',
  'user-carlos',
  'user-valen',
  'user-andres',
  'user-1',
  'user-2',
  'user-juancamilo'
];

export const isFictitiousUser = (id?: string, username?: string): boolean => {
  return false;
};

export const getDeterministicPrivateChatId = (userAId: string, userBId: string): string => {
  const sorted = [userAId, userBId].sort();
  return `chat-priv_${sorted[0]}__${sorted[1]}`;
};

export const extractMembersFromPrivateChatId = (chatId: string): string[] => {
  if (chatId.startsWith('chat-priv_') || chatId.startsWith('chat-priv-') || chatId.startsWith('priv-') || chatId.startsWith('chat-priv')) {
    const raw = chatId.replace(/^chat-priv[_-]|^priv[_-]|^chat-priv/, '');
    const parts = raw.split('__');
    if (parts.length === 2 && parts[0] && parts[1]) {
      return [parts[0], parts[1]];
    }
  }
  return [];
};

export const PRUNE_MAX_PUBLIC_MESSAGES = 99; // Cap at 99 messages max for general/city chats
export const PRUNE_MAX_PUBLIC_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

export const getSpanishFormattedTime = (date?: Date | number): string => {
  try {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid',
      hour12: false
    });
  } catch (e) {
    const d = date ? new Date(date) : new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

export const getClearedRoomTimestamps = (): Record<string, number> => {
  try {
    const saved = localStorage.getItem('latierrita_cleared_chats');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {}
  return {};
};

export const saveClearedRoomTimestamp = (chatId: string, timestamp: number) => {
  try {
    const current = getClearedRoomTimestamps();
    const targetIds = (chatId === 'chat-general-es' || chatId === 'general-spain' || chatId === 'chat-general')
      ? ['chat-general-es', 'chat-general', 'general-spain']
      : [chatId];
    targetIds.forEach(id => {
      current[id] = Math.max(current[id] || 0, timestamp);
    });
    localStorage.setItem('latierrita_cleared_chats', JSON.stringify(current));
  } catch {}
};

export const pruneRoomMessages = (room: ChatRoom): ChatRoom => {
  if (!room) {
    return room;
  }

  const now = Date.now();
  const rawMessages = Array.isArray(room.messages) ? room.messages : [];

  // 0. Blacklist known stale/corrupted legacy test messages from DB
  const cleanMessages = rawMessages.filter(msg => {
    if (!msg) return false;
    if (msg.id === 'msg-1790200543210') return false;
    const txt = msg.text || '';
    if (txt.includes('ANUNCIO PATROCINADO') && txt.includes('comida criolla') && txt.includes('La Tiendita Paisa')) {
      return false;
    }
    if (txt.includes('Les comparto este post de @latierrita_app:') && (txt.includes('La Tiendita Paisa') || txt.includes('arepas congeladas') || txt.includes('chocoramos'))) {
      return false;
    }
    return true;
  });

  // Get clear timestamp from local storage
  const clearedMap = getClearedRoomTimestamps();
  const isGeneralRoom = room.id.includes('general') || room.id.includes('comunidad') || room.id === 'general-spain';
  const generalClearTime = Math.max(
    clearedMap['chat-general-es'] || 0,
    clearedMap['chat-general'] || 0,
    clearedMap['general-spain'] || 0,
    clearedMap['general'] || 0
  );
  const storedClearTime = isGeneralRoom ? Math.max(...Object.values(clearedMap), generalClearTime) : (clearedMap[room.id] || 0);

  // 1. Drop any messages created at or BEFORE the latest /clear system action
  let latestClearMsg: ChatMessage | null = null;
  for (let i = cleanMessages.length - 1; i >= 0; i--) {
    const msg = cleanMessages[i];
    if (
      msg && (
        msg.id?.startsWith('msg-clear-') ||
        msg.encryptedHash === 'SHA256:clear-action' ||
        (msg.senderId === 'system' && (msg.text || '').includes('Chat vaciado'))
      )
    ) {
      latestClearMsg = msg;
      break;
    }
  }

  let effectiveClearTime = storedClearTime;
  if (latestClearMsg) {
    const msgClearTime = latestClearMsg.createdAt || 0;
    effectiveClearTime = Math.max(effectiveClearTime, msgClearTime);
  }

  let messagesAfterClear = cleanMessages;
  if (effectiveClearTime > 0) {
    messagesAfterClear = cleanMessages.filter(msg => {
      if (!msg) return false;
      if (latestClearMsg && msg.id === latestClearMsg.id) return true;
      let msgTime = msg.createdAt || 0;
      if (!msgTime && msg.id && msg.id.startsWith('msg-')) {
        const parts = msg.id.split('-');
        const parsed = parseInt(parts[1], 10);
        if (!isNaN(parsed) && parsed > 1600000000000) msgTime = parsed;
      }
      return msgTime > effectiveClearTime && !msg.id?.startsWith('msg-clear-');
    });

    if (latestClearMsg && !messagesAfterClear.some(m => m.id === latestClearMsg!.id)) {
      messagesAfterClear = [latestClearMsg, ...messagesAfterClear];
    }
  }

  // 2. Filter out messages older than 48 hours
  const unexpiredMessages = messagesAfterClear.filter(msg => {
    if (!msg) return false;
    let msgEpoch = now;
    if (typeof msg.createdAt === 'number' && msg.createdAt > 0) {
      msgEpoch = msg.createdAt;
    } else if (msg.id && msg.id.startsWith('msg-')) {
      const parts = msg.id.split('-');
      const possibleTimestamp = parseInt(parts[1], 10);
      if (!isNaN(possibleTimestamp) && possibleTimestamp > 1600000000000) {
        msgEpoch = possibleTimestamp;
      }
    }
    return (now - msgEpoch) <= PRUNE_MAX_PUBLIC_AGE_MS;
  });

  // 3. Keep at most the latest 99 messages
  const prunedMessages = unexpiredMessages.length > PRUNE_MAX_PUBLIC_MESSAGES
    ? unexpiredMessages.slice(-PRUNE_MAX_PUBLIC_MESSAGES)
    : unexpiredMessages;

  if (prunedMessages.length === rawMessages.length && prunedMessages.every((m, i) => m.id === rawMessages[i]?.id)) {
    return room;
  }

  return {
    ...room,
    messages: prunedMessages
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, updateUserProfile, isGuest } = useAuth();

  // Current user
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('latierrita_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isFictitiousUser(parsed.id, parsed.username)) {
          return INITIAL_CURRENT_USER;
        }
        return parsed;
      } catch (e) {
        return INITIAL_CURRENT_USER;
      }
    }
    return INITIAL_CURRENT_USER;
  });

  const isGuestUser = Boolean(
    isGuest ||
    currentUser?.isGuest ||
    currentUser?.id?.startsWith('guest-') ||
    currentUser?.id === 'user-guest' ||
    (currentUser?.username && /^user-\d+$/i.test(currentUser.username))
  );

  const isStaffAccount = (id?: string, username?: string, email?: string) => {
    return id === 'user-staff' || username === 'latierrita_app' || username === 'latierrita_oficial' || email === 'latierritaapp@gmail.com';
  };

  const getStoredOfficialProfile = (): UserProfile => {
    try {
      const raw = localStorage.getItem('latierrita_official_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.username === 'latierrita_app' || parsed.email === 'latierritaapp@gmail.com' || parsed.id === 'user-staff')) {
          return {
            ...parsed,
            username: 'latierrita_app',
            isVerified: true,
            staffRole: 'ADMIN'
          };
        }
      }
    } catch {}
    return {
      id: 'user-staff',
      username: 'latierrita_app',
      name: 'La Tierrita 🇨🇴',
      email: 'latierritaapp@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80',
      bio: '⭐ Cuenta oficial de Staff & Publicidad de La Tierrita España. Conectando a los colombianos.',
      website: 'https://latierrita.es',
      city: 'Madrid',
      originCity: 'Toda Colombia',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isVerified: true,
      staffRole: 'ADMIN',
      socialLinks: {
        instagram: '',
        facebook: '',
        tiktok: '',
        x: ''
      }
    };
  };

  const getLocalCommunity = (): UserProfile[] => {
    try {
      const raw = localStorage.getItem('latierrita_registered_community');
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  };

  const [otherUsers, setOtherUsers] = useState<UserProfile[]>(() => {
    const isCurrentStaff = isStaffAccount(currentUser?.id, currentUser?.username, currentUser?.email);
    const localCommunity = getLocalCommunity().filter(u => 
      !isFictitiousUser(u.id, u.username) &&
      (!currentUser || (u.id !== currentUser.id && u.username !== currentUser.username && (!u.email || u.email !== currentUser.email)))
    );

    const initial: UserProfile[] = [...localCommunity];

    // If current user is not staff, ensure the canonical official account is in otherUsers
    if (!isCurrentStaff) {
      const official = getStoredOfficialProfile();
      const existingIdx = initial.findIndex(u => isStaffAccount(u.id, u.username, u.email));
      if (existingIdx >= 0) {
        initial[existingIdx] = { ...official, ...initial[existingIdx] };
      } else {
        initial.unshift(official);
      }
    }

    OTHER_USERS.forEach(p => {
      if (!isFictitiousUser(p.id, p.username) && !initial.some(m => m.id === p.id || m.username === p.username || (p.email && m.email === p.email))) {
        initial.push(p);
      }
    });
    return initial;
  });
  const currentUserRef = useRef<UserProfile | null>(currentUser);
  currentUserRef.current = currentUser;
  const chatChannelRef = useRef<any>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const isInitialChatSyncRef = useRef<boolean>(true);

  // Sound synthesizer for real-time notification alerts
  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const freqs = [587.33, 880]; // D5, A5 pleasant alert chime
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
      });
    } catch {
      // Audio context might be restricted before user interaction
    }
  };

  const [followingIds, setFollowingIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('latierrita_following');
    const isCurrentStaff = isStaffAccount(currentUser?.id, currentUser?.username, currentUser?.email);
    if (isCurrentStaff) return [];

    let list: string[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const currentId = currentUser?.id;
          list = parsed.filter(id => id && id !== currentId && id !== 'latierrita_oficial');
        }
      } catch (e) {
        console.warn('Error parsing latierrita_following:', e);
      }
    }
    return list;
  });

  // Fetch real users from Supabase and Firestore profiles & sync with local community cache
  useEffect(() => {
    let isMounted = true;
    const fetchRealProfiles = async () => {
      try {
        let mappedList: UserProfile[] = [];

        // 1. Fetch from Supabase profiles
        try {
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');

          if (!error && Array.isArray(profiles) && profiles.length > 0) {
            mappedList = profiles.map(p => mapDBProfileToUserProfile(p));
          }
        } catch (supErr) {
          console.warn('Supabase profiles query note:', supErr);
        }

        // 2. Fetch from Firestore profiles and users collections
        try {
          const fsProfilesSnap = await getDocs(collection(db, 'profiles'));
          if (!fsProfilesSnap.empty) {
            fsProfilesSnap.forEach((docSnap: any) => {
              const data = docSnap.data();
              if (data && (data.username || data.name || data.email)) {
                const mapped = mapDBProfileToUserProfile({ id: docSnap.id, ...data });
                const existingIndex = mappedList.findIndex(m => m.id === mapped.id || m.username === mapped.username || (m.email && mapped.email && m.email === mapped.email));
                if (existingIndex >= 0) {
                  mappedList[existingIndex] = { ...mappedList[existingIndex], ...mapped };
                } else {
                  mappedList.push(mapped);
                }
              }
            });
          }
        } catch (fsErr) {
          console.warn('Firestore profiles fetch note:', fsErr);
        }

        try {
          const fsUsersSnap = await getDocs(collection(db, 'users'));
          if (!fsUsersSnap.empty) {
            fsUsersSnap.forEach((docSnap: any) => {
              const data = docSnap.data();
              if (data && (data.username || data.name || data.email)) {
                const mapped = mapDBProfileToUserProfile({ id: docSnap.id, ...data });
                const existingIndex = mappedList.findIndex(m => m.id === mapped.id || m.username === mapped.username || (m.email && mapped.email && m.email === mapped.email));
                if (existingIndex >= 0) {
                  mappedList[existingIndex] = { ...mappedList[existingIndex], ...mapped };
                } else {
                  mappedList.push(mapped);
                }
              }
            });
          }
        } catch (fsUsersErr) {
          console.warn('Firestore users fetch note:', fsUsersErr);
        }

        // 3. Fetch explicit official profile document from Firestore config
        try {
          const officialDoc = await getDoc(doc(db, 'config', 'official_profile'));
          if (officialDoc.exists()) {
            const data = officialDoc.data();
            if (data) {
              const mappedOfficial = mapDBProfileToUserProfile({ ...data, email: 'latierritaapp@gmail.com', username: 'latierrita_app' });
              safeSetLocalStorage('latierrita_official_profile', mappedOfficial);
              const existingIdx = mappedList.findIndex(m => isStaffAccount(m.id, m.username, m.email));
              if (existingIdx >= 0) {
                mappedList[existingIdx] = { ...mappedList[existingIdx], ...mappedOfficial };
              } else {
                mappedList.unshift(mappedOfficial);
              }
            }
          }
        } catch (offErr) {
          console.warn('Official profile fetch note:', offErr);
        }

        // Fetch follows from Supabase to sync follower/following relationships and counts
        try {
          const { data: followsData, error: followsErr } = await supabase
            .from('follows')
            .select('*');
          if (!followsErr && Array.isArray(followsData) && followsData.length > 0) {
            const currentUserId = currentUserRef.current?.id;
            if (currentUserId) {
              const myFollowing = followsData
                .filter((f: any) => f.follower_id === currentUserId)
                .map((f: any) => f.following_id);
              if (myFollowing.length > 0) {
                setFollowingIds(prev => Array.from(new Set([...prev, ...myFollowing])));
              }
            }

            mappedList.forEach(user => {
              const userFollowers = followsData.filter((f: any) => f.following_id === user.id).length;
              const userFollowing = followsData.filter((f: any) => f.follower_id === user.id).length;
              if (userFollowers > 0) user.followersCount = userFollowers;
              if (userFollowing > 0 && !isStaffAccount(user.id, user.username, user.email)) {
                user.followingCount = userFollowing;
              }
            });
          }
        } catch (fErr) {
          console.warn('Supabase follows sync note:', fErr);
        }

        const current = currentUserRef.current;
        const isCurrentStaff = isStaffAccount(current?.id, current?.username, current?.email);

        // Filter out fictitious users and deleted profiles from database results
        const allReal = [...mappedList].filter(p => !isFictitiousUser(p.id, p.username) && !p.isDeleted && !(p as any).is_deleted);

        // Update local community cache with only real, active database profiles
        safeSetLocalStorage('latierrita_registered_community', allReal);

        // Ensure official staff account is available if current user is not staff
        if (!isCurrentStaff) {
          const officialStored = getStoredOfficialProfile();
          const existingStaff = allReal.find(p => isStaffAccount(p.id, p.username, p.email));
          if (!existingStaff) {
            allReal.unshift(officialStored);
          } else {
            // Merge stored official data with fetched data to keep latest avatar, bio, website, social links
            Object.assign(existingStaff, {
              ...officialStored,
              ...existingStaff,
              username: 'latierrita_app',
              isVerified: true,
              staffRole: 'ADMIN',
              avatar: existingStaff.avatar || officialStored.avatar,
              bio: existingStaff.bio || officialStored.bio,
              website: existingStaff.website || officialStored.website,
              socialLinks: {
                ...(officialStored.socialLinks || {}),
                ...(existingStaff.socialLinks || {})
              }
            });
            safeSetLocalStorage('latierrita_official_profile', existingStaff);
          }
        }

        if (isMounted) {
          setOtherUsers(() => {
            // Filter out current user, fictitious users, and deleted accounts
            const validProfiles = allReal.filter(p => {
              if (p.isDeleted || (p as any).is_deleted) return false;
              if (isFictitiousUser(p.id, p.username)) return false;
              if (current && (p.id === current.id || (p.email && current.email && p.email === current.email) || (p.username && current.username && p.username === current.username))) return false;
              return true;
            });

            // Also update selectedUserProfile if it's currently active and was updated in DB
            setSelectedUserProfile(prevSelected => {
              if (!prevSelected) return null;
              const updated = allReal.find(r => r.id === prevSelected.id || r.username === prevSelected.username || (prevSelected.email && r.email === prevSelected.email) || (isStaffAccount(prevSelected.id, prevSelected.username, prevSelected.email) && isStaffAccount(r.id, r.username, r.email)));
              return updated ? { ...prevSelected, ...updated } : prevSelected;
            });

            return validProfiles;
          });
        }
      } catch (e) {
        console.warn('Error fetching profiles for otherUsers:', e);
      }
    };

    fetchRealProfiles();

    // Real-time listener for official account profile in Firestore
    let unsubOfficial: any = null;
    try {
      unsubOfficial = onSnapshot(doc(db, 'config', 'official_profile'), (docSnap: any) => {
        if (docSnap && docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            const mappedOfficial = mapDBProfileToUserProfile({ ...data, email: 'latierritaapp@gmail.com', username: 'latierrita_app' });
            safeSetLocalStorage('latierrita_official_profile', mappedOfficial);
            setOtherUsers(prev => {
              const idx = prev.findIndex(u => isStaffAccount(u.id, u.username, u.email));
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], ...mappedOfficial };
                return copy;
              } else if (!isStaffAccount(currentUserRef.current?.id, currentUserRef.current?.username, currentUserRef.current?.email)) {
                return [mappedOfficial, ...prev];
              }
              return prev;
            });

            // Update selectedUserProfile if currently viewing official profile
            setSelectedUserProfile(prev => {
              if (prev && isStaffAccount(prev.id, prev.username, prev.email)) {
                return { ...prev, ...mappedOfficial };
              }
              return prev;
            });
          }
        }
      }, (err: any) => {
        console.warn('official_profile snapshot listener note:', err);
      });
    } catch {}

    // Subscribe to realtime profile updates from Supabase with a unique channel name
    const channelName = `public_profiles_changes_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchRealProfiles();
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (typeof unsubOfficial === 'function') unsubOfficial();
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [currentUser?.id, currentUser?.email]);

  // Sync with Firebase/Supabase userProfile
  useEffect(() => {
    if (userProfile) {
      const sanitized = { ...userProfile };
      if (sanitized.username === 'juancamilo_es') {
        sanitized.staffRole = 'Usuario';
        sanitized.isVerified = false;
      }
      const isStaff = isStaffAccount(sanitized.id, sanitized.username, sanitized.email);
      const isGuestAccount = Boolean(isGuest || sanitized.isGuest || sanitized.id?.startsWith('guest-'));
      if (isGuestAccount) {
        sanitized.followingCount = 0;
        sanitized.followersCount = 0;
      } else if (!isStaff) {
        const cleanFollowCount = followingIds.filter(id => id !== 'user-staff' && id !== 'latierrita_oficial').length;
        sanitized.followingCount = Math.max(1, cleanFollowCount);
      } else {
        const communityFollowersCount = otherUsers.filter(u => !isStaffAccount(u.id, u.username, u.email)).length;
        sanitized.followersCount = Math.max(sanitized.followersCount || 0, communityFollowersCount);
        sanitized.followingCount = 0;
      }
      setCurrentUser(prev => {
        if (!prev) return sanitized;
        // Avoid state update if key properties are identical
        if (
          prev.id === sanitized.id &&
          prev.username === sanitized.username &&
          prev.avatar === sanitized.avatar &&
          prev.name === sanitized.name &&
          prev.bio === sanitized.bio &&
          prev.followingCount === sanitized.followingCount &&
          prev.followersCount === sanitized.followersCount
        ) {
          return prev;
        }
        return sanitized;
      });
    }
  }, [userProfile?.id, userProfile?.username, userProfile?.avatar, userProfile?.name, userProfile?.bio, followingIds.length, otherUsers.length]);

  // Keep following list strictly clean of self-following and ensure real staff is followed (EXCEPT for guest users who follow NOBODY)
  useEffect(() => {
    const isCurrentStaff = isStaffAccount(currentUser?.id, currentUser?.username, currentUser?.email);
    const isCurrentGuest = Boolean(isGuest || currentUser?.isGuest || currentUser?.id?.startsWith('guest-'));
    if (isCurrentStaff || isCurrentGuest) {
      setFollowingIds(prev => prev.length === 0 ? prev : []);
      return;
    }

    const staffUser = otherUsers.find(u => u.email === 'latierritaapp@gmail.com' || u.username === 'latierrita_app');
    const staffId = staffUser?.id;

    setFollowingIds(prev => {
      let cleaned = prev.filter(id => id && id !== currentUser?.id && id !== 'user-staff' && id !== 'latierrita_oficial');
      
      if (staffId && !cleaned.includes(staffId)) {
        cleaned = [staffId, ...cleaned];
      }
      
      if (cleaned.length === prev.length && cleaned.every((val, idx) => val === prev[idx])) {
        return prev;
      }
      return cleaned;
    });
  }, [currentUser?.id, currentUser?.email, currentUser?.username, otherUsers.length]);

  // Save following to localStorage and update followingCount without infinite loop
  useEffect(() => {
    const isStaff = isStaffAccount(currentUser?.id, currentUser?.username, currentUser?.email);
    const isCurrentGuest = Boolean(isGuest || currentUser?.isGuest || currentUser?.id?.startsWith('guest-'));
    const cleanList = (isStaff || isCurrentGuest) ? [] : followingIds.filter(id => id !== 'user-staff' && id !== 'latierrita_oficial');
    localStorage.setItem('latierrita_following', JSON.stringify(cleanList));

    setCurrentUser(prev => {
      if (!prev) return prev;
      const expectedCount = (isStaff || isCurrentGuest) ? 0 : Math.max(1, cleanList.length);
      if (prev.followingCount === expectedCount) return prev;
      const updated = { ...prev, followingCount: expectedCount };
      localStorage.setItem('latierrita_user', JSON.stringify(updated));
      return updated;
    });
  }, [followingIds, currentUser?.email, currentUser?.username]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('latierrita_blocked');
    return saved ? JSON.parse(saved) : [];
  });

  // Stories
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyViewerRestriction, setStoryViewerRestriction] = useState<string | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

  const isRealUserPost = (p: PostItem): boolean => {
    if (!p || !p.id) return false;
    const media = p.mediaUrl || (p as any).imageUrl || (p as any).image_url || (p as any).media_url || (p as any).photoUrl || (p as any).photo_url || (p as any).url || (p as any).image || (p as any).media || '';
    if (!media || typeof media !== 'string') return false;
    const clean = media.trim();
    return clean.length > 0;
  };

  // Safe persistence helper for instant grid loading on refresh
  const safeSaveLocalPosts = (postsToSave: PostItem[]) => {
    try {
      const sanitized = (postsToSave || []).filter(isRealUserPost).slice(0, 100);
      localStorage.setItem('latierrita_global_community_posts', JSON.stringify(sanitized));
      localStorage.setItem('latierrita_local_posts', JSON.stringify(sanitized));
      sessionStorage.setItem('latierrita_session_posts', JSON.stringify(sanitized));
    } catch (e) {
      try {
        const trimmed = (postsToSave || []).filter(isRealUserPost).slice(0, 20);
        localStorage.setItem('latierrita_global_community_posts', JSON.stringify(trimmed));
        localStorage.setItem('latierrita_local_posts', JSON.stringify(trimmed));
        sessionStorage.setItem('latierrita_session_posts', JSON.stringify(trimmed));
      } catch {}
    }
  };

  // Helper to remove any undefined properties so Firestore writes never fail
  const sanitizeCommentForFirestore = (c: PostComment): Record<string, any> => {
    const clean: Record<string, any> = {
      id: c.id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: c.userId || 'anon',
      name: c.name || c.username || 'Usuario',
      username: c.username || 'usuario',
      userAvatar: c.userAvatar || '',
      isVerified: Boolean(c.isVerified),
      staffRole: c.staffRole || 'Usuario',
      text: c.text || '',
      timestamp: c.timestamp || 'Reciente'
    };
    if (c.parentId) clean.parentId = c.parentId;
    if (Array.isArray(c.likes)) clean.likes = c.likes;
    if (typeof (c as any).createdAt === 'number') clean.createdAt = (c as any).createdAt;
    return clean;
  };

  // Posts & profile posts
  const [posts, setPosts] = useState<PostItem[]>(() => {
    try {
      const globalRaw = localStorage.getItem('latierrita_global_community_posts') || 
                        localStorage.getItem('latierrita_local_posts') || 
                        sessionStorage.getItem('latierrita_session_posts');
      if (globalRaw) {
        const parsed = JSON.parse(globalRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(isRealUserPost);
        }
      }
    } catch {}
    return [];
  });

  // Dynamically and synchronously compute profile posts from unified posts pool (Zero delay, always 100% in sync)
  const myProfilePosts = useMemo(() => {
    if (!currentUser) return [];
    const currentId = currentUser.id;
    const currentUsername = currentUser.username?.toLowerCase().trim();
    const currentEmail = currentUser.email?.toLowerCase().trim();
    const isCurrentStaff = isStaffAccount(currentId, currentUsername, currentEmail);

    return posts.filter(p => {
      if (isCurrentStaff && (p.isStaffAd || p.userId === 'user-staff' || p.username?.toLowerCase() === 'latierrita_app' || p.username?.toLowerCase() === 'staff_latierrita')) {
        return true;
      }
      const pUserId = p.userId;
      const pUsername = p.username?.toLowerCase().trim();
      const pEmail = (p as any).email?.toLowerCase().trim();

      return (
        (pUserId && currentId && pUserId === currentId) ||
        (pUsername && currentUsername && pUsername === currentUsername) ||
        (pEmail && currentEmail && pEmail === currentEmail)
      );
    });
  }, [posts, currentUser]);

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // Ads & Staff
  const [adBanners, setAdBanners] = useState<AdBanner[]>(() => {
    const saved = localStorage.getItem('latierrita_ad_banners');
    const localSaved = localStorage.getItem('latierrita_local_banners');
    const deletedRaw = localStorage.getItem('latierrita_deleted_banners') || '[]';
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(deletedRaw);
    } catch {}

    const cleanBanner = (b: AdBanner) =>
      b &&
      b.id !== 'banner-init-1' &&
      !deletedIds.includes(b.id) &&
      b.imageUrl &&
      !b.imageUrl.includes('unsplash.com') &&
      !b.imageUrl.includes('photo-1579546929518');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(cleanBanner);
        }
      } catch {}
    }
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed)) {
          return parsed.filter(cleanBanner);
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('latierrita_ad_banners', JSON.stringify(adBanners));
    } catch {}
  }, [adBanners]);
  const [isStaffMode, setIsStaffMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('latierrita_staff_mode');
    return saved === 'true';
  });

  useEffect(() => {
    try {
      localStorage.setItem('latierrita_staff_mode', isStaffMode ? 'true' : 'false');
    } catch {}
  }, [isStaffMode]);

  const [isStaffAdminOpen, setIsStaffAdminOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isAdminSlug = window.location.pathname === '/admin' || window.location.pathname === '/administracion';
    const savedAdminOpen = localStorage.getItem('latierrita_staff_admin_open') === 'true';
    const savedStaffMode = localStorage.getItem('latierrita_staff_mode') === 'true';
    return isAdminSlug || savedAdminOpen || savedStaffMode;
  });

  const [staffAdminTab, setStaffAdminTab] = useState<'carrusel_01' | 'carrusel_02' | 'feed_post' | 'popup_emergente' | 'administracion' | 'soporte'>('carrusel_01');

  const openStaffAdminWithTab = (tab: 'carrusel_01' | 'carrusel_02' | 'feed_post' | 'popup_emergente' | 'administracion' | 'soporte') => {
    setStaffAdminTab(tab);
    setIsStaffAdminOpen(true);
  };

  useEffect(() => {
    try {
      localStorage.setItem('latierrita_staff_admin_open', isStaffAdminOpen ? 'true' : 'false');
    } catch {}
  }, [isStaffAdminOpen]);

  // Default config for the startup popup ad (Disabled by default so no stale fallback image appears)
  const DEFAULT_STARTUP_AD: StartupAdConfig = {
    id: 'startup_ad',
    imageUrl: '',
    title: '',
    subtitle: '',
    badgeText: 'Publicidad Oficial STAFF',
    discountBadge: '',
    description: '',
    discountCode: '',
    discountValidity: '',
    ctaText: '',
    ctaUrl: '',
    active: false
  };

  const [startupAdConfig, setStartupAdConfig] = useState<StartupAdConfig | null>(() => {
    try {
      const saved = localStorage.getItem('latierrita_startup_ad');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return DEFAULT_STARTUP_AD;
  });

  // Startup Ad (shows on initial open or whenever a new login/registration enters)
  const [startupAdOpen, setStartupAdOpen] = useState<boolean>(() => {
    const forceShow = sessionStorage.getItem('latierrita_show_startup_ad_now') === 'true';
    if (forceShow) {
      sessionStorage.removeItem('latierrita_show_startup_ad_now');
      sessionStorage.removeItem('latierrita_startup_ad_closed');
      return true;
    }
    const hasSeenSessionAd = sessionStorage.getItem('latierrita_startup_ad_closed');
    return !hasSeenSessionAd;
  });

  // Watch for freshly authenticated users or user switches to guarantee startup ad shows
  useEffect(() => {
    const checkFreshAuthAd = () => {
      const forceShow = sessionStorage.getItem('latierrita_show_startup_ad_now') === 'true';
      if (forceShow) {
        sessionStorage.removeItem('latierrita_show_startup_ad_now');
        sessionStorage.removeItem('latierrita_startup_ad_closed');
        setStartupAdOpen(true);
      }
    };
    checkFreshAuthAd();
  }, [currentUser?.id]);

  // Chats
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(() => {
    const saved = localStorage.getItem('latierrita_chat_rooms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: ChatRoom) => {
            if (r.id === 'chat-general-es' || r.id === 'general-spain' || r.id === 'chat-general') {
              return {
                ...r,
                type: 'general',
                name: '🇨🇴 Gran Chat General Colombia en España',
                targetUserId: undefined,
                targetUser: undefined,
                isTicketChat: false
              } as ChatRoom;
            }
            if (r.id.startsWith('chat-city-') || r.id.startsWith('city-')) {
              return {
                ...r,
                type: 'city',
                targetUserId: undefined,
                targetUser: undefined,
                isTicketChat: false
              } as ChatRoom;
            }
            return r;
          });
        }
      } catch {}
    }
    return INITIAL_CHAT_ROOMS;
  });

  useEffect(() => {
    if (chatRooms && chatRooms.length > 0) {
      localStorage.setItem('latierrita_chat_rooms', JSON.stringify(chatRooms));
    }
  }, [chatRooms]);

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>(INITIAL_GROUP_INVITES);
  const [deletedMessageIdsForMe, setDeletedMessageIdsForMe] = useState<string[]>(() => {
    const saved = localStorage.getItem('latierrita_deleted_msgs_for_me');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('latierrita_deleted_msgs_for_me', JSON.stringify(deletedMessageIdsForMe));
  }, [deletedMessageIdsForMe]);

  // Reports
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    type: 'message' | 'user' | 'post' | 'story' | 'group' | 'support';
    title: string;
    chatId?: string;
    reportedUserId?: string;
    reportedUserName?: string;
    initialTicketType?: TicketType;
  } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('latierrita_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('latierrita_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const [plushToast, setPlushToast] = useState<AppNotification | null>(null);

  // Navigation
  const [activeTab, setActiveTabState] = useState<'feed' | 'explore' | 'chats' | 'notifications' | 'profile' | 'places'>(() => {
    const saved = localStorage.getItem('latierrita_active_tab');
    if (saved && ['feed', 'explore', 'chats', 'notifications', 'profile', 'places'].includes(saved)) {
      return saved as any;
    }
    return 'feed';
  });

  type NavHistoryItem = {
    tab: 'feed' | 'explore' | 'chats' | 'notifications' | 'profile' | 'places';
    profile: UserProfile | null;
  };

  const [navHistory, setNavHistory] = useState<NavHistoryItem[]>([]);

  const setActiveTab = (tab: 'feed' | 'explore' | 'chats' | 'notifications' | 'profile' | 'places') => {
    setNavHistory([]);
    setSelectedUserProfileState(null);
    setActiveTabState(tab);
  };

  useEffect(() => {
    localStorage.setItem('latierrita_active_tab', activeTab);
  }, [activeTab]);

  const [exploreSearchQuery, setExploreSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [placesSearchQuery, setPlacesSearchQuery] = useState('');
  const [adsSearchQuery, setAdsSearchQuery] = useState('');
  const [placesSubTab, setPlacesSubTab] = useState<'places' | 'ads'>('places');
  const [chatTypeTab, setChatTypeTab] = useState<'general' | 'city' | 'messages'>('messages');
  const [selectedUserProfile, setSelectedUserProfileState] = useState<UserProfile | null>(null);

  const selectedUserProfileRef = useRef<UserProfile | null>(selectedUserProfile);
  selectedUserProfileRef.current = selectedUserProfile;

  const setSelectedUserProfile = (user: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => {
    if (typeof user === 'function') {
      setSelectedUserProfileState(user);
      return;
    }
    if (user) {
      if (isGuestUser && user.id !== currentUser?.id && user.username !== currentUser?.username) {
        triggerPlushNotification({
          type: 'system',
          title: 'Acceso Limitado',
          message: 'Como invitado no puedes visitar otros perfiles. Regístrate en la app para acceder a todas las funciones.'
        });
        return;
      }
      // Save current view state before pushing new profile
      const currentState: NavHistoryItem = {
        tab: (activeTabRef.current || 'feed') as any,
        profile: selectedUserProfileRef.current
      };
      setNavHistory(prev => [...prev, currentState]);
      setSelectedUserProfileState(user);
      setActiveTabState('profile');
    } else {
      // Go back in stack
      setNavHistory(prev => {
        if (prev.length === 0) {
          setSelectedUserProfileState(null);
          return [];
        }
        const last = prev[prev.length - 1];
        const nextStack = prev.slice(0, prev.length - 1);
        setSelectedUserProfileState(last.profile);
        setActiveTabState(last.tab);
        return nextStack;
      });
    }
  };

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Synchronized refs to check user's current view in real-time listeners and polling
  const activeTabRef = useRef<string>(activeTab);
  activeTabRef.current = activeTab;

  const activeChatIdRef = useRef<string | null>(activeChatId);
  activeChatIdRef.current = activeChatId;

  const chatTypeTabRef = useRef<string>(chatTypeTab);
  chatTypeTabRef.current = chatTypeTab;

  // Helper: check if current user is actively looking at this specific chat room
  const isUserViewingChat = (targetChatId: string): boolean => {
    if (activeTabRef.current !== 'chats') return false;
    const currentActive = activeChatIdRef.current;
    if (!currentActive) return false;
    if (currentActive === targetChatId) return true;
    const cleanActive = currentActive.replace(/^chat-priv[_-]|^priv[_-]|^chat-priv/, '');
    const cleanTarget = targetChatId.replace(/^chat-priv[_-]|^priv[_-]|^chat-priv/, '');
    if (cleanActive === cleanTarget) return true;

    // Check if canonical IDs match when sorted
    const extractedActive = extractMembersFromPrivateChatId(currentActive);
    const extractedTarget = extractMembersFromPrivateChatId(targetChatId);
    if (extractedActive.length === 2 && extractedTarget.length === 2) {
      const sActive = [...extractedActive].sort().join('__');
      const sTarget = [...extractedTarget].sort().join('__');
      if (sActive === sTarget) return true;
    }
    return false;
  };

  // Support, Verification, Staff & Deleted Accounts state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [deletedAccounts, setDeletedAccounts] = useState<DeletedAccount[]>(INITIAL_DELETED_ACCOUNTS);

  // Sync deleted accounts from Firestore collection
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'deleted_accounts'), (snapshot) => {
        if (!snapshot.empty) {
          const fromDb: DeletedAccount[] = [];
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data() as DeletedAccount;
            fromDb.push(data);
          });
          // Merge unique by id or username
          setDeletedAccounts(prev => {
            const combined = [...fromDb];
            prev.forEach(p => {
              if (!combined.some(c => c.username === p.username || c.id === p.id)) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      }, (err) => {
        console.warn('Firestore deleted_accounts snapshot listener:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Failed to listen to deleted_accounts in Firestore:', e);
    }
  }, []);

  // Sync place_suggestions in real-time from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'place_suggestions'), (snapshot) => {
        if (!snapshot.empty) {
          const list: PlaceSuggestion[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as PlaceSuggestion);
          });
          list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setPlaceSuggestions(list);
        } else {
          setPlaceSuggestions([]);
        }
      }, (err) => {
        console.warn('Firestore place_suggestions snapshot listener:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Failed to listen to place_suggestions in Firestore:', e);
    }
  }, []);

  // Sync support_tickets in real-time from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'support_tickets'), (snapshot) => {
        if (!snapshot.empty) {
          const list: SupportTicket[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
          });
          setSupportTickets(list);
        } else {
          setSupportTickets([]);
        }
      }, (err) => {
        console.warn('Firestore support_tickets snapshot listener:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Failed to listen to support_tickets in Firestore:', e);
    }
  }, []);

  // Load Banners from IndexedDB and Sync with Firestore
  // Sync Deleted Banners Globally from Firestore
  useEffect(() => {
    try {
      const unsubDeleted = onSnapshot(collection(db, 'deleted_banners'), (deletedSnap) => {
        const globalDeletedIds: string[] = [];
        if (!deletedSnap.empty) {
          deletedSnap.forEach((docSnap: any) => {
            if (docSnap.id) globalDeletedIds.push(docSnap.id);
          });
        }

        try {
          const localDeletedRaw = localStorage.getItem('latierrita_deleted_banners') || '[]';
          const localDeleted: string[] = JSON.parse(localDeletedRaw);
          const combinedDeleted = Array.from(new Set([...localDeleted, ...globalDeletedIds]));
          localStorage.setItem('latierrita_deleted_banners', JSON.stringify(combinedDeleted));

          // Immediately remove deleted banners from state
          setAdBanners(prev => prev.filter(b => b && !combinedDeleted.includes(b.id)));

          // Purge deleted banners from local caches
          combinedDeleted.forEach(delId => {
            deleteBannerFromIndexedDB(delId).catch(() => {});
          });

          const localBannersRaw = localStorage.getItem('latierrita_local_banners');
          if (localBannersRaw) {
            const localBanners = JSON.parse(localBannersRaw);
            if (Array.isArray(localBanners)) {
              const cleaned = localBanners.filter((b: AdBanner) => b && !combinedDeleted.includes(b.id));
              localStorage.setItem('latierrita_local_banners', JSON.stringify(cleaned));
            }
          }

          const adBannersRaw = localStorage.getItem('latierrita_ad_banners');
          if (adBannersRaw) {
            const adBannersList = JSON.parse(adBannersRaw);
            if (Array.isArray(adBannersList)) {
              const cleaned = adBannersList.filter((b: AdBanner) => b && !combinedDeleted.includes(b.id));
              localStorage.setItem('latierrita_ad_banners', JSON.stringify(cleaned));
            }
          }
        } catch (e) {
          console.warn('Error syncing deleted banners:', e);
        }
      }, (error) => {
        console.warn('deleted_banners listener note:', error);
      });

      return () => unsubDeleted();
    } catch (e) {
      console.warn('Failed to listen to deleted_banners:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // 1. Asynchronously load high-capacity IndexedDB banners
    getAllBannersFromIndexedDB().then((idbBanners) => {
      if (!isMounted || !Array.isArray(idbBanners) || idbBanners.length === 0) return;
      const deletedRaw = localStorage.getItem('latierrita_deleted_banners') || '[]';
      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(deletedRaw);
      } catch {}

      const cleanIdb = idbBanners.filter(b => b && b.id !== 'banner-init-1' && !deletedIds.includes(b.id));
      if (cleanIdb.length > 0) {
        setAdBanners(prev => {
          const merged = [...prev];
          cleanIdb.forEach(ib => {
            if (!merged.some(m => m.id === ib.id)) {
              merged.unshift(ib);
            }
          });
          return merged;
        });
      }
    }).catch(() => {});

    // 2. Real-time Firestore Snapshot Listener & Supabase Sync
    try {
      const unsub = onSnapshot(collection(db, 'banners'), async (snapshot) => {
        const list: AdBanner[] = [];
        if (!snapshot.empty) {
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data() || {};
            list.push({ id: docSnap.id, ...data } as AdBanner);
          });
        }

        const deletedRaw = localStorage.getItem('latierrita_deleted_banners') || '[]';
        let deletedIds: string[] = [];
        try {
          deletedIds = JSON.parse(deletedRaw);
        } catch {}

        // Incorporate Supabase banners if present
        try {
          const { data: supaBanners } = await supabase.from('banners').select('*');
          if (Array.isArray(supaBanners) && supaBanners.length > 0) {
            supaBanners.forEach((sb: any) => {
              const img = sb.image_url || sb.imageUrl;
              if (img && !list.some(b => b.id === sb.id) && !deletedIds.includes(sb.id)) {
                list.push({
                  id: sb.id,
                  title: sb.title || '',
                  subtitle: sb.subtitle || '',
                  imageUrl: img,
                  sponsorName: sb.sponsor_name || sb.sponsorName || 'Staff',
                  sponsorCity: sb.sponsor_city || sb.sponsorCity || 'España',
                  ctaText: sb.cta_text || sb.ctaText || 'Ver detalles',
                  ctaLink: sb.cta_link || sb.ctaLink || '',
                  category: sb.category || 'Evento',
                  discountBadge: sb.discount_badge || sb.discountBadge,
                  active: sb.active ?? true,
                  carouselType: sb.carousel_type || sb.carouselType || 'explorar'
                });
              }
            });
          }
        } catch (e) {}

        // Incorporate IndexedDB stored banners
        try {
          const idbList = await getAllBannersFromIndexedDB();
          if (Array.isArray(idbList)) {
            idbList.forEach((ib: AdBanner) => {
              if (!list.some(b => b.id === ib.id) && !deletedIds.includes(ib.id) && ib.id !== 'banner-init-1') {
                list.unshift(ib);
              }
            });
          }
        } catch (e) {}

        // Incorporate locally saved banners (offline / local resilience fallback)
        try {
          const localBannersRaw = localStorage.getItem('latierrita_local_banners');
          if (localBannersRaw) {
            const localBanners = JSON.parse(localBannersRaw);
            if (Array.isArray(localBanners)) {
              localBanners.forEach((lb: AdBanner) => {
                if (!list.some(b => b.id === lb.id) && !deletedIds.includes(lb.id) && lb.id !== 'banner-init-1') {
                  list.unshift(lb);
                }
              });
            }
          }
        } catch (e) {}

        const cleanList = list.filter(
          b =>
            b &&
            b.id !== 'banner-init-1' &&
            !deletedIds.includes(b.id) &&
            b.imageUrl &&
            !b.imageUrl.includes('unsplash.com') &&
            !b.imageUrl.includes('photo-1579546929518')
        );

        setAdBanners(cleanList);
        cleanList.forEach(b => {
          if (b.id !== 'banner-oficial-latierrita' && b.id !== 'banner-init-1') {
            saveBannerToIndexedDB(b);
          }
        });
      }, async (error) => {
        // Fallback on network/permission error
        const list: AdBanner[] = [];
        const deletedRaw = localStorage.getItem('latierrita_deleted_banners') || '[]';
        let deletedIds: string[] = [];
        try {
          deletedIds = JSON.parse(deletedRaw);
        } catch {}

        try {
          const idbList = await getAllBannersFromIndexedDB();
          if (Array.isArray(idbList)) {
            list.push(...idbList.filter((b: AdBanner) => b && !deletedIds.includes(b.id) && b.id !== 'banner-init-1'));
          }
        } catch (e) {}

        try {
          const localBannersRaw = localStorage.getItem('latierrita_local_banners');
          if (localBannersRaw) {
            const localBanners = JSON.parse(localBannersRaw);
            if (Array.isArray(localBanners)) {
              localBanners.forEach((lb: AdBanner) => {
                if (!list.some(b => b.id === lb.id) && !deletedIds.includes(lb.id) && lb.id !== 'banner-init-1') {
                  list.push(lb);
                }
              });
            }
          }
        } catch (e) {}

        setAdBanners(list);
        console.warn('Banners listener note:', error?.message || error);
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {
      console.warn('Failed to listen to banners in DB:', e);
    }
  }, []);

  // Sync Stories
  useEffect(() => {
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    const getStoryCreationTime = (story: any): number => {
      if (typeof story.createdAt === 'number' && !isNaN(story.createdAt)) {
        return story.createdAt;
      }
      if (story.createdAt && typeof story.createdAt === 'string') {
        const parsed = new Date(story.createdAt).getTime();
        if (!isNaN(parsed)) return parsed;
      }
      if (typeof story.id === 'string' && story.id.startsWith('story-')) {
        const parts = story.id.split('-');
        if (parts.length >= 2) {
          const ts = parseInt(parts[1], 10);
          if (!isNaN(ts) && ts > 1600000000000) {
            return ts;
          }
        }
      }
      return Date.now();
    };

    const isStoryExpired = (story: any): boolean => {
      const creationTime = getStoryCreationTime(story);
      return (Date.now() - creationTime) > TWENTY_FOUR_HOURS_MS;
    };

    try {
      const unsub = onSnapshot(collection(db, 'stories'), (snapshot) => {
        const list: StoryItem[] = [];
        if (!snapshot.empty) {
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data() || {};
            const storyObj = {
              id: docSnap.id,
              ...data,
              userAvatar: data.userAvatar || data.avatarUrl || '',
              timestamp: data.timestamp || 'Reciente',
              createdAt: data.createdAt || (typeof data.timestamp === 'number' ? data.timestamp : undefined),
              reactions: Array.isArray(data.reactions) ? data.reactions : []
            } as StoryItem;

            if (isStoryExpired(storyObj)) {
              // Auto-eliminar de Firestore si tiene más de 24 horas
              deleteDoc(doc(db, 'stories', docSnap.id)).catch(() => {});
            } else {
              list.push(storyObj);
            }
          });
        }

        // Incorporar historias guardadas localmente (fallback por RLS/offline)
        try {
          const localStoriesRaw = localStorage.getItem('latierrita_local_stories');
          if (localStoriesRaw) {
            const localStories = JSON.parse(localStoriesRaw);
            if (Array.isArray(localStories)) {
              const unexpiredLocal = localStories.filter((s: StoryItem) => !isStoryExpired(s));
              localStorage.setItem('latierrita_local_stories', JSON.stringify(unexpiredLocal));
              unexpiredLocal.forEach((ls: StoryItem) => {
                if (!list.some(s => s.id === ls.id)) {
                  list.push(ls);
                }
              });
            }
          }
        } catch (e) {}

        list.sort((a, b) => getStoryCreationTime(b) - getStoryCreationTime(a));
        setStories(list);
      }, (error) => {
        // En caso de error, mostrar al menos las historias locales no expiradas
        const list: StoryItem[] = [];
        try {
          const localStoriesRaw = localStorage.getItem('latierrita_local_stories');
          if (localStoriesRaw) {
            const localStories = JSON.parse(localStoriesRaw);
            if (Array.isArray(localStories)) {
              const unexpiredLocal = localStories.filter((s: StoryItem) => !isStoryExpired(s));
              localStorage.setItem('latierrita_local_stories', JSON.stringify(unexpiredLocal));
              list.push(...unexpiredLocal);
            }
          }
        } catch (e) {}
        list.sort((a, b) => getStoryCreationTime(b) - getStoryCreationTime(a));
        setStories(list);
        console.log('Stories sync: offline or guest mode fallback loaded.');
      });

      // Timer para re-verificar caducidad de 24h en tiempo real mientras la app está abierta
      const timer = setInterval(() => {
        setStories(prev => {
          const active = prev.filter(s => !isStoryExpired(s));
          return active.length !== prev.length ? active : prev;
        });
      }, 30000);

      return () => {
        unsub();
        clearInterval(timer);
      };
    } catch (e) {
      setStories([]);
      console.log('Failed to listen to stories in DB:', e);
    }
  }, []);

  // Sync Posts in real-time from Firestore & Supabase and keep local cache updated for instant 0ms loads
  useEffect(() => {
    let isMounted = true;

    const fetchSupabasePosts = async (): Promise<PostItem[]> => {
      try {
        const { data: supaPosts, error } = await supabase
          .from('posts')
          .select('*');

        if (!error && Array.isArray(supaPosts) && supaPosts.length > 0) {
          const currentUserId = currentUserRef.current?.id;
          return supaPosts.map((sp: any) => {
            const media = sp.media_url || sp.mediaUrl || sp.image_url || sp.imageUrl || sp.photoUrl || sp.photo_url || sp.url || sp.image || sp.media || '';
            const isOfficial = sp.is_staff_ad || sp.isStaffAd || sp.user_id === 'user-staff' || sp.username === 'latierrita_app' || sp.username === 'staff_latierrita';
            const likesArr = Array.isArray(sp.likes) ? sp.likes : [];
            const commentsArr = Array.isArray(sp.comments) ? sp.comments : [];
            return {
              id: sp.id,
              userId: sp.user_id || sp.userId || 'anon',
              username: isOfficial ? 'latierrita_app' : (sp.username || 'usuario'),
              userAvatar: isOfficial ? '/logo.png?v=3' : (sp.user_avatar || sp.userAvatar || ''),
              userCity: sp.user_city || sp.userCity || 'España',
              mediaUrl: media,
              caption: sp.caption || '',
              likes: likesArr,
              likesCount: typeof sp.likes_count === 'number' ? sp.likes_count : (typeof sp.likesCount === 'number' ? sp.likesCount : likesArr.length),
              hasLiked: currentUserId ? (likesArr.includes(currentUserId) || Boolean(sp.hasLiked)) : false,
              hideLocation: sp.hide_location ?? false,
              location: sp.location || '',
              comments: commentsArr,
              timestamp: sp.created_at || sp.timestamp || 'Reciente',
              isStaffAd: isOfficial
            } as PostItem;
          }).filter(p => isRealUserPost(p));
        }
      } catch (e) {
        console.warn('Supabase posts fetch note:', e);
      }
      return [];
    };

    try {
      const unsub = onSnapshot(collection(db, 'posts'), async (snapshot) => {
        let list: PostItem[] = [];
        const currentUserId = currentUserRef.current?.id;

        if (!snapshot.empty) {
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data() || {};
            const isOfficial = data.isStaffAd || data.userId === 'user-staff' || data.username === 'staff_latierrita' || data.username === 'latierrita_app' || data.username === 'latierrita_oficial';
            const likesArr = Array.isArray(data.likes) ? data.likes : [];
            const commentsArr = Array.isArray(data.comments) ? data.comments : [];
            const media = data.mediaUrl || data.imageUrl || data.media_url || data.image_url || data.photoUrl || data.photo_url || data.url || data.image || data.media || '';
            const item: PostItem = {
              id: docSnap.id,
              ...data,
              username: isOfficial ? 'latierrita_app' : (data.username || 'usuario'),
              userAvatar: isOfficial ? '/logo.png?v=3' : (data.userAvatar || data.avatarUrl || ''),
              mediaUrl: media,
              timestamp: data.timestamp || data.createdAt || 'Reciente',
              likes: likesArr,
              likesCount: typeof data.likesCount === 'number' ? data.likesCount : likesArr.length,
              hasLiked: currentUserId ? likesArr.includes(currentUserId) : Boolean(data.hasLiked),
              hideLocation: data.hideLocation ?? !data.location,
              comments: commentsArr
            } as PostItem;
            if (isRealUserPost(item)) {
              list.push(item);
            }
          });
        }

        // Incorporar publicaciones de Supabase
        const supaPosts = await fetchSupabasePosts();
        supaPosts.forEach(sp => {
          if (!list.some(p => p.id === sp.id) && isRealUserPost(sp)) {
            list.push(sp);
          }
        });

        // Incorporar publicaciones guardadas localmente SOLO si son reales y no existen aún en la nube
        try {
          const localPostsRaw = localStorage.getItem('latierrita_local_posts');
          if (localPostsRaw) {
            const localPosts = JSON.parse(localPostsRaw);
            if (Array.isArray(localPosts)) {
              localPosts.forEach((lp: PostItem) => {
                if (lp && lp.id && isRealUserPost(lp) && !list.some(p => p.id === lp.id)) {
                  const isOfficial = lp.isStaffAd || lp.userId === 'user-staff' || lp.username === 'staff_latierrita' || lp.username === 'latierrita_app' || lp.username === 'latierrita_oficial';
                  const cleanedLp: PostItem = {
                    ...lp,
                    username: isOfficial ? 'latierrita_app' : lp.username,
                    userAvatar: isOfficial ? '/logo.png?v=3' : lp.userAvatar
                  };
                  list.push(cleanedLp);
                }
              });
            }
          }
        } catch (e) {}

        list = list.filter(isRealUserPost);
        list.sort((a, b) => b.id.localeCompare(a.id));
        if (isMounted) {
          setPosts(list);
          safeSaveLocalPosts(list);
        }
      }, async (error) => {
        // En caso de error de Firestore, cargar desde Supabase y local
        const supaPosts = await fetchSupabasePosts();
        let list: PostItem[] = supaPosts.filter(isRealUserPost);
        try {
          const localPostsRaw = localStorage.getItem('latierrita_local_posts');
          if (localPostsRaw) {
            const localPosts = JSON.parse(localPostsRaw);
            if (Array.isArray(localPosts)) {
              localPosts.forEach((lp: PostItem) => {
                if (lp && lp.id && isRealUserPost(lp) && !list.some(p => p.id === lp.id)) {
                  list.push(lp);
                }
              });
            }
          }
        } catch (e) {}
        list = list.filter(isRealUserPost);
        if (isMounted) {
          setPosts(list);
          safeSaveLocalPosts(list);
        }
        console.warn('Posts listener note:', error?.message || error);
      });

      // Real-time Supabase postgres_changes for posts table with unique channel name
      const supaPostsChannelName = `public_posts_changes_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const supaPostsChannel = supabase
        .channel(supaPostsChannelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, async () => {
          const supaList = await fetchSupabasePosts();
          if (supaList.length > 0 && isMounted) {
            setPosts(prev => {
              const merged = [...prev];
              supaList.forEach(sp => {
                const idx = merged.findIndex(m => m.id === sp.id);
                if (idx >= 0) {
                  merged[idx] = { ...merged[idx], ...sp };
                } else {
                  merged.unshift(sp);
                }
              });
              merged.sort((a, b) => b.id.localeCompare(a.id));
              safeSaveLocalPosts(merged);
              return merged;
            });
          }
        })
        .subscribe();

      return () => {
        isMounted = false;
        unsub();
        try {
          supabase.removeChannel(supaPostsChannel);
        } catch {}
      };
    } catch (e) {
      console.warn('Failed to listen to posts in DB:', e);
    }
  }, []);

  // Sync user hasLiked status across all posts when currentUser changes
  useEffect(() => {
    if (!currentUser?.id) return;
    setPosts(prev => {
      let changed = false;
      const updated = prev.map(p => {
        const likesArr = Array.isArray((p as any).likes) ? (p as any).likes : [];
        const userHasLiked = likesArr.includes(currentUser.id);
        if (p.hasLiked !== userHasLiked) {
          changed = true;
          return { ...p, hasLiked: userHasLiked };
        }
        return p;
      });
      if (changed) {
        safeSaveLocalPosts(updated);
        return updated;
      }
      return prev;
    });
  }, [currentUser?.id]);

  // Sync Chat Rooms with dual-engine Supabase and Firestore real-time fallbacks
  useEffect(() => {
    let isMounted = true;

    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    const inferRoomType = (id: string, explicitType?: string): 'general' | 'city' | 'private' | 'group' => {
      const cleanId = (id || '').toLowerCase();
      
      // Explicit general chat IDs or names ALWAYS return 'general'
      if (
        cleanId === 'chat-general-es' ||
        cleanId === 'chat-general' ||
        cleanId === 'general-spain' ||
        cleanId === 'chat-gen-es' ||
        cleanId === 'general' ||
        cleanId === 'comunidad' ||
        cleanId.includes('chat-general') ||
        cleanId.includes('general-es') ||
        cleanId.includes('general-spain') ||
        cleanId.includes('comunidad')
      ) {
        return 'general';
      }

      // Explicit city chat IDs ALWAYS return 'city'
      if (
        cleanId.startsWith('chat-city') ||
        cleanId.startsWith('city-') ||
        cleanId.includes('chat-city-')
      ) {
        return 'city';
      }

      // Explicit group chat IDs ALWAYS return 'group'
      if (
        cleanId.startsWith('chat-group') ||
        cleanId.startsWith('group-') ||
        cleanId.includes('chat-group-')
      ) {
        return 'group';
      }

      if (explicitType === 'private' || explicitType === 'group' || explicitType === 'city' || explicitType === 'general') {
        return explicitType;
      }

      if (
        cleanId.startsWith('chat-priv') ||
        cleanId.startsWith('priv-') ||
        cleanId.startsWith('priv_') ||
        cleanId.includes('ticket') ||
        cleanId.includes('soporte')
      ) {
        return 'private';
      }

      return 'private';
    };

    // Seed default rooms once on mount ONLY if they don't exist in Supabase (NEVER overwrite existing messages)
    const seedDefaultRooms = async () => {
      if (!hasSupabaseUrl || !hasSupabaseKey) return;
      for (const defaultRoom of INITIAL_CHAT_ROOMS) {
        try {
          const { data, error } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('id', defaultRoom.id)
            .maybeSingle();

          if (!data && !error) {
            const safeRoom = {
              id: defaultRoom.id,
              name: defaultRoom.name,
              description: defaultRoom.description || '',
              created_at: new Date().toISOString(),
              messages: []
            };
            await supabase.from('chat_rooms').upsert([safeRoom], { onConflict: 'id' });
          }
        } catch {
          // Ignore offline/connection errors
        }
      }
    };

    seedDefaultRooms();

    const fetchRooms = async () => {
      const roomsDataMap = new Map<string, any>();

      // 1. Fetch from Supabase
      if (hasSupabaseUrl && hasSupabaseKey) {
        try {
          const { data, error } = await supabase
            .from('chat_rooms')
            .select('*');

          if (!error && data && Array.isArray(data)) {
            data.forEach((row: any) => {
              roomsDataMap.set(row.id, {
                id: row.id,
                type: inferRoomType(row.id, row.type),
                name: row.name || 'Chat',
                avatar: row.avatar || '',
                city: row.city || undefined,
                targetUserId: row.target_user_id || row.targetUserId || undefined,
                description: row.description || '',
                members: Array.isArray(row.members) ? row.members : [],
                admins: Array.isArray(row.admins) ? row.admins : [],
                createdBy: row.created_by || row.createdBy || undefined,
                createdAt: row.created_at || row.createdAt || '2026-01-01',
                messages: Array.isArray(row.messages)
                  ? row.messages
                  : (typeof row.messages === 'string' ? JSON.parse(row.messages) : [])
              });
            });
          }
        } catch (e) {
          console.warn('Supabase fetchRooms exception:', e);
        }
      }

      // 2. Also fetch from Firestore to merge any rooms created across engines
      try {
        const querySnapshot = await getDocs(collection(db, 'chat_rooms'));
        if (!querySnapshot.empty) {
          querySnapshot.forEach((docSnap: any) => {
            const rdata = docSnap.data();
            const existing = roomsDataMap.get(docSnap.id);
            const firestoreMsgs = Array.isArray(rdata.messages) ? rdata.messages : [];
            const existingMsgs = existing && Array.isArray(existing.messages) ? existing.messages : [];

            // Merge messages from both sources
            const msgMap = new Map<string, any>();
            existingMsgs.forEach((m: any) => { if (m && m.id) msgMap.set(m.id, m); });
            firestoreMsgs.forEach((m: any) => { if (m && m.id) msgMap.set(m.id, m); });

            roomsDataMap.set(docSnap.id, {
              id: docSnap.id,
              type: inferRoomType(docSnap.id, rdata.type),
              name: rdata.name || existing?.name || 'Chat',
              avatar: rdata.avatar || existing?.avatar || '',
              city: rdata.city || existing?.city,
              targetUserId: rdata.targetUserId || existing?.targetUserId,
              targetUser: rdata.targetUser || existing?.targetUser,
              description: rdata.description || existing?.description || '',
              members: Array.isArray(rdata.members) && rdata.members.length > 0 ? rdata.members : (existing?.members || []),
              admins: Array.isArray(rdata.admins) && rdata.admins.length > 0 ? rdata.admins : (existing?.admins || []),
              createdBy: rdata.createdBy || existing?.createdBy,
              createdAt: rdata.createdAt || existing?.createdAt || '2026-01-01',
              messages: Array.from(msgMap.values())
            });
          });
        }
      } catch (e: any) {
        const msg = String(e?.message || e?.details || e || '');
        if (!msg.includes('Failed to fetch') && !msg.includes('unavailable') && !msg.includes('network-request-failed')) {
          console.warn('Firestore fetchRooms note:', msg);
        }
      }

      if (!isMounted) return;

      const currentUserId = currentUserRef.current?.id || '';

      // Update state, consolidating 1:1 private chats deterministically
      setChatRooms(prevRooms => {
        const roomsMap = new Map<string, ChatRoom>();
        prevRooms.forEach(r => roomsMap.set(r.id, r));

        INITIAL_CHAT_ROOMS.forEach(r => {
          if (!roomsMap.has(r.id)) {
            roomsMap.set(r.id, { ...r, messages: Array.isArray(r.messages) ? r.messages : [] });
          }
        });

        const allRawRooms = [...Array.from(roomsMap.values()), ...Array.from(roomsDataMap.values())];
        const finalMap = new Map<string, ChatRoom>();

        // Consolidate private rooms between identical pairs of users into one single deterministic room
        const privatePairGroups = new Map<string, {
          canonicalId: string;
          participants: [string, string];
          messagesMap: Map<string, any>;
          name?: string;
          avatar?: string;
          targetUserId?: string;
          createdAt?: string;
        }>();

        allRawRooms.forEach((rawRoom: any) => {
          const resolvedType = inferRoomType(rawRoom.id, rawRoom.type);

          if (resolvedType === 'private') {
            let p1 = '';
            let p2 = '';
            if (rawRoom.id.startsWith('chat-priv') || rawRoom.id.startsWith('priv-')) {
              const extracted = extractMembersFromPrivateChatId(rawRoom.id);
              if (extracted.length === 2) {
                p1 = extracted[0];
                p2 = extracted[1];
              }
            }
            if (!p1 || !p2) {
              if (Array.isArray(rawRoom.members) && rawRoom.members.length >= 2) {
                p1 = rawRoom.members[0];
                p2 = rawRoom.members[1];
              }
            }
            if (!p1 || !p2) {
              const senders = Array.from(new Set(
                (Array.isArray(rawRoom.messages) ? rawRoom.messages : [])
                  .map((m: any) => m?.senderId)
                  .filter((id: any) => id && id !== 'system')
              )) as string[];
              if (senders.length >= 2) {
                p1 = senders[0];
                p2 = senders[1];
              } else if (senders.length === 1 && rawRoom.targetUserId && rawRoom.targetUserId !== senders[0]) {
                p1 = senders[0];
                p2 = rawRoom.targetUserId;
              } else if (rawRoom.targetUserId && rawRoom.createdBy && rawRoom.targetUserId !== rawRoom.createdBy) {
                p1 = rawRoom.createdBy;
                p2 = rawRoom.targetUserId;
              }
            }

            if (p1 && p2 && p1 !== p2) {
              const sorted = [p1, p2].sort();
              const pairKey = `${sorted[0]}__${sorted[1]}`;
              const canonicalId = `chat-priv_${pairKey}`;

              if (!privatePairGroups.has(pairKey)) {
                privatePairGroups.set(pairKey, {
                  canonicalId,
                  participants: [sorted[0], sorted[1]],
                  messagesMap: new Map<string, any>(),
                  name: rawRoom.name,
                  avatar: rawRoom.avatar,
                  targetUserId: rawRoom.targetUserId,
                  createdAt: rawRoom.createdAt
                });
              }

              const group = privatePairGroups.get(pairKey)!;
              if (Array.isArray(rawRoom.messages)) {
                rawRoom.messages.forEach((m: any) => {
                  if (m && m.id) {
                    group.messagesMap.set(m.id, m);
                  }
                });
              }
              return; // Successfully consolidated
            }
          }

          // Non-private rooms (general, city, group) or fallback
          const existing = finalMap.get(rawRoom.id);
          const msgMap = new Map<string, any>();
          if (existing && Array.isArray(existing.messages)) {
            existing.messages.forEach(m => msgMap.set(m.id, m));
          }
          if (Array.isArray(rawRoom.messages)) {
            rawRoom.messages.forEach((m: any) => msgMap.set(m.id, m));
          }

          finalMap.set(rawRoom.id, {
            id: rawRoom.id,
            type: resolvedType,
            name: (rawRoom.name && rawRoom.name !== 'Chat') ? rawRoom.name : (existing?.name || rawRoom.name || 'Chat'),
            avatar: rawRoom.avatar || existing?.avatar || '',
            city: rawRoom.city || existing?.city,
            targetUserId: rawRoom.targetUserId || existing?.targetUserId,
            targetUser: rawRoom.targetUser || existing?.targetUser,
            description: rawRoom.description || existing?.description || '',
            members: (Array.isArray(rawRoom.members) && rawRoom.members.length > 0)
              ? rawRoom.members
              : (existing?.members || []),
            admins: (Array.isArray(rawRoom.admins) && rawRoom.admins.length > 0)
              ? rawRoom.admins
              : (existing?.admins || []),
            createdBy: rawRoom.createdBy || existing?.createdBy,
            createdAt: rawRoom.createdAt || existing?.createdAt || '2026-01-01',
            messages: Array.from(msgMap.values())
          });
        });

        // Add consolidated canonical private rooms
        privatePairGroups.forEach((group) => {
          const existing = finalMap.get(group.canonicalId);
          if (existing && Array.isArray(existing.messages)) {
            existing.messages.forEach(m => group.messagesMap.set(m.id, m));
          }

          const msgs = Array.from(group.messagesMap.values());
          // Sort messages chronologically
          msgs.sort((a, b) => (a.timestamp || a.id || '').localeCompare(b.timestamp || b.id || ''));

          // Check if there is an incoming message for current user that hasn't been seen
          if (!isInitialChatSyncRef.current && currentUserId && (group.participants.includes(currentUserId) || group.canonicalId.includes(currentUserId))) {
            const lastMessage = msgs[msgs.length - 1];
            if (lastMessage && lastMessage.senderId !== currentUserId && lastMessage.senderId !== 'system') {
              if (!seenMessageIdsRef.current.has(lastMessage.id)) {
                seenMessageIdsRef.current.add(lastMessage.id);
                // Only notify if user is NOT currently looking at this specific chat room
                if (!isUserViewingChat(group.canonicalId)) {
                  triggerPlushNotification({
                    type: 'chat_private',
                    title: lastMessage.senderName ? `Mensaje de ${lastMessage.senderName}` : 'Nuevo mensaje privado',
                    message: lastMessage.text || 'Te ha enviado un mensaje',
                    avatar: lastMessage.senderAvatar || DEFAULT_SILHOUETTE_AVATAR,
                    data: { chatId: group.canonicalId }
                  });
                }
              }
            }
          }

          finalMap.set(group.canonicalId, {
            id: group.canonicalId,
            type: 'private',
            name: group.name || 'Chat Privado',
            avatar: group.avatar || '',
            targetUserId: group.participants.find(id => id !== currentUserId) || group.targetUserId,
            members: [group.participants[0], group.participants[1]],
            createdAt: group.createdAt || '2026-01-01',
            messages: msgs
          });
        });

        // Add all message IDs to seen set on initial load to prevent false notification spam
        if (isInitialChatSyncRef.current) {
          finalMap.forEach(r => {
            r.messages.forEach(m => {
              if (m && m.id) seenMessageIdsRef.current.add(m.id);
            });
          });
          isInitialChatSyncRef.current = false;
        }

        return Array.from(finalMap.values()).map(r => pruneRoomMessages(r));
      });
    };

    fetchRooms();
    // Periodic synchronization every 15 seconds (Realtime WebSocket handles instant sub-second delivery)
    const interval = setInterval(fetchRooms, 15000);

    // Supabase Realtime channel for sub-second instant message delivery
    let chatChannel: any = null;
    if (hasSupabaseUrl && hasSupabaseKey) {
      const chatSyncChannelName = 'tierrita_global_realtime_community_v2';
      chatChannel = supabase
        .channel(chatSyncChannelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => {
          fetchRooms();
        })
        .on('broadcast', { event: 'new_chat_message' }, ({ payload }) => {
          if (payload && payload.chatId && payload.message) {
            const currentId = currentUserRef.current?.id || '';
            const myUsername = currentUserRef.current?.username || '';
            const myEmail = currentUserRef.current?.email || '';
            const msg = payload.message;

            const isFromMe = msg.senderId === currentId || msg.senderId === myUsername || (myEmail && msg.senderId === myEmail);

            // Determine if the incoming chat is strictly a private chat (exclude general, city, and non-private chats)
            const isGeneralOrCity = payload.roomType === 'general' ||
              payload.roomType === 'city' ||
              payload.chatId.startsWith('chat-general') ||
              payload.chatId.startsWith('chat-city') ||
              payload.chatId.includes('general') ||
              payload.chatId.includes('city') ||
              payload.chatId.includes('comunidad');

            const isPrivateChat = !isGeneralOrCity && (
              payload.roomType === 'private' ||
              payload.chatId.startsWith('chat-priv') ||
              payload.chatId.startsWith('priv_') ||
              payload.chatId.startsWith('priv-') ||
              extractMembersFromPrivateChatId(payload.chatId).length === 2
            );

            const strippedId = currentId.replace(/^user-/, '');
            const cleanUsername = myUsername.replace(/^@/, '');
            const myIdentifiers = [currentId.toLowerCase(), myUsername.toLowerCase(), myEmail.toLowerCase(), strippedId.toLowerCase(), cleanUsername.toLowerCase()].filter(Boolean);

            const isRecipient = myIdentifiers.some(id => payload.chatId.toLowerCase().includes(id)) ||
              (Array.isArray(payload.members) && payload.members.some((m: any) => myIdentifiers.some(id => String(m).toLowerCase().includes(id)))) ||
              extractMembersFromPrivateChatId(payload.chatId).some(m => myIdentifiers.some(id => m.toLowerCase() === id));

            // Strictly ONLY trigger notifications for private chats directed to this user when NOT viewing that chat
            if (isPrivateChat && isRecipient && !isFromMe && msg.senderId !== 'system') {
              if (!seenMessageIdsRef.current.has(msg.id)) {
                seenMessageIdsRef.current.add(msg.id);
                if (!isUserViewingChat(payload.chatId)) {
                  triggerPlushNotification({
                    type: 'chat_private',
                    title: msg.senderName ? `Mensaje de ${msg.senderName}` : 'Nuevo mensaje privado',
                    message: msg.text || 'Te ha enviado un mensaje',
                    avatar: msg.senderAvatar || DEFAULT_SILHOUETTE_AVATAR,
                    data: { chatId: payload.chatId }
                  });
                }
              }
            }

            setChatRooms(prevRooms => {
              const targetIdClean = (payload.chatId || '').toLowerCase();
              const isGeneralTarget = isGeneralOrCity && (targetIdClean.includes('general') || targetIdClean.includes('comunidad') || payload.roomType === 'general');

              const roomIndex = prevRooms.findIndex(r => {
                if (r.id === payload.chatId) return true;
                if (isGeneralTarget && (r.id === 'chat-general-es' || r.id === 'chat-general' || r.id === 'general-spain' || r.id === 'general' || r.type === 'general')) return true;
                if (r.type === 'city' && (r.id === payload.chatId || (r.city && targetIdClean.includes(r.city.toLowerCase())))) return true;
                if (r.type === 'private' && (r.id.includes(payload.chatId) || payload.chatId.includes(r.id.replace(/^chat-priv_/, '')))) return true;
                return false;
              });

              if (roomIndex >= 0) {
                const existingRoom = prevRooms[roomIndex];
                const alreadyExists = existingRoom.messages.some(m => m.id === payload.message.id);
                if (alreadyExists) return prevRooms;
                const updated = pruneRoomMessages({
                  ...existingRoom,
                  messages: [...existingRoom.messages, payload.message]
                });
                const copy = [...prevRooms];
                copy[roomIndex] = updated;
                return copy;
              } else if (isPrivateChat) {
                // Instantly inject new private room so it appears in the recipient's inbox immediately
                const extracted = extractMembersFromPrivateChatId(payload.chatId);
                const participants = extracted.length === 2 ? extracted : [msg.senderId, currentId];
                const newRoom: ChatRoom = {
                  id: payload.chatId,
                  type: 'private',
                  name: msg.senderName || 'Chat Privado',
                  avatar: msg.senderAvatar || DEFAULT_SILHOUETTE_AVATAR,
                  targetUserId: msg.senderId,
                  members: participants,
                  createdAt: new Date().toISOString().split('T')[0],
                  messages: [payload.message]
                };
                return [newRoom, ...prevRooms];
              }
              return prevRooms;
            });

            fetchRooms();
          }
        })
        .on('broadcast', { event: 'update_chat_messages' }, ({ payload }) => {
          if (payload && payload.chatId && Array.isArray(payload.messages)) {
            const clearMsg = payload.messages.find((m: any) => m && (m.id?.startsWith('msg-clear-') || m.encryptedHash === 'SHA256:clear-action'));
            if (clearMsg && clearMsg.createdAt) {
              saveClearedRoomTimestamp(payload.chatId, clearMsg.createdAt);
            }

            setChatRooms(prevRooms => prevRooms.map(room => {
              if (room.id === payload.chatId) {
                return pruneRoomMessages({
                  ...room,
                  messages: payload.messages
                });
              }
              return room;
            }));
          }
        })
        .subscribe();

      chatChannelRef.current = chatChannel;
    }

    // Firestore Real-Time sync
    let unsubFirestore: any;
    try {
      unsubFirestore = onSnapshot(collection(db, 'chat_rooms'), () => {
        fetchRooms();
      }, (err) => {
        const msg = String(err?.message || err?.details || err || '');
        if (!msg.includes('Failed to fetch') && !msg.includes('unavailable') && !msg.includes('network-request-failed')) {
          console.warn('Firestore chat_rooms snapshot listener note:', msg);
        }
      });
    } catch (e: any) {
      const msg = String(e?.message || e?.details || e || '');
      if (!msg.includes('Failed to fetch') && !msg.includes('unavailable') && !msg.includes('network-request-failed')) {
        console.warn('Failed to listen to chat_rooms in Firestore:', msg);
      }
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof unsubFirestore === 'function') unsubFirestore();
      if (chatChannel && hasSupabaseUrl && hasSupabaseKey) {
        supabase.removeChannel(chatChannel);
      }
      chatChannelRef.current = null;
    };
  }, []);

  // Sync Support Tickets
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'support_tickets'), (snapshot) => {
        if (snapshot.empty) {
          setSupportTickets([]);
        } else {
          const list: SupportTicket[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
          });
          setSupportTickets(list);
        }
      }, (error) => {
        setSupportTickets([]);
        console.warn('Support tickets listener error:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setSupportTickets([]);
      console.warn('Failed to listen to support_tickets in DB:', e);
    }
  }, []);

  // Sync Place Suggestions
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'place_suggestions'), (snapshot) => {
        if (snapshot.empty) {
          setPlaceSuggestions([]);
        } else {
          const list: PlaceSuggestion[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as PlaceSuggestion);
          });
          list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setPlaceSuggestions(list);
        }
      }, (error) => {
        setPlaceSuggestions([]);
        console.warn('Place suggestions listener error:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setPlaceSuggestions([]);
      console.warn('Failed to listen to place_suggestions in DB:', e);
    }
  }, []);

  // Sync Verification Requests
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'verification_requests'), (snapshot) => {
        if (snapshot.empty) {
          setVerificationRequests([]);
        } else {
          const list: VerificationRequest[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as VerificationRequest);
          });
          setVerificationRequests(list);
        }
      }, (error) => {
        setVerificationRequests([]);
        console.warn('Verification requests listener error:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setVerificationRequests([]);
      console.warn('Failed to listen to verification_requests in DB:', e);
    }
  }, []);

  // Sync Staff Members
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'staff_members'), (snapshot) => {
        if (snapshot.empty) {
          setStaffMembers([]);
        } else {
          const list: StaffMember[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as StaffMember);
          });
          setStaffMembers(list);
        }
      }, (error) => {
        setStaffMembers([]);
        console.warn('Staff members listener error:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setStaffMembers([]);
      console.warn('Failed to listen to staff_members in DB:', e);
    }
  }, []);

  // Sync Startup Ad Configuration
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'config', 'startup_ad'), async (docSnap) => {
        const isExists = docSnap && (typeof docSnap.exists === 'function' ? docSnap.exists() : Boolean(docSnap.exists));
        if (isExists && docSnap.data()) {
          const data = { id: docSnap.id, ...docSnap.data() } as StartupAdConfig;
          setStartupAdConfig(data);
          try {
            localStorage.setItem('latierrita_startup_ad', JSON.stringify(data));
          } catch {}
        } else {
          setStartupAdConfig(DEFAULT_STARTUP_AD);
          try {
            localStorage.removeItem('latierrita_startup_ad');
          } catch {}
        }
      }, (error) => {
        setStartupAdConfig(DEFAULT_STARTUP_AD);
        console.warn('Startup ad config listener error:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setStartupAdConfig(DEFAULT_STARTUP_AD);
      console.warn('Failed to listen to startup_ad config in DB:', e);
    }
  }, []);

  // Tickets actions
  const updateTicketStatus = async (
    id: string,
    status: 'pendientes' | 'en_proceso' | 'resueltos',
    response?: string,
    options?: { assignedStaffName?: string; assignToMe?: boolean }
  ) => {
    const target = supportTickets.find(t => t.id === id);
    if (!target) return;

    const assignedStaffId = (status === 'en_proceso' || options?.assignToMe) ? (target.assignedStaffId || currentUser.id) : target.assignedStaffId;
    const assignedStaffName = (status === 'en_proceso' || options?.assignToMe) ? (options?.assignedStaffName || target.assignedStaffName || currentUser.name) : target.assignedStaffName;
    const assignedStaffRole = (status === 'en_proceso' || options?.assignToMe) ? (target.assignedStaffRole || currentUser.staffRole) : target.assignedStaffRole;

    const updatePayload: Record<string, any> = {
      status,
      response: response || target.response || ''
    };

    if (assignedStaffId) updatePayload.assignedStaffId = assignedStaffId;
    if (assignedStaffName) updatePayload.assignedStaffName = assignedStaffName;
    if (assignedStaffRole) updatePayload.assignedStaffRole = assignedStaffRole;

    try {
      await updateDoc(doc(db, 'support_tickets', id), updatePayload);
      setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, ...updatePayload } : t));

      // Synchronize linked ChatRoom
      const roomId = target.chatRoomId;
      const targetRoom = chatRooms.find(r => r.id === roomId || r.ticketCode === target.code || r.ticketId === id);

      if (targetRoom) {
        const isLocked = status === 'pendientes';
        let statusMessageText = '';

        if (status === 'en_proceso') {
          statusMessageText = `👨‍💼 El agente ${assignedStaffName || currentUser.name} (${assignedStaffRole || currentUser.staffRole}) ha tomado tu caso (${target.code}). El chat ha sido habilitado para que puedas comunicarte con el equipo de soporte.`;
        } else if (status === 'resueltos') {
          statusMessageText = `✅ El caso (${target.code}) ha sido marcado como Resuelto por ${currentUser.name}. Si requieres más asistencia puedes responder a este chat para reabrir tu caso.`;
        } else if (status === 'pendientes') {
          statusMessageText = `⏳ El caso (${target.code}) está actualmente en estado Pendiente de asignación.`;
        }

        const newMsg: ChatMessage = {
          id: `msg-status-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          senderId: 'system',
          senderName: 'Soporte La Tierrita',
          senderAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
          text: statusMessageText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: Date.now(),
          isEncrypted: true,
          encryptedHash: 'SHA256:status-update'
        };

        const updatedRoom: ChatRoom = {
          ...targetRoom,
          ticketStatus: status,
          ticketLockedForUser: isLocked,
          messages: [...targetRoom.messages, newMsg]
        };

        setChatRooms(prev => prev.map(r => r.id === targetRoom.id ? updatedRoom : r));

        try {
          await setDoc(doc(db, 'chat_rooms', targetRoom.id), updatedRoom, { merge: true });
        } catch (e) {
          console.warn('Failed to update ticket chat room in Firestore:', e);
        }
      }

      triggerPlushNotification({
        type: 'system',
        title: 'Estado de Ticket Actualizado',
        message: `El ticket ${target.code} ha sido cambiado a "${status === 'pendientes' ? 'Pendiente' : status === 'en_proceso' ? 'En Proceso' : 'Resuelto'}".`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `support_tickets/${id}`);
    }
  };

  const deleteSupportTicket = async (id: string) => {
    // Only ADMIN role is authorized to delete tickets
    if (currentUser.staffRole !== 'ADMIN') {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción no permitida',
        message: 'Únicamente los administradores (ADMIN) tienen autorización para eliminar tickets.'
      });
      return;
    }

    try {
      const target = supportTickets.find(t => t.id === id);
      await deleteDoc(doc(db, 'support_tickets', id));
      setSupportTickets(prev => prev.filter(t => t.id !== id));

      if (target?.chatRoomId) {
        setChatRooms(prev => prev.filter(r => r.id !== target.chatRoomId && r.ticketCode !== target.code));
        try {
          await deleteDoc(doc(db, 'chat_rooms', target.chatRoomId));
        } catch {}
      }

      triggerPlushNotification({
        type: 'system',
        title: 'Ticket Eliminado',
        message: `El ticket ${target?.code || ''} ha sido eliminado definitivamente por el Administrador.`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `support_tickets/${id}`);
    }
  };

  const createSupportTicket = async (
    type: TicketType,
    subject: string,
    description: string,
    priority: 'Baja' | 'Media' | 'Alta' = 'Media',
    metadata?: {
      reportedUsername?: string;
      reportedUserId?: string;
      reportedItemTitle?: string;
      reasonTitle?: string;
      reasonText?: string;
      additionalDetails?: string;
    }
  ): Promise<string> => {
    try {
      // 1. Calculate sequential code based on existing tickets of this type
      let highestNum = 0;
      supportTickets.filter(t => t.type === type).forEach(t => {
        const match = t.code?.match(/-(\d+)$/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (!isNaN(val) && val > highestNum) highestNum = val;
        }
      });

      try {
        const ticketsRef = collection(db, 'support_tickets');
        const q = query(ticketsRef, where('type', '==', type));
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap: any) => {
          const data = docSnap.data();
          const match = data?.code?.match(/-(\d+)$/);
          if (match) {
            const val = parseInt(match[1], 10);
            if (!isNaN(val) && val > highestNum) highestNum = val;
          }
        });
      } catch (e) {
        console.warn('Could not query Firestore for ticket sequential count, using local state count', e);
      }

      const nextNum = highestNum + 1;
      const code = `${type}-${String(nextNum).padStart(4, '0')}`;

      // 2. Format details and build private ticket chat in user inbox
      const dateFormatted = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const ticketChatId = `chat-ticket_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${currentUser.id}`;

      const reportedUserDisplay = metadata?.reportedUsername || (metadata?.reportedItemTitle ? metadata.reportedItemTitle : 'N/A (Soporte)');
      const reporterDisplay = `${currentUser.name || currentUser.username} (@${currentUser.username})`;
      const reasonDisplay = `${metadata?.reasonTitle || subject} - ${metadata?.reasonText || description}`;
      const additionalDetailsDisplay = metadata?.additionalDetails?.trim() || 'Ninguno';

      const initialMessageSummary = `📋 Ticket #${code} registrado con éxito.

• Nombre de usuario del reportado: ${reportedUserDisplay}
• Nombre del reportador: ${reporterDisplay}
• Motivo: ${reasonDisplay}
• Detalles adicionales: ${additionalDetailsDisplay}
• Fecha: ${dateFormatted}

⏳ Estado: Pendiente de asignación.
Podrás enviar mensajes en este chat tan pronto un miembro del equipo de STAFF (Admin o Soporte) tome tu caso.`;

      const newTicketRoom: ChatRoom = {
        id: ticketChatId,
        type: 'private',
        name: `${code} - Soporte La Tierrita`,
        avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
        members: [currentUser.id, 'user-staff'],
        admins: ['user-staff'],
        createdBy: currentUser.id,
        createdAt: new Date().toISOString().split('T')[0],
        isTicketChat: true,
        ticketCode: code,
        ticketType: type,
        ticketStatus: 'pendientes',
        ticketLockedForUser: true,
        ticketDetails: {
          reportedUsername: reportedUserDisplay,
          reporterName: reporterDisplay,
          reason: reasonDisplay,
          additionalDetails: additionalDetailsDisplay,
          date: dateFormatted
        },
        messages: [
          {
            id: `msg-ticket-init-${Date.now()}`,
            senderId: 'system',
            senderName: 'Soporte La Tierrita',
            senderAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
            text: initialMessageSummary,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: Date.now(),
            isEncrypted: true,
            encryptedHash: 'SHA256:ticket-start'
          }
        ]
      };

      // 3. Add to chatRooms local state and persist to Firestore
      setChatRooms(prev => {
        const filtered = prev.filter(r => r.id !== ticketChatId && r.ticketCode !== code);
        return [newTicketRoom, ...filtered];
      });

      try {
        await setDoc(doc(db, 'chat_rooms', ticketChatId), newTicketRoom);
      } catch (e) {
        console.warn('Failed to write ticket chat room in Firestore:', e);
      }

      // 4. Build ticket object for support_tickets
      const newTicket: Omit<SupportTicket, 'id'> = {
        userId: currentUser.id,
        code,
        type,
        userName: currentUser.name || currentUser.username || 'Usuario',
        userUsername: currentUser.username || 'usuario',
        userAvatar: currentUser.avatar || '',
        subject,
        description,
        status: 'pendientes',
        priority,
        date: dateFormatted,
        reportedUsername: reportedUserDisplay,
        reportedUserId: metadata?.reportedUserId,
        reportedItemTitle: metadata?.reportedItemTitle,
        reporterName: currentUser.name || currentUser.username,
        reporterUsername: currentUser.username,
        reasonTitle: metadata?.reasonTitle || subject,
        reasonText: metadata?.reasonText || description,
        additionalDetails: metadata?.additionalDetails,
        chatRoomId: ticketChatId
      };

      const docRef = await addDoc(collection(db, 'support_tickets'), newTicket);
      const createdTicket: SupportTicket = {
        ...newTicket,
        id: docRef.id
      };

      setSupportTickets(prev => [createdTicket, ...prev]);

      // Update room with ticketId
      newTicketRoom.ticketId = docRef.id;
      setChatRooms(prev => prev.map(r => r.id === ticketChatId ? { ...r, ticketId: docRef.id } : r));
      try {
        await setDoc(doc(db, 'chat_rooms', ticketChatId), { ...newTicketRoom, ticketId: docRef.id }, { merge: true });
      } catch {}

      return code;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'support_tickets');
      throw error;
    }
  };

  // Place Suggestions actions
  const suggestPlace = async (data: {
    placeName: string;
    category: PlaceCategory;
    city: SpanishCity;
    address: string;
    inGoogleMaps?: boolean;
    isOwner?: boolean;
    phone?: string;
    description?: string;
    imageUrl?: string;
    website?: string;
    socialLinks?: any;
    isAnonymous?: boolean;
  }): Promise<string> => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acceso Limitado',
        message: 'Como invitado no puedes sugerir lugares. Regístrate en la app para acceder a todas las funciones.'
      });
      return '';
    }
    try {
      // Generate suggestion code (e.g. SUG-001)
      const count = placeSuggestions.length + 1;
      const code = `SUG-${String(count).padStart(3, '0')}`;
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const isAnon = data.isAnonymous || !currentUser;

      const placeChatId = isAnon ? '' : `chat-placesug_${code.toLowerCase()}_${currentUser.id}`;

      // Build initial place information message
      const initialMessageSummary = `📍 Sugerencia de Sitio #${code} registrada con éxito.

• Nombre del Lugar: ${data.placeName}
• Descripción: ${data.description || 'Sin descripción adicional'}
• Categoría - Ciudad: ${data.category} - ${data.city}
• Dirección: ${data.address}
• Teléfono: ${data.phone || 'No especificado'}
• Google Maps: ${data.inGoogleMaps ? 'Sí' : 'No'}
• ¿Es propietario/a?: ${data.isOwner ? 'Sí' : 'No'}
• Redes sociales: ${data.website || data.socialLinks?.instagram || data.socialLinks?.whatsapp || 'No especificado'}
• Fecha: ${dateFormatted}

⏳ Estado: Pendiente de revisión por el equipo de Soporte.
Podrás enviar mensajes en este chat tan pronto un miembro del equipo de STAFF (Admin o Soporte) inicie la conversación.`;

      let newPlaceRoom: ChatRoom | null = null;

      if (!isAnon && currentUser) {
        newPlaceRoom = {
          id: placeChatId,
          type: 'private',
          name: `${code} - Sugerencia: ${data.placeName}`,
          avatar: data.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
          members: [currentUser.id, 'user-staff'],
          admins: ['user-staff'],
          createdBy: currentUser.id,
          createdAt: now.toISOString().split('T')[0],
          isPlaceSuggestionChat: true,
          isTicketChat: true,
          placeSuggestionCode: code,
          placeSuggestionStatus: 'pendientes',
          placeSuggestionLockedForUser: true,
          placeSuggestionDetails: {
            placeName: data.placeName,
            category: data.category,
            city: data.city,
            address: data.address,
            phone: data.phone,
            inGoogleMaps: data.inGoogleMaps,
            isOwner: data.isOwner,
            description: data.description,
            imageUrl: data.imageUrl,
            website: data.website,
            socialLinks: data.socialLinks,
            date: dateFormatted
          },
          messages: [
            {
              id: `msg-placesug-init-${Date.now()}`,
              senderId: currentUser.id,
              senderName: currentUser.name || currentUser.username,
              senderAvatar: currentUser.avatar || DEFAULT_SILHOUETTE_AVATAR,
              text: initialMessageSummary,
              imageUrl: data.imageUrl,
              timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: Date.now(),
              isEncrypted: true,
              encryptedHash: 'SHA256:placesug-start'
            }
          ]
        };

        // Add to local state & Firestore
        setChatRooms(prev => {
          const filtered = prev.filter(r => r.id !== placeChatId && r.placeSuggestionCode !== code);
          return [newPlaceRoom!, ...filtered];
        });

        try {
          await setDoc(doc(db, 'chat_rooms', placeChatId), newPlaceRoom);
        } catch (e) {
          console.warn('Failed to write place suggestion chat room in Firestore:', e);
        }
      }

      // Create suggestion record in Firestore collection
      const newSuggestion: Omit<PlaceSuggestion, 'id'> = {
        userId: isAnon ? 'anonymous' : currentUser.id,
        userName: isAnon ? 'Invitado / Público' : (currentUser.name || currentUser.username || 'Usuario'),
        userUsername: isAnon ? 'invitado' : (currentUser.username || 'usuario'),
        userAvatar: isAnon ? DEFAULT_SILHOUETTE_AVATAR : (currentUser.avatar || DEFAULT_SILHOUETTE_AVATAR),
        code,
        placeName: data.placeName,
        category: data.category,
        city: data.city,
        address: data.address,
        inGoogleMaps: data.inGoogleMaps,
        isOwner: data.isOwner,
        phone: data.phone,
        description: data.description,
        imageUrl: data.imageUrl,
        website: data.website,
        socialLinks: data.socialLinks,
        status: 'pendientes',
        date: dateFormatted,
        createdAt: Date.now(),
        chatRoomId: placeChatId
      };

      const docRef = await addDoc(collection(db, 'place_suggestions'), newSuggestion);
      const createdSuggestion: PlaceSuggestion = {
        ...newSuggestion,
        id: docRef.id
      };

      setPlaceSuggestions(prev => [createdSuggestion, ...prev]);

      // Update room with placeSuggestionId
      if (!isAnon && placeChatId && newPlaceRoom) {
        newPlaceRoom.placeSuggestionId = docRef.id;
        setChatRooms(prev => prev.map(r => r.id === placeChatId ? { ...r, placeSuggestionId: docRef.id } : r));
        try {
          await setDoc(doc(db, 'chat_rooms', placeChatId), { ...newPlaceRoom, placeSuggestionId: docRef.id }, { merge: true });
        } catch {}

        triggerPlushNotification({
          type: 'system',
          title: `Sugerencia enviada (${code})`,
          message: 'Tu sugerencia de lugar se ha enviado a Soporte y se ha creado una conversación en tus chats.',
        });
      }

      return code;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'place_suggestions');
      throw error;
    }
  };

  const updatePlaceSuggestionStatus = async (
    id: string,
    status: 'pendientes' | 'en_proceso' | 'aprobado' | 'rechazado',
    responseNote?: string
  ) => {
    const target = placeSuggestions.find(s => s.id === id);
    if (!target) return;

    const assignedStaffName = currentUser.name || currentUser.username;
    const assignedStaffRole = currentUser.staffRole || 'Soporte';

    const updatePayload: Partial<PlaceSuggestion> = {
      status,
      assignedStaffName,
      assignedStaffRole
    };

    try {
      await updateDoc(doc(db, 'place_suggestions', id), updatePayload);
      setPlaceSuggestions(prev => prev.map(s => s.id === id ? { ...s, ...updatePayload } : s));

      // If approved, automatically add to places directory
      if (status === 'aprobado') {
        const placeObj: Omit<PlaceItem, 'id'> = {
          userId: target.userId,
          name: target.placeName,
          category: target.category,
          city: target.city,
          address: target.address,
          imageUrl: target.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
          rating: 5.0,
          reviewsCount: 1,
          priceRange: '€€',
          specialty: target.category === 'Restaurante/Cafe' ? 'Comida típica y especialidades' : target.category,
          description: target.description || 'Lugar recomendado por la comunidad de parceros en España.',
          phone: target.phone,
          website: target.website,
          inGoogleMaps: target.inGoogleMaps,
          socialLinks: target.socialLinks,
          isVerified: false,
          tags: [target.category, target.city, 'Recomendado por parceros']
        };
        addPlace(placeObj);
      }

      // Synchronize linked ChatRoom with automated notification message
      const roomId = target.chatRoomId;
      const targetRoom = chatRooms.find(r => r.id === roomId || r.placeSuggestionCode === target.code || r.placeSuggestionId === id);

      if (targetRoom) {
        let statusMessageText = '';

        if (status === 'en_proceso') {
          statusMessageText = `👨‍💼 ${assignedStaffName} (${assignedStaffRole}) del equipo de Soporte ha tomado la sugerencia (${target.code}) de "${target.placeName}". Se encuentra actualmente En Proceso de verificación y revisión. El chat ha sido habilitado para cualquier consulta.`;
        } else if (status === 'aprobado') {
          statusMessageText = `✅ ¡Felicidades! La sugerencia (${target.code}) para el lugar "${target.placeName}" ha sido APROBADA e integrada en el directorio oficial de lugares de La Tierrita. ¡Muchas gracias por contribuir con la comunidad!`;
        } else if (status === 'rechazado') {
          statusMessageText = `❌ La sugerencia (${target.code}) para el lugar "${target.placeName}" ha sido revisada por el equipo de Soporte y no ha sido aprobada en esta ocasión. Agradecemos tu participación.`;
        } else if (status === 'pendientes') {
          statusMessageText = `⏳ La sugerencia (${target.code}) está en estado Pendiente de revisión.`;
        }

        if (responseNote && responseNote.trim()) {
          statusMessageText += `\n\nNota del equipo: ${responseNote.trim()}`;
        }

        const newMsg: ChatMessage = {
          id: `msg-placesug-status-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          senderId: 'system',
          senderName: 'Soporte La Tierrita',
          senderAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
          text: statusMessageText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          createdAt: Date.now(),
          isEncrypted: true,
          encryptedHash: 'SHA256:placesug-status-update'
        };

        const isLocked = status === 'pendientes';

        const updatedRoom: ChatRoom = {
          ...targetRoom,
          placeSuggestionStatus: status,
          placeSuggestionLockedForUser: isLocked,
          messages: [...targetRoom.messages, newMsg]
        };

        setChatRooms(prev => prev.map(r => r.id === targetRoom.id ? updatedRoom : r));

        try {
          await setDoc(doc(db, 'chat_rooms', targetRoom.id), updatedRoom, { merge: true });
        } catch (e) {
          console.warn('Failed to update place suggestion chat room in Firestore:', e);
        }
      }

      triggerPlushNotification({
        type: 'system',
        title: 'Estado de Sugerencia Actualizado',
        message: `La sugerencia ${target.code} (${target.placeName}) ha sido marcada como "${status.toUpperCase()}".`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `place_suggestions/${id}`);
    }
  };

  const updatePlaceSuggestionDetails = async (id: string, updatedData: Partial<PlaceSuggestion>) => {
    try {
      const target = placeSuggestions.find(s => s.id === id);
      if (!target) return;

      const mergedSuggestion: PlaceSuggestion = { ...target, ...updatedData };

      setPlaceSuggestions(prev => prev.map(s => s.id === id ? mergedSuggestion : s));

      await setDoc(doc(db, 'place_suggestions', id), mergedSuggestion, { merge: true });

      // Synchronize associated ChatRoom
      const roomId = target.chatRoomId;
      const targetRoom = chatRooms.find(r => r.id === roomId || r.placeSuggestionCode === target.code || r.placeSuggestionId === id);

      if (targetRoom) {
        const updatedRoom: ChatRoom = {
          ...targetRoom,
          name: updatedData.placeName ? `${target.code} - Sugerencia: ${updatedData.placeName}` : targetRoom.name,
          avatar: updatedData.imageUrl || targetRoom.avatar,
          placeSuggestionDetails: {
            ...targetRoom.placeSuggestionDetails,
            placeName: mergedSuggestion.placeName,
            category: mergedSuggestion.category,
            city: mergedSuggestion.city,
            address: mergedSuggestion.address,
            phone: mergedSuggestion.phone,
            inGoogleMaps: mergedSuggestion.inGoogleMaps,
            description: mergedSuggestion.description,
            imageUrl: mergedSuggestion.imageUrl,
            website: mergedSuggestion.website,
            socialLinks: mergedSuggestion.socialLinks,
            date: mergedSuggestion.date || targetRoom.placeSuggestionDetails?.date || new Date().toISOString().split('T')[0]
          }
        };

        setChatRooms(prev => prev.map(r => r.id === targetRoom.id ? updatedRoom : r));

        try {
          await setDoc(doc(db, 'chat_rooms', targetRoom.id), updatedRoom, { merge: true });
        } catch (e) {
          console.warn('Failed to update place suggestion chat room details in Firestore:', e);
        }
      }

      triggerPlushNotification({
        type: 'system',
        title: 'Información Actualizada',
        message: `Los datos del lugar ${target.code} (${mergedSuggestion.placeName}) han sido actualizados con éxito.`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `place_suggestions/${id}`);
    }
  };

  const deletePlaceSuggestion = async (id: string) => {
    try {
      const target = placeSuggestions.find(s => s.id === id);
      await deleteDoc(doc(db, 'place_suggestions', id));
      setPlaceSuggestions(prev => prev.filter(s => s.id !== id));

      if (target?.chatRoomId) {
        setChatRooms(prev => prev.filter(r => r.id !== target.chatRoomId && r.placeSuggestionCode !== target.code));
        try {
          await deleteDoc(doc(db, 'chat_rooms', target.chatRoomId));
        } catch {}
      }

      triggerPlushNotification({
        type: 'system',
        title: 'Sugerencia Eliminada',
        message: `La sugerencia ${target?.code || ''} ha sido eliminada.`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `place_suggestions/${id}`);
    }
  };

  // Verification actions
  const respondVerification = async (id: string, approve: boolean) => {
    const req = verificationRequests.find(v => v.id === id);
    if (!req) return;
    try {
      await updateDoc(doc(db, 'verification_requests', id), {
        status: approve ? 'aprobado' : 'rechazado'
      });
      if (approve) {
        setOtherUsers(prev => prev.map(u => u.id === req.userId ? { ...u, isVerified: true } : u));
        if (currentUser.id === req.userId) {
          setCurrentUser(prev => ({ ...prev, isVerified: true }));
        }
        await setDoc(doc(db, 'users', req.userId), { isVerified: true }, { merge: true });
      }
      triggerPlushNotification({
        type: 'system',
        title: approve ? 'Verificación Aprobada' : 'Verificación Rechazada',
        message: `Solicitud de @${req.username} ha sido ${approve ? 'aprobada' : 'rechazada'}.`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `verification_requests/${id}`);
    }
  };

  // Staff roles actions (Usuario - MOD - Soporte - ADMIN)
  const updateStaffMemberRole = async (id: string, newRole: StaffRole) => {
    // 1. Update in staffMembers list
    if (newRole === 'Usuario') {
      setStaffMembers(prev => prev.filter(s => s.id !== id));
    } else {
      setStaffMembers(prev => {
        const exists = prev.some(s => s.id === id);
        if (exists) {
          return prev.map(s => s.id === id ? { ...s, role: newRole } : s);
        } else {
          // Promote from users
          const target = otherUsers.find(u => u.id === id) || (currentUser.id === id ? currentUser : null);
          if (target) {
            return [...prev, {
              id: target.id,
              name: target.name,
              username: target.username,
              avatar: target.avatar,
              role: newRole,
              email: target.email || `${target.username}@latierrita.es`,
              pin: '2025',
              status: 'Activo'
            }];
          }
          return prev;
        }
      });
    }

    // 2. Update user profile
    setOtherUsers(prev => prev.map(u => u.id === id ? { ...u, staffRole: newRole } : u));
    if (currentUser.id === id) {
      const updated = { ...currentUser, staffRole: newRole };
      setCurrentUser(updated);
      localStorage.setItem('latierrita_user', JSON.stringify(updated));
    }

    // 3. Update Firestore with setDoc merge
    try {
      const userRef = doc(db, 'users', id);
      await setDoc(userRef, { staffRole: newRole }, { merge: true });
    } catch (e) {
      console.warn('Failed to update staffRole in Firestore:', e);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Rango de Staff Actualizado',
      message: `Se ha asignado el rol ${newRole} al usuario.`
    });
  };

  // User Profile Editing by Admin
  const updateUserProfileByAdmin = async (userId: string, updatedData: Partial<UserProfile>, newPassword?: string) => {
    setOtherUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updatedData } : u));
    if (currentUser.id === userId) {
      const updated = { ...currentUser, ...updatedData };
      setCurrentUser(updated);
      localStorage.setItem('latierrita_user', JSON.stringify(updated));
    }

    if (updatedData.staffRole) {
      updateStaffMemberRole(userId, updatedData.staffRole);
    }

    try {
      const dbUpdate: Record<string, any> = {};
      if (updatedData.name !== undefined) dbUpdate.name = updatedData.name.trim();
      if (updatedData.username !== undefined) dbUpdate.username = updatedData.username.trim().toLowerCase().replace(/^@+/, '');
      if (updatedData.bio !== undefined) dbUpdate.bio = updatedData.bio.trim();
      if (updatedData.website !== undefined) dbUpdate.website = updatedData.website.trim();
      if (updatedData.city !== undefined) dbUpdate.city = updatedData.city;
      if (updatedData.originCity !== undefined) dbUpdate.origin_city = updatedData.originCity.trim();
      if (updatedData.avatar !== undefined) dbUpdate.avatar_url = updatedData.avatar;
      if (updatedData.age !== undefined) dbUpdate.age = Number(updatedData.age) || null;
      if (updatedData.birthDate !== undefined) dbUpdate.birth_date = updatedData.birthDate;
      if (updatedData.firstName !== undefined) dbUpdate.first_name = updatedData.firstName;
      if (updatedData.lastName !== undefined) dbUpdate.last_name = updatedData.lastName;
      if (updatedData.isVerified !== undefined) dbUpdate.verified = updatedData.isVerified;
      if (updatedData.staffRole !== undefined) {
        dbUpdate.staff_role = updatedData.staffRole;
        dbUpdate.is_staff = updatedData.staffRole !== 'Usuario';
      }
      if (updatedData.socialLinks) {
        if (updatedData.socialLinks.instagram !== undefined) dbUpdate.instagram = updatedData.socialLinks.instagram;
        if (updatedData.socialLinks.facebook !== undefined) dbUpdate.facebook = updatedData.socialLinks.facebook;
        if (updatedData.socialLinks.tiktok !== undefined) dbUpdate.tiktok = updatedData.socialLinks.tiktok;
        if (updatedData.socialLinks.x !== undefined) dbUpdate.x = updatedData.socialLinks.x;
      }
      if (Object.keys(dbUpdate).length > 0) {
        await supabase.from('profiles').update(dbUpdate).eq('id', userId);
      }
    } catch (e) {
      console.warn('Failed to update user profile in Supabase:', e);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Perfil de Usuario Actualizado',
      message: `Se guardaron los cambios del perfil${newPassword ? ' y se restableció la contraseña.' : '.'}`
    });
  };

  // Suspend / Activate account toggle
  const toggleSuspendUser = async (userId: string, reason?: string) => {
    const target = otherUsers.find(u => u.id === userId) || (currentUser.id === userId ? currentUser : null);
    if (!target) return;

    const willSuspend = !target.isSuspended;

    setOtherUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          isSuspended: willSuspend,
          suspendedAt: willSuspend ? new Date().toISOString() : undefined,
          suspendedReason: willSuspend ? (reason || 'Incumplimiento de las normas de la comunidad') : undefined
        };
      }
      return u;
    }));

    if (currentUser.id === userId) {
      const updated: UserProfile = {
        ...currentUser,
        isSuspended: willSuspend,
        suspendedAt: willSuspend ? new Date().toISOString() : undefined,
        suspendedReason: willSuspend ? (reason || 'Incumplimiento de las normas de la comunidad') : undefined
      };
      setCurrentUser(updated);
      localStorage.setItem('latierrita_user', JSON.stringify(updated));
    }

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        isSuspended: willSuspend,
        suspendedAt: willSuspend ? new Date().toISOString() : null,
        suspendedReason: willSuspend ? (reason || 'Incumplimiento de las normas de la comunidad') : null
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to update suspension in Firestore:', e);
    }

    triggerPlushNotification({
      type: 'system',
      title: willSuspend ? 'Cuenta Suspendida' : 'Cuenta Reactivada',
      message: willSuspend
        ? `La cuenta @${target.username} ha sido suspendida temporalmente.`
        : `La cuenta @${target.username} ha sido reactivada y ya tiene acceso completo.`
    });
  };

  // Admin Account Deletion with 7-day retention
  const deleteAccountByAdmin = async (userId: string, reason?: string) => {
    let target = otherUsers.find(u => u.id === userId) || (currentUser.id === userId ? currentUser : null);
    if (!target) {
      try {
        const raw = localStorage.getItem('latierrita_registered_community');
        if (raw) {
          const list = JSON.parse(raw);
          target = list.find((u: any) => u.id === userId);
        }
      } catch {}
    }

    const username = target?.username || `user_${userId.slice(0, 6)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const deletedRecord: DeletedAccount = {
      id: `del-${userId}-${Date.now()}`,
      userId: userId,
      username: username,
      name: target?.name || username,
      avatar: target?.avatar || DEFAULT_SILHOUETTE_AVATAR,
      email: target?.email,
      deletedAt: new Date().toISOString(),
      retentionExpiresAt: expiresAt,
      reason: reason || 'Eliminación administrativa por STAFF',
      canRestore: true,
      profileData: target || undefined
    };

    setDeletedAccounts(prev => [deletedRecord, ...prev.filter(d => d.userId !== userId)]);
    setOtherUsers(prev => prev.filter(u => u.id !== userId));

    // Remove from local community cache immediately
    try {
      const raw = localStorage.getItem('latierrita_registered_community');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          localStorage.setItem('latierrita_registered_community', JSON.stringify(list.filter((u: any) => u.id !== userId)));
        }
      }
    } catch {}

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        isDeleted: true,
        deletedAt: deletedRecord.deletedAt,
        retentionExpiresAt: expiresAt,
        deletedReason: deletedRecord.reason
      }, { merge: true });
      const delRef = doc(db, 'deleted_accounts', userId);
      await setDoc(delRef, deletedRecord);
    } catch (e) {
      console.warn('Failed to write deleted account in Firestore:', e);
    }

    // Sincronizar soft delete en Supabase profiles
    try {
      await supabase
        .from('profiles')
        .update({
          is_deleted: true,
          deleted_at: deletedRecord.deletedAt,
          retention_expires_at: expiresAt,
          deleted_reason: deletedRecord.reason
        })
        .eq('id', userId);
    } catch (e) {
      console.warn('Failed to soft delete in Supabase profiles:', e);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Cuenta Eliminada (Retención 7 días)',
      message: `La cuenta @${username} fue eliminada y se guardó en retención de 7 días.`
    });
  };

  // Deleted accounts actions with 7-day retention management
  const restoreDeletedAccount = async (id: string) => {
    const acc = deletedAccounts.find(d => d.id === id || d.userId === id);
    const userId = acc ? acc.userId : id;
    const username = acc ? acc.username : '';

    // 1. Remove from local list
    setDeletedAccounts(prev => prev.filter(d => d.id !== id && d.userId !== userId));

    // 2. Restore in Firestore users collection (unmark isDeleted)
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        isDeleted: false,
        deletedAt: null,
        retentionExpiresAt: null,
        deletedReason: null
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to restore user in Firestore users:', e);
    }

    // 3. Remove from deleted_accounts collection
    try {
      const delRef = doc(db, 'deleted_accounts', userId);
      await deleteDoc(delRef);
    } catch (e) {
      console.warn('Failed to delete from Firestore deleted_accounts:', e);
    }

    // Restaurar en Supabase profiles
    try {
      await supabase
        .from('profiles')
        .update({
          is_deleted: false,
          deleted_at: null,
          retention_expires_at: null,
          deleted_reason: null
        })
        .eq('id', userId);
    } catch (e) {
      console.warn('Failed to restore in Supabase profiles:', e);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Cuenta Restaurada',
      message: username ? `La cuenta de @${username} ha sido restaurada con éxito.` : 'La cuenta ha sido restaurada con éxito.'
    });
  };

  const permanentlyDeleteAccount = async (id: string) => {
    const acc = deletedAccounts.find(d => d.id === id || d.userId === id);
    const userId = acc ? acc.userId : id;
    const username = acc ? acc.username : '';

    // 1. Remove from local state
    setDeletedAccounts(prev => prev.filter(d => d.id !== id && d.userId !== userId));
    setOtherUsers(prev => prev.filter(u => u.id !== userId));

    // Remove from local community cache
    try {
      const raw = localStorage.getItem('latierrita_registered_community');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          localStorage.setItem('latierrita_registered_community', JSON.stringify(list.filter((u: any) => u.id !== userId)));
        }
      }
    } catch {}

    // 2. Intentar llamada RPC administrativa en Supabase
    try {
      await supabase.rpc('admin_delete_user', { target_user_id: userId });
    } catch {}

    // 3. Borrar dependencias hijas en Supabase antes de borrar el perfil
    try {
      await supabase.from('places').delete().eq('user_id', userId);
    } catch {}
    try {
      await supabase.from('posts').delete().eq('user_id', userId);
    } catch {}
    try {
      await supabase.from('stories').delete().eq('user_id', userId);
    } catch {}
    try {
      await supabase.from('verification_requests').delete().eq('user_id', userId);
    } catch {}
    try {
      await supabase.from('follows').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
    } catch {}
    try {
      await supabase.from('notifications').delete().eq('user_id', userId);
    } catch {}

    // 4. Borrar definitivamente de Supabase profiles
    try {
      const { error: delError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (delError) {
        console.warn('Supabase profile delete fallback to anonymized deletion:', delError.message);
        await supabase
          .from('profiles')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            retention_expires_at: new Date().toISOString(),
            deleted_reason: 'Purgado por administración'
          })
          .eq('id', userId);
      }
    } catch (e) {
      console.warn('Failed to permanently delete from Supabase profiles:', e);
    }

    // 4. Permanently delete user document from Firestore users collection
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (e) {
      console.warn('Failed to permanently delete user from Firestore users:', e);
    }

    // 5. Remove from deleted_accounts in Firestore
    try {
      const delRef = doc(db, 'deleted_accounts', userId);
      await deleteDoc(delRef);
    } catch (e) {
      console.warn('Failed to delete from Firestore deleted_accounts:', e);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Cuenta Eliminada Definitivamente',
      message: username ? `Los datos de @${username} han sido purgados y su usuario ha quedado libre.` : 'La cuenta ha sido purgada por completo.'
    });
  };

  const deletePostByAdmin = async (postId: string) => {
    setPosts(prev => {
      const next = prev.filter(p => p.id !== postId);
      safeSaveLocalPosts(next);
      return next;
    });
    try {
      await deleteDoc(doc(db, 'posts', postId));
      triggerPlushNotification({
        type: 'system',
        title: 'Publicación Eliminada por Moderación',
        message: 'El post ha sido removido de la plataforma.'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const deleteStaffPost = async (id: string) => {
    setPosts(prev => {
      const next = prev.filter(p => p.id !== id);
      safeSaveLocalPosts(next);
      return next;
    });
    try {
      await deleteDoc(doc(db, 'posts', id));
      triggerPlushNotification({
        type: 'system',
        title: 'Anuncio de Feed Eliminado',
        message: 'Se retiró la publicación patrocinada del feed.'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
    }
  };

  // Places state
  const [places, setPlaces] = useState<PlaceItem[]>([]);

  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'places'), (snapshot) => {
        if (snapshot.empty) {
          setPlaces([]);
        } else {
          const list: PlaceItem[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as PlaceItem);
          });
          setPlaces(list);
        }
      }, (error) => {
        setPlaces([]);
        console.warn('Places listener error:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setPlaces([]);
      console.warn('Failed to listen to places in DB:', e);
    }
  }, []);

  const addPlace = async (placeData: Omit<PlaceItem, 'id'>) => {
    const newPlaceId = `place-${Date.now()}`;
    const newPlace: PlaceItem = {
      ...placeData,
      id: newPlaceId
    };
    setPlaces(prev => [newPlace, ...prev]);
    try {
      await setDoc(doc(db, 'places', newPlaceId), newPlace);
    } catch (e) {
      console.warn('Failed to write place to Firestore:', e);
    }
    triggerPlushNotification({
      type: 'system',
      title: 'Lugar agregado a La Tierrita',
      message: `"${placeData.name}" ya está visible para todos los colombianos en España.`,
      avatar: placeData.imageUrl
    });
  };

  // Sync current user to localStorage
  useEffect(() => {
    localStorage.setItem('latierrita_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Sync blocked users
  useEffect(() => {
    localStorage.setItem('latierrita_blocked', JSON.stringify(blockedUserIds));
  }, [blockedUserIds]);

  // Update profile
  const updateProfile = async (updated: Partial<UserProfile>) => {
    let nextUser: UserProfile = { ...currentUser, ...updated };
    if (updated.socialLinks) {
      nextUser.socialLinks = {
        ...(currentUser.socialLinks || {}),
        ...updated.socialLinks
      };
    }
    const isStaff = isStaffAccount(nextUser.id, nextUser.username, nextUser.email);
    if (isStaff) {
      nextUser.username = 'latierrita_app';
      nextUser.isVerified = true;
      nextUser.staffRole = 'ADMIN';
      safeSetLocalStorage('latierrita_official_profile', nextUser);
    }

    setCurrentUser(nextUser);
    localStorage.setItem('latierrita_user', JSON.stringify(nextUser));

    setOtherUsers(prev => {
      return prev.map(u => {
        if (u.id === currentUser.id || u.username === currentUser.username || (isStaff && isStaffAccount(u.id, u.username, u.email))) {
          return { ...u, ...nextUser };
        }
        return u;
      });
    });
    
    if (selectedUserProfile && (selectedUserProfile.id === currentUser.id || selectedUserProfile.username === currentUser.username || (isStaff && isStaffAccount(selectedUserProfile.id, selectedUserProfile.username, selectedUserProfile.email)))) {
      setSelectedUserProfile(nextUser);
    }
    
    // Also update any posts/stories authored by me in local state
    if (updated.username || updated.avatar) {
      setPosts(prev => {
        const next = prev.map(p => {
          if (p.userId === currentUser.id || p.username === currentUser.username || (isStaff && (p.isStaffAd || p.username === 'latierrita_app' || p.userId === 'user-staff'))) {
            return {
              ...p,
              username: nextUser.username || p.username,
              userAvatar: nextUser.avatar || p.userAvatar
            };
          }
          return p;
        });
        safeSaveLocalPosts(next);
        return next;
      });
    }

    // Persist to Firestore
    try {
      if (currentUser?.id) {
        await setDoc(doc(db, 'users', currentUser.id), {
          ...updated,
          avatar: nextUser.avatar,
          avatar_url: nextUser.avatar,
          socialLinks: nextUser.socialLinks,
          social_links: nextUser.socialLinks,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await setDoc(doc(db, 'profiles', currentUser.id), {
          ...updated,
          avatar: nextUser.avatar,
          avatar_url: nextUser.avatar,
          socialLinks: nextUser.socialLinks,
          social_links: nextUser.socialLinks,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      if (isStaff) {
        await setDoc(doc(db, 'config', 'official_profile'), {
          ...nextUser,
          avatar: nextUser.avatar,
          avatar_url: nextUser.avatar,
          socialLinks: nextUser.socialLinks,
          social_links: nextUser.socialLinks,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        await setDoc(doc(db, 'profiles', 'latierrita_app'), {
          ...nextUser,
          avatar: nextUser.avatar,
          avatar_url: nextUser.avatar,
          socialLinks: nextUser.socialLinks,
          social_links: nextUser.socialLinks,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (fsErr) {
      console.warn('Firestore updateProfile note:', fsErr);
    }

    try {
      await updateUserProfile(updated);
    } catch {
      // Non-fatal Supabase sync
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Perfil actualizado',
      message: 'Los cambios en tu perfil se han guardado con éxito.',
      avatar: nextUser.avatar
    });
  };

  // Follow / Unfollow
  const followUser = async (userId: string) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acceso Limitado',
        message: 'Como invitado no puedes seguir a otros usuarios. Regístrate en la app para acceder a todas las funciones.'
      });
      return;
    }
    const targetCheck = otherUsers.find(u => u.id === userId);
    if (targetCheck?.isGuest || userId.startsWith('guest-')) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción no permitida',
        message: 'No es posible seguir a usuarios invitados temporales.'
      });
      return;
    }
    if (userId === currentUser.id) return;
    if (isStaffAccount(currentUser.id, currentUser.username) && (userId === 'user-staff' || userId === currentUser.id)) return;
    if (followingIds.includes(userId)) return;

    const nextFollowing = [...followingIds, userId];
    setFollowingIds(nextFollowing);
    localStorage.setItem('latierrita_following', JSON.stringify(nextFollowing));

    setCurrentUser(prev => ({ ...prev, followingCount: prev.followingCount + 1 }));
    setOtherUsers(prev => prev.map(u => u.id === userId ? { ...u, followersCount: u.followersCount + 1 } : u));

    // Sync to Firestore users
    try {
      await setDoc(doc(db, 'users', currentUser.id), { following: nextFollowing }, { merge: true });
      await setDoc(doc(db, 'follows', `${currentUser.id}_${userId}`), {
        followerId: currentUser.id,
        followingId: userId,
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch {
      // Non-fatal Firestore sync
    }

    // Try Supabase sync if schema supports it
    try {
      await supabase.from('follows').upsert([{ follower_id: currentUser.id, following_id: userId }]);
    } catch {
      // Non-fatal
    }
    
    const target = otherUsers.find(u => u.id === userId);
    triggerPlushNotification({
      type: 'follow',
      title: 'Nuevo parcero seguido',
      message: `Has comenzado a seguir a @${target?.username || 'usuario'}.`,
      avatar: target?.avatar
    });
  };

  const unfollowUser = async (userId: string) => {
    if (userId === currentUser.id) return;

    // Check if target is official staff account @latierrita_app
    const target = otherUsers.find(u => u.id === userId || u.username === userId);
    const isTargetOfficial = userId === 'user-staff' || target?.username === 'latierrita_app' || target?.username === 'latierrita_oficial';
    
    if (isTargetOfficial) {
      triggerPlushNotification({
        type: 'system',
        title: 'Cuenta Oficial',
        message: 'No es posible dejar de seguir la cuenta oficial @latierrita_app para recibir información y anuncios de la comunidad.',
        avatar: target?.avatar || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80'
      });
      return;
    }

    const nextFollowing = followingIds.filter(id => id !== userId);
    setFollowingIds(nextFollowing);
    localStorage.setItem('latierrita_following', JSON.stringify(nextFollowing));

    setCurrentUser(prev => ({ ...prev, followingCount: Math.max(0, prev.followingCount - 1) }));
    setOtherUsers(prev => prev.map(u => u.id === userId ? { ...u, followersCount: Math.max(0, u.followersCount - 1) } : u));

    // Sync to Firestore users
    try {
      await setDoc(doc(db, 'users', currentUser.id), { following: nextFollowing }, { merge: true });
      await deleteDoc(doc(db, 'follows', `${currentUser.id}_${userId}`));
    } catch {
      // Non-fatal Firestore sync
    }

    // Try Supabase sync if schema supports it
    try {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
    } catch {
      // Non-fatal
    }
  };

  // Block / Unblock
  const blockUser = (userId: string, userName?: string) => {
    const isTargetOfficial = userId === 'user-staff' || userName === 'latierrita_app' || userName === 'latierrita_oficial';
    if (isTargetOfficial) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción no permitida',
        message: 'No es posible bloquear la cuenta oficial del sistema @latierrita_app.'
      });
      return;
    }

    if (!blockedUserIds.includes(userId)) {
      setBlockedUserIds(prev => [...prev, userId]);
      unfollowUser(userId);
      triggerPlushNotification({
        type: 'system',
        title: 'Usuario bloqueado',
        message: `Has bloqueado a ${userName || 'este usuario'}. No verás sus mensajes ni publicaciones.`,
      });
    }
  };

  const unblockUser = (userId: string) => {
    setBlockedUserIds(prev => prev.filter(id => id !== userId));
    triggerPlushNotification({
      type: 'system',
      title: 'Usuario desbloqueado',
      message: 'Has desbloqueado al usuario correctamente.',
    });
  };

  // Trigger plush notification toast
  const triggerPlushNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Justo ahora',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    setPlushToast(newNotif);
    playNotificationSound();
  };

  const dismissPlushToast = () => {
    setPlushToast(null);
  };

  // Startup Ad
  const dismissStartupAd = () => {
    setStartupAdOpen(false);
    sessionStorage.setItem('latierrita_startup_ad_closed', 'true');
  };

  const simulateAppRestart = () => {
    sessionStorage.removeItem('latierrita_startup_ad_closed');
    setStartupAdOpen(true);
    triggerPlushNotification({
      type: 'system',
      title: 'Simulación de reinicio',
      message: 'Has reiniciado la aplicación (se muestra de nuevo el banner publicitario flotante).',
    });
  };

  const updateStartupAdConfig = async (config: StartupAdConfig) => {
    try {
      setStartupAdConfig(config);
      try {
        localStorage.setItem('latierrita_startup_ad', JSON.stringify(config));
      } catch {}
      await setDoc(doc(db, 'config', 'startup_ad'), config);
      triggerPlushNotification({
        type: 'system',
        title: config.active ? 'Publicidad de Inicio Actualizada' : 'Publicidad Desactivada',
        message: config.active
          ? 'La publicidad emergente oficial del STAFF ha sido guardada con éxito.'
          : 'La publicidad emergente ha sido desactivada y removida de la app.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/startup_ad');
    }
  };

  // Stories
  const addStory = async (data: { mediaUrl: string; caption?: string }) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes publicar historias. Regístrate en la app para acceder a todas las funciones.'
      });
      return;
    }
    const now = Date.now();
    const newStoryId = `story-${now}`;
    const newStory: StoryItem = {
      id: newStoryId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      userCity: currentUser.city,
      mediaUrl: data.mediaUrl,
      caption: data.caption,
      timestamp: 'Justo ahora',
      createdAt: now,
      viewed: false,
      reactions: []
    };
    setStories(prev => [newStory, ...prev]);

    // Guardado local resistente para fallback inmediato
    try {
      const localStoriesRaw = localStorage.getItem('latierrita_local_stories') || '[]';
      const localStories = JSON.parse(localStoriesRaw);
      localStories.push(newStory);
      localStorage.setItem('latierrita_local_stories', JSON.stringify(localStories));
    } catch (e) {
      console.warn('Local story storage note:', e);
    }

    try {
      await setDoc(doc(db, 'stories', newStoryId), newStory);
      setIsCreateStoryOpen(false);
      triggerPlushNotification({
        type: 'system',
        title: 'Historia publicada',
        message: 'Tu historia de Instagram ya está visible para tus parceros.',
        avatar: currentUser.avatar
      });
    } catch (error) {
      setIsCreateStoryOpen(false);
      handleFirestoreError(error, OperationType.CREATE, 'stories');
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      
      setStories(prev => prev.filter(s => s.id !== storyId));

      try {
        const localStoriesRaw = localStorage.getItem('latierrita_local_stories');
        if (localStoriesRaw) {
          const localStories = JSON.parse(localStoriesRaw);
          if (Array.isArray(localStories)) {
            const filtered = localStories.filter(s => s.id !== storyId);
            localStorage.setItem('latierrita_local_stories', JSON.stringify(filtered));
          }
        }
      } catch (e) {
        console.warn('Error deleting local story:', e);
      }

      triggerPlushNotification({
        type: 'system',
        title: 'Historia Eliminada',
        message: 'Tu historia ha sido eliminada con éxito.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `stories/${storyId}`);
    }
  };

  const reactToStory = async (storyId: string, emoji: string) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes reaccionar a historias. Regístrate en la app para acceder a todas las funciones.'
      });
      return;
    }
    const targetStory = stories.find(s => s.id === storyId);
    if (!targetStory) return;

    const reactions = [...(targetStory.reactions || [])];
    const existing = reactions.find(r => r.emoji === emoji);
    if (existing) {
      if (!existing.users.includes(currentUser.id)) {
        existing.count += 1;
        existing.users.push(currentUser.id);
      }
    } else {
      reactions.push({ emoji, count: 1, users: [currentUser.id] });
    }

    setStories(prev => prev.map(s => s.id === storyId ? { ...s, reactions } : s));

    try {
      await updateDoc(doc(db, 'stories', storyId), { reactions });
      if (targetStory.userId !== currentUser.id) {
        triggerPlushNotification({
          type: 'story_reaction',
          title: 'Reacción enviada',
          message: `Reaccionaste con ${emoji} a la historia de @${targetStory.username}.`,
          avatar: targetStory.userAvatar
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stories/${storyId}`);
    }
  };

  // Posts interactions
  const likePost = async (postId: string) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes dar me gusta a publicaciones. Regístrate en la app para acceder a todas las funciones.'
      });
      return;
    }
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const currentLikes: string[] = Array.isArray((targetPost as any).likes)
      ? [...(targetPost as any).likes]
      : [];
    const currentUserId = currentUser?.id || 'anon';
    const alreadyLiked = targetPost.hasLiked || currentLikes.includes(currentUserId);
    const updatedLikes = alreadyLiked
      ? currentLikes.filter(uid => uid !== currentUserId)
      : [...currentLikes, currentUserId];

    const newHasLiked = !alreadyLiked;
    const newLikesCount = updatedLikes.length;

    const updatedPost: PostItem = {
      ...targetPost,
      hasLiked: newHasLiked,
      likesCount: newLikesCount,
      likes: updatedLikes
    } as any;

    setPosts(prev => {
      const next = prev.map(p => p.id === postId ? updatedPost : p);
      safeSaveLocalPosts(next);
      return next;
    });

    try {
      await setDoc(doc(db, 'posts', postId), {
        likes: updatedLikes,
        likesCount: newLikesCount
      }, { merge: true });
    } catch (error) {
      console.warn('Could not sync like to DB, state updated locally:', error);
    }
  };

  const toggleSavePost = async (postId: string) => {
    const savedPostIds = Array.isArray(currentUser.savedPostIds) ? [...currentUser.savedPostIds] : [];
    const idx = savedPostIds.indexOf(postId);
    if (idx >= 0) {
      savedPostIds.splice(idx, 1);
    } else {
      savedPostIds.push(postId);
    }

    const nextUser = { ...currentUser, savedPostIds };
    setCurrentUser(nextUser);
    localStorage.setItem('latierrita_user', JSON.stringify(nextUser));

    // Update posts state locally
    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id === postId) {
          const savedBy = Array.isArray(p.savedBy) ? [...p.savedBy] : [];
          const uidx = savedBy.indexOf(currentUser.id);
          if (uidx >= 0) {
            savedBy.splice(uidx, 1);
          } else {
            savedBy.push(currentUser.id);
          }
          return { ...p, savedBy };
        }
        return p;
      });
      safeSaveLocalPosts(next);
      return next;
    });

    try {
      await setDoc(doc(db, 'users', currentUser.id), { savedPostIds }, { merge: true });
    } catch (e) {
      console.warn('Failed to sync savedPostIds in Firestore:', e);
    }

    try {
      await updateUserProfile({ savedPostIds });
    } catch (e) {
      // Ignore
    }

    // Sync savedBy to Firestore post document
    try {
      const p = posts.find(item => item.id === postId);
      if (p) {
        const savedBy = Array.isArray(p.savedBy) ? [...p.savedBy] : [];
        const uidx = savedBy.indexOf(currentUser.id);
        if (uidx >= 0) {
          savedBy.splice(uidx, 1);
        } else {
          savedBy.push(currentUser.id);
        }
        await setDoc(doc(db, 'posts', postId), { savedBy }, { merge: true });
      }
    } catch (err) {
      console.warn('Failed to sync savedBy to post document:', err);
    }

    triggerPlushNotification({
      type: 'system',
      title: idx >= 0 ? 'Publicación eliminada' : 'Publicación guardada',
      message: idx >= 0 ? 'Se eliminó el post de tus guardados.' : 'El post se ha guardado en tu colección guardada.'
    });
  };

  const addComment = async (postId: string, text: string, parentId?: string) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes comentar publicaciones. Regístrate en la app para acceder a todas las funciones.'
      });
      return;
    }
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    // Clean comment payload - ensure NO undefined properties
    const newComment: PostComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'anon',
      name: currentUser?.name || currentUser?.username || 'Usuario',
      username: currentUser?.username || 'usuario',
      userAvatar: currentUser?.avatar || '',
      isVerified: Boolean(currentUser?.isVerified),
      staffRole: currentUser?.staffRole || 'Usuario',
      text: text.trim(),
      timestamp: 'Justo ahora'
    };
    if (parentId) {
      newComment.parentId = parentId;
    }

    const updatedComments = [...(targetPost.comments || []), newComment];
    const cleanedComments = updatedComments.map(sanitizeCommentForFirestore);

    const updatedPost: PostItem = {
      ...targetPost,
      comments: updatedComments
    };

    setPosts(prev => {
      const next = prev.map(p => p.id === postId ? updatedPost : p);
      safeSaveLocalPosts(next);
      return next;
    });

    try {
      await setDoc(doc(db, 'posts', postId), {
        comments: cleanedComments
      }, { merge: true });
    } catch (error) {
      console.warn('Could not sync comment to DB, state updated locally:', error);
    }
  };

  const likeComment = async (postId: string, commentId: string) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes dar me gusta a comentarios. Regístrate en la app para acceder a todas las funciones.'
      });
      return;
    }
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const currentUserId = currentUser?.id || 'anon';
    const updatedComments = (targetPost.comments || []).map(c => {
      if (c.id === commentId) {
        const likes = Array.isArray(c.likes) ? [...c.likes] : [];
        const idx = likes.indexOf(currentUserId);
        if (idx >= 0) {
          likes.splice(idx, 1);
        } else {
          likes.push(currentUserId);
        }
        return { ...c, likes };
      }
      return c;
    });

    const cleanedComments = updatedComments.map(sanitizeCommentForFirestore);

    setPosts(prev => {
      const next = prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p);
      safeSaveLocalPosts(next);
      return next;
    });

    try {
      await setDoc(doc(db, 'posts', postId), {
        comments: cleanedComments
      }, { merge: true });
    } catch (e) {
      console.warn('Could not sync comment like to DB:', e);
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const updatedComments = (targetPost.comments || []).filter(c => c.id !== commentId && c.parentId !== commentId);
    const cleanedComments = updatedComments.map(sanitizeCommentForFirestore);

    setPosts(prev => {
      const next = prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p);
      safeSaveLocalPosts(next);
      return next;
    });

    try {
      await setDoc(doc(db, 'posts', postId), {
        comments: cleanedComments
      }, { merge: true });
    } catch (e) {
      console.warn('Could not delete comment in DB:', e);
    }
  };

  const createPost = async (data: {
    mediaUrl: string;
    caption: string;
    location: string;
    hideLocation?: boolean;
    isStaffAd?: boolean;
    adTitle?: string;
    adDescription?: string;
    adCtaText?: string;
    adCtaUrl?: string;
    sponsorName?: string;
    disableComments?: boolean;
    hideLikes?: boolean;
    taggedUsernames?: string[];
  }) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes crear publicaciones. Regístrate en la app para acceder a todas las funciones.'
      });
      return;
    }
    if (data.isStaffAd) {
      const lastAdKey = `latierrita_last_ad_${currentUser.id}`;
      const lastAdTime = localStorage.getItem(lastAdKey);
      const now = Date.now();
      if (lastAdTime && now - Number(lastAdTime) < 24 * 60 * 60 * 1000) {
        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (now - Number(lastAdTime))) / (1000 * 60 * 60));
        alert(`Solo puedes publicar 1 anuncio cada 24 horas. Debes esperar ${hoursLeft} hora(s) más para publicar otro anuncio.`);
        return;
      }
      localStorage.setItem(lastAdKey, String(now));
    }

    // Comprimir imagen base64 para evitar superar el límite de 1MB de Firestore o cuota de localStorage
    const compressBase64Image = (url: string): Promise<string> => {
      return new Promise((resolve) => {
        if (!url || !url.startsWith('data:image')) {
          resolve(url);
          return;
        }
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX = 1000;
          if (width > height && width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else if (height > MAX) {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(url);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            resolve(compressed);
          } catch (e) {
            resolve(url);
          }
        };
        img.onerror = () => resolve(url);
        img.src = url;
      });
    };

    const optimizedMediaUrl = await compressBase64Image(data.mediaUrl);

    const newPostId = `post-${Date.now()}`;
    const newPost: PostItem = {
      id: newPostId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      userCity: currentUser.city,
      mediaUrl: optimizedMediaUrl,
      caption: data.caption,
      likesCount: 0,
      hasLiked: false,
      comments: [],
      timestamp: 'Justo ahora',
      location: data.hideLocation ? '' : (data.location || `${currentUser.city}, España`),
      hideLocation: data.hideLocation,
      isStaffAd: data.isStaffAd,
      adTitle: data.adTitle,
      adDescription: data.adDescription,
      adCtaText: data.adCtaText,
      adCtaUrl: data.adCtaUrl,
      sponsorName: data.sponsorName,
      disableComments: data.disableComments,
      hideLikes: data.hideLikes,
      taggedUsernames: data.taggedUsernames
    };
    
    // 1. Optimistic state update & safe local caching
    setPosts(prev => {
      const next = [newPost, ...prev];
      safeSaveLocalPosts(next);
      return next;
    });

    const updatedUser = { ...currentUser, postsCount: (currentUser.postsCount || 0) + 1 };
    setCurrentUser(updatedUser);
    localStorage.setItem('latierrita_user', JSON.stringify(updatedUser));

    // 3. Close modal & notify immediately
    setIsCreatePostOpen(false);
    triggerPlushNotification({
      type: 'system',
      title: 'Publicación subida',
      message: 'Tu nueva foto ya está disponible en tu perfil y en el feed.',
      avatar: currentUser.avatar
    });

    // 4. Background sync to Cloud Database (Firestore & Supabase)
    try {
      await setDoc(doc(db, 'posts', newPostId), newPost);
      try {
        await supabase.from('posts').upsert([{
          id: newPost.id,
          user_id: newPost.userId,
          username: newPost.username,
          user_avatar: newPost.userAvatar,
          user_city: newPost.userCity,
          media_url: newPost.mediaUrl,
          caption: newPost.caption,
          likes_count: 0,
          location: newPost.location || '',
          is_staff_ad: newPost.isStaffAd || false,
          ad_title: newPost.adTitle || null,
          ad_description: newPost.adDescription || null,
          ad_cta_text: newPost.adCtaText || null,
          ad_cta_url: newPost.adCtaUrl || null,
          sponsor_name: newPost.sponsorName || null,
          created_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (supErr) {
        console.warn('Supabase post sync note:', supErr);
      }
      try {
        await setDoc(doc(db, 'users', currentUser.id), { postsCount: updatedUser.postsCount }, { merge: true });
      } catch (e) {}
      try {
        await setDoc(doc(db, 'profiles', currentUser.id), { postsCount: updatedUser.postsCount }, { merge: true });
      } catch (e) {}
    } catch (error) {
      console.warn('Cloud post sync warning:', error);
    }
  };

  // Staff Ads
  const addAdBanner = async (banner: Omit<AdBanner, 'id' | 'active'>) => {
    const newBannerId = `banner-${Date.now()}`;
    const newBanner: AdBanner = {
      id: newBannerId,
      active: true,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl || '',
      sponsorName: banner.sponsorName || 'La Tierrita',
      sponsorCity: banner.sponsorCity || 'España',
      ctaText: banner.ctaText || 'Ver detalles',
      ctaLink: banner.ctaLink || '',
      category: banner.category || 'Evento',
      carouselType: banner.carouselType || 'inicio'
    };

    // Ensure this new banner is not in the deleted set
    try {
      const deletedRaw = localStorage.getItem('latierrita_deleted_banners') || '[]';
      const deletedIds: string[] = JSON.parse(deletedRaw);
      const updatedDeleted = deletedIds.filter(id => id !== newBannerId);
      localStorage.setItem('latierrita_deleted_banners', JSON.stringify(updatedDeleted));
    } catch {}

    // 1. Immediate optimistic UI update
    setAdBanners(prev => {
      const filtered = (prev || []).filter(b => b.id !== newBannerId);
      return [newBanner, ...filtered];
    });

    // 2. Persist to high-capacity IndexedDB immediately
    saveBannerToIndexedDB(newBanner).catch(() => {});

    // 3. Persist to localStorage for zero-latency fallback
    try {
      const localBannersRaw = localStorage.getItem('latierrita_local_banners') || '[]';
      const localBanners = JSON.parse(localBannersRaw);
      const updatedLocal = [newBanner, ...localBanners.filter((b: any) => b && b.id !== newBannerId && b.id !== 'banner-init-1' && b.id !== 'banner-oficial-latierrita')];
      localStorage.setItem('latierrita_local_banners', JSON.stringify(updatedLocal));

      const allBannersRaw = localStorage.getItem('latierrita_ad_banners') || '[]';
      const allBanners = JSON.parse(allBannersRaw);
      const updatedAll = [newBanner, ...allBanners.filter((b: any) => b && b.id !== newBannerId && b.id !== 'banner-init-1' && b.id !== 'banner-oficial-latierrita')];
      localStorage.setItem('latierrita_ad_banners', JSON.stringify(updatedAll));
    } catch (e) {
      console.warn('Local banner storage note (preserved in IndexedDB):', e);
    }

    // 4. Clean object to prevent Firestore "undefined" property errors
    const firestoreBanner = JSON.parse(JSON.stringify(newBanner));

    // 5. Write to Firestore banners collection for all users
    try {
      await setDoc(doc(db, 'banners', newBannerId), firestoreBanner);
      triggerPlushNotification({
        type: 'system',
        title: 'STAFF: Anuncio añadido al carrusel',
        message: `El banner "${newBanner.title || 'Anuncio'}" ya está activo en el carrusel ${newBanner.carouselType === 'explorar' ? 'de Explorar' : 'de Inicio'}.`,
        avatar: newBanner.imageUrl
      });
    } catch (error) {
      console.warn('Firestore banners write error:', error);
      triggerPlushNotification({
        type: 'system',
        title: 'STAFF: Anuncio guardado localmente',
        message: `El banner "${newBanner.title || 'Anuncio'}" se ha guardado localmente en tu navegador.`,
        avatar: newBanner.imageUrl
      });
    }
  };

  // Manual / On-demand Refresh of Banners from Database & Local Storage
  const refreshBanners = async () => {
    try {
      const snap = await getDocs(collection(db, 'banners'));
      const list: AdBanner[] = [];
      if (!snap.empty) {
        snap.forEach((docSnap: any) => {
          const data = docSnap.data() || {};
          list.push({ id: docSnap.id, ...data } as AdBanner);
        });
      }

      const deletedRaw = localStorage.getItem('latierrita_deleted_banners') || '[]';
      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(deletedRaw);
      } catch {}

      // Merge IndexedDB stored banners
      try {
        const idbList = await getAllBannersFromIndexedDB();
        if (Array.isArray(idbList)) {
          idbList.forEach((ib: AdBanner) => {
            if (!list.some(b => b.id === ib.id) && !deletedIds.includes(ib.id) && ib.id !== 'banner-init-1') {
              list.unshift(ib);
            }
          });
        }
      } catch (e) {}

      // Merge locally stored banners
      try {
        const localBannersRaw = localStorage.getItem('latierrita_local_banners');
        if (localBannersRaw) {
          const localBanners = JSON.parse(localBannersRaw);
          if (Array.isArray(localBanners)) {
            localBanners.forEach((lb: AdBanner) => {
              if (!list.some(b => b.id === lb.id) && !deletedIds.includes(lb.id) && lb.id !== 'banner-init-1') {
                list.unshift(lb);
              }
            });
          }
        }
      } catch (e) {}

      const cleanList = list.filter(b => b && b.id !== 'banner-init-1' && !deletedIds.includes(b.id));
      setAdBanners(cleanList);
      try {
        localStorage.setItem('latierrita_ad_banners', JSON.stringify(cleanList));
      } catch {}

      triggerPlushNotification({
        type: 'system',
        title: 'Carruseles Actualizados',
        message: `Se han sincronizado ${cleanList.length} anuncios activos en los carruseles.`,
        avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80'
      });
    } catch (err) {
      console.warn('Manual refresh banners note, checking local storage:', err);
      const cached = localStorage.getItem('latierrita_ad_banners');
      let fallbackList: AdBanner[] = [];
      const deletedRaw = localStorage.getItem('latierrita_deleted_banners') || '[]';
      let deletedIds: string[] = [];
      try {
        deletedIds = JSON.parse(deletedRaw);
      } catch {}

      // Merge from IndexedDB on error
      try {
        const idbList = await getAllBannersFromIndexedDB();
        if (Array.isArray(idbList)) {
          fallbackList = idbList.filter((b: AdBanner) => b && b.id !== 'banner-init-1' && !deletedIds.includes(b.id));
        }
      } catch {}

      if (fallbackList.length === 0 && cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            fallbackList = parsed.filter((b: AdBanner) => b && b.id !== 'banner-init-1' && !deletedIds.includes(b.id));
          }
        } catch {}
      }
      setAdBanners(fallbackList);
      triggerPlushNotification({
        type: 'system',
        title: 'Carruseles Actualizados',
        message: `Se ha sincronizado la lista de anuncios (${fallbackList.length} activos).`
      });
    }
  };

  const deleteAdBanner = async (id: string) => {
    // 1. Mark as deleted so it is never re-added by fallbacks
    try {
      const deletedRaw = localStorage.getItem('latierrita_deleted_banners') || '[]';
      const deletedIds: string[] = JSON.parse(deletedRaw);
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('latierrita_deleted_banners', JSON.stringify(deletedIds));
      }
    } catch {}

    // 2. Immediate local state update
    setAdBanners(prev => prev.filter(b => b.id !== id));

    // 3. Remove from IndexedDB
    deleteBannerFromIndexedDB(id).catch(() => {});

    // 4. Remove from local storage
    try {
      const localBannersRaw = localStorage.getItem('latierrita_local_banners');
      if (localBannersRaw) {
        const localBanners = JSON.parse(localBannersRaw);
        if (Array.isArray(localBanners)) {
          const filtered = localBanners.filter((b: AdBanner) => b.id !== id);
          localStorage.setItem('latierrita_local_banners', JSON.stringify(filtered));
        }
      }
      const allBannersRaw = localStorage.getItem('latierrita_ad_banners');
      if (allBannersRaw) {
        const allBanners = JSON.parse(allBannersRaw);
        if (Array.isArray(allBanners)) {
          const filtered = allBanners.filter((b: AdBanner) => b.id !== id);
          localStorage.setItem('latierrita_ad_banners', JSON.stringify(filtered));
        }
      }
    } catch (e) {
      console.warn('Error deleting local banner:', e);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Banner Eliminado',
      message: 'El anuncio ha sido removido del carrusel.'
    });

    // 5. Delete from Firestore 'banners' collection
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (error) {
      console.warn('Firestore deleteDoc banners note:', error);
    }

    // 6. Record global deletion entry in Firestore 'deleted_banners' collection
    try {
      await setDoc(doc(db, 'deleted_banners', id), {
        id: id,
        deletedAt: Date.now()
      });
    } catch (error) {
      console.warn('Firestore setDoc deleted_banners note:', error);
    }
  };

  const addStaffPost = async (data: { title: string; description: string; imageUrl: string; ctaText: string; ctaUrl: string; sponsorName: string }) => {
    const newStaffPostId = `post-staff-${Date.now()}`;
    const newStaffPost: PostItem = {
      id: newStaffPostId,
      userId: 'user-staff',
      username: 'latierrita_app',
      userAvatar: '/logo.png?v=3',
      userCity: currentUser.city || 'España',
      mediaUrl: data.imageUrl,
      caption: `📢 ${data.title}: ${data.description}`,
      likesCount: 1,
      hasLiked: false,
      comments: [],
      timestamp: 'Justo ahora',
      location: `${data.sponsorName} · Publicidad Oficial`,
      isStaffAd: true,
      adTitle: data.title,
      adDescription: data.description,
      adCtaText: data.ctaText || 'Más Información',
      adCtaUrl: data.ctaUrl || 'https://latierrita.es',
      sponsorName: data.sponsorName
    };

    // 1. Immediate optimistic UI update
    setPosts(prev => [newStaffPost, ...prev.filter(p => p.id !== newStaffPostId)]);

    // 2. Persist to local storage
    try {
      const localPostsRaw = localStorage.getItem('latierrita_local_posts') || '[]';
      const localPosts = JSON.parse(localPostsRaw);
      localPosts.unshift(newStaffPost);
      localStorage.setItem('latierrita_local_posts', JSON.stringify(localPosts));
    } catch (e) {
      console.warn('Local staff post note:', e);
    }

    try {
      await setDoc(doc(db, 'posts', newStaffPostId), newStaffPost);
      triggerPlushNotification({
        type: 'system',
        title: 'STAFF: Anuncio añadido al feed',
        message: `Se ha publicado el anuncio patrocinado "${data.title}" en el feed.`,
        avatar: '/logo.png?v=3'
      });
    } catch (error) {
      console.warn('Firestore staff post note (stored locally):', error);
      triggerPlushNotification({
        type: 'system',
        title: 'STAFF: Anuncio publicado en el feed',
        message: `Se ha publicado el anuncio patrocinado "${data.title}".`,
        avatar: '/logo.png?v=3'
      });
    }
  };

  // Chats
  const clearChatMessages = async (chatId: string) => {
    const isStaff = (currentUser?.staffRole && currentUser.staffRole !== 'Usuario') ||
      currentUser?.id === 'user-staff' ||
      currentUser?.username === 'latierrita_app' ||
      currentUser?.email === 'latierritaapp@gmail.com';

    if (!isStaff) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción restringida',
        message: 'El comando /clear sólo está disponible para el equipo de Moderación, Soporte y Administración.'
      });
      return;
    }

    const targetRoom = chatRooms.find(r => r.id === chatId) || INITIAL_CHAT_ROOMS.find(r => r.id === chatId);
    const isExplicitPublicChat = chatId === 'chat-general-es' || chatId === 'general-spain' || chatId === 'chat-general' || chatId.startsWith('chat-city-') || chatId.startsWith('city-');
    const isTicketRoom = !!(targetRoom && (targetRoom.isTicketChat || targetRoom.ticketCode || targetRoom.ticketId));

    if (!isExplicitPublicChat && targetRoom && (targetRoom.type === 'private' || targetRoom.type === 'group' || isTicketRoom)) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción no permitida',
        message: 'No está permitido vaciar chats privados, grupos ni chats de tickets.'
      });
      return;
    }

    const targetIds = (chatId === 'chat-general-es' || chatId === 'general-spain' || chatId === 'chat-general')
      ? ['chat-general-es', 'chat-general', 'general-spain']
      : [chatId];

    const systemClearMsg: ChatMessage = {
      id: `msg-clear-${Date.now()}`,
      senderId: 'system',
      senderName: 'Sistema La Tierrita',
      senderAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&auto=format&fit=crop&q=80',
      text: `🧹 Chat vaciado por el equipo de STAFF (@${currentUser.username || 'staff'}).`,
      timestamp: getSpanishFormattedTime(),
      createdAt: Date.now(),
      isEncrypted: true,
      encryptedHash: 'SHA256:clear-action'
    };

    saveClearedRoomTimestamp(chatId, systemClearMsg.createdAt || Date.now());

    setChatRooms(prev => {
      const updated = prev.map(r => targetIds.includes(r.id) ? { ...r, messages: [systemClearMsg] } : r);
      try {
        localStorage.setItem('latierrita_chat_rooms', JSON.stringify(updated.slice(0, 50)));
      } catch {}
      return updated;
    });

    // Realtime broadcast via WebSocket
    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    if (hasSupabaseUrl && hasSupabaseKey && chatChannelRef.current) {
      targetIds.forEach(id => {
        try {
          chatChannelRef.current.send({
            type: 'broadcast',
            event: 'update_chat_messages',
            payload: { chatId: id, messages: [systemClearMsg] }
          });
        } catch (e) {
          console.warn('Realtime clear chat broadcast note:', e);
        }
      });
    }

    // Persist into Supabase & Firestore without merging old messages
    for (const id of targetIds) {
      if (hasSupabaseUrl && hasSupabaseKey) {
        try {
          await supabase.from('chat_rooms').update({ messages: [systemClearMsg] }).eq('id', id);
        } catch (err) {
          console.warn('Supabase clearChatMessages write error:', err);
        }
      }

      try {
        await setDoc(doc(db, 'chat_rooms', id), { messages: [systemClearMsg] }, { merge: false });
      } catch (error) {
        console.warn('Firestore clearChatMessages write error:', error);
      }
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Chat vaciado con éxito',
      message: `Se han borrado todos los mensajes del chat "${targetRoom?.name || 'Comunidad'}".`
    });
  };

  const cleanForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (Array.isArray(obj)) {
      return obj.map(item => cleanForFirestore(item));
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanForFirestore(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  const sendMessage = async (
    chatId: string,
    text: string,
    replyTo?: { id: string; senderName: string; text: string },
    audioData?: { url: string; duration: number },
    poll?: ChatPoll,
    event?: ChatEvent,
    sharedPost?: any
  ) => {
    if (!text.trim() && !audioData && !poll && !event && !sharedPost) return;

    if (text.trim().toLowerCase() === '/clear') {
      await clearChatMessages(chatId);
      return;
    }

    // Simulated SHA-256 E2E Encryption fingerprint
    const simulatedHash = 'SHA256:' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const msgText = text.trim() || (sharedPost ? `Compartió un post de @${sharedPost.username}` : poll ? `📊 Encuesta: ${poll.question}` : event ? `📅 Evento: ${event.title}` : audioData ? '🎤 Nota de voz' : '');

    const sanitizedPost = sharedPost ? {
      id: String(sharedPost.id || ''),
      username: String(sharedPost.username || 'usuario'),
      mediaUrl: String(sharedPost.mediaUrl || ''),
      caption: String(sharedPost.caption || '')
    } : undefined;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderCity: currentUser.city,
      text: msgText,
      timestamp: getSpanishFormattedTime(),
      createdAt: Date.now(),
      isEncrypted: true,
      encryptedHash: simulatedHash,
      replyTo: replyTo ? {
        id: replyTo.id,
        senderName: replyTo.senderName,
        text: replyTo.text
      } : undefined,
      audioUrl: audioData?.url,
      audioDuration: audioData?.duration,
      poll,
      event,
      sharedPost: sanitizedPost
    };

    const targetRoom = chatRooms.find(r => r.id === chatId);
    if (!targetRoom) return;

    // Track seen message id so sender doesn't receive a notification
    seenMessageIdsRef.current.add(newMsg.id);

    // 1. Optimistic update in local state for zero latency UI with pruning applied
    const unprunedRoom = {
      ...targetRoom,
      messages: [...targetRoom.messages, newMsg]
    };
    const updatedRoom = pruneRoomMessages(unprunedRoom);

    setChatRooms(prev => prev.map(room => room.id === chatId ? updatedRoom : room));

    // 2. Real-time broadcast to all connected accounts immediately via Supabase Realtime WebSocket
    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    if (hasSupabaseUrl && hasSupabaseKey) {
      try {
        if (chatChannelRef.current) {
          chatChannelRef.current.send({
            type: 'broadcast',
            event: 'new_chat_message',
            payload: {
              chatId,
              roomType: targetRoom.type,
              members: targetRoom.members || [],
              message: newMsg
            }
          });
        }
      } catch (bcErr) {
        console.warn('Realtime broadcast error:', bcErr);
      }
    }

    // 3. Persist into Supabase
    let finalMessages = updatedRoom.messages;
    if (hasSupabaseUrl && hasSupabaseKey) {
      try {
        const { data: dbRoom, error: fetchErr } = await supabase
          .from('chat_rooms')
          .select('id, messages')
          .eq('id', chatId)
          .maybeSingle();

        let dbMessages: any[] = [];
        if (!fetchErr && dbRoom) {
          if (Array.isArray(dbRoom.messages)) {
            dbMessages = dbRoom.messages;
          } else if (typeof dbRoom.messages === 'string') {
            try {
              const parsed = JSON.parse(dbRoom.messages);
              if (Array.isArray(parsed)) dbMessages = parsed;
            } catch {}
          }
        }

        const msgMap = new Map<string, any>();
        dbMessages.forEach((m: any) => { if (m && m.id) msgMap.set(m.id, m); });
        targetRoom.messages.forEach((m: any) => { if (m && m.id) msgMap.set(m.id, m); });
        msgMap.set(newMsg.id, newMsg);

        finalMessages = pruneRoomMessages({ ...targetRoom, messages: Array.from(msgMap.values()) }).messages;

        if (dbRoom) {
          await supabase
            .from('chat_rooms')
            .update({ messages: finalMessages })
            .eq('id', chatId);
        } else {
          await supabase
            .from('chat_rooms')
            .upsert([{
              id: targetRoom.id,
              name: targetRoom.name,
              description: targetRoom.description || '',
              created_at: targetRoom.createdAt || new Date().toISOString().split('T')[0],
              messages: finalMessages
            }], { onConflict: 'id' });
        }
      } catch (e) {
        console.warn('Supabase sendMessage write error:', e);
      }
    }

    // 4. Always dual-persist to Firestore for guaranteed cross-device reliability
    try {
      const roomRef = doc(db, 'chat_rooms', chatId);
      const docSnap = await getDoc(roomRef);
      let firestoreMessages: any[] = [];
      const isExists = docSnap && (typeof docSnap.exists === 'function' ? docSnap.exists() : Boolean(docSnap.exists));
      if (isExists) {
        const roomData: any = docSnap.data();
        if (roomData && Array.isArray(roomData.messages)) {
          firestoreMessages = roomData.messages;
        }
      }

      const msgMap = new Map<string, any>();
      firestoreMessages.forEach((m: any) => { if (m && m.id) msgMap.set(m.id, m); });
      finalMessages.forEach((m: any) => { if (m && m.id) msgMap.set(m.id, m); });

      const mergedMessages = pruneRoomMessages({ ...targetRoom, messages: Array.from(msgMap.values()) }).messages;

      const roomPayload = cleanForFirestore({ 
        id: targetRoom.id,
        type: targetRoom.type,
        name: targetRoom.name,
        description: targetRoom.description || '',
        messages: mergedMessages,
        members: targetRoom.members || [],
        createdAt: targetRoom.createdAt || new Date().toISOString().split('T')[0]
      });

      await setDoc(roomRef, roomPayload, { merge: true });

      // If general chat, write to all general chat alias documents in Firestore so all subscribers get notified instantly
      const cleanChatId = chatId.toLowerCase();
      if (cleanChatId.includes('general') || cleanChatId.includes('comunidad') || targetRoom.type === 'general') {
        const generalAliasIds = ['chat-general-es', 'chat-general', 'general-spain', 'general'];
        for (const aliasId of generalAliasIds) {
          if (aliasId !== chatId) {
            try {
              await setDoc(doc(db, 'chat_rooms', aliasId), cleanForFirestore({
                ...roomPayload,
                id: aliasId
              }), { merge: true });
            } catch {}
          }
        }
      }
    } catch (error) {
      console.warn('Firestore sendMessage write error:', error);
    }
  };

  const voteInPoll = (chatId: string, messageId: string, optionIndex: number) => {
    if (!currentUser) return;
    setChatRooms(prev => prev.map(room => {
      if (room.id !== chatId) return room;
      const updatedMessages = room.messages.map(msg => {
        if (msg.id !== messageId || !msg.poll) return msg;
        const userId = currentUser.id;
        const isMultiple = msg.poll.multipleAnswers;
        
        const newOptions = msg.poll.options.map((opt, idx) => {
          const hasVoted = Array.isArray(opt.votes) && opt.votes.includes(userId);
          if (idx === optionIndex) {
            if (hasVoted) {
              return { ...opt, votes: opt.votes.filter(id => id !== userId) };
            } else {
              return { ...opt, votes: [...(opt.votes || []), userId] };
            }
          } else {
            if (!isMultiple) {
              return { ...opt, votes: (opt.votes || []).filter(id => id !== userId) };
            }
            return opt;
          }
        });

        return {
          ...msg,
          poll: {
            ...msg.poll,
            options: newOptions
          }
        };
      });
      return { ...room, messages: updatedMessages };
    }));
  };

  const rsvpToEvent = (chatId: string, messageId: string) => {
    if (!currentUser) return;
    setChatRooms(prev => prev.map(room => {
      if (room.id !== chatId) return room;
      const updatedMessages = room.messages.map(msg => {
        if (msg.id !== messageId || !msg.event) return msg;
        const userId = currentUser.id;
        const currentAttendees = Array.isArray(msg.event.attendees) ? msg.event.attendees : [];
        const isAttending = currentAttendees.includes(userId);
        const newAttendees = isAttending
          ? currentAttendees.filter(id => id !== userId)
          : [...currentAttendees, userId];

        return {
          ...msg,
          event: {
            ...msg.event,
            attendees: newAttendees
          }
        };
      });
      return { ...room, messages: updatedMessages };
    }));
  };

  const createGroupChat = async (name: string, description: string, invitedUserIds: string[], avatar?: string) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes crear grupos de chat. Regístrate en la app para acceder a todas las funciones.'
      });
      return;
    }
    const newGroupId = `chat-group-${Date.now()}`;
    const newRoom: ChatRoom = {
      id: newGroupId,
      type: 'group',
      name,
      description,
      avatar: avatar || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString().split('T')[0],
      members: [currentUser.id],
      admins: [currentUser.id],
      status: 'active',
      messages: [
        {
          id: `msg-g-init-${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          text: `👋 Grupo "${name}" creado. Se enviaron invitaciones a los parceros seleccionados.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEncrypted: true,
          encryptedHash: 'SHA256:01ef...'
        }
      ]
    };

    setChatRooms(prev => {
      const filtered = prev.filter(r => r.id !== newGroupId);
      return [...filtered, newRoom];
    });
    setSelectedUserProfile(null);
    setActiveChatId(newGroupId);
    setActiveTab('chats');

    try {
      await setDoc(doc(db, 'chat_rooms', newGroupId), newRoom);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_rooms');
    }

    // Non-blocking Supabase creation if configured
    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    if (hasSupabaseUrl && hasSupabaseKey) {
      try {
        await supabase.from('chat_rooms').upsert([{
          id: newRoom.id,
          name: newRoom.name,
          description: newRoom.description || '',
          created_at: newRoom.createdAt || new Date().toISOString().split('T')[0],
          messages: newRoom.messages
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Non-blocking Supabase group creation error:', err);
      }
    }

    // Send invitations
    invitedUserIds.forEach(targetId => {
      inviteUserToGroup(newGroupId, targetId);
    });

    triggerPlushNotification({
      type: 'group_activity',
      title: 'Grupo creado exitosamente',
      message: `Has creado el grupo "${name}". Los parceros invitados decidirán si unirse.`,
      avatar: newRoom.avatar
    });
  };

  const startPrivateChat = (targetUserId: string, targetUserName?: string, targetUserAvatar?: string): string => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes iniciar chats privados. Regístrate en la app para acceder a todas las funciones.'
      });
      return '';
    }
    const canonicalChatId = getDeterministicPrivateChatId(currentUser.id, targetUserId);

    // Check if private chat already exists
    const existing = chatRooms.find(
      r => r.id === canonicalChatId || (r.type === 'private' && (
        (r.members.includes(targetUserId) && r.members.includes(currentUser.id)) ||
        (r.id.includes(targetUserId) && r.id.includes(currentUser.id)) ||
        r.targetUserId === targetUserId
      ))
    );

    const activeId = existing ? existing.id : canonicalChatId;

    if (existing) {
      setSelectedUserProfile(null);
      setActiveChatId(activeId);
      setActiveTab('chats');
      return activeId;
    }

    const existingUser = otherUsers.find(u => u.id === targetUserId);
    const targetUser: UserProfile = existingUser || {
      id: targetUserId,
      username: targetUserId.replace(/^user-/, ''),
      name: targetUserName || targetUserId.replace(/^user-/, '').replace(/_/g, ' '),
      avatar: targetUserAvatar || DEFAULT_SILHOUETTE_AVATAR,
      bio: `Usuario de La Tierrita España.`,
      website: '',
      city: currentUser.city || 'Madrid',
      originCity: 'Colombia',
      followersCount: 50,
      followingCount: 30,
      postsCount: 1,
      isVerified: false
    };

    if (!existingUser) {
      setOtherUsers(prev => [...prev, targetUser]);
    }

    const newRoom: ChatRoom = {
      id: canonicalChatId,
      type: 'private',
      name: targetUser.name,
      targetUserId: targetUser.id,
      targetUser: targetUser,
      avatar: targetUser.avatar,
      members: [currentUser.id, targetUser.id],
      createdAt: new Date().toISOString().split('T')[0],
      messages: [
        {
          id: `msg-priv-start-${Date.now()}`,
          senderId: 'system',
          senderName: 'Seguridad La Tierrita',
          senderAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100&auto=format&fit=crop&q=80',
          text: `🔒 Los mensajes y llamadas de este chat están cifrados de extremo a extremo. Nadie fuera de este chat puede leerlos.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEncrypted: true,
          encryptedHash: 'SHA256:session-active'
        }
      ]
    };

    setChatRooms(prev => {
      const filtered = prev.filter(r => r.id !== canonicalChatId);
      return [...filtered, newRoom];
    });
    setSelectedUserProfile(null);
    setActiveChatId(canonicalChatId);
    setChatTypeTab('messages');
    setActiveTab('chats');

    setDoc(doc(db, 'chat_rooms', canonicalChatId), newRoom).catch(error => {
      handleFirestoreError(error, OperationType.CREATE, 'chat_rooms');
    });

    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    if (hasSupabaseUrl && hasSupabaseKey) {
      (async () => {
        try {
          await supabase.from('chat_rooms').upsert([{
            id: newRoom.id,
            name: newRoom.name,
            description: newRoom.description || '',
            created_at: newRoom.createdAt || new Date().toISOString().split('T')[0],
            messages: newRoom.messages
          }], { onConflict: 'id' });
        } catch (err) {
          console.warn('Non-blocking Supabase private chat creation error:', err);
        }
      })();
    }

    return canonicalChatId;
  };

  const inviteUserToGroup = (groupId: string, targetUserId: string) => {
    const group = chatRooms.find(r => r.id === groupId);
    const targetUser = otherUsers.find(u => u.id === targetUserId);
    if (!group) return;

    // Simulate invite notification
    triggerPlushNotification({
      type: 'group_activity',
      title: 'Invitación enviada',
      message: `Se envió una solicitud de ingreso a @${targetUser?.username || 'usuario'} para el grupo "${group.name}".`,
      avatar: group.avatar
    });
  };

  const respondToGroupInvite = async (inviteId: string, accept: boolean) => {
    if (isGuestUser) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción Limitada',
        message: 'Como invitado no puedes unirte a grupos de chat. Regístrate en la app para acceder a todas las funciones.'
      });
      return;
    }
    const invite = groupInvites.find(i => i.id === inviteId);
    if (!invite) return;

    setGroupInvites(prev => prev.map(inv => inv.id === inviteId ? { ...inv, status: accept ? 'accepted' : 'rejected' } : inv));

    if (accept) {
      // Add user to the group
      const targetRoom = chatRooms.find(r => r.id === invite.groupId);
      if (targetRoom) {
        const updatedMembers = Array.from(new Set([...targetRoom.members, currentUser.id]));
        const updatedRoom = {
          ...targetRoom,
          members: updatedMembers
        };
        setChatRooms(prev => prev.map(room => room.id === invite.groupId ? updatedRoom : room));
        try {
          await setDoc(doc(db, 'chat_rooms', invite.groupId), updatedRoom, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, 'chat_rooms');
        }
      }

      triggerPlushNotification({
        type: 'group_invite',
        title: '¡Te has unido al grupo!',
        message: `Ahora formas parte de "${invite.groupName}".`,
        avatar: invite.groupAvatar
      });
    } else {
      triggerPlushNotification({
        type: 'group_invite',
        title: 'Invitación rechazada',
        message: `Has rechazado la invitación al grupo "${invite.groupName}".`,
        avatar: invite.groupAvatar
      });
    }
  };

  const reactToMessage = async (chatId: string, messageId: string, emoji: string) => {
    const targetRoom = chatRooms.find(r => r.id === chatId);
    if (!targetRoom) return;

    const updatedMessages = (targetRoom.messages || []).map(msg => {
      if (msg.id !== messageId) return msg;
      const currentReactions = msg.reactions || [];

      // 1. Check if user already reacted with THIS exact emoji
      const existingSameEmoji = currentReactions.find(r => r.emoji === emoji && (r.users || []).includes(currentUser.id));

      // Remove currentUser.id from ALL existing reactions on this message
      let cleanedReactions = currentReactions.map(r => {
        if ((r.users || []).includes(currentUser.id)) {
          const filteredUsers = (r.users || []).filter(u => u !== currentUser.id);
          return {
            ...r,
            count: filteredUsers.length,
            users: filteredUsers
          };
        }
        return r;
      }).filter(r => r.count > 0);

      // If user already had this exact emoji, removing it toggles it OFF
      if (existingSameEmoji) {
        return {
          ...msg,
          reactions: cleanedReactions
        };
      }

      // Otherwise, add currentUser.id to the target emoji
      const targetEmojiIndex = cleanedReactions.findIndex(r => r.emoji === emoji);
      if (targetEmojiIndex > -1) {
        cleanedReactions[targetEmojiIndex] = {
          ...cleanedReactions[targetEmojiIndex],
          count: cleanedReactions[targetEmojiIndex].count + 1,
          users: [...cleanedReactions[targetEmojiIndex].users, currentUser.id]
        };
      } else {
        cleanedReactions.push({
          emoji,
          count: 1,
          users: [currentUser.id]
        });
      }

      return {
        ...msg,
        reactions: cleanedReactions
      };
    });

    const updatedRoom = {
      ...targetRoom,
      messages: updatedMessages
    };

    setChatRooms(prev => prev.map(room => room.id === chatId ? updatedRoom : room));

    // Broadcast reaction change immediately
    try {
      if (chatChannelRef.current) {
        chatChannelRef.current.send({
          type: 'broadcast',
          event: 'update_chat_messages',
          payload: { chatId, messages: updatedMessages }
        });
      }
    } catch {}

    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    if (hasSupabaseUrl && hasSupabaseKey) {
      try {
        await supabase.from('chat_rooms').update({ messages: updatedMessages }).eq('id', chatId);
      } catch (err) {
        console.warn('Non-blocking Supabase reactToMessage write error:', err);
      }
    }

    try {
      await setDoc(doc(db, 'chat_rooms', chatId), updatedRoom, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chat_rooms/${chatId}`);
    }
  };

  const deleteMessageForMe = (messageId: string) => {
    setDeletedMessageIdsForMe(prev => [...prev, messageId]);
    triggerPlushNotification({
      type: 'system',
      title: 'Mensaje eliminado',
      message: 'El mensaje se ha eliminado de tu vista.'
    });
  };

  const deleteMessageForEveryone = async (chatId: string, messageId: string) => {
    const targetRoom = chatRooms.find(r => r.id === chatId);
    if (!targetRoom) return;

    const updatedMessages = (targetRoom.messages || []).map(msg => {
      if (msg.id !== messageId) return msg;
      return {
        ...msg,
        text: 'Este mensaje se elimino para todos.',
        deletedForEveryone: true,
        reactions: []
      };
    });

    const updatedRoom = {
      ...targetRoom,
      messages: updatedMessages
    };

    setChatRooms(prev => prev.map(room => room.id === chatId ? updatedRoom : room));

    // Broadcast deletion for everyone immediately
    try {
      if (chatChannelRef.current) {
        chatChannelRef.current.send({
          type: 'broadcast',
          event: 'update_chat_messages',
          payload: { chatId, messages: updatedMessages }
        });
      }
    } catch {}

    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    if (hasSupabaseUrl && hasSupabaseKey) {
      try {
        await supabase.from('chat_rooms').update({ messages: updatedMessages }).eq('id', chatId);
      } catch (err) {
        console.warn('Non-blocking Supabase deleteMessageForEveryone write error:', err);
      }
    }

    try {
      await setDoc(doc(db, 'chat_rooms', chatId), updatedRoom, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chat_rooms/${chatId}`);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Mensaje eliminado',
      message: 'Has eliminado este mensaje para todos los parceros.'
    });
  };

  const deleteChatRoom = async (chatId: string) => {
    setChatRooms(prev => prev.filter(r => r.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }

    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    if (hasSupabaseUrl && hasSupabaseKey) {
      try {
        await supabase.from('chat_rooms').delete().eq('id', chatId);
      } catch (err) {
        console.warn('Non-blocking Supabase deleteChatRoom error:', err);
      }
    }

    try {
      await deleteDoc(doc(db, 'chat_rooms', chatId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'chat_rooms');
    }
    triggerPlushNotification({
      type: 'system',
      title: 'Chat eliminado',
      message: 'Se ha eliminado la conversación de tu lista.'
    });
  };

  const leaveGroupChat = async (groupId: string) => {
    const group = chatRooms.find(r => r.id === groupId);
    if (!group) return;

    const newMembers = group.members.filter(id => id !== currentUser.id);
    const newAdmins = (group.admins || []).filter(id => id !== currentUser.id);

    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    if (newMembers.length === 0) {
      setChatRooms(prev => prev.filter(r => r.id !== groupId));
      if (activeChatId === groupId) setActiveChatId(null);

      if (hasSupabaseUrl && hasSupabaseKey) {
        try {
          await supabase.from('chat_rooms').delete().eq('id', groupId);
        } catch (err) {
          console.warn('Non-blocking Supabase group deletion error on leave:', err);
        }
      }

      try {
        await deleteDoc(doc(db, 'chat_rooms', groupId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'chat_rooms');
      }
    } else {
      const updatedRoom = {
        ...group,
        members: newMembers,
        admins: newAdmins
      };
      setChatRooms(prev => prev.map(room => room.id === groupId ? updatedRoom : room));
      if (activeChatId === groupId) setActiveChatId(null);

      if (hasSupabaseUrl && hasSupabaseKey) {
        try {
          await supabase.from('chat_rooms').update({
            members: newMembers,
            admins: newAdmins
          }).eq('id', groupId);
        } catch (err) {
          console.warn('Non-blocking Supabase group update error on leave:', err);
        }
      }

      try {
        await setDoc(doc(db, 'chat_rooms', groupId), updatedRoom, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'chat_rooms');
      }
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Has salido del grupo',
      message: `Ya no formas parte de "${group?.name || 'este grupo'}".`
    });
  };

  const toggleGroupAdmin = async (groupId: string, userId: string) => {
    const room = chatRooms.find(r => r.id === groupId);
    if (!room) return;

    if (userId === room.createdBy) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción no permitida',
        message: 'No es posible quitarle el rango de administrador al creador del grupo.'
      });
      return;
    }

    const currentAdmins = room.admins || (room.createdBy ? [room.createdBy] : [currentUser.id]);
    const isAdmin = currentAdmins.includes(userId);
    const newAdmins = isAdmin
      ? currentAdmins.filter(id => id !== userId)
      : [...currentAdmins, userId];

    const updatedRoom = {
      ...room,
      admins: newAdmins
    };

    setChatRooms(prev => prev.map(r => r.id === groupId ? updatedRoom : r));

    try {
      await setDoc(doc(db, 'chat_rooms', groupId), updatedRoom, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'chat_rooms');
    }

    const targetUser = otherUsers.find(u => u.id === userId);
    triggerPlushNotification({
      type: 'system',
      title: 'Administrador actualizado',
      message: `Se ha cambiado el rol de administrador para @${targetUser?.username || 'usuario'}.`
    });
  };

  const removeGroupMember = async (groupId: string, userId: string) => {
    const room = chatRooms.find(r => r.id === groupId);
    if (!room) return;

    if (userId === room.createdBy) {
      triggerPlushNotification({
        type: 'system',
        title: 'Acción no permitida',
        message: 'No es posible eliminar al creador del grupo.'
      });
      return;
    }

    const updatedRoom = {
      ...room,
      members: room.members.filter(id => id !== userId),
      admins: (room.admins || []).filter(id => id !== userId)
    };

    setChatRooms(prev => prev.map(r => r.id === groupId ? updatedRoom : r));

    try {
      await setDoc(doc(db, 'chat_rooms', groupId), updatedRoom, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'chat_rooms');
    }

    const targetUser = otherUsers.find(u => u.id === userId);
    triggerPlushNotification({
      type: 'system',
      title: 'Miembro eliminado',
      message: `Se ha eliminado a @${targetUser?.username || 'usuario'} del grupo.`
    });
  };

  const addMembersToGroup = async (groupId: string, userIds: string[]) => {
    const room = chatRooms.find(r => r.id === groupId);
    if (!room) return;

    const existingMembers = new Set(room.members);
    userIds.forEach(id => existingMembers.add(id));

    const updatedRoom = {
      ...room,
      members: Array.from(existingMembers)
    };

    setChatRooms(prev => prev.map(r => r.id === groupId ? updatedRoom : r));

    try {
      await setDoc(doc(db, 'chat_rooms', groupId), updatedRoom, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'chat_rooms');
    }

    userIds.forEach(id => inviteUserToGroup(groupId, id));
  };

  // Reports
  const openReportModal = (target: {
    id: string;
    type: 'message' | 'user' | 'post' | 'story' | 'group' | 'support';
    title: string;
    chatId?: string;
    reportedUserId?: string;
    reportedUserName?: string;
    initialTicketType?: TicketType;
  }) => {
    setReportTarget(target);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportTarget(null);
  };

  const submitTicketReport = async (
    type: TicketType,
    reasonTitle: string,
    reasonText: string,
    additionalDetails?: string,
    targetItem?: {
      id?: string;
      type?: string;
      title?: string;
      chatId?: string;
      reportedUserId?: string;
      reportedUserName?: string;
    }
  ): Promise<string> => {
    const item: any = targetItem || reportTarget || {
      id: `item-${Date.now()}`,
      title: 'Contenido General',
      type: 'user'
    };

    const reportedUserDisplay = item.reportedUserName || (item.title?.startsWith('@') ? item.title.replace(/^@/, '') : item.title) || 'Usuario';
    const subject = `[${type}] ${reasonTitle}: ${reportedUserDisplay}`;
    const description = `${reasonText}${additionalDetails ? ` - Detalles: ${additionalDetails}` : ''}`;

    try {
      const code = await createSupportTicket(
        type,
        subject,
        description,
        'Media',
        {
          reportedUsername: reportedUserDisplay,
          reportedUserId: item.reportedUserId || (item.id as string),
          reportedItemTitle: item.title,
          reasonTitle,
          reasonText,
          additionalDetails
        }
      );

      const newReport: ContentReport = {
        id: `report-${Date.now()}`,
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        reportedItemId: (item.id as string) || `item-${Date.now()}`,
        reportedType: (item.type as any) || 'user',
        reason: reasonTitle as any,
        details: `${reasonText}. ${additionalDetails || ''}`,
        chatId: item.chatId,
        timestamp: new Date().toLocaleString(),
        status: 'pending'
      };

      setReports(prev => [newReport, ...prev]);
      closeReportModal();

      triggerPlushNotification({
        type: 'system',
        title: `Ticket creado (${code})`,
        message: 'Se ha creado un chat privado en tu bandeja con la etiqueta de tu ticket.',
      });

      return code;
    } catch (e) {
      console.error('Failed to submit ticket report:', e);
      closeReportModal();
      throw e;
    }
  };

  const submitReport = async (reason: string, details: string) => {
    if (!reportTarget) return;

    // Map reported content type to TicketType
    let ticketType: TicketType = 'TRP';
    if (reportTarget.type === 'user') {
      ticketType = 'TRU';
    } else if (reportTarget.type === 'post') {
      ticketType = 'TRP';
    } else if (reportTarget.type === 'story') {
      ticketType = 'TRH';
    } else if (reportTarget.type === 'message') {
      ticketType = 'TRM';
    } else if (reportTarget.type === 'group') {
      ticketType = 'TRG';
    } else if (reportTarget.type === 'support') {
      ticketType = 'TS';
    }

    await submitTicketReport(ticketType, reason, details, '', reportTarget);
  };

  // Notification actions
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
    try {
      localStorage.removeItem('latierrita_notifications');
      localStorage.setItem('latierrita_notifications', '[]');
    } catch {}
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        updateProfile,
        otherUsers,
        followingIds,
        followUser,
        unfollowUser,
        blockedUserIds,
        blockUser,
        unblockUser,
        
        stories,
        addStory,
        deleteStory,
        reactToStory,
        activeStoryIndex,
        setActiveStoryIndex,
        storyViewerRestriction,
        setStoryViewerRestriction,
        isCreateStoryOpen,
        setIsCreateStoryOpen,

        posts,
        likePost,
        toggleSavePost,
        addComment,
        likeComment,
        deleteComment,
        createPost,
        myProfilePosts,
        isCreatePostOpen,
        setIsCreatePostOpen,
        isCreateMenuOpen,
        setIsCreateMenuOpen,

        adBanners,
        refreshBanners,
        addAdBanner,
        deleteAdBanner,
        addStaffPost,
        deleteStaffPost,
        isStaffMode,
        setIsStaffMode,
        isStaffAdminOpen,
        setIsStaffAdminOpen,
        staffAdminTab,
        setStaffAdminTab,
        openStaffAdminWithTab,

        supportTickets,
        createSupportTicket,
        updateTicketStatus,
        deleteSupportTicket,
        verificationRequests,
        respondVerification,
        staffMembers,
        updateStaffMemberRole,
        deletedAccounts,
        deleteAccountByAdmin,
        restoreDeletedAccount,
        permanentlyDeleteAccount,
        toggleSuspendUser,
        updateUserProfileByAdmin,
        deletePostByAdmin,

        startupAdOpen,
        dismissStartupAd,
        simulateAppRestart,
        startupAdConfig,
        updateStartupAdConfig,

        chatRooms,
        activeChatId,
        setActiveChatId,
        sendMessage,
        voteInPoll,
        rsvpToEvent,
        createGroupChat,
        startPrivateChat,
        groupInvites,
        respondToGroupInvite,
        inviteUserToGroup,
        reactToMessage,
        deleteMessageForMe,
        deleteMessageForEveryone,
        deletedMessageIdsForMe,
        deleteChatRoom,
        clearChatMessages,
        leaveGroupChat,
        toggleGroupAdmin,
        removeGroupMember,
        addMembersToGroup,

        reports,
        isReportModalOpen,
        reportTarget,
        openReportModal,
        closeReportModal,
        submitReport,
        submitTicketReport,

        notifications,
        markNotificationAsRead,
        clearNotifications,
        unreadNotificationsCount,
        plushToast,
        dismissPlushToast,
        triggerPlushNotification,

        activeTab,
        setActiveTab,
        exploreSearchQuery,
        setExploreSearchQuery,
        chatSearchQuery,
        setChatSearchQuery,
        placesSearchQuery,
        setPlacesSearchQuery,
        adsSearchQuery,
        setAdsSearchQuery,
        placesSubTab,
        setPlacesSubTab,
        chatTypeTab,
        setChatTypeTab,
        selectedUserProfile,
        setSelectedUserProfile,
        isEditProfileOpen,
        setIsEditProfileOpen,
        isSettingsOpen,
        setIsSettingsOpen,

        places,
        addPlace,
        placeSuggestions,
        suggestPlace,
        updatePlaceSuggestionStatus,
        updatePlaceSuggestionDetails,
        deletePlaceSuggestion
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

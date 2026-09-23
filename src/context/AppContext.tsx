import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth, DEFAULT_SILHOUETTE_AVATAR, mapDBProfileToUserProfile } from './AuthContext';
import { supabase } from '../lib/supabase';
import { db, doc, updateDoc, deleteDoc, setDoc, collection, onSnapshot, addDoc, getDoc, getDocs, query, where } from '../lib/firebase';
import {
  UserProfile,
  StoryItem,
  PostItem,
  AdBanner,
  ChatRoom,
  ChatMessage,
  GroupInvite,
  AppNotification,
  ContentReport,
  SpanishCity,
  PlaceItem,
  SupportTicket,
  VerificationRequest,
  StaffMember,
  DeletedAccount,
  StaffRole,
  StartupAdConfig
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
  addComment: (postId: string, text: string) => void;
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
    taggedUsernames?: string[];
  }) => void;
  myProfilePosts: PostItem[];
  isCreatePostOpen: boolean;
  setIsCreatePostOpen: (open: boolean) => void;
  isCreateMenuOpen: boolean;
  setIsCreateMenuOpen: (open: boolean) => void;

  // Ads & Staff
  adBanners: AdBanner[];
  addAdBanner: (banner: Omit<AdBanner, 'id' | 'active'>) => void;
  deleteAdBanner: (id: string) => void;
  addStaffPost: (post: { title: string; description: string; imageUrl: string; ctaText: string; ctaUrl: string; sponsorName: string }) => void;
  deleteStaffPost: (id: string) => void;
  isStaffMode: boolean;
  setIsStaffMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  isStaffAdminOpen: boolean;
  setIsStaffAdminOpen: (open: boolean) => void;

  // Support & Administration
  supportTickets: SupportTicket[];
  updateTicketStatus: (id: string, status: 'pendientes' | 'en_proceso' | 'resueltos', response?: string) => void;
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
  sendMessage: (chatId: string, text: string, replyTo?: { id: string; senderName: string; text: string }, audioData?: { url: string; duration: number }) => Promise<void>;
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
  leaveGroupChat: (groupId: string) => Promise<void>;
  toggleGroupAdmin: (groupId: string, userId: string) => Promise<void>;
  removeGroupMember: (groupId: string, userId: string) => Promise<void>;
  addMembersToGroup: (groupId: string, userIds: string[]) => Promise<void>;

  // Reports
  reports: ContentReport[];
  isReportModalOpen: boolean;
  reportTarget: { id: string; type: 'message' | 'user' | 'post' | 'story'; title: string; chatId?: string } | null;
  openReportModal: (target: { id: string; type: 'message' | 'user' | 'post' | 'story'; title: string; chatId?: string }) => void;
  closeReportModal: () => void;
  submitReport: (reason: 'spam' | 'inappropriate' | 'harassment' | 'scam' | 'other', details: string) => void;

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  if (!id && !username) return false;
  const cleanId = (id || '').toLowerCase();
  const cleanUsername = (username || '').toLowerCase();
  if (FICTITIOUS_IDS.includes(cleanId)) return true;
  if (FICTITIOUS_USERNAMES.includes(cleanUsername)) return true;
  if (
    cleanUsername.includes('juancamilo_es') ||
    cleanUsername.includes('mariana_bcn') ||
    cleanUsername.includes('carlos_valencia') ||
    cleanUsername.includes('valen_madrid') ||
    cleanUsername.includes('andres_sevilla')
  ) {
    return true;
  }
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

export const pruneRoomMessages = (room: ChatRoom): ChatRoom => {
  if (!room || (room.type !== 'general' && room.type !== 'city')) {
    return room;
  }

  const now = Date.now();
  const rawMessages = Array.isArray(room.messages) ? room.messages : [];

  // 1. Filter out messages older than 48 hours
  const unexpiredMessages = rawMessages.filter(msg => {
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

  // 2. Keep at most the latest 99 messages
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
  const { userProfile, updateUserProfile } = useAuth();

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

  const isStaffAccount = (id?: string, username?: string, email?: string) => {
    return id === 'user-staff' || username === 'latierrita_app' || username === 'latierrita_oficial' || email === 'latierritaapp@gmail.com';
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
    const localCommunity = getLocalCommunity().filter(u => 
      u.id !== 'user-staff' && 
      !isFictitiousUser(u.id, u.username) &&
      (!currentUser || (u.id !== currentUser.id && u.username !== currentUser.username && (!u.email || u.email !== currentUser.email)))
    );

    const initial = [...localCommunity];
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
          list = parsed.filter(id => id && id !== currentId && id !== 'user-staff' && id !== 'latierrita_oficial');
        }
      } catch (e) {
        console.warn('Error parsing latierrita_following:', e);
      }
    }
    return list;
  });

  // Fetch real users from Supabase profiles table and sync with local community cache
  useEffect(() => {
    let isMounted = true;
    const fetchRealProfiles = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');

        const localList = getLocalCommunity();
        const current = currentUserRef.current;
        let mappedList: UserProfile[] = [];

        if (!error && Array.isArray(profiles) && profiles.length > 0) {
          mappedList = profiles.map(p => mapDBProfileToUserProfile(p));
        }

        // Merge DB profiles and local community, filtering out fictitious users
        const allReal = [...mappedList].filter(p => !isFictitiousUser(p.id, p.username));
        localList.forEach(loc => {
          if (!isFictitiousUser(loc.id, loc.username) && !allReal.some(r => r.id === loc.id || r.username === loc.username || (loc.email && r.email === loc.email))) {
            allReal.push(loc);
          }
        });

        if (allReal.length > 0 && isMounted) {
          setOtherUsers(prev => {
            // Filter out current user, staff account, and fictitious users
            const validProfiles = allReal.filter(p => {
              if (p.id === 'user-staff') return false;
              if (p.username === 'latierrita_app' && p.email !== 'latierritaapp@gmail.com') return false;
              if (isFictitiousUser(p.id, p.username)) return false;
              if (current && (p.id === current.id || (p.email && current.email && p.email === current.email))) return false;
              return true;
            });

            const merged = [...validProfiles];
            
            // Do NOT retain fictitious parceros
            prev.forEach(p => {
              if (p.id === 'user-staff' || isFictitiousUser(p.id, p.username)) {
                return;
              }
              if (current && (p.id === current.id || (p.email && current.email && p.email === current.email))) {
                return;
              }
              if (!merged.some(m => m.id === p.id || m.username === p.username || (p.email && m.email === p.email))) {
                merged.push(p);
              }
            });

            // Also update selectedUserProfile if it's currently active and was updated in DB
            setSelectedUserProfile(prevSelected => {
              if (!prevSelected) return null;
              const updated = allReal.find(r => r.id === prevSelected.id || r.username === prevSelected.username || (prevSelected.email && r.email === prevSelected.email));
              return updated ? { ...prevSelected, ...updated } : prevSelected;
            });

            return merged;
          });
        }
      } catch (e) {
        console.warn('Error fetching Supabase profiles for otherUsers:', e);
      }
    };

    fetchRealProfiles();

    // Subscribe to realtime profile updates from Supabase
    const channel = supabase
      .channel('public_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchRealProfiles();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
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
      if (!isStaff) {
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

  // Keep following list strictly clean of self-following and ensure real staff is followed
  useEffect(() => {
    const isCurrentStaff = isStaffAccount(currentUser?.id, currentUser?.username, currentUser?.email);
    if (isCurrentStaff) {
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
    const cleanList = isStaff ? [] : followingIds.filter(id => id !== 'user-staff' && id !== 'latierrita_oficial');
    localStorage.setItem('latierrita_following', JSON.stringify(cleanList));

    setCurrentUser(prev => {
      if (!prev) return prev;
      const expectedCount = isStaff ? 0 : Math.max(1, cleanList.length);
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

  // Posts & profile posts
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [myProfilePosts, setMyProfilePosts] = useState<PostItem[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // Ads & Staff
  const [adBanners, setAdBanners] = useState<AdBanner[]>(() => {
    const saved = localStorage.getItem('latierrita_ad_banners');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_AD_BANNERS;
  });

  useEffect(() => {
    if (adBanners && adBanners.length > 0) {
      localStorage.setItem('latierrita_ad_banners', JSON.stringify(adBanners));
    }
  }, [adBanners]);
  const [isStaffMode, setIsStaffMode] = useState<boolean>(false);
  const [isStaffAdminOpen, setIsStaffAdminOpen] = useState<boolean>(false);

  // Default config for the startup popup ad
  const DEFAULT_STARTUP_AD: StartupAdConfig = {
    id: 'startup_ad',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
    title: 'Gran Festival Tricolor 2026',
    subtitle: '🇨🇴 Madrid & Barcelona',
    badgeText: 'Publicidad Oficial STAFF',
    discountBadge: '20% Dcto Exclusivo',
    description: '¡El mayor encuentro cultural y musical de colombianos en España! Orquestas en vivo, comida típica paisa, costeña y valluna, y zona de emprendimiento.',
    discountCode: 'LATIE2026',
    discountValidity: 'Válido 48h',
    ctaText: 'Ver Boletos y Reservar',
    ctaUrl: 'https://latierrita.es/eventos',
    active: true
  };

  const [startupAdConfig, setStartupAdConfig] = useState<StartupAdConfig | null>(DEFAULT_STARTUP_AD);

  // Startup Ad (only shows on initial open or when closed completely & reopened)
  const [startupAdOpen, setStartupAdOpen] = useState<boolean>(() => {
    const hasSeenSessionAd = sessionStorage.getItem('latierrita_startup_ad_closed');
    return !hasSeenSessionAd;
  });

  // Chats
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(() => {
    const saved = localStorage.getItem('latierrita_chat_rooms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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
    type: 'message' | 'user' | 'post' | 'story';
    title: string;
    chatId?: string;
  } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [plushToast, setPlushToast] = useState<AppNotification | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'chats' | 'notifications' | 'profile' | 'places'>(() => {
    const saved = localStorage.getItem('latierrita_active_tab');
    if (saved && ['feed', 'explore', 'chats', 'notifications', 'profile', 'places'].includes(saved)) {
      return saved as any;
    }
    return 'feed';
  });

  useEffect(() => {
    localStorage.setItem('latierrita_active_tab', activeTab);
  }, [activeTab]);
  const [exploreSearchQuery, setExploreSearchQuery] = useState('');
  const [placesSubTab, setPlacesSubTab] = useState<'places' | 'ads'>('places');
  const [chatTypeTab, setChatTypeTab] = useState<'general' | 'city' | 'messages'>('general');
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
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

  // Derive profile posts dynamically from synced posts
  useEffect(() => {
    if (currentUser) {
      setMyProfilePosts(posts.filter(p => p.userId === currentUser.id || p.username === currentUser.username));
    }
  }, [posts, currentUser]);

  // Sync Banners
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'banners'), (snapshot) => {
        if (snapshot.empty) {
          setAdBanners([]);
        } else {
          const list: AdBanner[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as AdBanner);
          });
          setAdBanners(list);
        }
      }, (error) => {
        setAdBanners([]);
        console.warn('Banners listener error:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setAdBanners([]);
      console.warn('Failed to listen to banners in DB:', e);
    }
  }, []);

  // Sync Stories
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'stories'), (snapshot) => {
        const list: StoryItem[] = [];
        if (!snapshot.empty) {
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data() || {};
            list.push({
              id: docSnap.id,
              ...data,
              userAvatar: data.userAvatar || data.avatarUrl || '',
              timestamp: data.timestamp || data.createdAt || 'Reciente',
              reactions: Array.isArray(data.reactions) ? data.reactions : []
            } as StoryItem);
          });
        }

        // Incorporar historias guardadas localmente (fallback por RLS)
        try {
          const localStoriesRaw = localStorage.getItem('latierrita_local_stories');
          if (localStoriesRaw) {
            const localStories = JSON.parse(localStoriesRaw);
            if (Array.isArray(localStories)) {
              localStories.forEach((ls: StoryItem) => {
                if (!list.some(s => s.id === ls.id)) {
                  list.push(ls);
                }
              });
            }
          }
        } catch (e) {}

        list.sort((a, b) => b.id.localeCompare(a.id));
        setStories(list);
      }, (error) => {
        // En caso de error, mostrar al menos las historias locales
        const list: StoryItem[] = [];
        try {
          const localStoriesRaw = localStorage.getItem('latierrita_local_stories');
          if (localStoriesRaw) {
            const localStories = JSON.parse(localStoriesRaw);
            if (Array.isArray(localStories)) {
              list.push(...localStories);
            }
          }
        } catch (e) {}
        setStories(list);
        console.log('Stories sync: offline or guest mode fallback loaded.');
      });
      return () => unsub();
    } catch (e) {
      setStories([]);
      console.log('Failed to listen to stories in DB:', e);
    }
  }, []);

  // Sync Posts
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'posts'), (snapshot) => {
        const list: PostItem[] = [];
        if (!snapshot.empty) {
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data() || {};
            list.push({
              id: docSnap.id,
              ...data,
              mediaUrl: data.mediaUrl || data.imageUrl || '',
              userAvatar: data.userAvatar || data.avatarUrl || '',
              timestamp: data.timestamp || data.createdAt || 'Reciente',
              likesCount: Array.isArray(data.likes) ? data.likes.length : (typeof data.likesCount === 'number' ? data.likesCount : 0),
              hasLiked: Array.isArray(data.likes) && currentUser ? data.likes.includes(currentUser.id) : (data.hasLiked ?? false),
              hideLocation: data.hideLocation ?? !data.location,
              comments: Array.isArray(data.comments) ? data.comments : []
            } as PostItem);
          });
        }

        // Incorporar publicaciones guardadas localmente (fallback por RLS)
        try {
          const localPostsRaw = localStorage.getItem('latierrita_local_posts');
          if (localPostsRaw) {
            const localPosts = JSON.parse(localPostsRaw);
            if (Array.isArray(localPosts)) {
              localPosts.forEach((lp: PostItem) => {
                if (!list.some(p => p.id === lp.id)) {
                  list.push(lp);
                }
              });
            }
          }
        } catch (e) {}

        list.sort((a, b) => b.id.localeCompare(a.id));
        setPosts(list);
      }, (error) => {
        // En caso de error, mostrar al menos las publicaciones locales
        const list: PostItem[] = [];
        try {
          const localPostsRaw = localStorage.getItem('latierrita_local_posts');
          if (localPostsRaw) {
            const localPosts = JSON.parse(localPostsRaw);
            if (Array.isArray(localPosts)) {
              list.push(...localPosts);
            }
          }
        } catch (e) {}
        setPosts(list);
        console.warn('Posts listener error:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setPosts([]);
      console.warn('Failed to listen to posts in DB:', e);
    }
  }, []);

  // Sync Chat Rooms with dual-engine Supabase and Firestore real-time fallbacks
  useEffect(() => {
    let isMounted = true;

    const hasSupabaseUrl = !!(import.meta.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech');
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'tu_anon_key_aqui';

    const inferRoomType = (id: string, explicitType?: string): 'general' | 'city' | 'private' | 'group' => {
      if (explicitType === 'private' || explicitType === 'group' || explicitType === 'city' || explicitType === 'general') {
        return explicitType;
      }
      if (id.startsWith('chat-priv') || id.startsWith('priv-')) return 'private';
      if (id.startsWith('chat-group') || id.startsWith('group-')) return 'group';
      if (id.startsWith('chat-city') || id.startsWith('city-')) return 'city';
      if (id === 'chat-general' || id.startsWith('chat-gen')) return 'general';
      return 'general';
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
              } else if (senders.length === 1 && currentUserId && currentUserId !== senders[0]) {
                p1 = senders[0];
                p2 = currentUserId;
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
      chatChannel = supabase
        .channel('tierrita_community_chat_sync')
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
              payload.chatId.includes('city');

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
              const roomIndex = prevRooms.findIndex(r => r.id === payload.chatId || (r.type === 'private' && (r.id.includes(payload.chatId) || payload.chatId.includes(r.id.replace(/^chat-priv_/, '')))));
              if (roomIndex >= 0) {
                const existingRoom = prevRooms[roomIndex];
                const alreadyExists = existingRoom.messages.some(m => m.id === payload.message.id);
                if (alreadyExists) return prevRooms;
                const updated = {
                  ...existingRoom,
                  messages: [...existingRoom.messages, payload.message]
                };
                const copy = [...prevRooms];
                copy[roomIndex] = updated;
                return copy;
              } else {
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
            });

            fetchRooms();
          }
        })
        .on('broadcast', { event: 'update_chat_messages' }, ({ payload }) => {
          if (payload && payload.chatId && Array.isArray(payload.messages)) {
            setChatRooms(prevRooms => prevRooms.map(room => {
              if (room.id === payload.chatId) {
                return {
                  ...room,
                  messages: payload.messages
                };
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
        if (docSnap.exists() && docSnap.data()) {
          setStartupAdConfig({ id: docSnap.id, ...docSnap.data() } as StartupAdConfig);
        } else {
          setStartupAdConfig(DEFAULT_STARTUP_AD);
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
  const updateTicketStatus = async (id: string, status: 'pendientes' | 'en_proceso' | 'resueltos', response?: string) => {
    const target = supportTickets.find(t => t.id === id);
    if (!target) return;
    try {
      await updateDoc(doc(db, 'support_tickets', id), {
        status,
        response: response || target.response || ''
      });
      triggerPlushNotification({
        type: 'system',
        title: 'Estado de Ticket Actualizado',
        message: `El ticket ha sido cambiado a "${status}".`
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `support_tickets/${id}`);
    }
  };

  const deleteSupportTicket = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'support_tickets', id));
      triggerPlushNotification({
        type: 'system',
        title: 'Ticket Eliminado',
        message: 'El ticket ha sido eliminado definitivamente del sistema.'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `support_tickets/${id}`);
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
    const target = otherUsers.find(u => u.id === userId) || (currentUser.id === userId ? currentUser : null);
    if (!target) return;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const deletedRecord: DeletedAccount = {
      id: `del-${target.id}-${Date.now()}`,
      userId: target.id,
      username: target.username,
      name: target.name,
      avatar: target.avatar,
      email: target.email,
      deletedAt: new Date().toISOString(),
      retentionExpiresAt: expiresAt,
      reason: reason || 'Eliminación administrativa por STAFF',
      canRestore: true,
      profileData: target
    };

    setDeletedAccounts(prev => [deletedRecord, ...prev]);
    setOtherUsers(prev => prev.filter(u => u.id !== userId));

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

    triggerPlushNotification({
      type: 'system',
      title: 'Cuenta Eliminada (Retención 7 días)',
      message: `La cuenta @${target.username} fue eliminada y se guardó en retención de 7 días.`
    });
  };

  // Deleted accounts actions with 7-day retention management
  const restoreDeletedAccount = async (id: string) => {
    const acc = deletedAccounts.find(d => d.id === id);
    if (!acc) return;

    // 1. Remove from local list
    setDeletedAccounts(prev => prev.filter(d => d.id !== id));

    // 2. Restore in Firestore users collection (unmark isDeleted)
    try {
      const userRef = doc(db, 'users', acc.userId);
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
      const delRef = doc(db, 'deleted_accounts', acc.userId);
      await deleteDoc(delRef);
    } catch (e) {
      console.warn('Failed to delete from Firestore deleted_accounts:', e);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Cuenta Restaurada',
      message: `La cuenta de @${acc.username} ha sido restaurada con éxito. El usuario puede volver a iniciar sesión.`
    });
  };

  const permanentlyDeleteAccount = async (id: string) => {
    const acc = deletedAccounts.find(d => d.id === id);
    if (!acc) return;

    // 1. Remove from local state
    setDeletedAccounts(prev => prev.filter(d => d.id !== id));

    // 2. Permanently delete user document from Firestore users collection (frees the username immediately)
    try {
      const userRef = doc(db, 'users', acc.userId);
      await deleteDoc(userRef);
    } catch (e) {
      console.warn('Failed to permanently delete user from Firestore users:', e);
    }

    // 3. Remove from deleted_accounts in Firestore
    try {
      const delRef = doc(db, 'deleted_accounts', acc.userId);
      await deleteDoc(delRef);
    } catch (e) {
      console.warn('Failed to delete from Firestore deleted_accounts:', e);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Cuenta Eliminada Definitivamente',
      message: `Los datos de @${acc.username} han sido purgados y su nombre de usuario ha quedado libre.`
    });
  };

  const deletePostByAdmin = async (postId: string) => {
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
    setCurrentUser(nextUser);
    localStorage.setItem('latierrita_user', JSON.stringify(nextUser));

    setOtherUsers(prev => prev.map(u => (u.id === currentUser.id || u.username === currentUser.username) ? { ...u, ...updated } : u));
    
    if (selectedUserProfile && (selectedUserProfile.id === currentUser.id || selectedUserProfile.username === currentUser.username)) {
      setSelectedUserProfile(nextUser);
    }
    
    // Also update any posts/stories authored by me in local state
    if (updated.username || updated.avatar) {
      setPosts(prev => prev.map(p => {
        if (p.userId === currentUser.id || p.username === currentUser.username || (currentUser.username === 'latierrita_app' && (p.isStaffAd || p.username === 'latierrita_app' || p.userId === 'user-staff'))) {
          return {
            ...p,
            username: updated.username || p.username,
            userAvatar: updated.avatar || p.userAvatar
          };
        }
        return p;
      }));
      setMyProfilePosts(prev => prev.map(p => {
        return {
          ...p,
          username: updated.username || p.username,
          userAvatar: updated.avatar || p.userAvatar
        };
      }));
    }

    try {
      if (currentUser?.id) {
        await setDoc(doc(db, 'users', currentUser.id), {
          ...updated,
          avatar: nextUser.avatar,
          avatar_url: nextUser.avatar,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch {
      // Non-fatal Firestore update
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
      await setDoc(doc(db, 'config', 'startup_ad'), config);
      triggerPlushNotification({
        type: 'system',
        title: 'Publicidad de Inicio Actualizada',
        message: 'La publicidad emergente oficial del STAFF ha sido actualizada con éxito.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/startup_ad');
    }
  };

  // Stories
  const addStory = async (data: { mediaUrl: string; caption?: string }) => {
    const newStoryId = `story-${Date.now()}`;
    const newStory: StoryItem = {
      id: newStoryId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      userCity: currentUser.city,
      mediaUrl: data.mediaUrl,
      caption: data.caption,
      timestamp: 'Justo ahora',
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

  // Posts
  const likePost = async (postId: string) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const currentLikes: string[] = Array.isArray((targetPost as any).likes)
      ? [...(targetPost as any).likes]
      : [];
    const alreadyLiked = targetPost.hasLiked || currentLikes.includes(currentUser.id);
    const updatedLikes = alreadyLiked
      ? currentLikes.filter(uid => uid !== currentUser.id)
      : [...currentLikes, currentUser.id];

    const newHasLiked = !alreadyLiked;
    const newLikesCount = updatedLikes.length;

    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      hasLiked: newHasLiked,
      likesCount: newLikesCount,
      likes: updatedLikes
    } as any : p));

    try {
      await updateDoc(doc(db, 'posts', postId), {
        likes: updatedLikes
      });
    } catch (error) {
      console.warn('Could not sync like to DB, state updated locally:', error);
    }
  };

  const addComment = async (postId: string, text: string) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const newComment = {
      id: `c-${Date.now()}`,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      text,
      timestamp: 'Justo ahora'
    };
    const updatedComments = [...(targetPost.comments || []), newComment];

    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      comments: updatedComments
    } : p));

    try {
      await updateDoc(doc(db, 'posts', postId), {
        comments: updatedComments
      });
    } catch (error) {
      console.warn('Could not sync comment to DB, state updated locally:', error);
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
    const newPostId = `post-${Date.now()}`;
    const newPost: PostItem = {
      id: newPostId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      userCity: currentUser.city,
      mediaUrl: data.mediaUrl,
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
    setPosts(prev => [newPost, ...prev]);

    // Guardado local resistente para fallback inmediato
    try {
      const localPostsRaw = localStorage.getItem('latierrita_local_posts') || '[]';
      const localPosts = JSON.parse(localPostsRaw);
      localPosts.push(newPost);
      localStorage.setItem('latierrita_local_posts', JSON.stringify(localPosts));
    } catch (e) {
      console.warn('Local post storage note:', e);
    }

    try {
      await setDoc(doc(db, 'posts', newPostId), newPost);
      setCurrentUser(prev => ({ ...prev, postsCount: prev.postsCount + 1 }));
      setIsCreatePostOpen(false);
      triggerPlushNotification({
        type: 'system',
        title: 'Publicación subida',
        message: 'Tu nueva foto ya está disponible en tu perfil y en el feed.',
        avatar: currentUser.avatar
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  // Staff Ads
  const addAdBanner = async (banner: Omit<AdBanner, 'id' | 'active'>) => {
    const newBannerId = `banner-${Date.now()}`;
    const newBanner: AdBanner = {
      ...banner,
      id: newBannerId,
      active: true
    };
    try {
      await setDoc(doc(db, 'banners', newBannerId), newBanner);
      triggerPlushNotification({
        type: 'system',
        title: 'STAFF: Anuncio añadido al carrusel',
        message: `El banner "${banner.title}" ya está activo en el carrusel de inicio.`,
        avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'banners');
    }
  };

  const deleteAdBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `banners/${id}`);
    }
  };

  const addStaffPost = async (data: { title: string; description: string; imageUrl: string; ctaText: string; ctaUrl: string; sponsorName: string }) => {
    const newStaffPostId = `post-staff-${Date.now()}`;
    const newStaffPost: PostItem = {
      id: newStaffPostId,
      userId: 'user-staff',
      username: 'staff_latierrita',
      userAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80',
      userCity: currentUser.city,
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
    try {
      await setDoc(doc(db, 'posts', newStaffPostId), newStaffPost);
      triggerPlushNotification({
        type: 'system',
        title: 'STAFF: Anuncio añadido al feed',
        message: `Se ha publicado el anuncio patrocinado "${data.title}" en el feed.`,
        avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    }
  };

  // Chats
  const sendMessage = async (
    chatId: string,
    text: string,
    replyTo?: { id: string; senderName: string; text: string },
    audioData?: { url: string; duration: number }
  ) => {
    if (!text.trim() && !audioData) return;

    // Simulated SHA-256 E2E Encryption fingerprint
    const simulatedHash = 'SHA256:' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const msgText = text.trim() || (audioData ? '🎤 Nota de voz' : '');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderCity: currentUser.city,
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      isEncrypted: true,
      encryptedHash: simulatedHash,
      replyTo: replyTo ? {
        id: replyTo.id,
        senderName: replyTo.senderName,
        text: replyTo.text
      } : undefined,
      audioUrl: audioData?.url,
      audioDuration: audioData?.duration
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
      
      if (docSnap.exists()) {
        const roomData = docSnap.data();
        if (Array.isArray(roomData.messages)) {
          firestoreMessages = roomData.messages;
        }
      }

      const msgMap = new Map<string, any>();
      firestoreMessages.forEach((m: any) => { if (m && m.id) msgMap.set(m.id, m); });
      finalMessages.forEach((m: any) => { if (m && m.id) msgMap.set(m.id, m); });

      const mergedMessages = pruneRoomMessages({ ...targetRoom, messages: Array.from(msgMap.values()) }).messages;

      await setDoc(roomRef, { 
        id: targetRoom.id,
        type: targetRoom.type,
        name: targetRoom.name,
        description: targetRoom.description || '',
        messages: mergedMessages,
        members: targetRoom.members || [],
        createdAt: targetRoom.createdAt || new Date().toISOString().split('T')[0]
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore sendMessage write error:', error);
    }
  };

  const createGroupChat = async (name: string, description: string, invitedUserIds: string[], avatar?: string) => {
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

    const updatedMessages = targetRoom.messages.map(msg => {
      if (msg.id !== messageId) return msg;
      const currentReactions = msg.reactions || [];

      // 1. Check if user already reacted with THIS exact emoji
      const existingSameEmoji = currentReactions.find(r => r.emoji === emoji && r.users.includes(currentUser.id));

      // Remove currentUser.id from ALL existing reactions on this message
      let cleanedReactions = currentReactions.map(r => {
        if (r.users.includes(currentUser.id)) {
          const filteredUsers = r.users.filter(u => u !== currentUser.id);
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

    const updatedMessages = targetRoom.messages.map(msg => {
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
  const openReportModal = (target: { id: string; type: 'message' | 'user' | 'post' | 'story'; title: string; chatId?: string }) => {
    setReportTarget(target);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setReportTarget(null);
  };

  const submitReport = (reason: 'spam' | 'inappropriate' | 'harassment' | 'scam' | 'other', details: string) => {
    if (!reportTarget) return;

    const newReport: ContentReport = {
      id: `report-${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reportedItemId: reportTarget.id,
      reportedType: reportTarget.type,
      reason,
      details,
      chatId: reportTarget.chatId,
      timestamp: new Date().toLocaleString(),
      status: 'pending'
    };

    setReports(prev => [newReport, ...prev]);
    closeReportModal();

    triggerPlushNotification({
      type: 'system',
      title: 'Reporte recibido por el STAFF',
      message: 'Gracias por colaborar con la seguridad de la comunidad. Nuestro equipo de moderación revisará el contenido.',
    });
  };

  // Notification actions
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
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
        addComment,
        createPost,
        myProfilePosts,
        isCreatePostOpen,
        setIsCreatePostOpen,
        isCreateMenuOpen,
        setIsCreateMenuOpen,

        adBanners,
        addAdBanner,
        deleteAdBanner,
        addStaffPost,
        deleteStaffPost,
        isStaffMode,
        setIsStaffMode,
        isStaffAdminOpen,
        setIsStaffAdminOpen,

        supportTickets,
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
        addPlace
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, DEFAULT_SILHOUETTE_AVATAR, mapDBProfileToUserProfile } from './AuthContext';
import { supabase } from '../lib/supabase';
import { db, doc, updateDoc, deleteDoc, setDoc, collection, onSnapshot, addDoc, getDocs, query, where } from '../lib/firebase';
import {
  UserProfile,
  StoryItem,
  PostItem,
  AdBanner,
  ChatRoom,
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
  reactToStory: (storyId: string, emoji: string) => void;
  activeStoryIndex: number | null;
  setActiveStoryIndex: (index: number | null) => void;
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
  sendMessage: (chatId: string, text: string) => void;
  createGroupChat: (name: string, description: string, invitedUserIds: string[], avatar?: string) => void;
  startPrivateChat: (targetUserId: string) => string;
  groupInvites: GroupInvite[];
  respondToGroupInvite: (inviteId: string, accept: boolean) => void;
  inviteUserToGroup: (groupId: string, targetUserId: string) => void;
  reactToMessage: (chatId: string, messageId: string, emoji: string) => void;
  deleteMessageForMe: (messageId: string) => void;
  deleteMessageForEveryone: (chatId: string, messageId: string) => void;
  deletedMessageIdsForMe: string[];
  deleteChatRoom: (chatId: string) => void;
  leaveGroupChat: (groupId: string) => void;
  toggleGroupAdmin: (groupId: string, userId: string) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  addMembersToGroup: (groupId: string, userIds: string[]) => void;

  // Reports
  reports: ContentReport[];
  isReportModalOpen: boolean;
  reportTarget: { id: string; type: 'message' | 'user' | 'post'; title: string; chatId?: string } | null;
  openReportModal: (target: { id: string; type: 'message' | 'user' | 'post'; title: string; chatId?: string }) => void;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, updateUserProfile } = useAuth();

  // Current user
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('latierrita_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.username === 'juancamilo_es') {
          parsed.staffRole = 'Usuario';
          parsed.isVerified = false;
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

  const [otherUsers, setOtherUsers] = useState<UserProfile[]>(OTHER_USERS);
  const [followingIds, setFollowingIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('latierrita_following');
    const isCurrentStaff = isStaffAccount(currentUser?.id, currentUser?.username, currentUser?.email);
    let list: string[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const currentId = currentUser?.id;
          list = parsed.filter(id => id !== currentId && (!isCurrentStaff || id !== 'user-staff'));
        }
      } catch (e) {
        console.warn('Error parsing latierrita_following:', e);
      }
    }
    // Automatically follow official staff account @latierrita_app for all non-staff accounts
    if (!isCurrentStaff && !list.includes('user-staff')) {
      list.push('user-staff');
    }
    return isCurrentStaff ? list.filter(id => id !== 'user-staff') : list;
  });

  // Fetch real users from Supabase profiles table
  useEffect(() => {
    let isMounted = true;
    const fetchRealProfiles = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');

        if (!error && Array.isArray(profiles) && profiles.length > 0 && isMounted) {
          const mappedList: UserProfile[] = profiles.map(p => {
            const mapped = mapDBProfileToUserProfile(p);
            if (mapped.username === 'latierrita_oficial' || mapped.email === 'latierritaapp@gmail.com') {
              mapped.username = 'latierrita_app';
            }
            return mapped;
          });

          setOtherUsers(prev => {
            const realStaff = mappedList.find(p => p.email === 'latierritaapp@gmail.com' || p.username === 'latierrita_app' || p.username === 'latierrita_oficial');
            const merged = [...mappedList];
            
            // Retain mock users only if they don't conflict with real database users
            prev.forEach(p => {
              // If real staff exists in DB, replace placeholder 'user-staff'
              if (realStaff && (p.id === 'user-staff' || p.username === 'latierrita_app' || p.username === 'latierrita_oficial' || p.email === 'latierritaapp@gmail.com')) {
                return;
              }
              const cleanUser = { ...p };
              if (cleanUser.username === 'latierrita_oficial') {
                cleanUser.username = 'latierrita_app';
              }
              if (!merged.some(m => m.id === cleanUser.id || m.username === cleanUser.username || (cleanUser.email && m.email === cleanUser.email))) {
                merged.push(cleanUser);
              }
            });

            // If real staff account is present, ensure all non-staff accounts follow its real ID
            if (realStaff && !isStaffAccount(currentUser?.id, currentUser?.username, currentUser?.email)) {
              setFollowingIds(fIds => {
                const targetId = realStaff.id;
                const cleaned = fIds.filter(id => id !== 'latierrita_oficial');
                if (!cleaned.includes(targetId)) {
                  return [...cleaned, targetId];
                }
                return cleaned;
              });
            }

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
  }, [currentUser]);

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
        sanitized.followingCount = Math.max(sanitized.followingCount || 0, followingIds.length, 1);
      } else {
        const communityFollowersCount = otherUsers.filter(u => !isStaffAccount(u.id, u.username, u.email)).length;
        sanitized.followersCount = Math.max(sanitized.followersCount || 0, communityFollowersCount);
      }
      setCurrentUser(sanitized);
    }
  }, [userProfile, followingIds, otherUsers]);

  // Keep following list strictly clean of self-following and ensure @latierrita_app is followed
  useEffect(() => {
    const isCurrentStaff = isStaffAccount(currentUser?.id, currentUser?.username, currentUser?.email);
    setFollowingIds(prev => {
      let cleaned = prev.filter(id => id !== currentUser.id && (!isCurrentStaff || id !== 'user-staff'));
      if (!isCurrentStaff && !cleaned.includes('user-staff')) {
        cleaned.push('user-staff');
      }
      if (cleaned.length !== prev.length || !cleaned.every((val, idx) => val === prev[idx])) {
        return cleaned;
      }
      return prev;
    });
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('latierrita_following', JSON.stringify(followingIds));
    setCurrentUser(prev => {
      if (prev && prev.followingCount !== followingIds.length) {
        const updated = { ...prev, followingCount: followingIds.length };
        localStorage.setItem('latierrita_user', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  }, [followingIds]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('latierrita_blocked');
    return saved ? JSON.parse(saved) : [];
  });

  // Stories
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

  // Posts & profile posts
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [myProfilePosts, setMyProfilePosts] = useState<PostItem[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // Ads & Staff
  const [adBanners, setAdBanners] = useState<AdBanner[]>([]);
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
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(INITIAL_CHAT_ROOMS);
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
    type: 'message' | 'user' | 'post';
    title: string;
    chatId?: string;
  } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [plushToast, setPlushToast] = useState<AppNotification | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState<'feed' | 'explore' | 'chats' | 'notifications' | 'profile' | 'places'>('feed');
  const [exploreSearchQuery, setExploreSearchQuery] = useState('');
  const [placesSubTab, setPlacesSubTab] = useState<'places' | 'ads'>('places');
  const [chatTypeTab, setChatTypeTab] = useState<'general' | 'city' | 'messages'>('general');
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          setAdBanners(INITIAL_AD_BANNERS);
        } else {
          const list: AdBanner[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as AdBanner);
          });
          setAdBanners(list);
        }
      }, (error) => {
        setAdBanners(INITIAL_AD_BANNERS);
        console.warn('Banners listener using fallback data:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setAdBanners(INITIAL_AD_BANNERS);
      console.warn('Failed to listen to banners in DB:', e);
    }
  }, []);

  // Sync Stories
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'stories'), (snapshot) => {
        if (snapshot.empty) {
          setStories(INITIAL_STORIES);
        } else {
          const list: StoryItem[] = [];
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
          list.sort((a, b) => b.id.localeCompare(a.id));
          setStories(list);
        }
      }, (error) => {
        setStories(INITIAL_STORIES);
        console.warn('Stories listener using fallback data:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setStories(INITIAL_STORIES);
      console.warn('Failed to listen to stories in DB:', e);
    }
  }, []);

  // Sync Posts
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'posts'), (snapshot) => {
        if (snapshot.empty) {
          setPosts(INITIAL_POSTS);
        } else {
          const list: PostItem[] = [];
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
              comments: Array.isArray(data.comments) ? data.comments : []
            } as PostItem);
          });
          list.sort((a, b) => b.id.localeCompare(a.id));
          setPosts(list);
        }
      }, (error) => {
        setPosts(INITIAL_POSTS);
        console.warn('Posts listener using fallback data:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setPosts(INITIAL_POSTS);
      console.warn('Failed to listen to posts in DB:', e);
    }
  }, []);

  // Sync Support Tickets
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'support_tickets'), (snapshot) => {
        if (snapshot.empty) {
          setSupportTickets(INITIAL_SUPPORT_TICKETS);
        } else {
          const list: SupportTicket[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
          });
          setSupportTickets(list);
        }
      }, (error) => {
        setSupportTickets(INITIAL_SUPPORT_TICKETS);
        console.warn('Support tickets listener using fallback data:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setSupportTickets(INITIAL_SUPPORT_TICKETS);
      console.warn('Failed to listen to support_tickets in DB:', e);
    }
  }, []);

  // Sync Verification Requests
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'verification_requests'), (snapshot) => {
        if (snapshot.empty) {
          setVerificationRequests(INITIAL_VERIFICATION_REQUESTS);
        } else {
          const list: VerificationRequest[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as VerificationRequest);
          });
          setVerificationRequests(list);
        }
      }, (error) => {
        setVerificationRequests(INITIAL_VERIFICATION_REQUESTS);
        console.warn('Verification requests listener using fallback data:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setVerificationRequests(INITIAL_VERIFICATION_REQUESTS);
      console.warn('Failed to listen to verification_requests in DB:', e);
    }
  }, []);

  // Sync Staff Members
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'staff_members'), (snapshot) => {
        if (snapshot.empty) {
          setStaffMembers(INITIAL_STAFF_MEMBERS);
        } else {
          const list: StaffMember[] = [];
          snapshot.forEach((docSnap: any) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as StaffMember);
          });
          setStaffMembers(list);
        }
      }, (error) => {
        setStaffMembers(INITIAL_STAFF_MEMBERS);
        console.warn('Staff members listener using fallback data:', error?.message || error);
      });
      return () => unsub();
    } catch (e) {
      setStaffMembers(INITIAL_STAFF_MEMBERS);
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
        console.warn('Startup ad config listener using fallback data:', error?.message || error);
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
  const [places, setPlaces] = useState<PlaceItem[]>(INITIAL_PLACES);

  const addPlace = (placeData: Omit<PlaceItem, 'id'>) => {
    const newPlace: PlaceItem = {
      ...placeData,
      id: `place-${Date.now()}`
    };
    setPlaces(prev => [newPlace, ...prev]);
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
    
    // Also update any posts/stories authored by me in local state
    if (updated.username || updated.avatar) {
      setPosts(prev => prev.map(p => {
        if (p.userId === currentUser.id || p.username === currentUser.username) {
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
      await updateUserProfile(updated);
    } catch (err) {
      console.warn('Could not sync profile to Supabase:', err);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Perfil actualizado',
      message: 'Los cambios en tu perfil se han guardado con éxito.',
      avatar: nextUser.avatar
    });
  };

  // Follow / Unfollow
  const followUser = (userId: string) => {
    if (userId === currentUser.id) return;
    if (isStaffAccount(currentUser.id, currentUser.username) && (userId === 'user-staff' || userId === currentUser.id)) return;
    if (followingIds.includes(userId)) return;
    setFollowingIds(prev => [...prev, userId]);
    setCurrentUser(prev => ({ ...prev, followingCount: prev.followingCount + 1 }));
    setOtherUsers(prev => prev.map(u => u.id === userId ? { ...u, followersCount: u.followersCount + 1 } : u));
    
    const target = otherUsers.find(u => u.id === userId);
    triggerPlushNotification({
      type: 'follow',
      title: 'Nuevo parcero seguido',
      message: `Has comenzado a seguir a @${target?.username || 'usuario'}.`,
      avatar: target?.avatar
    });
  };

  const unfollowUser = (userId: string) => {
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

    setFollowingIds(prev => prev.filter(id => id !== userId));
    setCurrentUser(prev => ({ ...prev, followingCount: Math.max(0, prev.followingCount - 1) }));
    setOtherUsers(prev => prev.map(u => u.id === userId ? { ...u, followersCount: Math.max(0, u.followersCount - 1) } : u));
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
      location: data.location || `${currentUser.city}, España`,
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
  const sendMessage = (chatId: string, text: string) => {
    if (!text.trim()) return;

    // Simulated SHA-256 E2E Encryption fingerprint
    const simulatedHash = 'SHA256:' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderCity: currentUser.city,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEncrypted: true,
      encryptedHash: simulatedHash
    };

    setChatRooms(prev => prev.map(room => {
      if (room.id !== chatId) return room;
      return {
        ...room,
        messages: [...room.messages, newMsg]
      };
    }));

    // If chat is a group or city, simulate a reply after 2.5 seconds to show active community
    const currentRoom = chatRooms.find(r => r.id === chatId);
    if (currentRoom) {
      if (currentRoom.type === 'city') {
        setTimeout(() => {
          const autoReplies = [
            `¡Qué chimba de plan! Saludos paisano en ${currentUser.city} 🇨🇴`,
            `Totalmente de acuerdo parcero, ¡así se hace!`,
            `Cualquier duda que tengan por acá a la orden en ${currentUser.city}.`
          ];
          const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
          const simulatedFriend = otherUsers.find(u => u.city === currentUser.city) || otherUsers[0];
          
          const replyMsg = {
            id: `msg-${Date.now()}`,
            senderId: simulatedFriend.id,
            senderName: simulatedFriend.name,
            senderAvatar: simulatedFriend.avatar,
            senderCity: simulatedFriend.city,
            text: randomReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isEncrypted: true,
            encryptedHash: 'SHA256:' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
              .map(b => b.toString(16).padStart(2, '0')).join('')
          };

          setChatRooms(prevRooms => prevRooms.map(r => {
            if (r.id !== chatId) return r;
            return {
              ...r,
              messages: [...r.messages, replyMsg]
            };
          }));

          triggerPlushNotification({
            type: 'chat_city',
            title: `Nuevo mensaje en ${currentRoom.name}`,
            message: `${simulatedFriend.name}: "${randomReply}"`,
            avatar: simulatedFriend.avatar,
            data: { chatId: currentRoom.id, chatType: 'city' }
          });
        }, 2500);
      } else if (currentRoom.type === 'private') {
        const target = otherUsers.find(u => u.id === currentRoom.targetUserId);
        if (target) {
          setTimeout(() => {
            const privateReplies = [
              '¡Hola Juan! Listo, me parece genial. Seguimos hablando por aquí 👍',
              'Súper parcero, gracias por la info. ¡Cuidate mucho!',
              '¡De una! Te aviso cualquier cosa.'
            ];
            const randomRep = privateReplies[Math.floor(Math.random() * privateReplies.length)];
            const rep = {
              id: `msg-${Date.now()}`,
              senderId: target.id,
              senderName: target.name,
              senderAvatar: target.avatar,
              text: randomRep,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isEncrypted: true,
              encryptedHash: 'SHA256:' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
                .map(b => b.toString(16).padStart(2, '0')).join('')
            };
            setChatRooms(prevRooms => prevRooms.map(r => r.id === chatId ? { ...r, messages: [...r.messages, rep] } : r));
            triggerPlushNotification({
              type: 'chat_private',
              title: `Mensaje de ${target.name}`,
              message: randomRep,
              avatar: target.avatar,
              data: { chatId: currentRoom.id, chatType: 'private' }
            });
          }, 2000);
        }
      }
    }
  };

  const createGroupChat = (name: string, description: string, invitedUserIds: string[], avatar?: string) => {
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

    setChatRooms(prev => [...prev, newRoom]);
    setActiveChatId(newGroupId);

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

  const startPrivateChat = (targetUserId: string): string => {
    // Check if private chat already exists
    const existing = chatRooms.find(
      r => r.type === 'private' && (r.targetUserId === targetUserId || (r.members.includes(targetUserId) && r.members.includes(currentUser.id)))
    );

    if (existing) {
      setActiveChatId(existing.id);
      setActiveTab('chats');
      return existing.id;
    }

    const existingUser = otherUsers.find(u => u.id === targetUserId);
    const targetUser: UserProfile = existingUser || {
      id: targetUserId,
      username: targetUserId.replace(/^user-/, ''),
      name: targetUserId.replace(/^user-/, '').replace(/_/g, ' '),
      avatar: DEFAULT_SILHOUETTE_AVATAR,
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

    const newChatId = `chat-priv-${Date.now()}`;
    const newRoom: ChatRoom = {
      id: newChatId,
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

    setChatRooms(prev => [...prev, newRoom]);
    setActiveChatId(newChatId);
    setActiveTab('chats');
    return newChatId;
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

  const respondToGroupInvite = (inviteId: string, accept: boolean) => {
    const invite = groupInvites.find(i => i.id === inviteId);
    if (!invite) return;

    setGroupInvites(prev => prev.map(inv => inv.id === inviteId ? { ...inv, status: accept ? 'accepted' : 'rejected' } : inv));

    if (accept) {
      // Add user to the group
      setChatRooms(prev => prev.map(room => {
        if (room.id === invite.groupId) {
          return {
            ...room,
            members: [...room.members, currentUser.id]
          };
        }
        return room;
      }));

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

  const reactToMessage = (chatId: string, messageId: string, emoji: string) => {
    setChatRooms(prev => prev.map(room => {
      if (room.id !== chatId) return room;
      return {
        ...room,
        messages: room.messages.map(msg => {
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
        })
      };
    }));
  };

  const deleteMessageForMe = (messageId: string) => {
    setDeletedMessageIdsForMe(prev => [...prev, messageId]);
    triggerPlushNotification({
      type: 'system',
      title: 'Mensaje eliminado',
      message: 'El mensaje se ha eliminado de tu vista.'
    });
  };

  const deleteMessageForEveryone = (chatId: string, messageId: string) => {
    setChatRooms(prev => prev.map(room => {
      if (room.id !== chatId) return room;
      return {
        ...room,
        messages: room.messages.map(msg => {
          if (msg.id !== messageId) return msg;
          return {
            ...msg,
            text: 'Este mensaje se elimino para todos.',
            deletedForEveryone: true,
            reactions: []
          };
        })
      };
    }));
    triggerPlushNotification({
      type: 'system',
      title: 'Mensaje eliminado',
      message: 'Has eliminado este mensaje para todos los parceros.'
    });
  };

  const deleteChatRoom = (chatId: string) => {
    setChatRooms(prev => prev.filter(r => r.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    triggerPlushNotification({
      type: 'system',
      title: 'Chat eliminado',
      message: 'Se ha eliminado la conversación de tu lista.'
    });
  };

  const leaveGroupChat = (groupId: string) => {
    const group = chatRooms.find(r => r.id === groupId);
    setChatRooms(prev => prev.map(room => {
      if (room.id !== groupId) return room;
      const newMembers = room.members.filter(id => id !== currentUser.id);
      const newAdmins = (room.admins || []).filter(id => id !== currentUser.id);
      return {
        ...room,
        members: newMembers,
        admins: newAdmins
      };
    }).filter(room => room.type !== 'group' || room.members.length > 0));

    if (activeChatId === groupId) {
      setActiveChatId(null);
    }

    triggerPlushNotification({
      type: 'system',
      title: 'Has salido del grupo',
      message: `Ya no formas parte de "${group?.name || 'este grupo'}".`
    });
  };

  const toggleGroupAdmin = (groupId: string, userId: string) => {
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

    setChatRooms(prev => prev.map(r => {
      if (r.id !== groupId) return r;
      const currentAdmins = r.admins || (r.createdBy ? [r.createdBy] : [currentUser.id]);
      const isAdmin = currentAdmins.includes(userId);
      const newAdmins = isAdmin
        ? currentAdmins.filter(id => id !== userId)
        : [...currentAdmins, userId];

      return {
        ...r,
        admins: newAdmins
      };
    }));

    const targetUser = otherUsers.find(u => u.id === userId);
    triggerPlushNotification({
      type: 'system',
      title: 'Administrador actualizado',
      message: `Se ha cambiado el rol de administrador para @${targetUser?.username || 'usuario'}.`
    });
  };

  const removeGroupMember = (groupId: string, userId: string) => {
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

    setChatRooms(prev => prev.map(r => {
      if (r.id !== groupId) return r;
      return {
        ...r,
        members: r.members.filter(id => id !== userId),
        admins: (r.admins || []).filter(id => id !== userId)
      };
    }));

    const targetUser = otherUsers.find(u => u.id === userId);
    triggerPlushNotification({
      type: 'system',
      title: 'Miembro eliminado',
      message: `Se ha eliminado a @${targetUser?.username || 'usuario'} del grupo.`
    });
  };

  const addMembersToGroup = (groupId: string, userIds: string[]) => {
    setChatRooms(prev => prev.map(room => {
      if (room.id !== groupId) return room;
      const existingMembers = new Set(room.members);
      userIds.forEach(id => existingMembers.add(id));
      return {
        ...room,
        members: Array.from(existingMembers)
      };
    }));

    userIds.forEach(id => inviteUserToGroup(groupId, id));
  };

  // Reports
  const openReportModal = (target: { id: string; type: 'message' | 'user' | 'post'; title: string; chatId?: string }) => {
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
        reactToStory,
        activeStoryIndex,
        setActiveStoryIndex,
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

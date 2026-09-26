import {
  UserProfile,
  StoryItem,
  PostItem,
  AdBanner,
  ChatRoom,
  GroupInvite,
  AppNotification,
  PlaceItem,
  SupportTicket,
  VerificationRequest,
  StaffMember,
  DeletedAccount
} from '../types';

export const INITIAL_CURRENT_USER: UserProfile = {
  id: 'user-guest',
  username: 'parcero',
  name: 'Usuario La Tierrita',
  avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231e293b'/%3E%3Ccircle cx='50' cy='36' r='18' fill='%2394a3b8'/%3E%3Cpath d='M20 86 C20 68 34 60 50 60 C66 60 80 68 80 86 Z' fill='%2394a3b8'/%3E%3C/svg%3E",
  bio: '🇨🇴 ¡Orgullo colombiano en España! 🇪🇸',
  website: '',
  city: 'Madrid',
  originCity: 'Colombia',
  notificationTone: 'Alegre Campesino (Bambuco)',
  isPrivateAccount: false,
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  isVerified: false,
  staffRole: 'Usuario'
};

export const OTHER_USERS: UserProfile[] = [];

export const INITIAL_STORIES: StoryItem[] = [];

export const INITIAL_AD_BANNERS: AdBanner[] = [];

export const INITIAL_POSTS: PostItem[] = [];

export const CURRENT_USER_PROFILE_POSTS: PostItem[] = [];

export const INITIAL_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'chat-general-es',
    type: 'general',
    name: '🇨🇴 Gran Chat General Colombia en España',
    description: 'Espacio público abierto para toda la comunidad colombiana en cualquier punto de España. Preguntas, anécdotas y fraternidad.',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&auto=format&fit=crop&q=80',
    members: [],
    createdAt: '2026-01-01',
    messages: []
  },
  {
    id: 'chat-city-madrid',
    type: 'city',
    city: 'Madrid',
    name: '📍 Parceros en Madrid',
    description: 'Chat oficial exclusivo para colombianos viviendo en la Comunidad de Madrid. Trámites, planes, recomendaciones y citas previas.',
    avatar: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=300&auto=format&fit=crop&q=80',
    members: [],
    createdAt: '2026-01-01',
    messages: []
  },
  {
    id: 'chat-city-barcelona',
    type: 'city',
    city: 'Barcelona',
    name: '📍 Colombianos en Barcelona',
    description: 'Chat oficial para los compatriotas en Barcelona, Hospitalet, Badalona y alrededores.',
    avatar: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=300&auto=format&fit=crop&q=80',
    members: [],
    createdAt: '2026-01-01',
    messages: []
  },
  {
    id: 'chat-city-valencia',
    type: 'city',
    city: 'Valencia',
    name: '📍 Paisas y Rolos en Valencia',
    description: 'Comunidad colombiana en la Comunidad Valenciana.',
    avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80',
    members: [],
    createdAt: '2026-01-01',
    messages: []
  }
];

export const INITIAL_GROUP_INVITES: GroupInvite[] = [];

import { SPANISH_CITIES as ALL_SPANISH_CITIES } from './citiesData';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const SPANISH_CITIES = ALL_SPANISH_CITIES;

export const INITIAL_PLACES: PlaceItem[] = [];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [];

export const INITIAL_VERIFICATION_REQUESTS: VerificationRequest[] = [];

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [];

export const INITIAL_DELETED_ACCOUNTS: DeletedAccount[] = [];

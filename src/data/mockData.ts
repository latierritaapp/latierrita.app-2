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
  id: 'guest-temp',
  username: 'parcero',
  name: 'Usuario Invitado',
  avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231e293b'/%3E%3Ccircle cx='50' cy='36' r='18' fill='%2394a3b8'/%3E%3Cpath d='M20 86 C20 68 34 60 50 60 C66 60 80 68 80 86 Z' fill='%2394a3b8'/%3E%3C/svg%3E",
  bio: "Usuario invitado de La Tierrita App.\nComunidad de Colombianos en España.",
  website: '',
  city: 'Sin asignar',
  originCity: 'Colombia',
  notificationTone: 'Alegre Campesino (Bambuco)',
  isPrivateAccount: false,
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  isVerified: false,
  staffRole: 'Usuario',
  isGuest: true
};

export const OTHER_USERS: UserProfile[] = [];

export const INITIAL_STORIES: StoryItem[] = [];

export const INITIAL_AD_BANNERS: AdBanner[] = [];

export const INITIAL_POSTS: PostItem[] = [
  {
    id: 'post-sample-1',
    userId: 'user-carlos',
    username: 'carlos_valencia',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    caption: 'Disfrutando de una deliciosa Bandeja Paisa extra grande aquí en Madrid. ¡Sabe a tierrita!',
    likesCount: 24,
    hasLiked: false,
    comments: [],
    timestamp: 'Hace 2 horas',
    location: 'Madrid, España'
  },
  {
    id: 'post-sample-2',
    userId: 'user-maria',
    username: 'maria_colombia',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    userCity: 'Barcelona',
    mediaUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    caption: 'Reunión de parceros en Barcelona este fin de semana. ¡Imparables!',
    likesCount: 42,
    hasLiked: false,
    comments: [],
    timestamp: 'Hace 5 horas',
    location: 'Barcelona, España'
  },
  {
    id: 'post-sample-3',
    userId: 'user-sofia',
    username: 'sofia_medellin',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    userCity: 'Valencia',
    mediaUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
    caption: 'Atardecer desde Valencia recordando nuestra hermosa Colombia. 🇨🇴🇪🇸',
    likesCount: 19,
    hasLiked: false,
    comments: [],
    timestamp: 'Hace 1 día',
    location: 'Valencia, España'
  }
];

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

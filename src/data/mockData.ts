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
  username: 'invitado',
  name: 'Usuario Invitado',
  avatar: '',
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

export const INITIAL_AD_BANNERS: AdBanner[] = [
  {
    id: 'banner-official-1',
    active: true,
    title: 'Festival Gastronómico Colombiano en Madrid',
    subtitle: 'Disfruta de la verdadera sazón de nuestra tierra con arepas, empanadas y sancocho.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    sponsorName: 'Restaurante El Sabor de Mi Tierra',
    sponsorCity: 'Madrid',
    ctaText: 'Reservar mesa',
    ctaLink: 'https://latierrita.es',
    category: 'Restaurante',
    carouselType: 'inicio'
  },
  {
    id: 'banner-official-2',
    active: true,
    title: 'Asesoría Jurídica y Trámites de Extranjería',
    subtitle: 'Nacionalidad española, arraigo, visados y reagrupación familiar con expertos.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    sponsorName: 'LegalParcero Expatriados',
    sponsorCity: 'Barcelona',
    ctaText: 'Consulta gratis',
    ctaLink: 'https://latierrita.es',
    category: 'Servicio',
    carouselType: 'inicio'
  },
  {
    id: 'banner-official-3',
    active: true,
    title: 'Envíos Express de Dinero y Giros a Colombia',
    subtitle: 'La tasa más baja del mercado y entrega instantánea directo a cuentas bancarias.',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
    sponsorName: 'GirosParcero Europa',
    sponsorCity: 'Toda España',
    ctaText: 'Enviar ahora',
    ctaLink: 'https://latierrita.es',
    category: 'Otro',
    carouselType: 'explorar'
  }
];

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

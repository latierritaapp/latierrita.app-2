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

export const INITIAL_POSTS: PostItem[] = [
  {
    id: 'post-init-1',
    userId: 'user-carlos',
    username: 'carlos_valencia',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    caption: '¡Disfrutando de un buen sancocho y empanadas con la familia en Madrid! Se siente el calor de nuestra tierrita aquí en España. 🇨🇴🇪🇸 #ColombianosEnMadrid #SazonColombiana',
    likesCount: 3,
    hasLiked: false,
    comments: [
      {
        id: 'c-1',
        userId: 'user-maria',
        name: 'María Rodríguez',
        username: 'maria_rodriguez',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        text: '¡Qué delicia Carlos! Se ve espectacular.',
        timestamp: 'Hace 2 horas'
      }
    ],
    timestamp: 'Hace 3 horas',
    location: 'Madrid, España'
  },
  {
    id: 'post-init-2',
    userId: 'user-maria',
    username: 'maria_rodriguez',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    userCity: 'Barcelona',
    mediaUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    caption: 'Reunión de parceros este fin de semana en Barcelona disfrutando un buen café colombiano. ¡Arriba nuestra cultura! ☕🇨🇴 #ColombianosEnBarcelona',
    likesCount: 1,
    hasLiked: false,
    comments: [],
    timestamp: 'Hace 5 horas',
    location: 'Barcelona, España'
  },
  {
    id: 'post-init-3',
    userId: 'user-andres',
    username: 'andres_gomez',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    userCity: 'Valencia',
    mediaUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
    caption: 'Túneles verdes y hermosos paisajes que nos recuerdan a nuestra tierra querida. ¡Saludos a todos desde Valencia! 🌿🇨🇴',
    likesCount: 2,
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

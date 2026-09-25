export type StaffRole = 'Usuario' | 'MOD' | 'Soporte' | 'ADMIN';

export type SpanishCity = 
  | 'Madrid'
  | 'Barcelona'
  | 'Valencia'
  | 'Sevilla'
  | 'Málaga'
  | 'Bilbao'
  | 'Alicante'
  | 'Zaragoza'
  | 'Murcia'
  | 'Palma de Mallorca'
  | (string & {});

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  username: string;
  name: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  avatar: string;
  bio?: string;
  website?: string;
  city: SpanishCity;
  originCity: string; // e.g. "Medellín", "Bogotá", "Cali"
  age?: number;
  socialLinks?: SocialLinks;
  lastUsernameChangeDate?: string;
  lastNameChangeDate?: string;
  isPrivateAccount?: boolean;
  notificationTone?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
  staffRole?: StaffRole;
  isSuspended?: boolean;
  suspendedAt?: string;
  suspendedReason?: string;
  phone?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  retentionExpiresAt?: string;
  deletedReason?: string;
  staffPin?: string;
  createdAt?: string;
  featuredStoryHighlight?: {
    id: string;
    title: string;
    cover: string;
  }[];
}

export interface StoryViewer {
  userId: string;
  username: string;
  userAvatar: string;
  timestamp: string;
  reaction?: string;
}

export interface StoryItem {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  userCity: SpanishCity;
  mediaUrl: string;
  caption?: string;
  timestamp: string;
  viewed?: boolean;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  viewers?: StoryViewer[];
}

export interface PostComment {
  id: string;
  username: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export interface PostItem {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  userCity: SpanishCity;
  mediaUrl: string;
  caption: string;
  likesCount: number;
  hasLiked: boolean;
  comments: PostComment[];
  timestamp: string;
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
}

export type AdCategory =
  | 'Restaurante'
  | 'Cafe'
  | 'Bar'
  | 'Pub'
  | 'Discoteca'
  | 'Hotel'
  | 'Tienda'
  | 'Spa'
  | 'Belleza'
  | 'S. de interes'
  | 'Otros'
  | 'Evento'
  | 'Restaurante/Comida'
  | 'Servicio'
  | 'Otro'
  | 'Trámites'
  | 'Envíos'
  | 'Vuelos';

export const AD_CAROUSEL_CATEGORIES: AdCategory[] = [
  'Restaurante',
  'Cafe',
  'Bar',
  'Pub',
  'Discoteca',
  'Hotel',
  'Tienda',
  'Spa',
  'Belleza',
  'S. de interes',
  'Otros'
];

export interface AdBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  sponsorName: string;
  sponsorCity: SpanishCity | 'Toda España';
  ctaText: string;
  ctaLink: string;
  category: AdCategory;
  discountBadge?: string;
  active: boolean;
  carouselType?: 'inicio' | 'explorar' | 'ambos';
}

export interface StartupAdConfig {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  discountBadge?: string;
  description: string;
  discountCode?: string;
  discountValidity?: string;
  ctaText: string;
  ctaUrl: string;
  active: boolean;
}

export type TicketType = 'TS' | 'TRU' | 'TRP' | 'TRH' | 'TRM' | 'TRG' | 'TRA' | 'TRI';

export interface SupportTicket {
  id: string;
  userId?: string;
  code: string;
  type: TicketType;
  userName: string;
  userUsername: string;
  userAvatar: string;
  subject: string;
  description: string;
  status: 'pendientes' | 'en_proceso' | 'resueltos';
  priority: 'Baja' | 'Media' | 'Alta';
  date: string;
  response?: string;
  // Specific report details:
  reportedUsername?: string;
  reportedUserId?: string;
  reportedItemTitle?: string;
  reporterName?: string;
  reporterUsername?: string;
  reasonTitle?: string;
  reasonText?: string;
  additionalDetails?: string;
  chatRoomId?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffRole?: StaffRole;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  username: string;
  name: string;
  city: SpanishCity;
  avatar: string;
  documentType: 'DNI' | 'NIE' | 'Pasaporte';
  documentNumber: string;
  reason: string;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  date: string;
}

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: StaffRole;
  email: string;
  pin: string;
  status: 'Activo' | 'Inactivo';
}

export interface DeletedAccount {
  id: string;
  userId: string;
  username: string;
  name: string;
  avatar: string;
  email?: string;
  deletedAt: string;
  retentionExpiresAt: string;
  reason: string;
  canRestore: boolean;
  profileData?: Partial<UserProfile>;
}

export interface ChatMessageReaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs who reacted with this emoji
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderCity?: SpanishCity;
  text: string;
  timestamp: string;
  createdAt?: number;
  isEncrypted: boolean;
  encryptedHash: string; // simulated E2E SHA-256 fingerprint
  read?: boolean;
  reactions?: ChatMessageReaction[];
  deletedForEveryone?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  audioUrl?: string;
  audioDuration?: number; // duration in seconds
  senderStaffRole?: StaffRole;
}

export type ChatType = 'general' | 'city' | 'private' | 'group';

export interface ChatRoom {
  id: string;
  type: ChatType;
  name: string;
  avatar?: string;
  city?: SpanishCity; // only for 'city' chat
  targetUserId?: string; // only for 'private' 1:1 chat
  targetUser?: UserProfile;
  description?: string;
  members: string[]; // user IDs
  admins?: string[]; // user IDs who are admins
  createdBy?: string;
  createdAt: string;
  messages: ChatMessage[];
  unreadCount?: number;
  status?: 'active' | 'pending_invite' | 'rejected';
  // Ticket chat enhancements:
  isTicketChat?: boolean;
  ticketId?: string;
  ticketCode?: string;
  ticketType?: TicketType;
  ticketStatus?: 'pendientes' | 'en_proceso' | 'resueltos';
  ticketLockedForUser?: boolean;
  ticketReportedUsername?: string;
  ticketReporterName?: string;
  ticketReporterUsername?: string;
  ticketReasonTitle?: string;
  ticketReasonText?: string;
  ticketSubject?: string;
  ticketAdditionalDetails?: string;
  ticketDate?: string;
  ticketDetails?: {
    reportedUsername?: string;
    reporterName: string;
    reason: string;
    additionalDetails?: string;
    date: string;
  };
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  invitedBy: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  invitedUserId: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export type NotificationType = 
  | 'chat_general'
  | 'chat_city'
  | 'chat_private'
  | 'group_invite'
  | 'group_activity'
  | 'like'
  | 'follow'
  | 'story_reaction'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  data?: {
    chatId?: string;
    chatType?: ChatType;
    groupId?: string;
    userId?: string;
    postId?: string;
  };
}

export type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'scam' | 'other';

export interface ContentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedItemId: string;
  reportedType: 'message' | 'user' | 'post';
  reason: ReportReason;
  details: string;
  chatId?: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'action_taken';
}

export type PlaceCategory = 
  | 'Restaurante/Cafe'
  | 'Bar/Pub'
  | 'Discoteca'
  | 'Hotel'
  | 'Tienda'
  | 'Spa/Belleza'
  | 'Sitios de interes'
  | 'Otros';

export type ClassifiedCategory =
  | 'Empleo & Trabajo'
  | 'Vivienda & Habitaciones'
  | 'Compra & Venta'
  | 'Eventos & Clases';

export interface ClassifiedAdItem {
  id: string;
  title: string;
  category: ClassifiedCategory;
  city: SpanishCity | 'Toda España';
  description: string;
  contactName: string;
  contactUsername?: string;
  contactPhone?: string;
  whatsapp?: string;
  contactEmail?: string;
  price?: string;
  imageUrl?: string;
  date: string;
  isPromoted?: boolean;
  tags: string[];
}

export interface PlaceItem {
  id: string;
  userId?: string;
  name: string;
  category: PlaceCategory;
  city: SpanishCity;
  address: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  priceRange: '€' | '€€' | '€€€';
  specialty: string;
  description: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  inGoogleMaps?: boolean;
  socialLinks?: {
    latierrita?: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    x?: string;
    web?: string;
  };
  isVerified?: boolean;
  tags: string[];
}

export type NavTab = 'feed' | 'chats' | 'profile' | 'places' | 'explore' | 'notifications';

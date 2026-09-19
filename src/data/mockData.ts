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
  id: 'user-me',
  username: 'juancamilo_es',
  name: 'Juan Camilo Ospina',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  bio: '🇨🇴 Paisa viviendo en Madrid 🇪🇸\n☕ Amante del café y las arepas con quesito\n📍 Gran Vía, Madrid | 🚀 Desarrollador & Emprendedor',
  website: 'https://latierrita.es/juancamilo',
  city: 'Madrid',
  originCity: 'Medellín',
  age: 28,
  socialLinks: {
    instagram: 'juancamilo_es',
    facebook: 'juancamilo.ospina',
    tiktok: 'juancamilo_madrid',
    x: 'juancamilo_co'
  },
  notificationTone: 'Alegre Campesino (Bambuco)',
  isPrivateAccount: false,
  followersCount: 842,
  followingCount: 395,
  postsCount: 9,
  isVerified: true,
  staffRole: 'ADMIN',
  featuredStoryHighlight: [
    { id: 'hl-1', title: 'Madrid 🇪🇸', cover: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=300&auto=format&fit=crop&q=80' },
    { id: 'hl-2', title: 'Comidita 🫓', cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80' },
    { id: 'hl-3', title: 'Trámites 📑', cover: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300&auto=format&fit=crop&q=80' },
    { id: 'hl-4', title: 'Parceros 🍻', cover: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&auto=format&fit=crop&q=80' },
    { id: 'hl-5', title: 'Medellín 🇨🇴', cover: 'https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?w=300&auto=format&fit=crop&q=80' },
  ]
};

export const OTHER_USERS: UserProfile[] = [
  {
    id: 'user-mariana',
    username: 'mariana_bcn',
    name: 'Mariana Restrepo',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    bio: 'Caleña en Barcelona 🌴 Arquitecta | Salsa brava y mar mediterráneo 🌊',
    website: 'https://marianarestrepo.design',
    city: 'Barcelona',
    originCity: 'Cali',
    followersCount: 1420,
    followingCount: 512,
    postsCount: 24,
    isVerified: true,
    staffRole: 'MOD'
  },
  {
    id: 'user-carlos',
    username: 'carlos_valencia',
    name: 'Carlos Alberto Gómez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bio: 'Rollo en Valencia 🇪🇸🚴‍♂️ Fanático de la bandeja paisa en Ruzafa.',
    website: 'https://carlosbikevalencia.es',
    city: 'Valencia',
    originCity: 'Bogotá',
    followersCount: 689,
    followingCount: 310,
    postsCount: 15,
    isVerified: true,
    staffRole: 'Soporte'
  },
  {
    id: 'user-valen',
    username: 'valen_madrid',
    name: 'Valentina Morales',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    bio: 'Pereirana en Malasaña 🎨 Fotografía, eventos colombianos y buena energía.',
    website: 'https://valenmorales.art',
    city: 'Madrid',
    originCity: 'Pereira',
    followersCount: 2310,
    followingCount: 420,
    postsCount: 38,
    isVerified: true,
  },
  {
    id: 'user-andres',
    username: 'andres_sevilla',
    name: 'Andrés Felipe Ruiz',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    bio: 'Santandereano en Sevilla 💃 Chef & Asesor gastronómico. Bocadillos y arepas.',
    website: 'https://andreschef.es',
    city: 'Sevilla',
    originCity: 'Bucaramanga',
    followersCount: 890,
    followingCount: 298,
    postsCount: 19,
  },
  {
    id: 'user-staff',
    username: 'latierrita_oficial',
    name: 'La Tierrita 🇨🇴',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80',
    bio: '⭐ Cuenta oficial de Staff & Publicidad de La Tierrita España. Conectando a los colombianos.',
    website: 'https://latierrita.es',
    city: 'Madrid',
    originCity: 'Toda Colombia',
    followersCount: 15420,
    followingCount: 12,
    postsCount: 45,
    isVerified: true,
    staffRole: 'ADMIN'
  }
];

export const INITIAL_STORIES: StoryItem[] = [
  {
    id: 'story-1',
    userId: 'user-mariana',
    username: 'mariana_bcn',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    userCity: 'Barcelona',
    mediaUrl: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=800&auto=format&fit=crop&q=80',
    caption: '¡Domingo soleado en la Barceloneta con parceros! 🏖️🌞',
    timestamp: 'Hace 35 min',
    viewed: false,
    reactions: [
      { emoji: '🔥', count: 12, users: ['user-carlos', 'user-valen'] },
      { emoji: '❤️', count: 24, users: ['user-me'] },
      { emoji: '🇨🇴', count: 19, users: ['user-andres'] }
    ]
  },
  {
    id: 'story-2',
    userId: 'user-valen',
    username: 'valen_madrid',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    caption: 'Conseguí arepas de chócolo con quesito campesino en Quintana 😍 ¡Sabor a patria!',
    timestamp: 'Hace 1 hora',
    viewed: false,
    reactions: [
      { emoji: '☕', count: 8, users: ['user-me'] },
      { emoji: '❤️', count: 32, users: ['user-mariana'] },
      { emoji: '🇨🇴', count: 41, users: ['user-carlos'] }
    ]
  },
  {
    id: 'story-3',
    userId: 'user-carlos',
    username: 'carlos_valencia',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    userCity: 'Valencia',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    caption: 'Rodada ciclista en el Turia recordando las montañas de Boyacá 🚴‍♂️🇨🇴',
    timestamp: 'Hace 3 horas',
    viewed: false,
    reactions: [
      { emoji: '👏', count: 15, users: ['user-me'] },
      { emoji: '🔥', count: 7, users: ['user-valen'] }
    ]
  },
  {
    id: 'story-4',
    userId: 'user-andres',
    username: 'andres_sevilla',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    userCity: 'Sevilla',
    mediaUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    caption: 'Preparando sancocho trifásico para el parche de colombianos en Sevilla 🍲✨',
    timestamp: 'Hace 5 horas',
    viewed: true,
    reactions: [
      { emoji: '😍', count: 18, users: ['user-me'] },
      { emoji: '🥳', count: 11, users: ['user-mariana'] }
    ]
  }
];

export const INITIAL_AD_BANNERS: AdBanner[] = [
  {
    id: 'banner-1',
    title: '✈️ Vuelos Baratos España ⇄ Colombia',
    subtitle: 'Vuelos directos Madrid/Barcelona a Bogotá, Medellín y Cali con equipaje incluido.',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1000&auto=format&fit=crop&q=80',
    sponsorName: 'Viajes La Tierrita Express',
    sponsorCity: 'Toda España',
    ctaText: 'Ver Ofertas',
    ctaLink: 'https://viajeslatierrita.es',
    category: 'Vuelos',
    discountBadge: '15% Dcto Parceros',
    active: true,
    carouselType: 'inicio'
  },
  {
    id: 'banner-2',
    title: '🍲 Restaurante La Candelaria Madrid',
    subtitle: 'Ajiaco santafereño, bandeja paisa tradicional y sobrebarriga en pleno centro.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
    sponsorName: 'La Candelaria Madrid',
    sponsorCity: 'Madrid',
    ctaText: 'Reservar Mesa',
    ctaLink: 'https://lacandelariamadrid.es',
    category: 'Restaurante/Comida',
    discountBadge: 'Postre Gratis',
    active: true,
    carouselType: 'inicio'
  },
  {
    id: 'banner-3',
    title: '📑 Abogados Extranjería & Trámites TIE / NIE',
    subtitle: 'Asesoría especializada para colombianos: Arraigo Social, Nacionalidad y Residencia.',
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1000&auto=format&fit=crop&q=80',
    sponsorName: 'Asesoría Jurídica Colombo-Hispana',
    sponsorCity: 'Toda España',
    ctaText: 'Consulta WhatsApp',
    ctaLink: 'https://wa.me/34600123456',
    category: 'Servicio',
    discountBadge: '1ª Consulta Gratis',
    active: true,
    carouselType: 'explorar'
  },
  {
    id: 'banner-4',
    title: '📦 Envíos de Cajas & Remesas a Colombia',
    subtitle: 'Llega en 4 días puerta a puerta sin aduanas complicadas. Tasa garantizada.',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80',
    sponsorName: 'EnvíaYa Colombia',
    sponsorCity: 'Barcelona',
    ctaText: 'Cotizar Envío',
    ctaLink: 'https://enviayacolombia.com',
    category: 'Servicio',
    discountBadge: 'Envío Gratis >50€',
    active: true,
    carouselType: 'explorar'
  }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tick-1',
    code: 'TS-1042',
    type: 'TS',
    userName: 'Carlos Alberto Gómez',
    userUsername: 'carlos_valencia',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    subject: 'Problema al subir foto en historia de Valencia',
    description: 'Intento subir una imagen en historia pero se queda cargando en 99%.',
    status: 'pendientes',
    priority: 'Media',
    date: '2026-09-18 14:20'
  },
  {
    id: 'tick-2',
    code: 'TR-2089',
    type: 'TR',
    userName: 'Mariana Restrepo',
    userUsername: 'mariana_bcn',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    subject: 'Reporte de spam en chat privado de Barcelona',
    description: 'Un usuario envió ofertas de préstamos dudosos por mensaje privado.',
    status: 'en_proceso',
    priority: 'Alta',
    date: '2026-09-18 11:05'
  },
  {
    id: 'tick-3',
    code: 'TCS-3012',
    type: 'TCS',
    userName: 'David Alejandro Restrepo',
    userUsername: 'david_madrid_temp',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    subject: 'Solicitud de reactivación de cuenta suspendida por error',
    description: 'Mi cuenta fue suspendida automáticamente por publicar un aviso clasificado de alquiler.',
    status: 'pendientes',
    priority: 'Alta',
    date: '2026-09-17 18:40'
  }
];

export const INITIAL_VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: 'verif-1',
    userId: 'user-andres',
    username: 'andres_sevilla',
    name: 'Andrés Felipe Ruiz',
    city: 'Sevilla',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    documentType: 'NIE',
    documentNumber: 'Y-9823412-Z',
    reason: 'Soy chef certificado y tengo restaurante de comida colombiana en Sevilla.',
    status: 'pendiente',
    date: '2026-09-18'
  },
  {
    id: 'verif-2',
    userId: 'user-carlos',
    username: 'carlos_valencia',
    name: 'Carlos Alberto Gómez',
    city: 'Valencia',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    documentType: 'DNI',
    documentNumber: '53912048X',
    reason: 'Organizador oficial de rodadas ciclistas y parches colombianos en Valencia.',
    status: 'pendiente',
    date: '2026-09-17'
  }
];

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Administrador Principal La Tierrita',
    username: 'latierrita_oficial',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80',
    role: 'ADMIN',
    email: 'admin@latierrita.es',
    pin: '7890',
    status: 'Activo'
  },
  {
    id: 'staff-2',
    name: 'Soporte Técnico España',
    username: 'soporte_tierrita',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    role: 'Soporte',
    email: 'soporte@latierrita.es',
    pin: '1234',
    status: 'Activo'
  },
  {
    id: 'staff-3',
    name: 'Moderador Comunidad Madrid',
    username: 'mod_madrid',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    role: 'MOD',
    email: 'moderacion@latierrita.es',
    pin: '4321',
    status: 'Activo'
  }
];

export const INITIAL_DELETED_ACCOUNTS: DeletedAccount[] = [
  {
    id: 'del-1',
    userId: 'user-old-1',
    username: 'pedro_valles',
    name: 'Pedro Vallés',
    email: 'pedro.valles@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    deletedAt: '2026-09-17T10:00:00.000Z',
    retentionExpiresAt: '2026-09-24T10:00:00.000Z',
    reason: 'Solicitud del usuario por cambio de residencia temporal fuera de España',
    canRestore: true
  },
  {
    id: 'del-2',
    userId: 'user-old-2',
    username: 'spam_bot_madrid',
    name: 'Publicidad No Autorizada',
    email: 'spam@botmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    deletedAt: '2026-09-15T14:30:00.000Z',
    retentionExpiresAt: '2026-09-22T14:30:00.000Z',
    reason: 'Cuenta suspendida por violación de normas comunitarias',
    canRestore: false
  }
];

export const INITIAL_POSTS: PostItem[] = [
  // STAFF AD IN FEED 1
  {
    id: 'post-staff-1',
    userId: 'user-staff',
    username: 'latierrita_oficial',
    userAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80',
    caption: '🎉 ¡OFICIAL STAFF! Gran Concierto Feria de Cali & Noche Vallenata en Madrid y Barcelona. Los mejores artistas colombianos juntos en una noche inolvidable. Entradas con 25% de descuento para miembros de la app con el código: PARCEROS2026. ¡No te quedes por fuera!',
    likesCount: 384,
    hasLiked: false,
    comments: [
      { id: 'c-1', username: 'valen_madrid', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', text: '¡Allá estaré con todo mi combo! 🔥🇨🇴', timestamp: 'Hace 2 horas' },
      { id: 'c-2', username: 'mariana_bcn', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', text: '¿La fecha de Barcelona es en el Poble Espanyol? Qué emoción 💃', timestamp: 'Hace 1 hora' }
    ],
    timestamp: 'Hace 4 horas',
    location: 'WiZink Center, Madrid',
    isStaffAd: true,
    adTitle: 'Feria de Cali & Vallenato Tour España 2026',
    adDescription: 'Promoción oficial administrada por el STAFF de La Tierrita. Entradas limitadas.',
    adCtaText: 'Comprar Boletos con Descuento',
    adCtaUrl: 'https://entradascolombia.es',
    sponsorName: 'STAFF La Tierrita Eventos'
  },
  // User Post 1
  {
    id: 'post-user-1',
    userId: 'user-valen',
    username: 'valen_madrid',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1000&auto=format&fit=crop&q=80',
    caption: 'Caminar por el Retiro en otoño me recuerda los atardeceres en el Eje Cafetero. Cada día más agradecida con esta ciudad que nos acogió con tanto cariño 🍁🇨🇴❤️ #ColombianosEnMadrid #ParcerosEnEspaña',
    likesCount: 156,
    hasLiked: true,
    comments: [
      { id: 'c-3', username: 'juancamilo_es', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', text: '¡Qué fotaza Valen! El Retiro está hermoso estos días 👏', timestamp: 'Hace 2 horas' }
    ],
    timestamp: 'Hace 6 horas',
    location: 'Parque del Buen Retiro, Madrid'
  },
  // STAFF AD IN FEED 2
  {
    id: 'post-staff-2',
    userId: 'user-staff',
    username: 'latierrita_oficial',
    userAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80',
    userCity: 'Barcelona',
    mediaUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
    caption: '🥟 ¡ANUNCIO PATROCINADO! ¿Antojo de comida criolla? La Tiendita Paisa trae arepas congeladas, chocoramos, café liofilizado, queso costeño fresco y ponqué Gala directo a tu puerta en 24h a toda España.',
    likesCount: 219,
    hasLiked: false,
    comments: [
      { id: 'c-4', username: 'andres_sevilla', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', text: 'El queso costeño les queda idéntico, súper recomendado', timestamp: 'Hace 3 horas' }
    ],
    timestamp: 'Hace 8 horas',
    location: 'Barcelona & Envíos Toda España',
    isStaffAd: true,
    adTitle: 'La Tiendita Paisa - Envíos 24h a toda España',
    adDescription: 'Productos 100% colombianos originales con certificado sanitario europeo.',
    adCtaText: 'Pedir por WhatsApp Ahora',
    adCtaUrl: 'https://wa.me/34611223344',
    sponsorName: 'La Tiendita Paisa BCN'
  },
  // User Post 2
  {
    id: 'post-user-2',
    userId: 'user-mariana',
    username: 'mariana_bcn',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    userCity: 'Barcelona',
    mediaUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1000&auto=format&fit=crop&q=80',
    caption: 'Vistas desde los Bunkers del Carmel. Siempre que subo aquí pienso en lo lejos que hemos llegado todos los compatriotas que vinimos a buscar nuestros sueños 💫💪 #OrgulloColombiano #Barcelona',
    likesCount: 312,
    hasLiked: false,
    comments: [
      { id: 'c-5', username: 'valen_madrid', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', text: '¡Hermosa vista parce! Orgullo total 🇨🇴', timestamp: 'Hace 8 horas' }
    ],
    timestamp: 'Hace 12 horas',
    location: 'Bunkers del Carmel, Barcelona'
  },
  // User Post 3 - Carlos Gómez
  {
    id: 'post-user-3',
    userId: 'user-carlos',
    username: 'carlos_valencia',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    userCity: 'Valencia',
    mediaUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80',
    caption: 'Bandeja paisa monumental armada en Valencia con chicharrón crujiente y frijoles cargamanto. ¿Quién se anota para el próximo almuerzo? 🥑🍛🔥',
    likesCount: 428,
    hasLiked: false,
    comments: [
      { id: 'c-6', username: 'juancamilo_es', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', text: '¡Ese chicharrón se ve de 10! Guárdame un plato', timestamp: 'Hace 5 horas' },
      { id: 'c-7', username: 'mariana_bcn', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', text: 'Qué delicia Carlos, anótame ya', timestamp: 'Hace 4 horas' }
    ],
    timestamp: 'Hace 14 horas',
    location: 'Ruzafa, Valencia'
  },
  // User Post 4 - Andrés Ruiz
  {
    id: 'post-user-4',
    userId: 'user-andres',
    username: 'andres_sevilla',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    userCity: 'Sevilla',
    mediaUrl: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=1000&auto=format&fit=crop&q=80',
    caption: 'Plaza de España en Sevilla luciendo la camiseta tricolor. Llevando nuestras raíces con la frente en alto siempre 🇨🇴💃🌞',
    likesCount: 275,
    hasLiked: true,
    comments: [
      { id: 'c-8', username: 'valen_madrid', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', text: '¡Esa plaza es mágica Andrés! Gran foto', timestamp: 'Hace 3 horas' }
    ],
    timestamp: 'Hace 1 día',
    location: 'Plaza de España, Sevilla'
  },
  // User Post 5 - Valentina Morales
  {
    id: 'post-user-5',
    userId: 'user-valen',
    username: 'valen_madrid',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1000&auto=format&fit=crop&q=80',
    caption: 'Taller de salsa caleña y café colombiano en Malasaña. Qué alegría ver tanta gente aprendiendo nuestros pasos 💃☕🕺',
    likesCount: 490,
    hasLiked: true,
    comments: [
      { id: 'c-9', username: 'mariana_bcn', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', text: '¡Para el próximo voy a Madrid sin falta!', timestamp: 'Hace 6 horas' },
      { id: 'c-10', username: 'carlos_valencia', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', text: 'Puro talento pereirano', timestamp: 'Hace 2 horas' }
    ],
    timestamp: 'Hace 1 día',
    location: 'Malasaña, Madrid'
  },
  // User Post 6 - Mariana Restrepo
  {
    id: 'post-user-6',
    userId: 'user-mariana',
    username: 'mariana_bcn',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    userCity: 'Barcelona',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
    caption: 'Atardecer en la Costa Brava con amigos colombianos. Momentos que recargan el alma 🌊💙 #ParcerosEnCatalunya',
    likesCount: 360,
    hasLiked: false,
    comments: [],
    timestamp: 'Hace 2 días',
    location: 'Costa Brava, Girona'
  }
];

export const CURRENT_USER_PROFILE_POSTS: PostItem[] = [
  {
    id: 'my-post-1',
    userId: 'user-me',
    username: 'juancamilo_es',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&auto=format&fit=crop&q=80',
    caption: 'Tarde en Gran Vía. Madrid nunca duerme y siempre tiene un plan 🇪🇸✨',
    likesCount: 94,
    hasLiked: true,
    comments: [],
    timestamp: 'Hace 2 días',
    location: 'Gran Vía, Madrid'
  },
  {
    id: 'my-post-2',
    userId: 'user-me',
    username: 'juancamilo_es',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    caption: 'Preparando arepas con queso en casa. Lo que nunca se negocia ☕🫓',
    likesCount: 142,
    hasLiked: false,
    comments: [],
    timestamp: 'Hace 5 días',
    location: 'Madrid, España'
  },
  {
    id: 'my-post-3',
    userId: 'user-me',
    username: 'juancamilo_es',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    caption: 'Asado con la banda en la sierra. ¡Puro sabor paisa!',
    likesCount: 201,
    hasLiked: true,
    comments: [],
    timestamp: 'Hace 1 semana',
    location: 'Sierra de Guadarrama, Madrid'
  },
  {
    id: 'my-post-4',
    userId: 'user-me',
    username: 'juancamilo_es',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    caption: 'Escapada de fin de semana a Segovia con el combo',
    likesCount: 88,
    hasLiked: false,
    comments: [],
    timestamp: 'Hace 2 semanas',
    location: 'Segovia, España'
  },
  {
    id: 'my-post-5',
    userId: 'user-me',
    username: 'juancamilo_es',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    caption: 'Concierto inolvidable en Madrid. La bandera tricolor siempre arriba 🇨🇴',
    likesCount: 167,
    hasLiked: true,
    comments: [],
    timestamp: 'Hace 3 semanas',
    location: 'Madrid, España'
  },
  {
    id: 'my-post-6',
    userId: 'user-me',
    username: 'juancamilo_es',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    userCity: 'Madrid',
    mediaUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    caption: '¡Por fin salió la resolución favorable de residencia! Un proceso largo pero valió la pena 🙌',
    likesCount: 350,
    hasLiked: true,
    comments: [],
    timestamp: 'Hace 1 mes',
    location: 'Oficina de Extranjería, Madrid'
  }
];

export const INITIAL_CHAT_ROOMS: ChatRoom[] = [
  // 1. CHAT GENERAL
  {
    id: 'chat-general-es',
    type: 'general',
    name: '🇨🇴 Gran Chat General Colombia en España',
    description: 'Espacio público abierto para toda la comunidad colombiana en cualquier punto de España. Preguntas, anécdotas y fraternidad.',
    avatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&auto=format&fit=crop&q=80',
    members: ['user-me', 'user-mariana', 'user-carlos', 'user-valen', 'user-andres', 'user-staff'],
    createdAt: '2026-01-01',
    messages: [
      {
        id: 'm-gen-1',
        senderId: 'user-valen',
        senderName: 'Valentina Morales',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        senderCity: 'Madrid',
        text: '¡Buenas parceros! ¿Alguien sabe de algún evento de música en vivo este fin de semana?',
        timestamp: '10:14 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:8f419c2...41a'
      },
      {
        id: 'm-gen-2',
        senderId: 'user-mariana',
        senderName: 'Mariana Restrepo',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        senderCity: 'Barcelona',
        text: '¡Hola Valen! En Barcelona hay un toque de salsa y cumbia en Gràcia, y en Madrid creo que hay vallenato en Lavapiés 🎵',
        timestamp: '10:18 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:3a992d1...99e'
      },
      {
        id: 'm-gen-3',
        senderId: 'user-carlos',
        senderName: 'Carlos Gómez',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        senderCity: 'Valencia',
        text: '¡Saludos desde Valencia mi gente! Si alguien viene a las Fallas o a comer paella avise que armamos parche.',
        timestamp: '10:30 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:7bc12a4...02f'
      }
    ]
  },

  // 2. CHATS POR CIUDAD (Filtered dynamically by user's city)
  {
    id: 'chat-city-madrid',
    type: 'city',
    city: 'Madrid',
    name: '📍 Parceros en Madrid',
    description: 'Chat oficial exclusivo para colombianos viviendo en la Comunidad de Madrid. Trámites, planes, recomendaciones y citas previas.',
    avatar: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=300&auto=format&fit=crop&q=80',
    members: ['user-me', 'user-valen', 'user-staff'],
    createdAt: '2026-01-01',
    messages: [
      {
        id: 'm-city-m-1',
        senderId: 'user-valen',
        senderName: 'Valentina Morales',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        senderCity: 'Madrid',
        text: 'Parceros de Madrid, hoy abrieron citas para huellas en Aluche a las 9:30am, ¡revisen la web de extranjería rápido!',
        timestamp: '09:40 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:4d8721c...88a'
      },
      {
        id: 'm-city-m-2',
        senderId: 'user-me',
        senderName: 'Juan Camilo Ospina',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        senderCity: 'Madrid',
        text: '¡Uy qué buen dato Valen! Muchas gracias por avisar 🙌',
        timestamp: '09:45 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:1a84f33...bb2'
      }
    ]
  },
  {
    id: 'chat-city-barcelona',
    type: 'city',
    city: 'Barcelona',
    name: '📍 Colombianos en Barcelona',
    description: 'Chat oficial para los compatriotas en Barcelona, Hospitalet, Badalona y alrededores.',
    avatar: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=300&auto=format&fit=crop&q=80',
    members: ['user-mariana', 'user-staff'],
    createdAt: '2026-01-01',
    messages: [
      {
        id: 'm-city-b-1',
        senderId: 'user-mariana',
        senderName: 'Mariana Restrepo',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        senderCity: 'Barcelona',
        text: 'Hola parceros en BCN! Estamos organizando una tarde de volley playa en Bogatell este sábado a las 5pm.',
        timestamp: '11:10 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:6e189ac...91f'
      }
    ]
  },
  {
    id: 'chat-city-valencia',
    type: 'city',
    city: 'Valencia',
    name: '📍 Paisas y Rolos en Valencia',
    description: 'Comunidad colombiana en la Comunidad Valenciana.',
    avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80',
    members: ['user-carlos'],
    createdAt: '2026-01-01',
    messages: [
      {
        id: 'm-city-v-1',
        senderId: 'user-carlos',
        senderName: 'Carlos Gómez',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        senderCity: 'Valencia',
        text: '¿Alguien sabe dónde conseguir arequipe de buena calidad por la zona de Ruzafa?',
        timestamp: 'Ayer',
        isEncrypted: true,
        encryptedHash: 'SHA256:92cb551...33d'
      }
    ]
  },

  // 3. CHATS PRIVADOS 1:1
  {
    id: 'chat-priv-mariana',
    type: 'private',
    name: 'Mariana Restrepo',
    targetUserId: 'user-mariana',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    members: ['user-me', 'user-mariana'],
    createdAt: '2026-02-10',
    messages: [
      {
        id: 'm-p-1',
        senderId: 'user-mariana',
        senderName: 'Mariana Restrepo',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        text: '¡Hola Juan! Vi que publicaste sobre las arepas en Madrid, ¿dónde queda el lugar que mencionaste?',
        timestamp: '11:20 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:d8291aa...74b'
      },
      {
        id: 'm-p-2',
        senderId: 'user-me',
        senderName: 'Juan Camilo Ospina',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        text: '¡Hola Mariana! Queda cerca a la estación de metro Quintana en la calle Alcalá. Son deliciosas y calientitas.',
        timestamp: '11:24 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:b174092...ec3'
      },
      {
        id: 'm-p-3',
        senderId: 'user-mariana',
        senderName: 'Mariana Restrepo',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        text: '¡Genial! Cuando suba a Madrid la próxima semana paso fijo. ¡Un abrazo parcero!',
        timestamp: '11:28 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:90aa18b...55f'
      }
    ]
  },
  {
    id: 'chat-priv-valen',
    type: 'private',
    name: 'Valentina Morales',
    targetUserId: 'user-valen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    members: ['user-me', 'user-valen'],
    createdAt: '2026-03-01',
    messages: [
      {
        id: 'm-pv-1',
        senderId: 'user-valen',
        senderName: 'Valentina Morales',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        text: '¡Juan! ¿Vamos al partido de la Selección Colombia el martes con el grupo de Madrid?',
        timestamp: 'Ayer',
        isEncrypted: true,
        encryptedHash: 'SHA256:7198bb2...33c'
      }
    ]
  },

  // 4. CHATS GRUPALES (Created by users, with invite system)
  {
    id: 'chat-group-futbol',
    type: 'group',
    name: '⚽ Fútbol 7 Parceros Madrid',
    description: 'Partidos amistosos entre semana y fines de semana en polideportivos de Madrid. ¡Todos los niveles bienvenidos!',
    avatar: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=300&auto=format&fit=crop&q=80',
    createdBy: 'user-me',
    members: ['user-me', 'user-carlos', 'user-andres'],
    createdAt: '2026-02-15',
    status: 'active',
    messages: [
      {
        id: 'm-g-1',
        senderId: 'user-me',
        senderName: 'Juan Camilo Ospina',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        text: 'Muchachos, ya reservé la cancha de césped sintético en Canal para este jueves a las 8:00 PM. Faltan 2 jugadores.',
        timestamp: '10:05 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:ff0912a...77e'
      },
      {
        id: 'm-g-2',
        senderId: 'user-carlos',
        senderName: 'Carlos Gómez',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        text: '¡Anotadísimo! Llevo el peto y el balón número 5.',
        timestamp: '10:12 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:bb14299...51a'
      }
    ]
  },
  {
    id: 'chat-group-tramites',
    type: 'group',
    name: '📑 Red Solidaria Trámites & Arraigo',
    description: 'Grupo colaborativo de colombianos para resolver dudas de NIE, TIE, empadronamiento y homologación de títulos.',
    avatar: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300&auto=format&fit=crop&q=80',
    createdBy: 'user-valen',
    members: ['user-valen', 'user-me', 'user-mariana'],
    createdAt: '2026-02-01',
    status: 'active',
    messages: [
      {
        id: 'm-gt-1',
        senderId: 'user-valen',
        senderName: 'Valentina Morales',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        text: 'Subí al grupo el modelo de solicitud de prórroga de estancia que le funcionó a mi hermano.',
        timestamp: '08:30 AM',
        isEncrypted: true,
        encryptedHash: 'SHA256:09fe821...44b'
      }
    ]
  }
];

export const INITIAL_GROUP_INVITES: GroupInvite[] = [
  {
    id: 'inv-1',
    groupId: 'group-rumba-bcn',
    groupName: '💃 Rumberos & Salsa en Barcelona',
    groupAvatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    invitedBy: {
      id: 'user-mariana',
      name: 'Mariana Restrepo',
      username: 'mariana_bcn',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
    },
    invitedUserId: 'user-me',
    timestamp: 'Hace 30 min',
    status: 'pending'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'group_invite',
    title: 'Nueva invitación a grupo',
    message: 'Mariana Restrepo te ha invitado a unirte al grupo "💃 Rumberos & Salsa en Barcelona". ¿Deseas unirte?',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    timestamp: 'Hace 30 min',
    read: false,
    data: { groupId: 'group-rumba-bcn' }
  },
  {
    id: 'notif-2',
    type: 'story_reaction',
    title: 'Reacción a tu historia',
    message: 'Valentina Morales reaccionó con 🔥 a tu historia en Madrid.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    timestamp: 'Hace 2 horas',
    read: false
  },
  {
    id: 'notif-3',
    type: 'chat_city',
    title: 'Actividad en Parceros en Madrid',
    message: 'Valentina Morales: "Parceros de Madrid, hoy abrieron citas para huellas..."',
    avatar: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=300&auto=format&fit=crop&q=80',
    timestamp: 'Hace 3 horas',
    read: true,
    data: { chatId: 'chat-city-madrid', chatType: 'city' }
  },
  {
    id: 'notif-4',
    type: 'follow',
    title: 'Nuevo seguidor',
    message: 'Andrés Felipe Ruiz (@andres_sevilla) ha comenzado a seguirte.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    timestamp: 'Ayer',
    read: true,
    data: { userId: 'user-andres' }
  }
];

export const SPANISH_CITIES = [
  'Madrid',
  'Barcelona',
  'Valencia',
  'Sevilla',
  'Málaga',
  'Bilbao',
  'Alicante',
  'Zaragoza',
  'Murcia',
  'Palma de Mallorca'
] as const;

export const INITIAL_PLACES: PlaceItem[] = [
  {
    id: 'place-1',
    name: 'El Fogón Paisa',
    category: 'Restaurante/Cafe',
    city: 'Madrid',
    address: 'Calle de Atocha 112, Centro, Madrid',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 320,
    priceRange: '€€',
    specialty: 'Bandeja Paisa con chicharrón crujiente y frijoles con garra',
    description: 'El rincón paisa más tradicional de Madrid. Comida casera antioqueña, sancocho los domingos y mazamorra con dulce de guayaba.',
    phone: '+34 912 345 678',
    website: 'https://elfogonpaisamadrid.es',
    inGoogleMaps: true,
    socialLinks: {
      latierrita: '@elfogonpaisa_madrid',
      whatsapp: '+34 612 345 678',
      instagram: '@elfogonpaisamadrid',
      facebook: 'facebook.com/elfogonpaisamadrid',
      tiktok: '@elfogonpaisa',
      x: '@elfogonmadrid',
      web: 'https://elfogonpaisamadrid.es'
    },
    isVerified: true,
    tags: ['Bandeja Paisa', 'Sancocho', 'Familiar', 'Centro']
  },
  {
    id: 'place-2',
    name: 'Panadería La Sucursal del Cielo',
    category: 'Restaurante/Cafe',
    city: 'Madrid',
    address: 'Calle Bravo Murillo 204, Tetuán, Madrid',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 185,
    priceRange: '€',
    specialty: 'Pandebonos calientes, buñuelos recién hechos y avena caleña',
    description: 'Panadería y pastelería tradicional vallecaucana. Pandebonos al horno cada 30 minutos, empanadas de cambray y kumis casero.',
    phone: '+34 915 678 901',
    inGoogleMaps: true,
    socialLinks: {
      latierrita: '@lasucursaldelcielo',
      instagram: '@lasucursaldelcielo_madrid',
      facebook: 'facebook.com/lasucursaldelcielomadrid',
      tiktok: '@pandebonosmadrid',
      x: '@sucursalcielo',
      web: 'https://lasucursaldelcielo.es'
    },
    isVerified: true,
    tags: ['Pandebonos', 'Buñuelos', 'Avena', 'Desayuno']
  },
  {
    id: 'place-3',
    name: 'Restaurante Macondo Barcelona',
    category: 'Restaurante/Cafe',
    city: 'Barcelona',
    address: 'Carrer de Còrsega 206, Eixample, Barcelona',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 290,
    priceRange: '€€',
    specialty: 'Ajiaco santafereño, arroz con coco y cazuela de mariscos costeña',
    description: 'Homenaje a la gastronomía caribeña y andina colombiana en el corazón de Barcelona. Excelente ambientación con música en vivo los fines de semana.',
    phone: '+34 932 110 099',
    website: 'https://macondobarcelona.com',
    inGoogleMaps: true,
    socialLinks: {
      latierrita: '@macondobcn',
      whatsapp: '+34 932 110 099',
      instagram: '@macondobarcelona',
      facebook: 'facebook.com/macondobcn',
      tiktok: '@macondobarcelona',
      x: '@macondobcn',
      web: 'https://macondobarcelona.com'
    },
    isVerified: true,
    tags: ['Ajiaco', 'Mariscos', 'Música en vivo', 'Eixample']
  },
  {
    id: 'place-4',
    name: 'Discoteca Salsa & Sentimiento',
    category: 'Discoteca',
    city: 'Madrid',
    address: 'Calle Orense 24, Nuevos Ministerios, Madrid',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 410,
    priceRange: '€€',
    specialty: 'Aguardiente Antioqueño, cócteles tropicales y salsa brava',
    description: 'La mejor rumba crossover y salsa de golpe en Madrid. Clásicos de Grupo Niche, Guayacán, Binomio de Oro y ambiente 100% colombiano.',
    phone: '+34 678 901 234',
    inGoogleMaps: true,
    socialLinks: {
      latierrita: '@salsaysentimiento',
      instagram: '@salsaysentimientomadrid',
      facebook: 'facebook.com/salsaysentimientomadrid',
      tiktok: '@salsaysentimientomadrid',
      x: '@salsasentimiento',
      web: 'https://salsaysentimiento.es'
    },
    isVerified: true,
    tags: ['Salsa', 'Vallenato', 'Aguardiente', 'Rumba']
  },
  {
    id: 'place-5',
    name: 'Asesoría Jurídica Tricolor',
    category: 'Otros',
    city: 'Madrid',
    address: 'Paseo de la Castellana 95, Planta 8, Madrid',
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 156,
    priceRange: '€€',
    specialty: 'Arraigo social, homologación de títulos, nacionalidad española y canje de licencia',
    description: 'Abogados colombianos colegiados en España especialistas en extranjería y derecho migratorio para la comunidad latina.',
    phone: '+34 910 882 123',
    website: 'https://asesoriatricolor.es',
    inGoogleMaps: true,
    socialLinks: {
      latierrita: '@asesoriatricolor',
      instagram: '@asesoriatricolor',
      facebook: 'facebook.com/asesoriatricolor',
      tiktok: '@abogadostricolor',
      x: '@asesoriatricolor',
      web: 'https://asesoriatricolor.es'
    },
    isVerified: true,
    tags: ['Arraigo', 'Nacionalidad', 'Canje Licencia', 'Homologación']
  },
  {
    id: 'place-6',
    name: 'Supermercado y Carnicería La Tierrita',
    category: 'Tienda',
    city: 'Valencia',
    address: 'Carrer de Cuba 38, Ruzafa, Valencia',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 142,
    priceRange: '€',
    specialty: 'Chocoramo, Pony Malta, harina PAN, arepas de chócolo y cortes de carne para sancocho',
    description: 'Tu tienda colombiana en Valencia. Todos los antojos de la patria: bocadillos veleños, café sello rojo, frijol cargamanto y productos frescos.',
    phone: '+34 963 456 789',
    inGoogleMaps: true,
    socialLinks: {
      latierrita: '@tiendalatierritavlc',
      instagram: '@tiendalatierritavalencia',
      facebook: 'facebook.com/tiendalatierritavalencia',
      tiktok: '@tiendalatierrita',
      x: '@tiendalatierrita',
      web: 'https://tiendalatierrita.es'
    },
    isVerified: true,
    tags: ['Chocoramo', 'Pony Malta', 'Carnicería', 'Abarrotes']
  },
  {
    id: 'place-7',
    name: 'Consulado General de Colombia en Madrid',
    category: 'Sitios de interes',
    city: 'Madrid',
    address: 'Calle Alfonso XI, 6, 28014 Madrid',
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=80',
    rating: 4.3,
    reviewsCount: 890,
    priceRange: '€',
    specialty: 'Pasaportes, cédulas de ciudadanía, poderes notariales y asistencia consular',
    description: 'Sede oficial de atención consular para ciudadanos colombianos en la Comunidad de Madrid y provincias adscritas.',
    phone: '+34 917 814 550',
    website: 'https://madrid.consulado.gov.co',
    inGoogleMaps: true,
    socialLinks: {
      latierrita: '@consuladocolmadrid',
      instagram: '@cancilleriacol',
      facebook: 'facebook.com/CancilleriaCol',
      tiktok: '@cancilleriacolombia',
      x: '@CancilleriaCol',
      web: 'https://madrid.consulado.gov.co'
    },
    isVerified: true,
    tags: ['Oficial', 'Pasaportes', 'Cédula', 'Poderes']
  },
  {
    id: 'place-8',
    name: 'Arepas & Grill Medellín',
    category: 'Restaurante/Cafe',
    city: 'Sevilla',
    address: 'Calle Betis 19, Triana, Sevilla',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 110,
    priceRange: '€',
    specialty: 'Arepas rellenas de carne desmechada, queso costeño y picadas criollas',
    description: 'Rincón paisa a orillas del Guadalquivir en Triana. Arepas artesanales hechas a mano y empanaditas con ají casero picante.',
    phone: '+34 954 123 456',
    inGoogleMaps: true,
    socialLinks: {
      latierrita: '@arepasgrillsevilla',
      instagram: '@arepasgrillsevilla',
      facebook: 'facebook.com/arepasgrillsevilla',
      tiktok: '@arepasgrillsevilla',
      x: '@arepasgrillsev',
      web: 'https://arepasgrillsevilla.es'
    },
    isVerified: true,
    tags: ['Arepas', 'Empanadas', 'Triana', 'Carne Desmechada']
  }
];

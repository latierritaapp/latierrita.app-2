import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config({ override: true });

// Importamos los datos mock directo de la app
import {
  INITIAL_CURRENT_USER,
  OTHER_USERS,
  INITIAL_STORIES,
  INITIAL_AD_BANNERS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_VERIFICATION_REQUESTS,
  INITIAL_STAFF_MEMBERS,
  INITIAL_DELETED_ACCOUNTS,
  INITIAL_POSTS,
  INITIAL_PLACES
} from './src/data/mockData';

const jwtSecret = '83MoTh7uamYte56x58VfcUgwMZH8oacP';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://api.latierrita.tech';
const anonApiKey = process.env.VITE_SUPABASE_ANON_KEY || '';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateJWT(payload: any, secret: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

const iat = Math.floor(Date.now() / 1000);
const exp = iat + (50 * 365 * 24 * 60 * 60);

const serviceRoleJWT = generateJWT({ role: 'service_role', iss: 'supabase', aud: 'anon', iat, exp }, jwtSecret);

async function upsertTable(tableName: string, records: any[]) {
  console.log(`\nSembrando tabla "${tableName}" (${records.length} registros)...`);
  if (records.length === 0) return;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'apikey': anonApiKey,
        'Authorization': `Bearer ${serviceRoleJWT}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(records)
    });

    if (response.ok || response.status === 201) {
      console.log(`✅ ¡Éxito sembrando "${tableName}"!`);
    } else {
      console.error(`❌ Error al sembrar "${tableName}":`, response.status, response.statusText);
      console.error('Detalles:', await response.text());
    }
  } catch (err: any) {
    console.error(`❌ Excepción en "${tableName}":`, err.message);
  }
}

// Helper para parsear fechas
function parseDateString(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toISOString();
  // Convierte "2026-09-18 14:20" a formato ISO estándar
  const formatted = dateStr.replace(' ', 'T');
  const d = new Date(formatted);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function runSeeder() {
  console.log('=== INICIANDO SIEMBRA INTEGRAL DE SUPABASE ===');

  // 1. PROFILES
  // Unimos el usuario actual y los otros usuarios
  const rawProfiles = [INITIAL_CURRENT_USER, ...OTHER_USERS];
  const mappedProfiles = rawProfiles.map(p => ({
    id: p.id,
    username: p.username,
    name: p.name,
    email: p.email || `${p.username}@latierrita.es`, // Solución para email NOT NULL
    avatar_url: p.avatar || null,
    bio: p.bio || null,
    city: p.city || null,
    phone: null,
    whatsapp: null,
    facebook: null,
    instagram: null,
    verified: p.isVerified || false,
    is_staff: p.staffRole ? true : false,
    staff_role: p.staffRole || null,
    followers: [],
    following: [],
    created_at: parseDateString(p.createdAt),
    origin_city: p.originCity || 'Colombia',
    first_name: p.firstName || null,
    last_name: p.lastName || null,
    birth_date: p.birthDate || null,
    age: p.age || null,
    is_deleted: false,
    deleted_at: null,
    retention_expires_at: null,
    deleted_reason: null
  }));
  await upsertTable('profiles', mappedProfiles);

  // 2. STORIES
  const mappedStories = INITIAL_STORIES.map(s => {
    const timestampISO = parseDateString(s.timestamp);
    // Vencimiento +24 horas
    const expiresAt = new Date(new Date(timestampISO).getTime() + 24 * 60 * 60 * 1000).toISOString();
    return {
      id: s.id,
      user_id: s.userId,
      username: s.username,
      avatar_url: s.userAvatar,
      media_url: s.mediaUrl,
      media_type: 'image',
      caption: s.caption || null,
      user_city: s.userCity,
      viewed_by: [],
      expires_at: expiresAt,
      created_at: timestampISO
    };
  });
  await upsertTable('stories', mappedStories);

  // 3. BANNERS
  const mappedBanners = INITIAL_AD_BANNERS.map(b => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle || null,
    image_url: b.imageUrl,
    sponsor_name: b.sponsorName,
    sponsor_city: b.sponsorCity,
    cta_text: b.ctaText,
    cta_link: b.ctaLink,
    category: b.category,
    discount_badge: b.discountBadge || null,
    active: b.active,
    carousel_type: b.carouselType || 'explorar'
  }));
  await upsertTable('banners', mappedBanners);

  // 4. POSTS
  // Encontramos nombres para los autores en base a los usuarios para cumplir con la restricción "name" NOT NULL
  const getUserName = (userId: string, username: string): string => {
    const match = rawProfiles.find(u => u.id === userId);
    if (match) return match.name;
    return username.charAt(0).toUpperCase() + username.slice(1).replace('_', ' ');
  };

  const mappedPosts = INITIAL_POSTS.map(p => ({
    id: p.id,
    user_id: p.userId,
    username: p.username,
    name: getUserName(p.userId, p.username),
    avatar_url: p.userAvatar,
    image_url: p.mediaUrl,
    caption: p.caption || null,
    location: p.location || null,
    user_city: p.userCity,
    likes: [], // Solución para likes de tipo JSON Array en vez de número entero
    comments_count: 0,
    is_staff_ad: false,
    created_at: parseDateString(p.timestamp)
  }));
  await upsertTable('posts', mappedPosts);

  // 5. PLACES
  const mappedPlaces = INITIAL_PLACES.map(p => ({
    id: p.id,
    user_id: p.userId || null,
    name: p.name,
    specialty: p.specialty,
    description: p.description,
    address: p.address,
    phone: p.phone || null,
    whatsapp: p.whatsapp || null,
    instagram: p.instagram || null,
    image_url: p.imageUrl,
    category: p.category,
    city: p.city,
    rating: p.rating || 0,
    reviews_count: p.reviewsCount || 0,
    tags: p.tags || [],
    created_at: new Date().toISOString()
  }));
  await upsertTable('places', mappedPlaces);

  // 6. SUPPORT TICKETS
  const mappedTickets = INITIAL_SUPPORT_TICKETS.map(t => ({
    id: t.id,
    code: t.code,
    type: t.type,
    user_name: t.userName,
    user_username: t.userUsername,
    user_avatar: t.userAvatar || null,
    subject: t.subject,
    description: t.description,
    status: t.status || 'pendientes',
    priority: t.priority || 'Media',
    date: t.date || new Date().toISOString(),
    response: null
  }));
  await upsertTable('support_tickets', mappedTickets);

  // 7. VERIFICATION REQUESTS
  const mappedVerifications = INITIAL_VERIFICATION_REQUESTS.map(v => ({
    id: v.id,
    user_id: v.userId || null,
    username: v.username,
    name: v.name,
    city: v.city,
    avatar: v.avatar || null,
    document_type: v.documentType,
    document_number: v.documentNumber,
    reason: v.reason,
    status: v.status || 'pendiente',
    date: v.date || new Date().toISOString()
  }));
  await upsertTable('verification_requests', mappedVerifications);

  // 8. STAFF MEMBERS
  const mappedStaff = INITIAL_STAFF_MEMBERS.map(s => ({
    id: s.id,
    name: s.name,
    username: s.username,
    avatar: s.avatar || null,
    role: s.role,
    email: s.email,
    pin: s.pin,
    status: s.status || 'Activo'
  }));
  await upsertTable('staff_members', mappedStaff);

  // 9. DELETED ACCOUNTS
  const mappedDeleted = INITIAL_DELETED_ACCOUNTS.map(d => ({
    id: d.id,
    user_id: d.userId,
    username: d.username,
    name: d.name,
    avatar: d.avatar || null,
    email: d.email,
    deleted_at: parseDateString(d.deletedAt),
    retention_expires_at: parseDateString(d.retentionExpiresAt),
    reason: d.reason || null,
    can_restore: d.canRestore || false,
    profile_data: d.profileData || {}
  }));
  await upsertTable('deleted_accounts', mappedDeleted);

  console.log('\n=== PROCESO DE SIEMBRA COMPLETADO ===');
}

runSeeder();

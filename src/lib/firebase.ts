import { supabase } from './supabase';

// DB Dummy object to match previous exports
export const db = {};

// Helpers to dynamically convert camelCase (JavaScript/React) <-> snake_case (PostgreSQL)
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function isObject(val: any): boolean {
  return val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date);
}

function convertKeysToSnake(obj: any): any {
  if (!isObject(obj) && !Array.isArray(obj)) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToSnake);
  const result: any = {};
  for (const key of Object.keys(obj)) {
    // Keep internal JSON fields unaltered if they are complex configuration metadata
    if (key === 'profileData' || key === 'profile_data') {
      result[camelToSnake(key)] = obj[key];
      continue;
    }
    const snakeKey = camelToSnake(key);
    result[snakeKey] = convertKeysToSnake(obj[key]);
  }
  return result;
}

function convertKeysToCamel(obj: any): any {
  if (!isObject(obj) && !Array.isArray(obj)) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToCamel);
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (key === 'profile_data' || key === 'profileData') {
      result[snakeToCamel(key)] = obj[key];
      continue;
    }
    const camelKey = snakeToCamel(key);
    result[camelKey] = convertKeysToCamel(obj[key]);
  }
  return result;
}

function formatRowData(tableName: string, data: any): any {
  if (!data || typeof data !== 'object') return data;
  const item = convertKeysToCamel(data);

  if (tableName === 'posts') {
    item.mediaUrl = item.mediaUrl || item.imageUrl || '';
    item.userAvatar = item.userAvatar || item.avatarUrl || '';
    item.timestamp = item.timestamp || item.createdAt || 'Reciente';
    item.likesCount = Array.isArray(item.likes) ? item.likes.length : (typeof item.likesCount === 'number' ? item.likesCount : 0);
    item.comments = Array.isArray(item.comments) ? item.comments : [];
  } else if (tableName === 'stories') {
    item.userAvatar = item.userAvatar || item.avatarUrl || '';
    item.timestamp = item.timestamp || item.createdAt || 'Reciente';
    item.reactions = Array.isArray(item.reactions) ? item.reactions : [];
  } else if (tableName === 'profiles' || tableName === 'users') {
    item.avatar = item.avatar || item.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
    item.isVerified = item.isVerified !== undefined ? item.isVerified : (item.verified ?? false);
    item.originCity = item.originCity || 'Colombia';
    item.city = item.city || 'Madrid';
    item.followersCount = Array.isArray(item.followers) ? item.followers.length : (item.followersCount || 0);
    item.followingCount = Array.isArray(item.following) ? item.following.length : (item.followingCount || 0);
    item.socialLinks = item.socialLinks || {
      instagram: item.instagram || '',
      facebook: item.facebook || '',
      tiktok: item.tiktok || '',
      x: item.x || ''
    };
  } else if (tableName === 'chat_rooms') {
    // 1. Process messages column (Postgres JSONB or stringified JSON)
    if (typeof item.messages === 'string') {
      try {
        item.messages = JSON.parse(item.messages);
      } catch (e) {
        item.messages = [];
      }
    }

    // 2. Fallback: check if description had JSON metadata from previous version
    if (item.description && typeof item.description === 'string' && item.description.startsWith('{')) {
      try {
        const meta = JSON.parse(item.description);
        if (!Array.isArray(item.messages) || item.messages.length === 0) {
          if (Array.isArray(meta.messages)) item.messages = meta.messages;
        }
        item.description = meta.description || '';
        item.targetUserId = meta.targetUserId || item.targetUserId;
        item.targetUser = meta.targetUser || item.targetUser;
        item.admins = meta.admins || item.admins || [];
        item.createdBy = meta.createdBy || item.createdBy;
        item.status = meta.status || item.status;
        item.unreadCount = meta.unreadCount || item.unreadCount;
      } catch (e) {
        // Not JSON
      }
    }
    if (!Array.isArray(item.members)) item.members = [];
    if (!Array.isArray(item.messages)) item.messages = [];
  }

  return item;
}

function sanitizePayloadForTable(tableName: string, payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  const clean = { ...payload };

  if (tableName === 'posts') {
    // Strip frontend-only properties that do not exist as DB columns in Postgres
    delete clean.has_liked;
    delete clean.ad_cta_url;
    delete clean.likes_count;
    delete clean.disable_comments;
    delete clean.hide_likes;
    delete clean.tagged_usernames;

    if (clean.media_url && !clean.image_url) {
      clean.image_url = clean.media_url;
    }
    delete clean.media_url;

    if (clean.user_avatar && !clean.avatar_url) {
      clean.avatar_url = clean.user_avatar;
    }
    delete clean.user_avatar;

    if (clean.timestamp && !clean.created_at) {
      clean.created_at = new Date().toISOString();
    }
    delete clean.timestamp;

    if (!clean.name) {
      clean.name = clean.username || 'Usuario';
    }

    if (!Array.isArray(clean.likes)) {
      clean.likes = [];
    }

    if (clean.comments_count === undefined) {
      clean.comments_count = Array.isArray(clean.comments) ? clean.comments.length : 0;
    }
  } else if (tableName === 'stories') {
    delete clean.viewed;

    if (clean.timestamp && !clean.created_at) {
      clean.created_at = new Date().toISOString();
    }
    delete clean.timestamp;

    if (clean.user_avatar && !clean.avatar_url) {
      clean.avatar_url = clean.user_avatar;
    }
    delete clean.user_avatar;

    if (!clean.expires_at) {
      clean.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }
    if (!clean.media_type) {
      clean.media_type = 'image';
    }
    if (!Array.isArray(clean.viewed_by)) {
      clean.viewed_by = [];
    }
    if (!Array.isArray(clean.reactions)) {
      clean.reactions = [];
    }
  } else if (tableName === 'profiles' || tableName === 'users') {
    // Strip frontend-only properties
    delete clean.followers_count;
    delete clean.following_count;
    delete clean.posts_count;
    delete clean.last_name_change_date;
    delete clean.last_username_change_date;

    if (clean.avatar && !clean.avatar_url) {
      clean.avatar_url = clean.avatar;
    }
    delete clean.avatar;

    if (clean.is_verified !== undefined && clean.verified === undefined) {
      clean.verified = clean.is_verified;
    }
    delete clean.is_verified;

    if (clean.social_links && typeof clean.social_links === 'object') {
      if (clean.social_links.instagram !== undefined) clean.instagram = clean.social_links.instagram;
      if (clean.social_links.facebook !== undefined) clean.facebook = clean.social_links.facebook;
      if (clean.social_links.tiktok !== undefined) clean.tiktok = clean.social_links.tiktok;
      if (clean.social_links.x !== undefined) clean.x = clean.social_links.x;
      delete clean.social_links;
    }
  } else if (tableName === 'chat_rooms') {
    // 1. Ensure messages is kept as an array for the Postgres JSONB column
    if (typeof clean.messages === 'string') {
      try {
        clean.messages = JSON.parse(clean.messages);
      } catch {
        clean.messages = [];
      }
    } else if (!Array.isArray(clean.messages)) {
      clean.messages = [];
    }

    // 2. Ensure description is a clean text string, NOT a giant JSON object
    if (typeof clean.description === 'string' && clean.description.startsWith('{')) {
      try {
        const parsed = JSON.parse(clean.description);
        if (parsed.description && typeof parsed.description === 'string') {
          clean.description = parsed.description;
        }
      } catch {
        // Keep string as is
      }
    } else if (typeof clean.description !== 'string') {
      clean.description = '';
    }

    // Clean up temporary frontend-only fields
    delete clean.targetUserId;
    delete clean.target_user_id;
    delete clean.targetUser;
    delete clean.target_user;
    delete clean.unreadCount;
    delete clean.unread_count;

    if (!Array.isArray(clean.members)) clean.members = [];
    if (!clean.created_at) clean.created_at = new Date().toISOString().split('T')[0];
    if (!clean.name) clean.name = 'Chat';
  }

  return clean;
}

// 1. EMULACIÓN DE COLLECTION REF
export function collection(database: any, name: string) {
  // Translate firestore 'users' collection to our postgres 'profiles' table
  const tableName = name === 'users' ? 'profiles' : name;
  return {
    type: 'collection',
    name: tableName
  };
}

// 2. EMULACIÓN DE DOCUMENT REF
export function doc(database: any, colOrPath: any, id?: string) {
  if (typeof colOrPath === 'string') {
    // E.g. doc(db, 'config', 'startup_ad')
    const tableName = colOrPath === 'users' ? 'profiles' : colOrPath;
    return {
      type: 'document',
      collection: tableName,
      id: id || ''
    };
  }
  
  // E.g. doc(db, collectionRef, id)
  return {
    type: 'document',
    collection: colOrPath.name,
    id: id || ''
  };
}

// 3. EMULACIÓN DE GET DOC
export async function getDoc(docRef: any) {
  const { collection, id } = docRef;
  const { data, error } = await supabase
    .from(collection)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return {
    exists: () => !!data,
    data: () => data ? formatRowData(collection, data) : null,
    id
  };
}

// 4. EMULACIÓN DE SET DOC
export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }) {
  const { collection, id } = docRef;
  const rawSnake = convertKeysToSnake(data);
  const snakePayload = sanitizePayloadForTable(collection, rawSnake);
  
  // Ensure the document ID is preserved in the table row
  snakePayload.id = id;

  const { error } = await supabase
    .from(collection)
    .upsert([snakePayload], { onConflict: 'id' });

  if (error) throw error;
}

// 5. EMULACIÓN DE UPDATE DOC
export async function updateDoc(docRef: any, data: any) {
  const { collection, id } = docRef;
  const rawSnake = convertKeysToSnake(data);
  const snakePayload = sanitizePayloadForTable(collection, rawSnake);

  const { error } = await supabase
    .from(collection)
    .update(snakePayload)
    .eq('id', id);

  if (error) throw error;
}

// 6. EMULACIÓN DE DELETE DOC
export async function deleteDoc(docRef: any) {
  const { collection, id } = docRef;
  const { error } = await supabase
    .from(collection)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// 7. EMULACIÓN DE ON SNAPSHOT (Soporta suscripciones en tiempo real)
export function onSnapshot(
  ref: any, 
  callback: (snapshot: any) => void, 
  errorCallback?: (err: any) => void
) {
  let isUnsubscribed = false;

  const fetchData = async () => {
    if (isUnsubscribed) return;
    try {
      if (ref.type === 'collection') {
        const { data, error } = await supabase
          .from(ref.name)
          .select('*');

        if (error) throw error;

        const docs = (data || []).map(row => ({
          id: row.id,
          data: () => formatRowData(ref.name, row),
          exists: () => true
        }));

        callback({
          empty: docs.length === 0,
          forEach: (cb: any) => docs.forEach(cb),
          docs
        });
      } else if (ref.type === 'document') {
        const { data, error } = await supabase
          .from(ref.collection)
          .select('*')
          .eq('id', ref.id)
          .maybeSingle();

        if (error) throw error;

        callback({
          exists: () => !!data,
          data: () => data ? formatRowData(ref.collection, data) : null,
          id: ref.id
        });
      }
    } catch (err) {
      if (errorCallback) errorCallback(err);
      else console.error('Error in emulated onSnapshot:', err);
    }
  };

  // Carga inicial
  fetchData();

  // Configurar suscripción en tiempo real con Supabase Realtime
  const targetTable = ref.type === 'collection' ? ref.name : ref.collection;
  const channelName = ref.type === 'collection' ? ref.name : `${ref.collection}-${ref.id}`;
  const channel = supabase.channel(`realtime-shim:${channelName}`);

  channel
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: targetTable,
      filter: ref.type === 'document' ? `id=eq.${ref.id}` : undefined
    }, () => {
      fetchData();
    })
    .subscribe();

  return () => {
    isUnsubscribed = true;
    channel.unsubscribe();
  };
}

// 8. EMULACIÓN DE CONSULTAS Y FILTROS (QUERY, WHERE, LIMIT)
export function query(colRef: any, ...constraints: any[]) {
  return {
    type: 'query',
    collection: colRef.name,
    constraints
  };
}

export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

export function limit(num: number) {
  return { type: 'limit', value: num };
}

// 9. EMULACIÓN DE GET DOCS
export async function getDocs(queryRef: any) {
  const collectionName = queryRef.type === 'query' ? queryRef.collection : queryRef.name;
  let q = supabase.from(collectionName).select('*');

  if (queryRef.type === 'query' && queryRef.constraints) {
    for (const cons of queryRef.constraints) {
      if (cons.type === 'where') {
        const snakeField = camelToSnake(cons.field);
        if (cons.op === '==') {
          q = q.eq(snakeField, cons.value);
        } else if (cons.op === 'in') {
          q = q.in(snakeField, cons.value);
        }
      } else if (cons.type === 'limit') {
        q = q.limit(cons.value);
      }
    }
  }

  const { data, error } = await q;
  if (error) throw error;

  const docs = (data || []).map(row => ({
    id: row.id,
    data: () => formatRowData(collectionName, row),
    exists: () => true
  }));

  return {
    empty: docs.length === 0,
    docs,
    forEach: (cb: any) => docs.forEach(cb)
  };
}

// 10. EMULACIÓN DE ADD DOC
export async function addDoc(colRef: any, data: any) {
  const rawSnake = convertKeysToSnake(data);
  const snakePayload = sanitizePayloadForTable(colRef.name, rawSnake);
  const { data: inserted, error } = await supabase
    .from(colRef.name)
    .insert([snakePayload])
    .select('*')
    .single();

  if (error) throw error;
  return {
    id: inserted.id,
    data: () => formatRowData(colRef.name, inserted)
  };
}

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
    data: () => data ? convertKeysToCamel(data) : null,
    id
  };
}

// 4. EMULACIÓN DE SET DOC
export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }) {
  const { collection, id } = docRef;
  const snakePayload = convertKeysToSnake(data);
  
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
  const snakePayload = convertKeysToSnake(data);

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
          data: () => convertKeysToCamel(row),
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
          data: () => data ? convertKeysToCamel(data) : null,
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
    data: () => convertKeysToCamel(row),
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
  const snakePayload = convertKeysToSnake(data);
  const { data: inserted, error } = await supabase
    .from(colRef.name)
    .insert([snakePayload])
    .select('*')
    .single();

  if (error) throw error;
  return {
    id: inserted.id,
    data: () => convertKeysToCamel(inserted)
  };
}

import { supabase } from './supabase';

export const db = {};
export const auth = null;

// Helpers to convert camelCase <-> snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertKeysToSnake(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || obj instanceof Date) return obj;
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = camelToSnake(key);
    result[snakeKey] = obj[key];
  }
  return result;
}

// 1. COLLECTION REF
export function collection(database: any, name: string) {
  const colName = name === 'users' ? 'profiles' : name;
  return { path: colName, id: colName };
}

// 2. DOCUMENT REF
export function doc(database: any, colOrPath: any, id?: string) {
  const colName = typeof colOrPath === 'string' ? (colOrPath === 'users' ? 'profiles' : colOrPath) : (colOrPath?.path || 'profiles');
  const docId = id || (typeof colOrPath === 'string' ? '' : '');
  return {
    path: `${colName}/${docId}`,
    id: docId,
    parent: { id: colName }
  };
}

// 3. GET DOC
export async function getDoc(docRef: any) {
  try {
    const colName = docRef?.parent?.id || docRef?.path?.split('/')[0];
    const docId = docRef?.id;
    if (colName && docId) {
      const { data } = await supabase.from(colName).select('*').eq('id', docId).maybeSingle();
      if (data) {
        return {
          exists: () => true,
          data: () => ({ id: docId, ...data }),
          id: docId
        };
      }
    }
  } catch {}

  return {
    exists: () => false,
    data: () => null,
    id: docRef?.id || ''
  };
}

// 4. SET DOC
export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }) {
  try {
    const colName = docRef?.parent?.id || docRef?.path?.split('/')[0];
    const docId = docRef?.id;
    if (colName && docId) {
      const snakePayload = { ...convertKeysToSnake(data), id: docId };
      await supabase.from(colName).upsert([snakePayload], { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Supabase setDoc warning:', err);
  }
}

// 5. UPDATE DOC
export async function updateDoc(docRef: any, data: any) {
  try {
    const colName = docRef?.parent?.id || docRef?.path?.split('/')[0];
    const docId = docRef?.id;
    if (colName && docId) {
      const snakePayload = convertKeysToSnake(data);
      await supabase.from(colName).update(snakePayload).eq('id', docId);
    }
  } catch (err) {
    console.warn('Supabase updateDoc warning:', err);
  }
}

// 6. DELETE DOC
export async function deleteDoc(docRef: any) {
  try {
    const colName = docRef?.parent?.id || docRef?.path?.split('/')[0];
    const docId = docRef?.id;
    if (colName && docId) {
      await supabase.from(colName).delete().eq('id', docId);
    }
  } catch (err) {
    console.warn('Supabase deleteDoc warning:', err);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  return { error: String(error), operationType, path, authInfo: {} };
}

// 7. ON SNAPSHOT
export function onSnapshot(
  ref: any,
  callback: (snapshot: any) => void,
  errorCallback?: (err: any) => void
) {
  let isCancelled = false;

  const fetchData = async () => {
    try {
      const colName = ref?.path || ref?.parent?.id || (typeof ref?.id === 'string' ? ref.id : null);
      if (!colName) return;
      const table = colName === 'users' ? 'profiles' : colName;

      // Check if it's a single doc snapshot
      const isSingleDoc = ref?.id && ref?.parent?.id;
      if (isSingleDoc) {
        const { data } = await supabase.from(table).select('*').eq('id', ref.id).maybeSingle();
        if (!isCancelled) {
          callback({
            exists: () => Boolean(data),
            data: () => data ? { id: ref.id, ...data } : null,
            id: ref.id
          });
        }
        return;
      }

      // Query snapshot
      const { data } = await supabase.from(table).select('*');
      if (!isCancelled && Array.isArray(data)) {
        const docs = data.map((item: any) => ({
          id: item.id || `sup-${Math.random()}`,
          data: () => ({ id: item.id, ...item }),
          exists: () => true
        }));
        callback({
          empty: docs.length === 0,
          forEach: (cb: any) => docs.forEach(cb),
          docs,
          exists: () => docs.length > 0,
          data: () => null
        });
      }
    } catch (err) {
      if (errorCallback && !isCancelled) errorCallback(err);
    }
  };

  fetchData();

  // Also subscribe to Supabase realtime if table exists
  const colName = ref?.path || ref?.parent?.id || (typeof ref?.id === 'string' ? ref.id : null);
  const table = colName === 'users' ? 'profiles' : colName;
  let channel: any = null;
  if (table && typeof table === 'string' && !table.includes('/')) {
    try {
      channel = supabase
        .channel(`public_${table}_changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchData();
        })
        .subscribe();
    } catch {}
  }

  return () => {
    isCancelled = true;
    if (channel) {
      try { supabase.removeChannel(channel); } catch {}
    }
  };
}

// 8. QUERY & CONSTRAINTS
export function query(colRef: any, ...constraints: any[]) {
  return colRef;
}

export function where(field: string, op: any, value: any) {
  return { field, op, value };
}

export function limit(num: number) {
  return { limit: num };
}

// 9. GET DOCS
export async function getDocs(queryRef: any) {
  try {
    const colName = queryRef?.path || queryRef?.parent?.id || queryRef?.id;
    if (colName) {
      const table = colName === 'users' ? 'profiles' : colName;
      const { data } = await supabase.from(table).select('*');
      if (Array.isArray(data)) {
        const docs = data.map((item: any) => ({
          id: item.id || `sup-${Math.random()}`,
          data: () => ({ id: item.id, ...item }),
          exists: () => true
        }));
        return {
          empty: docs.length === 0,
          docs,
          forEach: (cb: any) => docs.forEach(cb)
        };
      }
    }
  } catch {}

  return {
    empty: true,
    docs: [],
    forEach: () => {}
  };
}

// 10. ADD DOC
export async function addDoc(colRef: any, data: any) {
  try {
    const colName = colRef?.path || colRef?.id;
    const newId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    if (colName) {
      const table = colName === 'users' ? 'profiles' : colName;
      const snakePayload = { ...convertKeysToSnake(data), id: newId };
      await supabase.from(table).upsert([snakePayload]);
    }
    return {
      id: newId,
      data: () => ({ id: newId, ...data })
    };
  } catch (e) {
    throw e;
  }
}

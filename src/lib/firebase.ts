import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection as fsCollection,
  doc as fsDoc,
  getDoc as fsGetDoc,
  getDocs as fsGetDocs,
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  onSnapshot as fsOnSnapshot,
  addDoc as fsAddDoc,
  query as fsQuery,
  where as fsWhere,
  limit as fsLimit,
  getDocFromServer,
  QueryConstraint
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { supabase } from './supabase';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection as required by Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(fsDoc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Helpers to dynamically convert camelCase <-> snake_case for dual Supabase backup
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
  return fsCollection(db, colName);
}

// 2. DOCUMENT REF
export function doc(database: any, colOrPath: any, id?: string) {
  if (typeof colOrPath === 'string') {
    const colName = colOrPath === 'users' ? 'profiles' : colOrPath;
    if (id) {
      return fsDoc(db, colName, id);
    }
    return fsDoc(db, colName);
  }
  if (id) {
    return fsDoc(colOrPath, id);
  }
  return fsDoc(colOrPath);
}

// 3. GET DOC
export async function getDoc(docRef: any) {
  try {
    const snap = await fsGetDoc(docRef);
    const isExists = snap && (typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists));
    if (isExists) {
      const snapData = snap.data() || {};
      return {
        exists: () => true,
        data: () => ({ id: snap.id, ...snapData }),
        id: snap.id
      };
    }
  } catch (e) {
    console.warn('Firestore getDoc note:', e);
  }

  // Fallback to Supabase
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
  // Primary: Real-time Cloud Firestore write
  try {
    if (options) {
      await fsSetDoc(docRef, data, options);
    } else {
      await fsSetDoc(docRef, data);
    }
  } catch (err) {
    console.warn('Firestore setDoc warning, syncing locally:', err);
  }

  // Non-blocking background sync to Supabase backup
  try {
    const colName = docRef?.parent?.id || docRef?.path?.split('/')[0];
    const docId = docRef?.id;
    if (colName && docId) {
      const snakePayload = { ...convertKeysToSnake(data), id: docId };
      await supabase.from(colName).upsert([snakePayload], { onConflict: 'id' });
    }
  } catch {}
}

// 5. UPDATE DOC
export async function updateDoc(docRef: any, data: any) {
  try {
    await fsUpdateDoc(docRef, data);
  } catch (err) {
    console.warn('Firestore updateDoc warning:', err);
  }

  try {
    const colName = docRef?.parent?.id || docRef?.path?.split('/')[0];
    const docId = docRef?.id;
    if (colName && docId) {
      const snakePayload = convertKeysToSnake(data);
      await supabase.from(colName).update(snakePayload).eq('id', docId);
    }
  } catch {}
}

// 6. DELETE DOC
export async function deleteDoc(docRef: any) {
  try {
    await fsDeleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteDoc warning:', err);
  }

  try {
    const colName = docRef?.parent?.id || docRef?.path?.split('/')[0];
    const docId = docRef?.id;
    if (colName && docId) {
      await supabase.from(colName).delete().eq('id', docId);
    }
  } catch {}
}

// Structured error handling for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// 7. ON SNAPSHOT (Cloud Firestore Real-Time Stream across all connected clients)
export function onSnapshot(
  ref: any,
  callback: (snapshot: any) => void,
  errorCallback?: (err: any) => void
) {
  return fsOnSnapshot(
    ref,
    (snapshot: any) => {
      if (!snapshot) {
        callback({
          empty: true,
          docs: [],
          forEach: () => {},
          exists: () => false,
          data: () => null
        });
        return;
      }

      // Single Document Snapshot (e.g. onSnapshot(doc(...)))
      if (typeof snapshot.exists === 'function' && !('docs' in snapshot)) {
        const isExists = snapshot.exists();
        const snapData = isExists ? (snapshot.data() || {}) : null;
        const wrappedDoc = {
          id: snapshot.id,
          data: () => snapData ? { id: snapshot.id, ...snapData } : null,
          exists: () => isExists
        };
        callback(wrappedDoc);
        return;
      }

      // Query Snapshot (e.g. onSnapshot(collection(...)))
      const docs = (snapshot?.docs || []).map((d: any) => {
        const dData = d.data() || {};
        const dExists = typeof d.exists === 'function' ? d.exists() : true;
        return {
          id: d.id,
          data: () => ({ id: d.id, ...dData }),
          exists: () => dExists
        };
      });
      callback({
        empty: snapshot?.empty ?? docs.length === 0,
        forEach: (cb: any) => docs.forEach(cb),
        docs,
        exists: () => docs.length > 0,
        data: () => null
      });
    },
    (err: any) => {
      handleFirestoreError(err, OperationType.GET, ref?.path || ref?.id || null);
      if (errorCallback) errorCallback(err);
    }
  );
}

// 8. QUERY & CONSTRAINTS
export function query(colRef: any, ...constraints: QueryConstraint[]) {
  return fsQuery(colRef, ...constraints);
}

export function where(field: string, op: any, value: any) {
  return fsWhere(field, op, value);
}

export function limit(num: number) {
  return fsLimit(num);
}

// 9. GET DOCS
export async function getDocs(queryRef: any) {
  try {
    const snap = await fsGetDocs(queryRef);
    const docs = (snap?.docs || []).map((d) => {
      const dData = d.data() || {};
      return {
        id: d.id,
        data: () => ({ id: d.id, ...dData }),
        exists: () => d.exists()
      };
    });
    return {
      empty: snap.empty,
      docs,
      forEach: (cb: any) => docs.forEach(cb)
    };
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, queryRef?.path || null);
    return {
      empty: true,
      docs: [],
      forEach: () => {}
    };
  }
}

// 10. ADD DOC
export async function addDoc(colRef: any, data: any) {
  try {
    const docRef = await fsAddDoc(colRef, data);
    return {
      id: docRef.id,
      data: () => ({ id: docRef.id, ...data })
    };
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, colRef?.path || null);
    throw e;
  }
}

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, SpanishCity } from '../types';
import { INITIAL_CURRENT_USER } from '../data/mockData';

export const DEFAULT_SILHOUETTE_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231e293b'/%3E%3Ccircle cx='50' cy='36' r='18' fill='%2394a3b8'/%3E%3Cpath d='M20 86 C20 68 34 60 50 60 C66 60 80 68 80 86 Z' fill='%2394a3b8'/%3E%3C/svg%3E";

export interface RegisterData {
  email: string;
  password?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  birthDate?: string;
  age?: number;
  avatar?: string;
  city?: SpanishCity;
  originCity?: string;
}

interface AuthContextType {
  firebaseUser: User | null; // Mantenemos el nombre de la variable para evitar refactorizar toda la app
  userProfile: UserProfile | null;
  loading: boolean;
  isGuest: boolean;
  loginWithEmail: (identifier: string, pass: string) => Promise<void>;
  loginWithEmailOrUsername: (identifier: string, pass: string) => Promise<void>;
  registerWithEmail: (data: RegisterData) => Promise<void>;
  checkUsernameExists: (username: string) => Promise<boolean>;
  checkEmailExists: (email: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (val: boolean) => void;
  continueAsGuest: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteAccount: (reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sanitizeHandle = (username: string | undefined | null, email: string | undefined | null, idFallback?: string): string => {
  if (username) {
    const withoutAt = username.replace(/^@+/, '').trim();
    if (withoutAt.includes('@')) {
      return withoutAt.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    }
    const cleaned = withoutAt.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    if (cleaned) return cleaned;
  }
  if (email) {
    return email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  }
  return `parcero_${(idFallback || 'user').slice(0, 5)}`;
};

const sanitizeDisplayName = (name: string | undefined | null, username: string, email?: string): string => {
  if (name && !name.includes('@') && name.trim().length > 0) {
    return name.trim();
  }
  if (username && !username.includes('@')) {
    return username;
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'Colombiano en España';
};

export const safeSetLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.warn(`[Storage] Failed to save key "${key}" to localStorage:`, e);
  }
};

export const saveUserToCommunityCache = (user: UserProfile): void => {
  if (!user || (!user.id && !user.username)) return;
  try {
    const isStaff = user.username === 'latierrita_app' || user.email === 'latierritaapp@gmail.com' || user.id === 'user-staff';
    if (isStaff) {
      safeSetLocalStorage('latierrita_official_profile', user);
    }
    const raw = localStorage.getItem('latierrita_registered_community');
    let list: UserProfile[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    const idx = list.findIndex(u => (user.id && u.id === user.id) || (user.username && u.username === user.username) || (u.email && user.email && u.email === user.email));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.unshift(user);
    }
    safeSetLocalStorage('latierrita_registered_community', list);
  } catch (e) {
    console.warn('Error saving to community cache:', e);
  }
};

// Mapeador de base de datos Postgres/Firestore a React State (camelCase)
export const mapDBProfileToUserProfile = (db: any): UserProfile => {
  const isGuestAccount = Boolean(
    db.isGuest ||
    db.is_guest ||
    (db.id || '').startsWith('guest-') ||
    (db.username || '').startsWith('User-') ||
    (db.username || '').startsWith('user-') ||
    (db.username || '').toLowerCase().startsWith('invitado') ||
    (db.email || '').includes('@invitado.latierrita.tech')
  );
  const isOfficialEmail = !isGuestAccount && ((db.email || '').trim().toLowerCase() === 'latierritaapp@gmail.com' || db.username === 'latierrita_app' || db.id === 'user-staff');
  let cleanUsername = isOfficialEmail 
    ? 'latierrita_app' 
    : sanitizeHandle(db.username, db.email, db.id);

  // If any other profile claims latierrita_app or latierrita_oficial without the official email, sanitize it
  if (!isOfficialEmail && (cleanUsername === 'latierrita_app' || cleanUsername === 'latierrita_oficial')) {
    cleanUsername = sanitizeHandle('', db.email, db.id);
  }

  const isStaff = isOfficialEmail;

  const displayName = isStaff && db.name && !db.name.includes('@') && db.name.trim().length > 0
    ? db.name.trim()
    : sanitizeDisplayName(db.name, cleanUsername, db.email);

  // Extraer enlaces de redes sociales tanto de columnas individuales como de objetos anidados
  const rawSocial = db.socialLinks || db.social_links || {};
  const instagram = db.instagram || rawSocial.instagram || '';
  const facebook = db.facebook || rawSocial.facebook || '';
  const tiktok = db.tiktok || rawSocial.tiktok || '';
  const x = db.x || rawSocial.x || '';

  const avatarUrl = isGuestAccount ? DEFAULT_SILHOUETTE_AVATAR : (db.avatar_url || db.avatar || db.avatarUrl || (isStaff ? 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80' : DEFAULT_SILHOUETTE_AVATAR));
  const userBio = db.bio !== undefined && db.bio !== null ? db.bio : (isStaff ? '⭐ Cuenta oficial de Staff & Publicidad de La Tierrita España. Conectando a los colombianos.' : '🇨🇴 ¡Orgullo colombiano en España! 🇪🇸');
  const userWebsite = db.website !== undefined && db.website !== null ? db.website : (isStaff ? 'https://latierrita.es' : '');
  const userCity = db.city || 'Madrid';
  const userOriginCity = db.origin_city || db.originCity || (isStaff ? 'Toda Colombia' : 'Colombia');

  return {
    id: db.id || (isStaff ? 'user-staff' : `user-${cleanUsername}`),
    email: db.email,
    username: cleanUsername,
    name: displayName,
    firstName: db.first_name || db.firstName || '',
    lastName: db.last_name || db.lastName || '',
    birthDate: db.birth_date || db.birthDate || '',
    age: db.age || undefined,
    avatar: avatarUrl,
    bio: userBio,
    website: userWebsite,
    city: userCity,
    originCity: userOriginCity,
    followersCount: Array.isArray(db.followers) ? db.followers.length : (typeof db.followers_count === 'number' ? db.followers_count : (typeof db.followersCount === 'number' ? db.followersCount : 0)),
    followingCount: isStaff ? 0 : (Array.isArray(db.following) ? db.following.length : (typeof db.followingCount === 'number' ? db.followingCount : 1)),
    postsCount: typeof db.postsCount === 'number' ? db.postsCount : 0,
    isVerified: isGuestAccount ? false : (isStaff ? true : (db.verified || db.isVerified || false)),
    staffRole: isGuestAccount ? 'Usuario' : (isStaff ? 'ADMIN' : (db.staff_role || db.staffRole || 'Usuario')),
    isGuest: isGuestAccount,
    isDeleted: db.is_deleted || db.isDeleted || false,
    deletedAt: db.deleted_at || db.deletedAt || undefined,
    retentionExpiresAt: db.retention_expires_at || db.retentionExpiresAt || undefined,
    deletedReason: db.deleted_reason || db.deletedReason || '',
    lastNameChangeDate: db.last_name_change_date || db.lastNameChangeDate || undefined,
    lastUsernameChangeDate: db.last_username_change_date || db.lastUsernameChangeDate || undefined,
    createdAt: db.created_at || db.createdAt || new Date().toISOString(),
    socialLinks: {
      instagram,
      facebook,
      tiktok,
      x
    }
  };
};

// Generador de payload para UPDATE en bases de datos (soporta Postgres y Firestore)
const buildDBProfileUpdatePayload = (data: Partial<UserProfile>): Record<string, any> => {
  const payload: Record<string, any> = {};

  if (data.name !== undefined && data.name.trim() !== '') {
    payload.name = data.name.trim();
  }
  if (data.username !== undefined && data.username.trim() !== '') {
    payload.username = data.username.trim().toLowerCase().replace(/^@+/, '');
  }
  if (data.bio !== undefined) {
    payload.bio = data.bio.trim();
  }
  if (data.website !== undefined) {
    payload.website = data.website.trim();
  }
  if (data.city !== undefined) {
    payload.city = data.city;
  }
  if (data.originCity !== undefined) {
    payload.origin_city = data.originCity.trim();
    payload.originCity = data.originCity.trim();
  }
  if (data.age !== undefined) {
    payload.age = data.age;
  }
  if (data.birthDate !== undefined) {
    payload.birth_date = data.birthDate;
    payload.birthDate = data.birthDate;
  }
  if (data.firstName !== undefined) {
    payload.first_name = data.firstName.trim();
    payload.firstName = data.firstName.trim();
  }
  if (data.lastName !== undefined) {
    payload.last_name = data.lastName.trim();
    payload.lastName = data.lastName.trim();
  }
  if (data.avatar !== undefined && data.avatar.trim() !== '') {
    payload.avatar_url = data.avatar;
    payload.avatar = data.avatar;
  }
  if (data.lastNameChangeDate !== undefined) {
    payload.last_name_change_date = data.lastNameChangeDate;
    payload.lastNameChangeDate = data.lastNameChangeDate;
  }
  if (data.lastUsernameChangeDate !== undefined) {
    payload.last_username_change_date = data.lastUsernameChangeDate;
    payload.lastUsernameChangeDate = data.lastUsernameChangeDate;
  }
  if (data.socialLinks) {
    if (data.socialLinks.instagram !== undefined) payload.instagram = data.socialLinks.instagram.trim();
    if (data.socialLinks.facebook !== undefined) payload.facebook = data.socialLinks.facebook.trim();
    if (data.socialLinks.tiktok !== undefined) payload.tiktok = data.socialLinks.tiktok.trim();
    if (data.socialLinks.x !== undefined) payload.x = data.socialLinks.x.trim();
    payload.social_links = data.socialLinks;
    payload.socialLinks = data.socialLinks;
  }
  
  return payload;
};

// Mapeador de React State (camelCase) a base de datos
const mapUserProfileToDBProfile = (profile: Partial<UserProfile>): any => {
  const cleanUsername = sanitizeHandle(profile.username, profile.email, profile.id);
  const displayName = sanitizeDisplayName(profile.name, cleanUsername, profile.email);

  const db: any = {
    id: profile.id,
    email: profile.email || '',
    username: cleanUsername,
    name: displayName,
    avatar_url: profile.avatar || DEFAULT_SILHOUETTE_AVATAR,
    avatar: profile.avatar || DEFAULT_SILHOUETTE_AVATAR,
    bio: profile.bio || '🇨🇴 ¡Orgullo colombiano en España! 🇪🇸',
    website: profile.website || '',
    city: profile.city || 'Madrid',
    origin_city: profile.originCity || 'Colombia',
    originCity: profile.originCity || 'Colombia',
    first_name: profile.firstName || '',
    last_name: profile.lastName || '',
    birth_date: profile.birthDate || '',
    age: profile.age || null,
    instagram: profile.socialLinks?.instagram || '',
    facebook: profile.socialLinks?.facebook || '',
    tiktok: profile.socialLinks?.tiktok || '',
    x: profile.socialLinks?.x || '',
    social_links: profile.socialLinks || {},
    socialLinks: profile.socialLinks || {},
    last_name_change_date: profile.lastNameChangeDate || null,
    lastNameChangeDate: profile.lastNameChangeDate || null,
    last_username_change_date: profile.lastUsernameChangeDate || null,
    lastUsernameChangeDate: profile.lastUsernameChangeDate || null,
    created_at: profile.createdAt || new Date().toISOString()
  };
  return db;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const expiresAtRaw = localStorage.getItem('latierrita_guest_expires_at');
      if (expiresAtRaw && new Date(expiresAtRaw).getTime() < Date.now()) {
        localStorage.removeItem('latierrita_guest_username');
        localStorage.removeItem('latierrita_guest_id');
        localStorage.removeItem('latierrita_guest_expires_at');
        localStorage.removeItem('latierrita_user');
        return null;
      }
    } catch {}

    const saved = localStorage.getItem('latierrita_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.isGuest || parsed?.id?.startsWith('guest-') || parsed?.id === 'user-guest' || (parsed?.username && /^user-\d+$/i.test(parsed.username))) {
          parsed.bio = 'Usuario invitado de La Tierrita App. Comunidad de Colombianos en España.';
          parsed.city = 'Sin asignar';
          parsed.isGuest = true;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('latierrita_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return Boolean(parsed?.isGuest || parsed?.id?.startsWith('guest-') || parsed?.id === 'user-guest' || (parsed?.username && /^user-\d+$/i.test(parsed.username)));
      }
    } catch {}
    return false;
  });
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isSaved = sessionStorage.getItem('latierrita_is_password_recovery') === 'true';
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const path = window.location.pathname || '';
    return isSaved || hash.includes('type=recovery') || search.includes('type=recovery') || path.includes('reset-password');
  });

  const isRegisteringRef = useRef<boolean>(false);

  // Check guest expiration and check if URL indicates password recovery
  useEffect(() => {
    try {
      const expiresAtRaw = localStorage.getItem('latierrita_guest_expires_at');
      if (expiresAtRaw && new Date(expiresAtRaw).getTime() < Date.now()) {
        localStorage.removeItem('latierrita_guest_username');
        localStorage.removeItem('latierrita_guest_id');
        localStorage.removeItem('latierrita_guest_expires_at');
        localStorage.removeItem('latierrita_user');
        setUserProfile(null);
        setFirebaseUser(null);
        setIsGuest(false);
      }
    } catch {}

    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const path = window.location.pathname || '';
    const isRecoveryUrl = hash.includes('type=recovery') || search.includes('type=recovery') || path.includes('reset-password');
    if (isRecoveryUrl || sessionStorage.getItem('latierrita_is_password_recovery') === 'true') {
      setIsPasswordRecovery(true);
      try {
        sessionStorage.setItem('latierrita_is_password_recovery', 'true');
      } catch {}
    }
  }, []);

  // Listen to Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        try {
          sessionStorage.setItem('latierrita_is_password_recovery', 'true');
        } catch {}
      }
      const user = session?.user || null;
      
      // Retrieve locally saved user modifications to guarantee data is never overwritten by stale/null fields
      const savedRaw = localStorage.getItem('latierrita_user');
      let localProfile: Partial<UserProfile> = {};
      if (savedRaw) {
        try {
          localProfile = JSON.parse(savedRaw) || {};
        } catch (e) {}
      }

      if (user) {
        setFirebaseUser(user);
        setIsGuest(false);
        sessionStorage.removeItem('latierrita_guest');
        try {
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (!profile && user.email) {
            const { data: byEmail } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', user.email.trim().toLowerCase())
              .maybeSingle();
            if (byEmail) profile = byEmail;
          }

          if (profile) {
            const mapped = mapDBProfileToUserProfile(profile);
            const isStaff = mapped.username === 'latierrita_app' || user.id === 'user-staff';

            // Ensure existing accounts have correct followingCount
            if (!isStaff) {
              const savedFollowing = localStorage.getItem('latierrita_following');
              let fList: string[] = [];
              if (savedFollowing) {
                try {
                  const parsed = JSON.parse(savedFollowing);
                  if (Array.isArray(parsed)) {
                    fList = parsed.filter(id => id && id !== 'user-staff' && id !== 'latierrita_oficial');
                  }
                } catch {
                  fList = [];
                }
              }
              localStorage.setItem('latierrita_following', JSON.stringify(fList));
              mapped.followingCount = Math.max(1, fList.length);
            } else {
              mapped.followingCount = 0;
            }

            const isOfficial = (user.email || '').trim().toLowerCase() === 'latierritaapp@gmail.com';
            let finalUsername = isOfficial ? 'latierrita_app' : (localProfile.username || mapped.username);
            if (!isOfficial && (finalUsername === 'latierrita_app' || finalUsername === 'latierrita_oficial')) {
              finalUsername = mapped.username && mapped.username !== 'latierrita_app' && mapped.username !== 'latierrita_oficial' 
                ? mapped.username 
                : sanitizeHandle('', user.email, user.id);
            }

            const merged: UserProfile = {
              ...mapped,
              id: user.id,
              name: (localProfile.name && localProfile.name !== 'Colombiano en España' && localProfile.name !== 'Usuario') ? localProfile.name : (mapped.name || localProfile.name || 'Usuario'),
              username: finalUsername,
              bio: localProfile.bio !== undefined ? localProfile.bio : mapped.bio,
              website: localProfile.website !== undefined ? localProfile.website : (mapped.website || ''),
              avatar: (localProfile.avatar && localProfile.avatar !== DEFAULT_SILHOUETTE_AVATAR) ? localProfile.avatar : (mapped.avatar || DEFAULT_SILHOUETTE_AVATAR),
              age: localProfile.age !== undefined ? localProfile.age : mapped.age,
              city: localProfile.city || mapped.city,
              originCity: localProfile.originCity || mapped.originCity,
              followersCount: mapped.followersCount !== undefined ? mapped.followersCount : (localProfile.followersCount || 0),
              followingCount: mapped.followingCount || (isStaff ? 0 : 1),
              socialLinks: {
                ...(mapped.socialLinks || {}),
                ...(localProfile.socialLinks || {})
              }
            };
            saveUserToCommunityCache(merged);
            setUserProfile(merged);
            safeSetLocalStorage('latierrita_user', merged);
          } else {
            // New user from OAuth or first login - synthesize profile while preserving all local edits
            const meta = user.user_metadata || {};
            const cleanUsername = sanitizeHandle(localProfile.username || meta.username || meta.user_name, user.email, user.id);
            const fullName = sanitizeDisplayName(
              localProfile.name || meta.full_name || meta.name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim(),
              cleanUsername,
              user.email
            );
            
            const newProfile: UserProfile = {
              id: user.id,
              email: user.email || '',
              username: cleanUsername,
              name: fullName,
              firstName: localProfile.firstName || meta.first_name || '',
              lastName: localProfile.lastName || meta.last_name || '',
              birthDate: localProfile.birthDate || meta.birth_date || '',
              age: localProfile.age !== undefined ? localProfile.age : (meta.age || undefined),
              avatar: (localProfile.avatar && localProfile.avatar !== DEFAULT_SILHOUETTE_AVATAR) ? localProfile.avatar : (meta.avatar_url || DEFAULT_SILHOUETTE_AVATAR),
              bio: localProfile.bio !== undefined ? localProfile.bio : '🇨🇴 ¡Orgullo colombiano en España! 🇪🇸',
              website: localProfile.website || '',
              city: localProfile.city || (meta.city as any) || 'Madrid',
              originCity: localProfile.originCity || meta.origin_city || 'Colombia',
              followersCount: localProfile.followersCount || 0,
              followingCount: localProfile.followingCount || (cleanUsername === 'latierrita_app' || user.id === 'user-staff' ? 0 : 1),
              postsCount: 0,
              isVerified: localProfile.isVerified || false,
              staffRole: localProfile.staffRole || 'Usuario',
              socialLinks: localProfile.socialLinks || {}
            };

            const dbPayload = mapUserProfileToDBProfile(newProfile);
            try {
              await supabase.from('profiles').upsert([dbPayload]);
            } catch (upsertErr) {
              console.warn('Upsert note in onAuthStateChange:', upsertErr);
            }
            saveUserToCommunityCache(newProfile);
            setUserProfile(newProfile);
            safeSetLocalStorage('latierrita_user', newProfile);
            if (cleanUsername !== 'latierrita_app' && user.id !== 'user-staff') {
              const currentFollowing = localStorage.getItem('latierrita_following');
              if (!currentFollowing) {
                safeSetLocalStorage('latierrita_following', []);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user profile from Supabase:', error);
          if (localProfile && Object.keys(localProfile).length > 0) {
            setUserProfile({ ...localProfile, id: user.id } as UserProfile);
          }
        }
      } else {
        // If registration is currently finishing, do not wipe user states
        if (isRegisteringRef.current) {
          setLoading(false);
          return;
        }

        // When not authenticated with Supabase session, check fresh local session
        const freshSavedRaw = localStorage.getItem('latierrita_user');
        let currentLocal: Partial<UserProfile> = localProfile;
        if (freshSavedRaw) {
          try {
            currentLocal = JSON.parse(freshSavedRaw) || currentLocal;
          } catch (e) {}
        }

        if (currentLocal && (currentLocal.id || currentLocal.username)) {
          const isSavedGuest = Boolean(currentLocal.id?.startsWith('guest-') || (currentLocal as any).isGuest);
          if (isSavedGuest) {
            const expRaw = localStorage.getItem('latierrita_guest_expires_at');
            if (expRaw && new Date(expRaw).getTime() < Date.now()) {
              localStorage.removeItem('latierrita_guest_username');
              localStorage.removeItem('latierrita_guest_id');
              localStorage.removeItem('latierrita_guest_expires_at');
              localStorage.removeItem('latierrita_user');
              setUserProfile(null);
              setFirebaseUser(null);
              setIsGuest(false);
              setLoading(false);
              return;
            }
          }
          setIsGuest(isSavedGuest);
          setUserProfile(currentLocal as UserProfile);
          setFirebaseUser({
            id: currentLocal.id || 'user-me',
            email: currentLocal.email || 'usuario@latierrita.tech',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: currentLocal.createdAt || new Date().toISOString()
          } as User);
        } else {
          setUserProfile(null);
          setFirebaseUser(null);
          setIsGuest(false);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmailOrUsername = async (identifier: string, pass: string) => {
    const trimmed = identifier.trim();
    
    let emailToUse = trimmed;

    // If identifier is not an email, lookup by username in Supabase profiles table
    if (!trimmed.includes('@')) {
      const cleanUsername = trimmed.toLowerCase().replace('@', '');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (error || !profile) {
        const err = new Error('No se encontró ninguna cuenta con ese usuario.');
        (err as any).code = 'auth/username-not-found';
        throw err;
      }
      emailToUse = profile.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: pass
    });

    if (error) {
      throw error;
    }

    const user = data.user;
    if (user) {
      setFirebaseUser(user);
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile && user.email) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email.trim().toLowerCase())
          .maybeSingle();
        if (byEmail) profile = byEmail;
      }

      if (profile) {
        const mapped = mapDBProfileToUserProfile(profile);
        const isStaff = mapped.username === 'latierrita_app' || user.id === 'user-staff';
        if (!isStaff) {
          const savedFollowing = localStorage.getItem('latierrita_following');
          let fList: string[] = [];
          if (savedFollowing) {
            try {
              fList = JSON.parse(savedFollowing);
            } catch {
              fList = [];
            }
          }
          if (!fList.includes('user-staff')) {
            fList.push('user-staff');
            localStorage.setItem('latierrita_following', JSON.stringify(fList));
          }
          mapped.followingCount = Math.max(mapped.followingCount || 0, fList.length);
        }
        setUserProfile(mapped);
        localStorage.setItem('latierrita_user', JSON.stringify(mapped));
      } else {
        // Synthesize profile from metadata if profiles row was missing
        const meta = user.user_metadata || {};
        const cleanUsername = sanitizeHandle(meta.username || meta.user_name, user.email, user.id);
        const fullName = sanitizeDisplayName(
          meta.full_name || meta.name || `${meta.first_name || ''} ${meta.last_name || ''}`.trim(),
          cleanUsername,
          user.email
        );

        const newProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          username: cleanUsername,
          name: fullName,
          firstName: meta.first_name || '',
          lastName: meta.last_name || '',
          birthDate: meta.birth_date || '',
          age: meta.age || undefined,
          avatar: meta.avatar_url || DEFAULT_SILHOUETTE_AVATAR,
          bio: '🇨🇴 Orgullo colombiano viviendo en España 🇪🇸',
          website: '',
          city: (meta.city as any) || 'Madrid',
          originCity: meta.origin_city || 'Colombia',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isVerified: false,
          staffRole: 'Usuario',
          socialLinks: {}
        };

        const dbPayload = mapUserProfileToDBProfile(newProfile);
        try {
          await supabase.from('profiles').upsert([dbPayload]);
        } catch (e) {
          console.warn('Upsert note during login:', e);
        }
        setUserProfile(newProfile);
        localStorage.setItem('latierrita_user', JSON.stringify(newProfile));
      }
    }
  };

  const loginWithEmail = loginWithEmailOrUsername;

  const checkUsernameExists = async (rawUsername: string): Promise<boolean> => {
    const clean = rawUsername.replace('@', '').trim().toLowerCase();
    if (!clean) return false;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, is_deleted, retention_expires_at')
        .eq('username', clean)
        .maybeSingle();

      if (error || !profile) {
        return false;
      }

      if (profile.is_deleted) {
        if (profile.retention_expires_at) {
          const expiresTime = new Date(profile.retention_expires_at).getTime();
          if (Date.now() > expiresTime) {
            // Retention expired (+7 days), username is free
            return false;
          }
        }
        return true;
      }
      return true;
    } catch (err) {
      console.error('Error checking username existence in Supabase:', err);
      return false;
    }
  };

  const checkEmailExists = async (rawEmail: string): Promise<boolean> => {
    const clean = rawEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) return false;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, is_deleted, retention_expires_at')
        .ilike('email', clean)
        .maybeSingle();

      if (error || !profile) {
        return false;
      }

      if (profile.is_deleted) {
        if (profile.retention_expires_at) {
          const expiresTime = new Date(profile.retention_expires_at).getTime();
          if (Date.now() > expiresTime) {
            // Cuenta eliminada con retención vencida (+7 días), el correo puede reusarse
            return false;
          }
        }
        return true;
      }
      return true;
    } catch (err) {
      console.error('Error checking email existence in Supabase:', err);
      return false;
    }
  };

  const registerWithEmail = async (data: RegisterData) => {
    isRegisteringRef.current = true;
    try {
      const email = data.email.trim().toLowerCase();

      const cleanUsername = sanitizeHandle(data.username, email);
      const fullName = sanitizeDisplayName(
        data.name?.trim() || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        cleanUsername,
        email
      );

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password || '',
        options: {
          data: {
            full_name: fullName,
            name: fullName,
            username: cleanUsername,
            user_name: cleanUsername,
            first_name: data.firstName?.trim() || '',
            last_name: data.lastName?.trim() || '',
            birth_date: data.birthDate || '',
            age: data.age || null,
            city: data.city || 'Madrid',
            origin_city: data.originCity?.trim() || 'Colombia',
            avatar_url: data.avatar || DEFAULT_SILHOUETTE_AVATAR
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!authData.user) {
        throw new Error('No se pudo completar la autenticación.');
      }
      
      const user = authData.user;

      const newProfile: UserProfile = {
        id: user.id,
        email: data.email?.trim() || user.email || '',
        username: cleanUsername,
        name: fullName,
        firstName: data.firstName?.trim() || '',
        lastName: data.lastName?.trim() || '',
        birthDate: data.birthDate || '',
        age: data.age,
        avatar: data.avatar || DEFAULT_SILHOUETTE_AVATAR,
        bio: `🇨🇴 ¡Orgullo colombiano en España! 🇪🇸`,
        website: '',
        city: data.city || 'Madrid',
        originCity: data.originCity?.trim() || 'Colombia',
        followersCount: 0,
        followingCount: (cleanUsername === 'latierrita_app' || user.id === 'user-staff') ? 0 : 1,
        postsCount: 0,
        isVerified: false,
        staffRole: 'Usuario',
        createdAt: new Date().toISOString(),
        socialLinks: {}
      };

      // 1. Immediately activate local session so AppGate transitions immediately to the feed
      sessionStorage.removeItem('latierrita_startup_ad_closed');
      sessionStorage.setItem('latierrita_show_startup_ad_now', 'true');
      safeSetLocalStorage('latierrita_user', newProfile);
      saveUserToCommunityCache(newProfile);
      if (cleanUsername !== 'latierrita_app' && user.id !== 'user-staff') {
        localStorage.setItem('latierrita_following', JSON.stringify(['user-staff']));
      }
      setFirebaseUser(user);
      setUserProfile(newProfile);
      setLoading(false);

      // 2. If session is null on signup, attempt automatic login in background
      if (!authData.session && data.password) {
        try {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: email,
            password: data.password
          });
          if (signInData?.user) {
            setFirebaseUser(signInData.user);
          }
        } catch (signInErr) {
          console.warn('Auto sign-in attempt note:', signInErr);
        }
      }

      // 3. Upsert profile in Supabase profiles table
      const dbPayload = mapUserProfileToDBProfile(newProfile);
      try {
        const { error: insertErr } = await supabase.from('profiles').upsert([dbPayload]);
        if (insertErr) {
          console.warn('Profile upsert note:', insertErr);
        }
      } catch (insertEx) {
        console.warn('Profile upsert exception:', insertEx);
      }
    } finally {
      // Keep registration lock active for 3 seconds to guarantee onAuthStateChange doesn't wipe session
      setTimeout(() => {
        isRegisteringRef.current = false;
      }, 3000);
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const loginWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setFirebaseUser(null);
    setIsGuest(false);
    sessionStorage.removeItem('latierrita_guest');
    localStorage.removeItem('latierrita_user');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    try {
      sessionStorage.removeItem('latierrita_is_password_recovery');
    } catch {}
    setIsPasswordRecovery(false);
    if (window.location.hash.includes('type=recovery') || window.location.pathname.includes('reset-password')) {
      window.history.replaceState(null, '', '/');
    }
  };

  const continueAsGuest = () => {
    try {
      // Clear active Supabase session to prevent automatic login on page reload
      supabase.auth.signOut().catch(() => {});

      let guestUsername = localStorage.getItem('latierrita_guest_username');
      let guestId = localStorage.getItem('latierrita_guest_id');
      let expiresAtRaw = localStorage.getItem('latierrita_guest_expires_at');

      const isExpired = expiresAtRaw ? new Date(expiresAtRaw).getTime() < Date.now() : true;

      if (!guestUsername || !guestId || isExpired) {
        // Generate new guest credentials: User-000000 (6 random digits)
        const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
        guestUsername = `User-${randomNum}`;
        guestId = `guest-${randomNum}`;
        const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

        localStorage.setItem('latierrita_guest_username', guestUsername);
        localStorage.setItem('latierrita_guest_id', guestId);
        localStorage.setItem('latierrita_guest_expires_at', expiresAt);
      }

      const finalExpiresAt = localStorage.getItem('latierrita_guest_expires_at') || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      const guestProfile: UserProfile = {
        id: guestId,
        email: `${guestUsername.toLowerCase()}@invitado.latierrita.tech`,
        username: guestUsername,
        name: `Invitado (${guestUsername})`,
        avatar: DEFAULT_SILHOUETTE_AVATAR,
        bio: "Usuario invitado de La Tierrita App.\nComunidad de Colombianos en España.",
        website: '',
        city: 'Sin asignar',
        originCity: 'Colombia',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isVerified: false,
        staffRole: 'Usuario',
        isGuest: true,
        guestExpiresAt: finalExpiresAt,
        socialLinks: {}
      };

      // Critical: Guests do not follow any accounts and have an empty chat inbox
      localStorage.removeItem('latierrita_chat_rooms');
      safeSetLocalStorage('latierrita_following', []);
      safeSetLocalStorage('latierrita_user', guestProfile);
      setUserProfile(guestProfile);
      
      const synthUser = {
        id: guestId,
        email: `${guestUsername.toLowerCase()}@invitado.latierrita.tech`,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as any;
      
      setFirebaseUser(synthUser);
      setIsGuest(true);
    } catch (e) {
      console.error('Error entering as guest:', e);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (isGuest || userProfile?.isGuest || userProfile?.id?.startsWith('guest-')) {
      console.warn('Invitados no pueden actualizar su perfil.');
      return;
    }
    let updatedProfile: UserProfile | null = null;
    
    // Get actual session user if available
    const { data: authUserRes } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const sessionUser = authUserRes?.user || firebaseUser;
    const realId = sessionUser?.id || userProfile?.id || 'user-me';
    const realEmail = sessionUser?.email || userProfile?.email || '';

    setUserProfile(prev => {
      let base = prev;
      if (!base) {
        const saved = localStorage.getItem('latierrita_user');
        if (saved) {
          try {
            base = JSON.parse(saved);
          } catch (e) {
            base = null;
          }
        }
      }
      if (!base) {
        base = {
          id: realId,
          email: realEmail,
          username: 'usuario',
          name: 'Usuario',
          avatar: DEFAULT_SILHOUETTE_AVATAR,
          bio: '🇨🇴 Orgullo colombiano viviendo en España 🇪🇸',
          website: '',
          city: 'Madrid',
          originCity: 'Colombia',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          isVerified: false,
          staffRole: 'Usuario',
          socialLinks: {}
        };
      }
      const merged: UserProfile = {
        ...base,
        ...data,
        id: realId,
        email: realEmail || base.email,
        socialLinks: {
          ...(base.socialLinks || {}),
          ...(data.socialLinks || {})
        }
      };
      updatedProfile = merged;
      saveUserToCommunityCache(merged);
      safeSetLocalStorage('latierrita_user', merged);
      return merged;
    });

    try {
      if (sessionUser && sessionUser.id) {
        const dbPayload = buildDBProfileUpdatePayload(data);
        if (Object.keys(dbPayload).length > 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update(dbPayload)
            .eq('id', sessionUser.id);

          if (updateError) {
            console.warn('Supabase profile update note, attempting core fields fallback:', updateError.message);
            const coreFields = ['name', 'username', 'bio', 'city', 'origin_city', 'avatar_url', 'age', 'birth_date', 'first_name', 'last_name', 'instagram', 'facebook'];
            const fallbackPayload: Record<string, any> = {};
            coreFields.forEach(field => {
              if (dbPayload[field] !== undefined) fallbackPayload[field] = dbPayload[field];
            });
            if (Object.keys(fallbackPayload).length > 0) {
              await supabase
                .from('profiles')
                .update(fallbackPayload)
                .eq('id', sessionUser.id);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase profile sync error:', err);
    }
  };

  const deleteAccount = async (reason: string = 'Solicitud de eliminación voluntaria del usuario') => {
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days retention

    const sessionData = await supabase.auth.getSession();
    const user = sessionData.data.session?.user;

    if (user) {
      const deletedData: Partial<UserProfile> = {
        isDeleted: true,
        deletedAt: now.toISOString(),
        retentionExpiresAt: expires.toISOString(),
        deletedReason: reason
      };

      try {
        const dbPayload = mapUserProfileToDBProfile(deletedData);
        await supabase
          .from('profiles')
          .update(dbPayload)
          .eq('id', user.id);
      } catch (err) {
        console.error('Failed to update user profile in Supabase:', err);
      }

      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Failed to sign out user:', err);
      }
    }

    setUserProfile(null);
    setFirebaseUser(null);
    setIsGuest(false);
    sessionStorage.removeItem('latierrita_guest');
    localStorage.removeItem('latierrita_user');
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        isGuest,
        loginWithEmail,
        loginWithEmailOrUsername,
        registerWithEmail,
        checkUsernameExists,
        checkEmailExists,
        loginWithGoogle,
        loginWithApple,
        logout,
        resetPassword,
        updatePassword,
        isPasswordRecovery,
        setIsPasswordRecovery,
        continueAsGuest,
        updateUserProfile,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

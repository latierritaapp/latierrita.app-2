import React, { createContext, useContext, useState, useEffect } from 'react';
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
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

// Mapeador de base de datos Postgres (snake_case) a React State (camelCase)
export const mapDBProfileToUserProfile = (db: any): UserProfile => {
  const isOfficialEmail = db.email === 'latierritaapp@gmail.com';
  const cleanUsername = isOfficialEmail ? 'latierrita_app' : sanitizeHandle(db.username, db.email, db.id);
  const displayName = isOfficialEmail && (!db.name || db.name.includes('@')) 
    ? 'La Tierrita 🇨🇴' 
    : sanitizeDisplayName(db.name, cleanUsername, db.email);

  const isStaff = isOfficialEmail || cleanUsername === 'latierrita_app' || cleanUsername === 'latierrita_oficial';

  return {
    id: db.id,
    email: db.email,
    username: cleanUsername,
    name: displayName,
    firstName: db.first_name || '',
    lastName: db.last_name || '',
    birthDate: db.birth_date || '',
    age: db.age || undefined,
    avatar: db.avatar_url || (isStaff ? 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=80' : DEFAULT_SILHOUETTE_AVATAR),
    bio: db.bio || (isStaff ? '⭐ Cuenta oficial de Staff & Publicidad de La Tierrita España. Conectando a los colombianos.' : '🇨🇴 ¡Orgullo colombiano en España! 🇪🇸'),
    website: db.website || (isStaff ? 'https://latierrita.es' : ''),
    city: db.city || 'Madrid',
    originCity: db.origin_city || (isStaff ? 'Toda Colombia' : 'Colombia'),
    followersCount: Array.isArray(db.followers) ? db.followers.length : (isStaff ? 15420 : 0),
    followingCount: Array.isArray(db.following) ? db.following.length : (isStaff ? 12 : 1),
    postsCount: 0,
    isVerified: isStaff ? true : (db.verified || false),
    staffRole: isStaff ? 'ADMIN' : (db.staff_role || 'Usuario'),
    isDeleted: db.is_deleted || false,
    deletedAt: db.deleted_at || undefined,
    retentionExpiresAt: db.retention_expires_at || undefined,
    deletedReason: db.deleted_reason || '',
    createdAt: db.created_at || new Date().toISOString(),
    socialLinks: {
      instagram: db.instagram || '',
      facebook: db.facebook || '',
      tiktok: db.tiktok || '',
      x: db.x || ''
    }
  };
};

// Generador de payload exclusivo para UPDATE (no sobreescribe email, id, created_at ni arrays)
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
  }
  if (data.avatar !== undefined && data.avatar.trim() !== '') {
    payload.avatar_url = data.avatar;
  }
  if (data.age !== undefined) {
    const parsedAge = Number(data.age);
    payload.age = isNaN(parsedAge) ? null : parsedAge;
  }
  if (data.birthDate !== undefined) {
    payload.birth_date = data.birthDate;
  }
  if (data.firstName !== undefined) {
    payload.first_name = data.firstName.trim();
  }
  if (data.lastName !== undefined) {
    payload.last_name = data.lastName.trim();
  }
  if (data.isVerified !== undefined) {
    payload.verified = data.isVerified;
  }
  if (data.staffRole !== undefined) {
    payload.staff_role = data.staffRole;
    payload.is_staff = data.staffRole !== 'Usuario';
  }
  if (data.socialLinks) {
    if (data.socialLinks.instagram !== undefined) payload.instagram = data.socialLinks.instagram.trim();
    if (data.socialLinks.facebook !== undefined) payload.facebook = data.socialLinks.facebook.trim();
    if (data.socialLinks.tiktok !== undefined) payload.tiktok = data.socialLinks.tiktok.trim();
    if (data.socialLinks.x !== undefined) payload.x = data.socialLinks.x.trim();
  }

  return payload;
};

// Mapeador de React State (camelCase) a base de datos Postgres (snake_case)
const mapUserProfileToDBProfile = (profile: Partial<UserProfile>): any => {
  const cleanUsername = sanitizeHandle(profile.username, profile.email, profile.id);
  const displayName = sanitizeDisplayName(profile.name, cleanUsername, profile.email);

  const db: any = {
    id: profile.id,
    email: profile.email || '',
    username: cleanUsername,
    name: displayName,
    first_name: profile.firstName || null,
    last_name: profile.lastName || null,
    birth_date: profile.birthDate || null,
    age: profile.age || null,
    avatar_url: profile.avatar || DEFAULT_SILHOUETTE_AVATAR,
    bio: profile.bio || '🇨🇴 ¡Orgullo colombiano en España! 🇪🇸',
    website: profile.website || null,
    city: profile.city || 'Madrid',
    origin_city: profile.originCity || 'Colombia',
    verified: profile.isVerified || false,
    is_staff: profile.staffRole && profile.staffRole !== 'Usuario' ? true : false,
    staff_role: profile.staffRole || 'Usuario',
    followers: [],
    following: [],
    is_deleted: profile.isDeleted || false,
    deleted_at: profile.deletedAt || null,
    retention_expires_at: profile.retentionExpiresAt || null,
    deleted_reason: profile.deletedReason || null,
    created_at: profile.createdAt || new Date().toISOString()
  };

  if (profile.socialLinks) {
    if (profile.socialLinks.instagram !== undefined) db.instagram = profile.socialLinks.instagram;
    if (profile.socialLinks.facebook !== undefined) db.facebook = profile.socialLinks.facebook;
    if (profile.socialLinks.tiktok !== undefined) db.tiktok = profile.socialLinks.tiktok;
    if (profile.socialLinks.x !== undefined) db.x = profile.socialLinks.x;
  }
  return db;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('latierrita_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Clear any existing stale guest session
  useEffect(() => {
    sessionStorage.removeItem('latierrita_guest');
  }, []);

  // Listen to Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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

            // Ensure existing accounts follow @latierrita_app
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

            const merged: UserProfile = {
              ...mapped,
              id: user.id,
              name: (localProfile.name && localProfile.name !== 'Colombiano en España' && localProfile.name !== 'Usuario') ? localProfile.name : (mapped.name || localProfile.name || 'Usuario'),
              username: localProfile.username || mapped.username,
              bio: localProfile.bio !== undefined ? localProfile.bio : mapped.bio,
              website: localProfile.website !== undefined ? localProfile.website : (mapped.website || ''),
              avatar: (localProfile.avatar && localProfile.avatar !== DEFAULT_SILHOUETTE_AVATAR) ? localProfile.avatar : (mapped.avatar || DEFAULT_SILHOUETTE_AVATAR),
              age: localProfile.age !== undefined ? localProfile.age : mapped.age,
              city: localProfile.city || mapped.city,
              originCity: localProfile.originCity || mapped.originCity,
              followingCount: mapped.followingCount || (isStaff ? 0 : 1),
              socialLinks: {
                ...(mapped.socialLinks || {}),
                ...(localProfile.socialLinks || {})
              }
            };
            setUserProfile(merged);
            localStorage.setItem('latierrita_user', JSON.stringify(merged));
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
            setUserProfile(newProfile);
            localStorage.setItem('latierrita_user', JSON.stringify(newProfile));
            if (cleanUsername !== 'latierrita_app' && user.id !== 'user-staff') {
              const currentFollowing = localStorage.getItem('latierrita_following');
              if (!currentFollowing) {
                localStorage.setItem('latierrita_following', JSON.stringify(['user-staff']));
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
        // When not authenticated with Supabase session, check if there is a local session (e.g. preview)
        if (localProfile && (localProfile.id || localProfile.username)) {
          setUserProfile(localProfile as UserProfile);
          setFirebaseUser({
            id: localProfile.id || 'user-me',
            email: localProfile.email || 'usuario@latierrita.tech',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: localProfile.createdAt || new Date().toISOString()
          } as User);
        } else {
          setUserProfile(null);
          setFirebaseUser(null);
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

  const registerWithEmail = async (data: RegisterData) => {
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

    // If session is null on signup, attempt automatic login
    if (!authData.session && data.password) {
      try {
        await supabase.auth.signInWithPassword({
          email: email,
          password: data.password
        });
      } catch (signInErr) {
        console.warn('Auto sign-in attempt note:', signInErr);
      }
    }

    const dbPayload = mapUserProfileToDBProfile(newProfile);
    try {
      const { error: insertErr } = await supabase.from('profiles').upsert([dbPayload]);
      if (insertErr) {
        console.warn('Profile upsert note:', insertErr);
      }
    } catch (insertEx) {
      console.warn('Profile upsert exception:', insertEx);
    }

    setUserProfile(newProfile);
    localStorage.setItem('latierrita_user', JSON.stringify(newProfile));
    if (cleanUsername !== 'latierrita_app' && user.id !== 'user-staff') {
      localStorage.setItem('latierrita_following', JSON.stringify(['user-staff']));
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

  const continueAsGuest = () => {
    // Modo invitado eliminado para obligar registro obligatorio
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
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
      localStorage.setItem('latierrita_user', JSON.stringify(merged));
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
        loginWithGoogle,
        loginWithApple,
        logout,
        resetPassword,
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

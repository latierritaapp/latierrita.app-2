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

// Mapeador de base de datos Postgres (snake_case) a React State (camelCase)
const mapDBProfileToUserProfile = (db: any): UserProfile => {
  return {
    id: db.id,
    email: db.email,
    username: db.username,
    name: db.name,
    firstName: db.first_name || '',
    lastName: db.last_name || '',
    birthDate: db.birth_date || '',
    age: db.age || undefined,
    avatar: db.avatar_url || DEFAULT_SILHOUETTE_AVATAR,
    bio: db.bio || '',
    city: db.city || 'Madrid',
    originCity: db.origin_city || 'Colombia',
    followersCount: db.followers ? db.followers.length : 0,
    followingCount: db.following ? db.following.length : 0,
    postsCount: 0,
    isVerified: db.verified || false,
    staffRole: db.staff_role || 'Usuario',
    isDeleted: db.is_deleted || false,
    deletedAt: db.deleted_at || undefined,
    retentionExpiresAt: db.retention_expires_at || undefined,
    deletedReason: db.deleted_reason || '',
    createdAt: db.created_at || new Date().toISOString(),
    socialLinks: {
      instagram: db.instagram || '',
      facebook: db.facebook || '',
    }
  };
};

// Mapeador de React State (camelCase) a base de datos Postgres (snake_case)
const mapUserProfileToDBProfile = (profile: Partial<UserProfile>): any => {
  const db: any = {};
  if (profile.id !== undefined) db.id = profile.id;
  if (profile.email !== undefined) db.email = profile.email;
  if (profile.username !== undefined) db.username = profile.username;
  if (profile.name !== undefined) db.name = profile.name;
  if (profile.firstName !== undefined) db.first_name = profile.firstName;
  if (profile.lastName !== undefined) db.last_name = profile.lastName;
  if (profile.birthDate !== undefined) db.birth_date = profile.birthDate;
  if (profile.age !== undefined) db.age = profile.age;
  if (profile.avatar !== undefined) db.avatar_url = profile.avatar;
  if (profile.bio !== undefined) db.bio = profile.bio;
  if (profile.city !== undefined) db.city = profile.city;
  if (profile.originCity !== undefined) db.origin_city = profile.originCity;
  if (profile.isVerified !== undefined) db.verified = profile.isVerified;
  if (profile.staffRole !== undefined) db.staff_role = profile.staffRole;
  if (profile.isDeleted !== undefined) db.is_deleted = profile.isDeleted;
  if (profile.deletedAt !== undefined) db.deleted_at = profile.deletedAt;
  if (profile.retentionExpiresAt !== undefined) db.retention_expires_at = profile.retentionExpiresAt;
  if (profile.deletedReason !== undefined) db.deleted_reason = profile.deletedReason;
  if (profile.createdAt !== undefined) db.created_at = profile.createdAt;
  
  if (profile.socialLinks) {
    if (profile.socialLinks.instagram !== undefined) db.instagram = profile.socialLinks.instagram;
    if (profile.socialLinks.facebook !== undefined) db.facebook = profile.socialLinks.facebook;
  }
  return db;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
      
      if (user) {
        const email = user.email?.toLowerCase().trim() || '';
        if (email === 'diegof_024@hotmail.com' || email === 'latierritaapp@gmail.com') {
          console.warn('⚠️ Cuenta bloqueada:', email);
          await supabase.auth.signOut();
          setFirebaseUser(null);
          setUserProfile(null);
          localStorage.removeItem('latierrita_user');
          setLoading(false);
          return;
        }
        
        setFirebaseUser(user);
        setIsGuest(false);
        sessionStorage.removeItem('latierrita_guest');
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            const mapped = mapDBProfileToUserProfile(profile);
            setUserProfile(mapped);
            localStorage.setItem('latierrita_user', JSON.stringify(mapped));
          } else {
            // New user from OAuth or first login - create a profile
            const fallbackUsername = user.email 
              ? user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') 
              : `parcero_${user.id.slice(0, 5)}`;
            
            const newProfile: UserProfile = {
              id: user.id,
              email: user.email || '',
              username: fallbackUsername,
              name: user.user_metadata?.full_name || 'Colombiano en España',
              avatar: user.user_metadata?.avatar_url || DEFAULT_SILHOUETTE_AVATAR,
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

            const dbPayload = mapUserProfileToDBProfile(newProfile);
            await supabase.from('profiles').insert([dbPayload]);
            setUserProfile(newProfile);
            localStorage.setItem('latierrita_user', JSON.stringify(newProfile));
          }
        } catch (error) {
          console.error('Error fetching user profile from Supabase:', error);
          // Fallback to local profile if available
          const saved = localStorage.getItem('latierrita_user');
          if (saved) {
            setUserProfile(JSON.parse(saved));
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmailOrUsername = async (identifier: string, pass: string) => {
    const trimmed = identifier.trim();
    const normalized = trimmed.toLowerCase();
    
    // Lista negra estricta
    if (normalized === 'diegof_024@hotmail.com' || normalized === 'latierritaapp@gmail.com' || normalized === 'diegof_024' || normalized === 'latierritaapp') {
      const err = new Error('Esta cuenta ha sido inhabilitada permanentemente por la administración.');
      (err as any).code = 'auth/user-disabled';
      throw err;
    }
    
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        const mapped = mapDBProfileToUserProfile(profile);
        setUserProfile(mapped);
        localStorage.setItem('latierrita_user', JSON.stringify(mapped));
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
    
    // Lista negra estricta
    if (email === 'diegof_024@hotmail.com' || email === 'latierritaapp@gmail.com') {
      const err = new Error('No es posible registrar esta cuenta de correo electrónico.');
      (err as any).code = 'auth/invalid-email';
      throw err;
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password || '',
      options: {
        data: {
          full_name: data.name?.trim() || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Colombiano en España',
          avatar_url: data.avatar || undefined
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
    const fullName = data.name?.trim() || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Colombiano en España';
    const cleanUsername = data.username.replace('@', '').trim().toLowerCase();

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
      followingCount: 0,
      postsCount: 0,
      isVerified: false,
      staffRole: 'Usuario',
      createdAt: new Date().toISOString(),
      socialLinks: {}
    };

    const dbPayload = mapUserProfileToDBProfile(newProfile);
    const { error: insertErr } = await supabase.from('profiles').insert([dbPayload]);
    
    if (insertErr) {
      throw insertErr;
    }

    setUserProfile(newProfile);
    localStorage.setItem('latierrita_user', JSON.stringify(newProfile));
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
    if (!userProfile) return;
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);
    localStorage.setItem('latierrita_user', JSON.stringify(updated));

    const sessionData = await supabase.auth.getSession();
    const user = sessionData.data.session?.user;
    if (user) {
      try {
        const dbPayload = mapUserProfileToDBProfile(data);
        const { error } = await supabase
          .from('profiles')
          .update(dbPayload)
          .eq('id', user.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update profile in Supabase:', err);
      }
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

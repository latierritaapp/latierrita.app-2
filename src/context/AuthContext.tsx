import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, googleProvider, appleProvider, db } from '../lib/firebase';
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
  firebaseUser: User | null;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return sessionStorage.getItem('latierrita_guest') === 'true';
  });

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsGuest(false);
        sessionStorage.removeItem('latierrita_guest');
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            setUserProfile(data);
            localStorage.setItem('latierrita_user', JSON.stringify(data));
          } else {
            // New user from OAuth or first login
            const fallbackUsername = user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') : `parcero_${user.uid.slice(0, 5)}`;
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              username: fallbackUsername,
              name: user.displayName || 'Colombiano en España',
              avatar: user.photoURL || DEFAULT_SILHOUETTE_AVATAR,
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
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            localStorage.setItem('latierrita_user', JSON.stringify(newProfile));
          }
        } catch (error) {
          console.error('Error fetching user profile from Firestore:', error);
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

    return () => unsubscribe();
  }, []);

  const loginWithEmailOrUsername = async (identifier: string, pass: string) => {
    const trimmed = identifier.trim();
    let emailToUse = trimmed;

    // If identifier is not an email, lookup by username in Firestore
    if (!trimmed.includes('@')) {
      const cleanUsername = trimmed.toLowerCase().replace('@', '');
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', cleanUsername), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          const err = new Error('No se encontró ninguna cuenta con ese usuario.');
          (err as unknown as { code: string }).code = 'auth/username-not-found';
          throw err;
        }
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        if (!userData.email) {
          const err = new Error('No se encontró un correo asociado a este usuario.');
          (err as unknown as { code: string }).code = 'auth/user-not-found';
          throw err;
        }
        emailToUse = userData.email;
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === 'auth/username-not-found' || (err as { code?: string })?.code === 'auth/user-not-found') {
          throw err;
        }
        // If Firestore query fails, fallback or rethrow
        throw err;
      }
    }

    const cred = await signInWithEmailAndPassword(auth, emailToUse, pass);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      setUserProfile(data);
      localStorage.setItem('latierrita_user', JSON.stringify(data));
    }
  };

  const loginWithEmail = loginWithEmailOrUsername;

  const checkUsernameExists = async (rawUsername: string): Promise<boolean> => {
    const clean = rawUsername.replace('@', '').trim().toLowerCase();
    if (!clean) return false;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', clean), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return false;
      }
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserProfile;
      // If account is marked as deleted, check if 7-day retention period is active
      if (userData.isDeleted) {
        if (userData.retentionExpiresAt) {
          const expiresTime = new Date(userData.retentionExpiresAt).getTime();
          if (Date.now() > expiresTime) {
            // Retention has expired (+7 days), username is freed
            return false;
          }
        }
        // Within 7 days retention: username is still reserved for recovery
        return true;
      }
      return true;
    } catch (err) {
      console.error('Error checking username existence in Firestore:', err);
      return false;
    }
  };

  const registerWithEmail = async (data: RegisterData) => {
    let currentUser = auth.currentUser;

    if (!currentUser && data.password) {
      const cred = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
      currentUser = cred.user;
    }

    if (!currentUser) {
      throw new Error('No se pudo completar la autenticación.');
    }
    
    const fullName = data.name?.trim() || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Colombiano en España';

    // Update Firebase Auth displayName and photoURL
    await updateFirebaseProfile(currentUser, {
      displayName: fullName,
      photoURL: data.avatar || undefined
    });

    const cleanUsername = data.username.replace('@', '').trim().toLowerCase();

    const newProfile: UserProfile = {
      id: currentUser.uid,
      email: data.email?.trim() || currentUser.email || '',
      username: cleanUsername,
      name: fullName,
      firstName: data.firstName?.trim() || '',
      lastName: data.lastName?.trim() || '',
      birthDate: data.birthDate || '',
      age: data.age,
      avatar: data.avatar || currentUser.photoURL || DEFAULT_SILHOUETTE_AVATAR,
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

    // Save profile to Firestore
    await setDoc(doc(db, 'users', currentUser.uid), newProfile);
    setUserProfile(newProfile);
    localStorage.setItem('latierrita_user', JSON.stringify(newProfile));
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithApple = async () => {
    await signInWithPopup(auth, appleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
    setIsGuest(false);
    sessionStorage.removeItem('latierrita_guest');
    localStorage.removeItem('latierrita_user');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    sessionStorage.setItem('latierrita_guest', 'true');
    // Assign demo user profile
    setUserProfile(INITIAL_CURRENT_USER);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);
    localStorage.setItem('latierrita_user', JSON.stringify(updated));

    if (firebaseUser) {
      try {
        const ref = doc(db, 'users', firebaseUser.uid);
        await setDoc(ref, data, { merge: true });
      } catch (err) {
        console.error('Failed to update profile in Firestore:', err);
      }
    }
  };

  const deleteAccount = async (reason: string = 'Solicitud de eliminación voluntaria del usuario') => {
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days retention

    if (firebaseUser) {
      const deletedData: Partial<UserProfile> = {
        isDeleted: true,
        deletedAt: now.toISOString(),
        retentionExpiresAt: expires.toISOString(),
        deletedReason: reason
      };

      try {
        // 1. Mark user profile in Firestore as deleted with 7-day retention (username remains reserved)
        const ref = doc(db, 'users', firebaseUser.uid);
        await setDoc(ref, deletedData, { merge: true });
      } catch (err) {
        console.error('Failed to update user profile in Firestore:', err);
      }

      // 2. Record in deleted_accounts for Staff Admin management
      try {
        const deletedRef = doc(db, 'deleted_accounts', firebaseUser.uid);
        await setDoc(deletedRef, {
          id: `del-${firebaseUser.uid}`,
          userId: firebaseUser.uid,
          username: userProfile?.username || 'usuario',
          name: userProfile?.name || 'Usuario',
          avatar: userProfile?.avatar || DEFAULT_SILHOUETTE_AVATAR,
          email: userProfile?.email || firebaseUser.email || '',
          deletedAt: now.toISOString(),
          retentionExpiresAt: expires.toISOString(),
          reason: reason,
          canRestore: true,
          profileData: userProfile || undefined
        });
      } catch (err) {
        console.error('Failed to record deleted account in Firestore:', err);
      }

      try {
        await signOut(auth);
      } catch (err) {
        console.error('Failed to sign out user:', err);
      }
    }

    // 3. Clear local state and cache
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

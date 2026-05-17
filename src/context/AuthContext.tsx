import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type User,
  type ConfirmationResult,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface Profile {
  id: string;
  name: string | null;
  bio: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  goals: string[] | null;
  avatar_url: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Store confirmation result for OTP
let confirmationResult: ConfirmationResult | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileReady, setProfileReady] = useState(false);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'profiles', uid));
      if (snap.exists()) {
        setProfile({ id: uid, ...snap.data() } as Profile);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error('fetchProfile error:', e);
      setProfile(null);
    } finally {
      setProfileReady(true);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.uid);
  }, [user, fetchProfile]);

  // Create default profile + streak for new users
  const ensureProfile = useCallback(async (u: User) => {
    const ref = doc(db, 'profiles', u.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const now = new Date().toISOString();
      await setDoc(ref, {
        name: u.displayName ?? 'Wellness Explorer',
        bio: 'Wellness Explorer',
        age: null, height: null, weight: null,
        goals: ['Calm Mind'],
        avatar_url: u.photoURL ?? null,
        emergency_contact_phone: null,
        emergency_contact_relation: null,
        created_at: now,
        updated_at: now,
      });
      // default streak
      await setDoc(doc(db, 'streaks', u.uid), {
        current_streak: 0, longest_streak: 0,
        last_checkin_date: null,
        created_at: now, updated_at: now,
      });
      // default reminders
      const reminders = [
        { title: 'Drink Water', time: '09:00 AM', enabled: true },
        { title: 'Stretch Break', time: '12:30 PM', enabled: true },
        { title: 'Meditation', time: '06:00 PM', enabled: false },
        { title: 'Read a Book', time: '09:00 PM', enabled: true },
      ];
      for (const r of reminders) {
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'reminders'), { user_id: u.uid, ...r, created_at: now });
      }
    }
  }, []);

  useEffect(() => {
    const profileFetchedRef = { current: false };

    const timeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) { setProfileReady(true); return false; }
        return prev;
      });
    }, 10000);

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        if (!profileFetchedRef.current) {
          profileFetchedRef.current = true;
          await ensureProfile(u);
          await fetchProfile(u.uid);
        } else {
          setProfileReady(true);
        }
      } else {
        profileFetchedRef.current = false;
        setProfile(null);
        setProfileReady(true);
      }
      setLoading(false);
      clearTimeout(timeout);
    });

    return () => { unsub(); clearTimeout(timeout); };
  }, [fetchProfile, ensureProfile]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithPhone = async (phone: string): Promise<{ error: string | null }> => {
    try {
      // Setup invisible recaptcha
      if (!(window as unknown as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier) {
        (window as unknown as { recaptchaVerifier: RecaptchaVerifier }).recaptchaVerifier =
          new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const verifier = (window as unknown as { recaptchaVerifier: RecaptchaVerifier }).recaptchaVerifier;
      confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  };

  const verifyOtp = async (token: string): Promise<{ error: string | null }> => {
    try {
      if (!confirmationResult) return { error: 'No OTP request found. Please try again.' };
      await confirmationResult.confirm(token);
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('jeevalife_last_view');
    Object.keys(localStorage)
      .filter(k => k.startsWith('onboarding_done_') || k.startsWith('lastCheckinDate_'))
      .forEach(k => localStorage.removeItem(k));
    setProfile(null);
    setUser(null);
    setProfileReady(false);
  };

  const updateProfile = async (
    updates: Partial<Omit<Profile, 'id' | 'created_at'>>
  ): Promise<{ error: string | null }> => {
    if (!user) return { error: 'Not authenticated' };
    try {
      const ref = doc(db, 'profiles', user.uid);
      await updateDoc(ref, { ...updates, updated_at: new Date().toISOString() });
      await fetchProfile(user.uid);
      return { error: null };
    } catch (e: unknown) {
      return { error: (e as Error).message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, profileReady,
      signInWithGoogle, signInWithPhone, verifyOtp,
      signOut, updateProfile, refreshProfile,
    }}>
      {children}
      {/* Invisible recaptcha container for phone auth */}
      <div id="recaptcha-container" />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

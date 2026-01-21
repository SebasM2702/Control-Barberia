import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

type UserProfile = {
  businessId?: string;
  role?: string;
  name?: string;
  [key: string]: any;
};

const STORAGE_KEYS = {
  uid: '@cb:uid',
  businessId: '@cb:businessId',
  role: '@cb:role',
  name: '@cb:name',
};

export async function signIn(email: string, password: string): Promise<{ uid: string; profile: UserProfile }> {
  // Sign in with Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // Load profile from Firestore
  const profile = await loadUserProfile(uid);
  if (!profile) {
    // If profile doesn't exist, force sign out and throw
    await firebaseSignOut(auth);
    const err: any = new Error('Perfil de usuario no encontrado. Contacta al administrador.');
    err.code = 'PROFILE_NOT_FOUND';
    throw err;
  }

  // Save session locally (including name for display)
  await saveSession(uid, profile.businessId || '', profile.role || '', profile.name || '');

  return { uid, profile };
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('firebase signOut failed', e);
  }
  await clearSession();
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.warn(`[auth] User profile not found for UID: ${uid}`);
      return null;
    }
    const rawData = snap.data();
    // Normalize data: trim all keys and string values to handle invisible spaces (like "businessId ")
    const data: any = {};
    Object.keys(rawData).forEach(key => {
      const val = rawData[key];
      data[key.trim()] = (typeof val === 'string') ? val.trim() : val;
    });
    return {
      ...data,
      businessId: data.businessId,
    } as UserProfile;
  } catch (e) {
    console.error('[auth] loadUserProfile error', e);
    return null;
  }
}

export async function saveSession(uid: string, businessId: string, role: string, name?: string): Promise<void> {
  try {
    const items: [string, string][] = [
      [STORAGE_KEYS.uid, uid],
      [STORAGE_KEYS.businessId, businessId],
      [STORAGE_KEYS.role, role],
    ];
    if (name !== undefined) items.push([STORAGE_KEYS.name, name]);
    await AsyncStorage.multiSet(items);
  } catch (e) {
    console.error('saveSession error', e);
  }
}

export async function getStoredSession(): Promise<{ uid?: string; businessId?: string; role?: string; name?: string }> {
  try {
    const values = await AsyncStorage.multiGet([
      STORAGE_KEYS.uid,
      STORAGE_KEYS.businessId,
      STORAGE_KEYS.role,
      STORAGE_KEYS.name,
    ]);
    const result: any = {};
    values.forEach(([k, v]) => {
      if (k === STORAGE_KEYS.uid) result.uid = v || undefined;
      if (k === STORAGE_KEYS.businessId) result.businessId = v || undefined;
      if (k === STORAGE_KEYS.role) result.role = v || undefined;
      if (k === STORAGE_KEYS.name) result.name = v || undefined;
    });
    return result;
  } catch (e) {
    console.error('getStoredSession error', e);
    return {};
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEYS.uid, STORAGE_KEYS.businessId, STORAGE_KEYS.role, STORAGE_KEYS.name]);
  } catch (e) {
    console.error('clearSession error', e);
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

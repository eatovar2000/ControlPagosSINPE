/**
 * Firebase configuration for Expo (Web + Native)
 * Uses environment variables for configuration
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { Platform } from 'react-native';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

/**
 * Sign in with Google (Web only for now)
 */
export async function signInWithGoogle() {
  if (Platform.OS !== 'web') {
    throw new Error('Google Sign-In on native requires additional setup');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

/**
 * Set up reCAPTCHA verifier for phone authentication (Web)
 */
let recaptchaVerifier = null;

export function setupRecaptcha(containerId = 'recaptcha-container') {
  if (Platform.OS !== 'web') {
    return null;
  }

  // Clear existing verifier
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    },
  });

  return recaptchaVerifier;
}

/**
 * Send SMS verification code
 */
export async function sendPhoneVerification(phoneNumber) {
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA not initialized. Call setupRecaptcha first.');
  }

  try {
    // Ensure phone number has country code
    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+506${phoneNumber}`; // Costa Rica default

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      recaptchaVerifier
    );

    return confirmationResult;
  } catch (error) {
    console.error('Phone verification error:', error);
    // Reset reCAPTCHA on error
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    throw error;
  }
}

/**
 * Verify SMS code and complete sign in
 */
export async function verifyPhoneCode(confirmationResult, code) {
  try {
    const result = await confirmationResult.confirm(code);
    return result.user;
  } catch (error) {
    console.error('Code verification error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get current user's ID token for API calls
 */
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  return user.getIdToken();
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}

export { auth, app };

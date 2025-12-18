import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { env } from './env';

// Firebase configuration using validated environment variables
const getFirebaseConfig = () => {
  // Validate API key
  if (!env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY.length < 20) {
    const errorMsg = 'Firebase API Key is missing or invalid. Please check your .env file.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set error handler for auth
auth.onAuthStateChanged(
  (user) => {
    if (user) {
      console.log('Firebase user authenticated:', user.uid);
    }
  },
  (error: any) => {
    console.error('Firebase Auth error:', error);
    if (error?.code === 'auth/api-key-not-valid') {
      console.error('❌ API Key Error - Please check:');
      console.error('1. Verify API key in Firebase Console → Project Settings');
      console.error('2. Check API key restrictions in Google Cloud Console');
      console.error('3. Ensure localhost:* is allowed in HTTP referrers');
      console.error('4. Verify .env file has correct VITE_FIREBASE_API_KEY');
      console.error('5. Restart dev server after changing .env file');
      console.error('6. See API_KEY_TROUBLESHOOTING.md for detailed help');
    }
  }
);

// Verify Firebase initialization
console.log('✅ Firebase initialized successfully:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyPrefix: firebaseConfig.apiKey.substring(0, 10) + '...',
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server',
});

// Initialize Analytics (optional, only in browser)
if (typeof window !== 'undefined') {
  try {
    getAnalytics(app);
  } catch (error) {
    // Analytics initialization failed (e.g., in development or if not configured)
    console.warn('Firebase Analytics initialization failed:', error);
  }
}

export const setupRecaptcha = (elementId: string = 'recaptcha-container'): RecaptchaVerifier => {
  return new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
  });
};

export const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<string> => {
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  return confirmationResult.verificationId;
};

export const verifyOTP = async (verificationId: string, otp: string): Promise<string> => {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  const userCredential = await signInWithCredential(auth, credential);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
};

// Initialize Firebase Cloud Messaging (only in browser)
let messaging: Messaging | null = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Messaging initialization failed:', error);
  }
}

export { messaging };


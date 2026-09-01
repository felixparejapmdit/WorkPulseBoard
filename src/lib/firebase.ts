import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  runTransaction,
  serverTimestamp,
  Firestore 
} from "firebase/firestore";

// Firebase configuration from environment or fallback placeholder
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-workpulse-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "workpulse-dashboard.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "workpulse-dashboard",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "workpulse-dashboard.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "workpulse-dashboard"
);

// Initialize Firebase App singleton safely
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let firestoreInstance: Firestore | null = null;

export const getFirestoreDb = (): Firestore | null => {
  if (!isFirebaseConfigured) return null;
  if (!firestoreInstance) {
    try {
      firestoreInstance = getFirestore(app);
    } catch (e) {
      console.warn("Firestore initialization skipped: using real-time sync engine", e);
      return null;
    }
  }
  return firestoreInstance;
};

export {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp
};

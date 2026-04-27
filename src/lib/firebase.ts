import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let secondaryApp;
try {
  secondaryApp = initializeApp(firebaseConfig, "Secondary");
} catch (e) {
  secondaryApp = getApp("Secondary");
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Secondary instances for member registration
export const secondaryAuth = getAuth(secondaryApp);
// Also need a secondary db instance to write user profile as the newly created user
export const secondaryDb = getFirestore(secondaryApp, firebaseConfig.firestoreDatabaseId);

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

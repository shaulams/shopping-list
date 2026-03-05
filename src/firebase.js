import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Get or create a list document in Firestore
export function getListRef(listCode) {
  return doc(db, 'shopping-lists', listCode);
}

// Subscribe to real-time updates for a list
export function subscribeToList(listCode, callback) {
  const ref = getListRef(listCode);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data().items || {});
    } else {
      callback({});
    }
  });
}

// Save items to Firestore
export async function saveItems(listCode, items) {
  const ref = getListRef(listCode);
  await setDoc(ref, { items, updatedAt: new Date().toISOString() }, { merge: true });
}

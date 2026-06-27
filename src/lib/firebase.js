import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim(),
}

// Skip init during SSR prerendering when env vars are not yet injected
const app = firebaseConfig.apiKey
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : null

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const rtdb = app ? getDatabase(app) : null
export const storage = app ? getStorage(app) : null
export default app

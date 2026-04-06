'use client'
// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ─── Create user doc in Firestore ───
  async function createUserDoc(firebaseUser, extra = {}) {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || extra.displayName || 'Vibe User',
        photoURL: firebaseUser.photoURL || '',
        youtubeAccessToken: null,
        youtubeRefreshToken: null,
        createdAt: serverTimestamp(),
      })
    }
  }

  // ─── Email/Password Sign Up ───
  async function signup(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await createUserDoc(cred.user, { displayName })
    return cred.user
  }

  // ─── Email/Password Login ───
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  // ─── Google OAuth ───
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    provider.addScope('profile')
    provider.addScope('email')
    const cred = await signInWithPopup(auth, provider)
    await createUserDoc(cred.user)
    return cred.user
  }

  // ─── Sign Out ───
  async function logout() {
    await signOut(auth)
  }

  // ─── Password Reset ───
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email)
  }

  // ─── Listen to auth state ───
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Enrich with Firestore data
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          ...(snap.exists() ? snap.data() : {}),
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

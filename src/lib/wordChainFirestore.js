// src/lib/wordChainFirestore.js
// Firestore helpers for Word Chain game.
// Game → rooms/{roomId}/wordchain/game

import { db } from './firebase'
import { doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore'

const gameRef = (roomId) => doc(db, 'rooms', roomId, 'wordchain', 'game')

export async function writeWordChainGame(roomId, state) {
  await setDoc(gameRef(roomId), state)
}

export function subscribeWordChainGame(roomId, cb) {
  return onSnapshot(gameRef(roomId), snap => cb(snap.exists() ? snap.data() : null))
}

export async function deleteWordChainGame(roomId) {
  try { await deleteDoc(gameRef(roomId)) } catch (_) {}
}

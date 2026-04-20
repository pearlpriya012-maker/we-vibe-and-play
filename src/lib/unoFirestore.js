// src/lib/unoFirestore.js
// Firestore helpers for UNO game state.
// The game is stored at: rooms/{roomId}/uno/game  (a single document)

import { db } from './firebase'
import {
  doc, setDoc, updateDoc, onSnapshot, deleteDoc, getDoc
} from 'firebase/firestore'

const gameRef = (roomId) => doc(db, 'rooms', roomId, 'uno', 'game')

/** Write a full new game state (start / restart) */
export async function writeUnoGame(roomId, state) {
  await setDoc(gameRef(roomId), state)
}

/** Apply a partial update (action result) */
export async function updateUnoGame(roomId, partial) {
  await updateDoc(gameRef(roomId), partial)
}

/** Overwrite game state (used after any action that returns full state) */
export async function saveUnoState(roomId, state) {
  await setDoc(gameRef(roomId), state)
}

/** Get current state once */
export async function getUnoGame(roomId) {
  const snap = await getDoc(gameRef(roomId))
  return snap.exists() ? snap.data() : null
}

/** Subscribe to live game state */
export function subscribeUnoGame(roomId, callback) {
  return onSnapshot(gameRef(roomId), snap => {
    callback(snap.exists() ? snap.data() : null)
  })
}

/** Delete the game document (end / close game) */
export async function deleteUnoGame(roomId) {
  await deleteDoc(gameRef(roomId))
}

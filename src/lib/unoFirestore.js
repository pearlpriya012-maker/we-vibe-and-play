// src/lib/unoFirestore.js
// Firestore helpers for UNO game state + invite state.
// Game   → rooms/{roomId}/uno/game
// Invite → rooms/{roomId}/uno/invite

import { db } from './firebase'
import {
  doc, setDoc, updateDoc, onSnapshot, deleteDoc, getDoc
} from 'firebase/firestore'

const gameRef   = (roomId) => doc(db, 'rooms', roomId, 'uno', 'game')
const inviteRef = (roomId) => doc(db, 'rooms', roomId, 'uno', 'invite')

// ─── Invite helpers ───────────────────────────────────────────────────────────

/** Create a new invite (host only) */
export async function writeUnoInvite(roomId, invite) {
  await setDoc(inviteRef(roomId), invite)
}

/** Accept or decline an invite */
export async function respondToInvite(roomId, uid, response) {
  await updateDoc(inviteRef(roomId), { [`responses.${uid}`]: response })
}

/** Subscribe to invite doc */
export function subscribeUnoInvite(roomId, callback) {
  return onSnapshot(inviteRef(roomId), snap => {
    callback(snap.exists() ? snap.data() : null)
  })
}

/** Delete the invite doc */
export async function deleteUnoInvite(roomId) {
  try { await deleteDoc(inviteRef(roomId)) } catch (_) {}
}

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

// src/lib/wordChainGame.js
// Pure game-logic for Word Chain (no Firebase, no side-effects).
//
// Rules:
//   • Each word must start with the LAST LETTER of the previous word.
//   • Words must be at least MIN_LENGTH characters.
//   • Words cannot be repeated in the same game.
//   • If the timer expires you get a STRIKE.
//   • 3 strikes → eliminated.
//   • Last player standing wins (or highest score if all eliminated simultaneously).
//   • Score: word length × (1 + streak bonus).

const MIN_LENGTH = 3
const MAX_STRIKES = 3

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── State shape ──────────────────────────────────────────────────────────────
// {
//   status: 'playing' | 'finished'
//   players: { [uid]: { displayName, photoURL, score, strikes, eliminated, streak } }
//   order: uid[]              — shuffled once, eliminated players stay but are skipped
//   currentIdx: number
//   currentUid: string
//   lastWord: string | null
//   lastLetter: string | null  — uppercase
//   usedWords: string[]
//   turnSeconds: number
//   turnStartedAt: number | null
//   round: number
//   log: string[]             — last ~25 entries
//   winner: string | null
// }

export function createGame(players, settings = {}) {
  const order = shuffleArray(players.map(p => p.uid))
  const first = order[0]
  return {
    status: 'playing',
    players: Object.fromEntries(players.map(p => [p.uid, {
      displayName: p.displayName || 'Player',
      photoURL: p.photoURL || '',
      score: 0, strikes: 0, eliminated: false, streak: 0,
    }])),
    order,
    currentIdx: 0,
    currentUid: first,
    lastWord: null,
    lastLetter: null,
    usedWords: [],
    turnSeconds: settings.turnSeconds || 15,
    turnStartedAt: null,
    round: 1,
    log: [`Game started! ${players.find(p => p.uid === first)?.displayName || 'Player'} goes first.`],
    winner: null,
  }
}

// Start the current player's turn (set turnStartedAt)
export function startTurn(state) {
  return { ...state, turnStartedAt: Date.now() }
}

// Validate a word submission. Returns error string or null.
export function validateWord(state, word) {
  const w = word.trim().toLowerCase()
  if (!w) return 'Empty word'
  if (w.length < MIN_LENGTH) return `Word must be at least ${MIN_LENGTH} letters`
  if (!/^[a-z]+$/.test(w)) return 'Letters only'
  if (state.lastLetter && w[0] !== state.lastLetter.toLowerCase()) {
    return `Must start with "${state.lastLetter.toUpperCase()}"`
  }
  if (state.usedWords.includes(w)) return 'Already used!'
  return null
}

export function submitWord(state, uid, word) {
  if (state.status !== 'playing') return state
  if (state.currentUid !== uid) return state
  const error = validateWord(state, word)
  if (error) return state // caller should show the error from validateWord

  const w = word.trim().toLowerCase()
  const player = state.players[uid]
  const points = w.length + player.streak
  const newStreak = player.streak + 1

  const players = {
    ...state.players,
    [uid]: { ...player, score: player.score + points, streak: newStreak },
  }

  const log = [...state.log.slice(-24), `${player.displayName}: "${w}" (+${points})`]
  const newState = {
    ...state,
    players,
    lastWord: w,
    lastLetter: w[w.length - 1].toUpperCase(),
    usedWords: [...state.usedWords, w],
    log,
  }

  return advanceTurn(newState)
}

// Called when timer expires — give current player a strike
export function expireTurn(state, uid) {
  if (state.status !== 'playing') return state
  if (state.currentUid !== uid) return state

  const player = state.players[uid]
  const newStrikes = player.strikes + 1
  const eliminated = newStrikes >= MAX_STRIKES

  const players = {
    ...state.players,
    [uid]: { ...player, strikes: newStrikes, eliminated, streak: 0 },
  }

  const strikeStr = '⚡'.repeat(newStrikes)
  const log = [...state.log.slice(-24),
    eliminated
      ? `${player.displayName} is eliminated! ${strikeStr}`
      : `${player.displayName} timed out! ${strikeStr} (${MAX_STRIKES - newStrikes} left)`,
  ]

  return advanceTurn({ ...state, players, log })
}

function advanceTurn(state) {
  const active = state.order.filter(uid => !state.players[uid].eliminated)
  if (active.length <= 1) {
    const winner = active[0] || topScorer(state)
    return {
      ...state,
      status: 'finished',
      winner,
      turnStartedAt: null,
      log: [...state.log.slice(-24), `🏆 ${state.players[winner]?.displayName || 'Player'} wins!`],
    }
  }

  // Find next non-eliminated player
  let idx = state.currentIdx
  let attempts = 0
  do {
    idx = (idx + 1) % state.order.length
    attempts++
  } while (state.players[state.order[idx]].eliminated && attempts <= state.order.length)

  const nextUid = state.order[idx]
  const isNewRound = idx <= state.currentIdx
  return {
    ...state,
    currentIdx: idx,
    currentUid: nextUid,
    turnStartedAt: Date.now(), // start immediately
    round: isNewRound ? state.round + 1 : state.round,
  }
}

function topScorer(state) {
  return Object.entries(state.players).sort((a, b) => b[1].score - a[1].score)[0]?.[0]
}

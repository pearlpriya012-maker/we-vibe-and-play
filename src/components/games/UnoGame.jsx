'use client'
// src/components/games/UnoGame.jsx
// Full UNO multiplayer game UI — renders as a full-screen overlay.

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  createGame, playCard, pickWildColor, drawCard, passTurn,
  callUno, catchUno, challengeWD4, jumpIn, sevenSwap,
  getMyHand, getOpponentCounts, isMyTurn, needsColorPick,
  COLORS, cardScore,
} from '@/lib/uno'
import {
  writeUnoGame, saveUnoState, subscribeUnoGame, deleteUnoGame,
} from '@/lib/unoFirestore'

// ─── Card rendering ───────────────────────────────────────────────────────────

const COLOR_MAP = {
  red:    { bg: '#e74c3c', text: '#fff', glow: 'rgba(231,76,60,0.5)' },
  yellow: { bg: '#f1c40f', text: '#000', glow: 'rgba(241,196,15,0.5)' },
  green:  { bg: '#27ae60', text: '#fff', glow: 'rgba(39,174,96,0.5)' },
  blue:   { bg: '#2980b9', text: '#fff', glow: 'rgba(41,128,185,0.5)' },
  wild:   { bg: 'linear-gradient(135deg,#e74c3c,#f1c40f,#27ae60,#2980b9)', text: '#fff', glow: 'rgba(255,255,255,0.3)' },
}

const VALUE_LABEL = {
  skip: '⊘', reverse: '↺', draw2: '+2', wild: '★', wilddraw4: '+4★',
}

function CardFace({ card, small, selected, playable, onClick, style = {} }) {
  if (!card) return null
  const c = COLOR_MAP[card.color] || COLOR_MAP.wild
  const label = VALUE_LABEL[card.value] ?? card.value.toUpperCase()
  const size = small ? { w: 38, h: 54, font: '0.7rem', corner: '0.45rem' }
                     : { w: 56, h: 80, font: '1rem', corner: '0.6rem' }

  return (
    <div
      onClick={onClick}
      title={`${card.color} ${card.value}`}
      style={{
        width: size.w, height: size.h,
        borderRadius: size.corner,
        background: c.bg,
        color: c.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Oswald', fontWeight: 700, fontSize: size.font,
        boxShadow: selected
          ? `0 0 0 3px #fff, 0 0 16px ${c.glow}`
          : playable
            ? `0 0 10px ${c.glow}`
            : '0 2px 6px rgba(0,0,0,0.4)',
        transform: selected ? 'translateY(-10px) scale(1.08)' : playable ? 'translateY(-4px)' : 'none',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: onClick && playable ? 'pointer' : onClick ? 'default' : 'default',
        opacity: onClick && !playable ? 0.55 : 1,
        flexShrink: 0,
        userSelect: 'none',
        border: selected ? '2px solid #fff' : '2px solid rgba(255,255,255,0.15)',
        letterSpacing: '0.02em',
        ...style,
      }}
    >
      {label}
    </div>
  )
}

function CardBack({ small, style = {} }) {
  const size = small ? { w: 32, h: 46 } : { w: 48, h: 68 }
  return (
    <div style={{
      width: size.w, height: size.h, borderRadius: '0.5rem',
      background: 'linear-gradient(135deg, #1a1a2e 60%, #16213e)',
      border: '2px solid rgba(255,255,255,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: small ? '0.65rem' : '0.9rem', color: 'rgba(255,255,255,0.3)',
      flexShrink: 0,
      ...style,
    }}>
      🃏
    </div>
  )
}

// ─── Opponent seat ────────────────────────────────────────────────────────────

function OpponentSeat({ opponent, isCurrent, callUnoEnabled, onCatchUno, unoEligible }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '8px 12px', borderRadius: 12,
      background: isCurrent ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isCurrent ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
      transition: 'all 0.3s',
      minWidth: 70,
    }}>
      <div style={{ position: 'relative' }}>
        {opponent.photoURL
          ? <img src={opponent.photoURL} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${isCurrent ? 'gold' : 'transparent'}` }} />
          : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#e74c3c,#2980b9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald', fontWeight: 700, fontSize: '0.9rem', color: '#fff', border: `2px solid ${isCurrent ? 'gold' : 'transparent'}` }}>
              {opponent.displayName?.[0]?.toUpperCase() || '?'}
            </div>
        }
        {isCurrent && <div style={{ position: 'absolute', top: -4, right: -4, fontSize: '0.7rem' }}>👑</div>}
      </div>

      <div style={{ fontFamily: 'Oswald', fontSize: '0.65rem', color: isCurrent ? 'gold' : 'var(--text-dim)', textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {opponent.displayName}
      </div>

      {/* Card backs row */}
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 80 }}>
        {Array.from({ length: Math.min(opponent.count, 8) }).map((_, i) => (
          <CardBack key={i} small style={{ width: 14, height: 20 }} />
        ))}
        {opponent.count > 8 && <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>+{opponent.count - 8}</span>}
      </div>

      <div style={{ fontFamily: 'Oswald', fontSize: '0.7rem', color: opponent.count === 1 ? 'var(--pink)' : 'var(--text-dim)' }}>
        {opponent.count} card{opponent.count !== 1 ? 's' : ''}
      </div>

      {unoEligible && callUnoEnabled && (
        <button onClick={() => onCatchUno(opponent.uid)}
          style={{ background: 'var(--pink)', border: 'none', borderRadius: 6, padding: '3px 8px', color: '#fff', fontFamily: 'Oswald', fontSize: '0.6rem', cursor: 'pointer', letterSpacing: '0.08em' }}>
          CATCH!
        </button>
      )}
    </div>
  )
}

// ─── Color picker modal ───────────────────────────────────────────────────────

function ColorPicker({ onPick }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <div style={{ fontFamily: 'Oswald', fontSize: '1.3rem', color: '#fff', letterSpacing: '0.15em' }}>CHOOSE A COLOR</div>
      <div style={{ display: 'flex', gap: 16 }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => onPick(c)} style={{
            width: 64, height: 64, borderRadius: 14,
            background: COLOR_MAP[c].bg, border: '3px solid rgba(255,255,255,0.2)',
            cursor: 'pointer', boxShadow: `0 0 20px ${COLOR_MAP[c].glow}`,
            transition: 'transform 0.15s',
            fontFamily: 'Oswald', fontWeight: 700, fontSize: '0.65rem',
            color: COLOR_MAP[c].text, letterSpacing: '0.08em',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Lobby (waiting room) ─────────────────────────────────────────────────────

function UnoLobby({ roomParticipants, currentUser, onStart, onClose }) {
  const [houseRules, setHouseRules] = useState({ stackDraw: false, sevenSwap: false, jumpIn: false })

  const toggle = (key) => setHouseRules(r => ({ ...r, [key]: !r[key] }))

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24 }}>
      <div style={{ fontFamily: 'Oswald', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.2em', background: 'linear-gradient(135deg,#e74c3c,#f1c40f,#27ae60,#2980b9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        UNO
      </div>

      {/* Players in lobby */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ fontFamily: 'Oswald', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: 10 }}>
          PLAYERS ({roomParticipants.length}/10)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {roomParticipants.map(p => (
            <div key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {p.photoURL
                ? <img src={p.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#e74c3c,#2980b9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald', fontWeight: 700, fontSize: '0.75rem', color: '#fff' }}>{p.displayName?.[0]?.toUpperCase() || '?'}</div>
              }
              <span style={{ fontFamily: 'Oswald', fontSize: '0.82rem', color: '#fff' }}>{p.displayName}</span>
              {p.uid === currentUser.uid && <span style={{ fontSize: '0.6rem', color: 'var(--green)', marginLeft: 'auto' }}>YOU</span>}
            </div>
          ))}
        </div>
      </div>

      {/* House rules */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ fontFamily: 'Oswald', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: 10 }}>HOUSE RULES</div>
        {[
          ['stackDraw', 'Stack +2 / +4', 'Chain draw cards — accumulate until someone can\'t stack'],
          ['sevenSwap', '7-Swap / 0-Rotate', 'Play 7 to swap hands; play 0 to rotate all hands'],
          ['jumpIn',    'Jump-In', 'Play an identical card out of turn'],
        ].map(([key, label, desc]) => (
          <div key={key} onClick={() => toggle(key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: houseRules[key] ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${houseRules[key] ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', marginBottom: 8 }}>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: houseRules[key] ? 'var(--green)' : 'rgba(255,255,255,0.1)', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: houseRules[key] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: houseRules[key] ? '#000' : 'var(--text-dim)', transition: 'left 0.2s' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Oswald', fontSize: '0.78rem', color: houseRules[key] ? 'var(--green)' : '#fff' }}>{label}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-dim)', fontFamily: 'Oswald', fontSize: '0.85rem', cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={() => onStart(houseRules)}
          disabled={roomParticipants.length < 2}
          style={{ padding: '10px 32px', borderRadius: 10, background: roomParticipants.length < 2 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#e74c3c,#2980b9)', border: 'none', color: '#fff', fontFamily: 'Oswald', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', cursor: roomParticipants.length < 2 ? 'not-allowed' : 'pointer', opacity: roomParticipants.length < 2 ? 0.4 : 1 }}>
          START GAME
        </button>
      </div>
      {roomParticipants.length < 2 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Need at least 2 players</div>
      )}
    </div>
  )
}

// ─── Game over screen ─────────────────────────────────────────────────────────

function GameOver({ game, currentUser, onPlayAgain, onClose }) {
  const winner = game.winner
  const myScore = game.scores?.[currentUser.uid] || 0
  const isWinner = winner === currentUser.uid

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      <div style={{ fontSize: '4rem' }}>{isWinner ? '🏆' : '😢'}</div>
      <div style={{ fontFamily: 'Oswald', fontSize: '1.6rem', color: isWinner ? 'gold' : 'var(--text-dim)', letterSpacing: '0.2em' }}>
        {isWinner ? 'YOU WIN!' : `${game.players[winner]?.displayName} WINS!`}
      </div>

      {/* Scores */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ fontFamily: 'Oswald', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: 10 }}>SCORES</div>
        {Object.entries(game.scores || {}).sort((a, b) => b[1] - a[1]).map(([uid, score]) => (
          <div key={uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: 10, background: uid === winner ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${uid === winner ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`, marginBottom: 6 }}>
            <span style={{ fontFamily: 'Oswald', fontSize: '0.82rem', color: uid === winner ? 'gold' : '#fff' }}>{game.players[uid]?.displayName}</span>
            <span style={{ fontFamily: 'Oswald', fontSize: '0.82rem', color: uid === winner ? 'gold' : 'var(--text-dim)' }}>{score} pts</span>
          </div>
        ))}
      </div>

      {/* Remaining hands */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ fontFamily: 'Oswald', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>HAND VALUES</div>
        {Object.entries(game.hands || {}).filter(([uid]) => uid !== winner).map(([uid, hand]) => (
          <div key={uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', marginBottom: 4 }}>
            <span style={{ fontFamily: 'Oswald', fontSize: '0.75rem', color: 'var(--text-dim)' }}>{game.players[uid]?.displayName}</span>
            <span style={{ fontFamily: 'Oswald', fontSize: '0.75rem', color: 'var(--pink)' }}>{hand.reduce((s, c) => s + cardScore(c), 0)} pts</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-dim)', fontFamily: 'Oswald', fontSize: '0.85rem', cursor: 'pointer' }}>Close</button>
        <button onClick={onPlayAgain} style={{ padding: '10px 32px', borderRadius: 10, background: 'linear-gradient(135deg,#e74c3c,#2980b9)', border: 'none', color: '#fff', fontFamily: 'Oswald', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>Play Again</button>
      </div>
    </div>
  )
}

// ─── Main UnoGame component ───────────────────────────────────────────────────

export default function UnoGame({ roomId, roomParticipants, currentUser, onClose }) {
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [error, setError] = useState(null)
  const [showLog, setShowLog] = useState(false)
  const [challengePending, setChallengePending] = useState(false)
  const [sevenTarget, setSevenTarget] = useState(null) // uid to swap with
  const gameRef = useRef(null)

  // Live subscription
  useEffect(() => {
    const unsub = subscribeUnoGame(roomId, state => {
      setGame(state)
      gameRef.current = state
      setLoading(false)
    })
    return unsub
  }, [roomId])

  const act = useCallback(async (fn) => {
    setError(null)
    try {
      const current = gameRef.current
      if (!current) return
      const next = fn(current)
      await saveUnoState(roomId, next)
    } catch (e) {
      setError(e.message)
      setTimeout(() => setError(null), 3000)
    }
  }, [roomId])

  // ── Actions ──

  async function handleStart(houseRules) {
    try {
      const players = roomParticipants.map(p => ({ uid: p.uid, displayName: p.displayName, photoURL: p.photoURL || '' }))
      const state = createGame(players, houseRules)
      await writeUnoGame(roomId, state)
    } catch (e) {
      setError(e.message)
    }
  }

  function handlePlayCard(cardId) {
    const g = gameRef.current
    if (!g) return
    const card = g.hands[currentUser.uid]?.find(c => c.id === cardId)
    if (!card) return

    if (card.value === 'wild' || card.value === 'wilddraw4') {
      // Need color pick first — just select it, ColorPicker appears
      setSelectedCardId(cardId)
      return
    }

    // 7-swap house rule
    if (g.houseRules?.sevenSwap && card.value === '7') {
      setSelectedCardId(cardId)
      // Show swap target picker — handled separately
      setSevenTarget('PICK')
      return
    }

    act(s => playCard(s, currentUser.uid, cardId))
    setSelectedCardId(null)
  }

  function handleColorPick(color) {
    act(s => {
      const g = s
      const card = g.hands[currentUser.uid]?.find(c => c.id === selectedCardId)
      if (!card) throw new Error('Card not found')
      return playCard(g, currentUser.uid, selectedCardId, color)
    })
    setSelectedCardId(null)
  }

  function handleDraw() {
    act(s => drawCard(s, currentUser.uid))
    setSelectedCardId(null)
  }

  function handlePass() {
    act(s => passTurn(s, currentUser.uid))
  }

  function handleUno() {
    act(s => callUno(s, currentUser.uid))
  }

  function handleCatchUno(targetUid) {
    act(s => catchUno(s, currentUser.uid, targetUid))
  }

  function handleChallenge() {
    act(s => challengeWD4(s, currentUser.uid))
    setChallengePending(false)
  }

  function handleSevenSwap(toUid) {
    act(s => {
      const g = playCard(s, currentUser.uid, selectedCardId)
      return sevenSwap(g, currentUser.uid, toUid)
    })
    setSelectedCardId(null)
    setSevenTarget(null)
  }

  function handleJumpIn(cardId) {
    act(s => jumpIn(s, currentUser.uid, cardId))
  }

  async function handlePlayAgain() {
    const players = roomParticipants.map(p => ({ uid: p.uid, displayName: p.displayName, photoURL: p.photoURL || '' }))
    const state = createGame(players, game?.houseRules || {})
    // Carry forward scores
    state.scores = game?.scores || {}
    await writeUnoGame(roomId, state)
  }

  async function handleClose() {
    await deleteUnoGame(roomId)
    onClose()
  }

  // ── Derived ──

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: 'Oswald', fontSize: '0.9rem', letterSpacing: '0.12em' }}>
      LOADING…
    </div>
  )

  // No game yet → lobby
  if (!game) {
    return <UnoLobby roomParticipants={roomParticipants} currentUser={currentUser} onStart={handleStart} onClose={onClose} />
  }

  // Game over
  if (game.status === 'finished') {
    return <GameOver game={game} currentUser={currentUser} onPlayAgain={handlePlayAgain} onClose={handleClose} />
  }

  const myHand = getMyHand(game, currentUser.uid)
  const opponents = getOpponentCounts(game, currentUser.uid)
  const myTurn = isMyTurn(game, currentUser.uid)
  const needsColor = needsColorPick(game, currentUser.uid)
  const topCard = game.discardPile?.[game.discardPile.length - 1]
  const currentColor = game.currentColor
  const currentPlayerName = game.players[game.order[game.currentIdx]]?.displayName

  // Check challenge eligibility: last card was WD4 and it's now my turn
  const lastCard = game.lastCard
  const prevPlayerIdx = ((game.currentIdx - game.direction + game.order.length) % game.order.length)
  const prevPlayerUid = game.order[prevPlayerIdx]
  const canChallenge = myTurn && lastCard?.value === 'wilddraw4' && prevPlayerUid !== currentUser.uid && game.pendingDraw >= 4

  // Jump-in eligibility
  const jumpInCards = game.houseRules?.jumpIn && !myTurn
    ? myHand.filter(c => c.color === topCard?.color && c.value === topCard?.value)
    : []

  // Determine which of my cards are playable
  const playableIds = new Set(
    myTurn
      ? myHand.filter(c => {
          try {
            const { isPlayable: ip } = require('@/lib/uno')
            return ip
          } catch { return true }
        }).map(c => c.id)
      : []
  )

  // Simpler playable check inline
  function cardIsPlayable(card) {
    if (!myTurn) return false
    if (game.wildPickerUid) return false
    const { pendingDraw, houseRules: hr } = game
    if (pendingDraw > 0 && !hr.stackDraw) return false
    if (pendingDraw > 0 && hr.stackDraw) {
      return (topCard.value === 'draw2' && card.value === 'draw2') ||
             (topCard.value === 'wilddraw4' && card.value === 'wilddraw4')
    }
    if (card.value === 'wild' || card.value === 'wilddraw4') return true
    if (card.color === currentColor) return true
    if (card.value === topCard?.value) return true
    return false
  }

  const drawnCard = game.drawnCardId != null
    ? myHand.find(c => c.id === game.drawnCardId)
    : null

  // Color dot indicator
  const colorDotStyle = currentColor ? {
    width: 14, height: 14, borderRadius: '50%',
    background: COLOR_MAP[currentColor]?.bg,
    boxShadow: `0 0 8px ${COLOR_MAP[currentColor]?.glow}`,
    display: 'inline-block', flexShrink: 0,
  } : null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: '#0a0a12' }}>

      {/* Error toast */}
      {error && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: 'rgba(231,76,60,0.9)', padding: '8px 20px', borderRadius: 10, fontFamily: 'Oswald', fontSize: '0.82rem', color: '#fff', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          {error}
        </div>
      )}

      {/* Color picker modal */}
      {needsColor && <ColorPicker onPick={handleColorPick} />}

      {/* Seven-swap target picker */}
      {sevenTarget === 'PICK' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'Oswald', fontSize: '1.2rem', color: '#fff', letterSpacing: '0.15em' }}>SWAP HANDS WITH</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {opponents.map(op => (
              <button key={op.uid} onClick={() => handleSevenSwap(op.uid)}
                style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'Oswald', fontSize: '0.85rem', cursor: 'pointer' }}>
                {op.displayName} ({op.count} cards)
              </button>
            ))}
          </div>
          <button onClick={() => setSevenTarget(null)} style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(10,10,18,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'Oswald', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.2em', background: 'linear-gradient(135deg,#e74c3c,#f1c40f,#27ae60,#2980b9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UNO</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentColor && colorDotStyle && <div style={colorDotStyle} title={`Active color: ${currentColor}`} />}
          <div style={{ fontFamily: 'Oswald', fontSize: '0.7rem', color: myTurn ? 'gold' : 'var(--text-dim)', letterSpacing: '0.08em' }}>
            {myTurn ? '👑 YOUR TURN' : `${currentPlayerName}'s turn`}
          </div>
          {game.pendingDraw > 0 && (
            <div style={{ fontFamily: 'Oswald', fontSize: '0.65rem', color: 'var(--pink)', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 6, padding: '2px 8px' }}>
              +{game.pendingDraw} pending
            </div>
          )}
          <button onClick={() => setShowLog(l => !l)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-dim)', fontSize: '0.65rem', cursor: 'pointer', fontFamily: 'Oswald' }}>
            {showLog ? 'BOARD' : 'LOG'}
          </button>
          <button onClick={handleClose} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(233,30,99,0.1)', border: '1px solid rgba(233,30,99,0.3)', color: 'var(--pink)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      </div>

      {showLog ? (
        /* ── Log view ── */
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[...game.log].reverse().map((entry, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: i === 0 ? '#fff' : 'var(--text-dim)', padding: '4px 8px', borderRadius: 6, background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
              {entry}
            </div>
          ))}
        </div>
      ) : (
        /* ── Board ── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Opponents row */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 10, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.04)', scrollbarWidth: 'none' }}>
            {opponents.map(op => (
              <OpponentSeat
                key={op.uid}
                opponent={op}
                isCurrent={game.order[game.currentIdx] === op.uid}
                callUnoEnabled={true}
                unoEligible={!!game.unoPenaltyEligible?.[op.uid]}
                onCatchUno={handleCatchUno}
              />
            ))}
          </div>

          {/* Center play area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 16 }}>

            {/* Draw pile */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div onClick={myTurn && !game.wildPickerUid ? handleDraw : undefined}
                style={{ cursor: myTurn && !game.wildPickerUid ? 'pointer' : 'default', position: 'relative' }}>
                <CardBack />
                {game.drawPile?.length > 0 && (
                  <div style={{ position: 'absolute', top: -8, right: -8, background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald', fontSize: '0.55rem', color: '#fff' }}>
                    {game.drawPile.length}
                  </div>
                )}
              </div>
              <div style={{ fontFamily: 'Oswald', fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>DRAW</div>
            </div>

            {/* Discard pile */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                {topCard && <CardFace card={topCard} />}
                {currentColor && topCard?.color === 'wild' && colorDotStyle && (
                  <div style={{ ...colorDotStyle, position: 'absolute', bottom: -5, right: -5, width: 16, height: 16 }} />
                )}
              </div>
              <div style={{ fontFamily: 'Oswald', fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>DISCARD</div>
            </div>

            {/* Action column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              {/* UNO button */}
              {myHand.length === 1 && (
                <button onClick={handleUno}
                  style={{ padding: '8px 18px', borderRadius: 10, background: game.unoCalledBy?.[currentUser.uid] ? 'rgba(0,255,136,0.15)' : 'linear-gradient(135deg,#e74c3c,#f1c40f)', border: 'none', color: '#fff', fontFamily: 'Oswald', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer', boxShadow: '0 0 16px rgba(231,76,60,0.4)' }}>
                  {game.unoCalledBy?.[currentUser.uid] ? '✅ UNO!' : '🔔 UNO!'}
                </button>
              )}

              {/* Pass button (only after drawing) */}
              {myTurn && game.drawnCardId != null && (
                <button onClick={handlePass}
                  style={{ padding: '6px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-dim)', fontFamily: 'Oswald', fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '0.1em' }}>
                  PASS
                </button>
              )}

              {/* Challenge WD4 */}
              {canChallenge && (
                <button onClick={handleChallenge}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', color: 'var(--pink)', fontFamily: 'Oswald', fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '0.08em' }}>
                  ⚡ CHALLENGE +4
                </button>
              )}
            </div>
          </div>

          {/* My hand */}
          <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 8px', background: 'rgba(10,10,18,0.9)' }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, alignItems: 'flex-end', scrollbarWidth: 'none', minHeight: 92, justifyContent: myHand.length < 8 ? 'center' : 'flex-start' }}>
              {myHand.map(card => {
                const playable = cardIsPlayable(card)
                const isSelected = selectedCardId === card.id
                const isDrawn = card.id === game.drawnCardId
                return (
                  <div key={card.id} style={{ position: 'relative', flexShrink: 0 }}>
                    <CardFace
                      card={card}
                      playable={playable || (game.drawnCardId === card.id)}
                      selected={isSelected}
                      onClick={playable || isDrawn ? () => handlePlayCard(card.id) : undefined}
                    />
                    {isDrawn && (
                      <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.5rem', color: 'var(--green)', background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap', fontFamily: 'Oswald' }}>NEW</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Jump-in cards when not my turn */}
            {jumpInCards.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Oswald', fontSize: '0.6rem', color: 'gold', letterSpacing: '0.1em' }}>JUMP IN:</span>
                {jumpInCards.map(card => (
                  <CardFace key={card.id} card={card} small playable onClick={() => handleJumpIn(card.id)} />
                ))}
              </div>
            )}

            {/* Hand count */}
            <div style={{ textAlign: 'center', marginTop: 6, fontFamily: 'Oswald', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
              YOUR HAND ({myHand.length})
              {!myTurn && <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.15)' }}>• Wait for your turn</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

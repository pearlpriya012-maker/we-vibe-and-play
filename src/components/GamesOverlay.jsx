'use client'
// src/components/GamesOverlay.jsx
// Games hub — shown as a full-screen overlay over the room.
// Click a game to launch it; music keeps playing underneath.

import { useState } from 'react'
import UnoGame from './games/UnoGame'

const GAMES = [
  {
    id: 'uno',
    name: 'UNO',
    icon: '🃏',
    desc: 'The classic card game. Match colors & numbers, play action cards, be the first to empty your hand.',
    players: '2–10',
    available: true,
    gradient: 'linear-gradient(135deg, #e74c3c 0%, #2980b9 100%)',
    glow: 'rgba(231,76,60,0.35)',
  },
  {
    id: 'trivia',
    name: 'Music Trivia',
    icon: '🎵',
    desc: 'Guess the song or artist from your room\'s queue. More fun with your own playlist!',
    players: '2–10',
    available: false,
    gradient: 'linear-gradient(135deg, #27ae60, #2980b9)',
    glow: 'rgba(39,174,96,0.3)',
  },
  {
    id: 'truth',
    name: 'Truth or Dare',
    icon: '🔥',
    desc: 'Classic party game. Pick truth or dare — random prompts keep it spicy.',
    players: '2–12',
    available: false,
    gradient: 'linear-gradient(135deg, #e67e22, #e74c3c)',
    glow: 'rgba(230,126,34,0.3)',
  },
  {
    id: 'nhi',
    name: 'Never Have I Ever',
    icon: '🙅',
    desc: 'Take turns reading prompts. See who\'s done what!',
    players: '2–12',
    available: false,
    gradient: 'linear-gradient(135deg, #8e44ad, #e74c3c)',
    glow: 'rgba(142,68,173,0.3)',
  },
  {
    id: 'word',
    name: 'Word Chain',
    icon: '🔤',
    desc: 'Continue from the last letter of the previous word — don\'t repeat, don\'t hesitate!',
    players: '2–10',
    available: false,
    gradient: 'linear-gradient(135deg, #16a085, #27ae60)',
    glow: 'rgba(22,160,133,0.3)',
  },
  {
    id: 'pictionary',
    name: 'Pictionary',
    icon: '🎨',
    desc: 'One player draws, others guess. Shared canvas, live strokes.',
    players: '2–10',
    available: false,
    gradient: 'linear-gradient(135deg, #f39c12, #e74c3c)',
    glow: 'rgba(243,156,18,0.3)',
  },
]

function GameCard({ game, onSelect }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onClick={() => game.available && onSelect(game.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '20px 18px',
        background: hover && game.available ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hover && game.available ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
        cursor: game.available ? 'pointer' : 'not-allowed',
        opacity: game.available ? 1 : 0.45,
        transition: 'all 0.2s',
        boxShadow: hover && game.available ? `0 0 24px ${game.glow}` : 'none',
        transform: hover && game.available ? 'translateY(-3px)' : 'none',
      }}
    >
      {/* Gradient accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0', background: game.gradient, opacity: game.available ? 1 : 0.3 }} />

      {!game.available && (
        <div style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 8px', fontFamily: 'Oswald', fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--text-dim)' }}>
          COMING SOON
        </div>
      )}

      <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>{game.icon}</div>
      <div style={{ fontFamily: 'Oswald', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.1em', color: '#fff', marginBottom: 6 }}>{game.name}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 12 }}>{game.desc}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Oswald', fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>👥 {game.players} players</span>
        {game.available && (
          <span style={{ fontFamily: 'Oswald', fontSize: '0.65rem', letterSpacing: '0.12em', background: game.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PLAY →</span>
        )}
      </div>
    </div>
  )
}

export default function GamesOverlay({ roomId, roomParticipants, currentUser, onClose, invite, initialGame }) {
  const [activeGame, setActiveGame] = useState(initialGame || null)

  if (activeGame === 'uno') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: '#0a0a12',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Minimal back header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(10,10,18,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setActiveGame(null)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 12px', color: 'var(--text-dim)', fontFamily: 'Oswald', fontSize: '0.72rem', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← GAMES
          </button>
          <span style={{ fontFamily: 'Oswald', fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' }}>UNO</span>
        </div>
        <UnoGame
          roomId={roomId}
          roomParticipants={roomParticipants}
          currentUser={currentUser}
          invite={invite}
          onClose={() => setActiveGame(null)}
        />
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(8,8,15,0.97)',
      backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <div style={{ fontFamily: 'Oswald', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.15em', color: '#fff' }}>🎮 GAMES</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>Play together — music keeps going</div>
        </div>
        <button onClick={onClose}
          style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(233,30,99,0.1)', border: '1px solid rgba(233,30,99,0.3)', color: 'var(--pink)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>
      </div>

      {/* Players online strip */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <span style={{ fontFamily: 'Oswald', fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.12em', flexShrink: 0 }}>IN ROOM:</span>
        {roomParticipants.map(p => (
          <div key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: 6, background: p.uid === currentUser.uid ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${p.uid === currentUser.uid ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, padding: '4px 10px', flexShrink: 0 }}>
            {p.photoURL
              ? <img src={p.photoURL} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#e74c3c,#2980b9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', fontWeight: 700 }}>{p.displayName?.[0]?.toUpperCase() || '?'}</div>
            }
            <span style={{ fontFamily: 'Oswald', fontSize: '0.65rem', color: p.uid === currentUser.uid ? 'var(--green)' : '#fff' }}>{p.uid === currentUser.uid ? 'You' : p.displayName}</span>
          </div>
        ))}
      </div>

      {/* Game cards grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px', scrollbarWidth: 'none' }}>
        <style>{`.games-grid::-webkit-scrollbar{display:none}`}</style>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, maxWidth: 900, margin: '0 auto' }}>
          {GAMES.map(g => (
            <GameCard key={g.id} game={g} onSelect={setActiveGame} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: '0.72rem', color: 'rgba(255,255,255,0.12)', fontStyle: 'italic' }}>
          More games coming soon — suggest one in the room chat!
        </div>
      </div>
    </div>
  )
}

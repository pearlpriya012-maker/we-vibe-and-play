'use client'
// src/app/settings/page.jsx
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { updateProfile, deleteUser } from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

function Avatar({ user, size = 72 }) {
  if (user?.photoURL) return (
    <img src={user.photoURL} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }} />
  )
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, var(--green), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Oswald', fontWeight: 700, fontSize: size * 0.38, color: '#000', border: '3px solid var(--border)' }}>
      {(user?.displayName || 'V').charAt(0).toUpperCase()}
    </div>
  )
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [avatarTab, setAvatarTab] = useState('ai')

  useEffect(() => {
    if (!user) { router.replace('/'); return }
    setDisplayName(user.displayName || '')
  }, [user])

  // ── Handle YouTube OAuth callback ──
  useEffect(() => {
    const yt = searchParams.get('yt')
    if (!yt || !user) return
    if (yt === 'success') {
      // Read tokens from cookies set by the callback route
      const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
        return match ? decodeURIComponent(match[1]) : null
      }
      const accessToken = getCookie('yt_access_token')
      const refreshToken = getCookie('yt_refresh_token')
      if (accessToken) {
        updateDoc(doc(db, 'users', user.uid), {
          youtubeAccessToken: accessToken,
          youtubeRefreshToken: refreshToken || '',
        }).then(() => {
          toast.success('YouTube linked successfully! 🎵')
          router.replace('/settings')
        }).catch(() => toast.error('Could not save YouTube token'))
      } else {
        toast.error('YouTube linking failed — token missing')
        router.replace('/settings')
      }
    } else if (yt === 'error') {
      toast.error('YouTube linking failed. Please try again.')
      router.replace('/settings')
    }
  }, [searchParams, user])

  if (!user) return null

  async function handleSaveName(e) {
    e.preventDefault()
    if (!displayName.trim()) return toast.error('Username cannot be empty')
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() })
      await updateDoc(doc(db, 'users', user.uid), { displayName: displayName.trim(), username: displayName.trim() })
      toast.success('Username updated!')
    } catch (err) {
      toast.error('Could not update name')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== 'DELETE') return toast.error('Type DELETE to confirm')
    setDeleting(true)
    try {
      await deleteUser(auth.currentUser)
      localStorage.removeItem('we-vibe-mode')
      sessionStorage.removeItem('we-vibe-mode')
      toast.success('Account deleted')
      router.push('/')
    } catch (err) {
      toast.error('Could not delete account')
    } finally {
      setDeleting(false)
    }
  }

  const AI_STYLES = [
    { id: 'adventurer',   label: '🧝 Explorer' },
    { id: 'big-smile',    label: '😊 Happy' },
    { id: 'bottts',       label: '🤖 Robot' },
    { id: 'croodles',     label: '✏️ Doodle' },
    { id: 'fun-emoji',    label: '😎 Emoji' },
    { id: 'pixel-art',    label: '🎮 Pixel' },
    { id: 'lorelei',      label: '🌸 Lorelei' },
    { id: 'thumbs',       label: '👍 Thumbs' },
  ]

  async function handleSelectAiAvatar(style) {
    setSavingPhoto(true)
    const url = `https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(user.displayName || 'vibe')}&size=150`
    try {
      await updateProfile(auth.currentUser, { photoURL: url })
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url })
      toast.success('Avatar updated! ✨')
      setShowAvatarPicker(false)
    } catch {
      toast.error('Could not update avatar')
    } finally {
      setSavingPhoto(false)
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 150
        canvas.height = 150
        const ctx = canvas.getContext('2d')
        const size = Math.min(img.width, img.height)
        const sx = (img.width - size) / 2
        const sy = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 150, 150)
        const dataURL = canvas.toDataURL('image/jpeg', 0.85)
        setSavingPhoto(true)
        try {
          await updateProfile(auth.currentUser, { photoURL: dataURL })
          await updateDoc(doc(db, 'users', user.uid), { photoURL: dataURL })
          toast.success('Photo updated! 📸')
          setShowAvatarPicker(false)
        } catch {
          toast.error('Could not update photo')
        } finally {
          setSavingPhoto(false)
        }
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="grid-bg" />

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', backdropFilter: 'blur(20px)', background: 'rgba(13,13,13,0.9)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ fontFamily: 'Oswald', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', textShadow: '0 0 20px rgba(0,255,136,0.5)', textDecoration: 'none' }}>
          WE🕊️
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/dashboard" className="btn-ghost" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>← Dashboard</Link>
          <button onClick={async () => { await logout(); router.push('/') }} className="btn-ghost" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Sign Out</button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ marginBottom: 48 }}>
          <span className="section-label">Account</span>
          <h1 style={{ fontFamily: 'Oswald', fontSize: '2.5rem', fontWeight: 700, textTransform: 'uppercase' }}>Settings</h1>
        </div>

        {/* Profile Card */}
        <div className="glass-card" style={{ padding: '32px 28px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Oswald', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 24 }}>Profile</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => setShowAvatarPicker(v => !v)}>
              <Avatar user={user} size={64} />
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <span style={{ fontSize: '1.3rem' }}>📷</span>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user.displayName}</div>
              <button onClick={() => setShowAvatarPicker(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, marginTop: 4 }}>
                Change picture
              </button>
              <div className="badge badge-green" style={{ marginTop: 8, fontSize: '0.65rem' }}>
                <span className="pulse-dot" style={{ width: 5, height: 5 }} /> {user.isRandomGuest ? 'Guest Session' : 'Active'}
              </div>
            </div>
          </div>

          {showAvatarPicker && (
            <div style={{ marginBottom: 24, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {[['ai', '🤖 AI Avatars'], ['upload', '📁 Upload Photo']].map(([id, label]) => (
                  <button key={id} onClick={() => setAvatarTab(id)} style={{
                    flex: 1, padding: '12px', background: avatarTab === id ? 'rgba(0,255,136,0.08)' : 'transparent',
                    border: 'none', borderBottom: avatarTab === id ? '2px solid var(--green)' : '2px solid transparent',
                    color: avatarTab === id ? 'var(--green)' : 'var(--text-dim)', cursor: 'pointer',
                    fontSize: '0.85rem', fontFamily: 'Work Sans', fontWeight: 500, transition: 'all 0.2s',
                  }}>{label}</button>
                ))}
              </div>

              {avatarTab === 'ai' && (
                <div style={{ padding: 20 }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 16 }}>Generated from your name — click any to use it</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {AI_STYLES.map(({ id, label }) => (
                      <button key={id} onClick={() => handleSelectAiAvatar(id)} disabled={savingPhoto}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 8px', cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <img
                          src={`https://api.dicebear.com/9.x/${id}/png?seed=${encodeURIComponent(user.displayName || 'vibe')}&size=80`}
                          alt={label}
                          style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {avatarTab === 'upload' && (
                <div style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', textAlign: 'center' }}>
                    Upload from your device — auto-cropped to a square.
                  </p>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--green)', color: '#000', padding: '11px 24px', borderRadius: 8, fontFamily: 'Work Sans', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                    {savingPhoto ? <span className="spinner" style={{ borderTopColor: '#000', borderColor: 'rgba(0,0,0,0.2)' }} /> : '📁 Choose Photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </label>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8, fontFamily: 'Oswald', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Display Name</label>
              <input type="text" className="input-vibe" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your vibe name" maxLength={50} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '11px 24px' }}>
              {saving ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* YouTube Linking */}
        <div className="glass-card" style={{ padding: '32px 28px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Oswald', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 20 }}>YouTube Integration</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>▶</div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>YouTube Account</div>
              <div style={{ fontSize: '0.82rem', color: user.youtubeAccessToken ? 'var(--green)' : 'var(--text-dim)' }}>
                {user.youtubeAccessToken ? '✅ Linked — Access your playlists & liked videos' : 'Not linked — Connect to access your playlists'}
              </div>
            </div>
          </div>
          <a href="/api/youtube/oauth" className={user.youtubeAccessToken ? 'btn-danger' : 'btn-primary'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.875rem', textDecoration: 'none' }}>
            {user.youtubeAccessToken ? '🔗 Unlink YouTube' : '🔗 Link YouTube Account'}
          </a>
        </div>

        {/* Danger Zone */}
        <div className="glass-card" style={{ padding: '32px 28px', border: '1px solid rgba(233,30,99,0.2)' }}>
          <div style={{ fontFamily: 'Oswald', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--pink)', marginBottom: 16 }}>⚠️ Danger Zone</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: 20, lineHeight: 1.6 }}>
            {user.isRandomGuest
              ? 'Your session will end when you close the browser. No data is permanently stored for guest sessions.'
              : 'Permanently delete your account and all associated data. This action cannot be undone.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>Type <strong style={{ color: 'var(--pink)' }}>DELETE</strong> to confirm</label>
              <input type="text" className="input-vibe" placeholder="DELETE" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} style={{ borderColor: deleteConfirm === 'DELETE' ? 'var(--pink)' : undefined }} />
            </div>
            <button onClick={handleDelete} disabled={deleting || deleteConfirm !== 'DELETE'} className="btn-danger" style={{ alignSelf: 'flex-start', padding: '10px 20px' }}>
              {deleting ? <span className="spinner" /> : (user.isRandomGuest ? 'End Session' : 'Delete My Account')}
            </button>
          </div>
        </div>

        <p style={{ marginTop: 40, color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center' }}>
          🕊️ Vibe and Play, darling! Made with ❤️ by Team SPY
        </p>
      </main>
    </div>
  )
}

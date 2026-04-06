'use client'
// src/app/auth/signup/page.jsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.displayName.trim()) return toast.error('Display name is required')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await signup(form.email, form.password, form.displayName.trim())
      toast.success('Welcome to WE🕊️! 🎉')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      toast.success('Welcome to WE🕊️! 🎉')
      router.push('/dashboard')
    } catch (err) {
      toast.error('Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      <div className="grid-bg" />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ fontFamily: 'Oswald', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', textShadow: '0 0 20px rgba(0,255,136,0.5)', textDecoration: 'none' }}>
            WE🕊️
          </Link>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: 8 }}>Create your account and start vibing</p>
        </div>

        <div className="glass-card" style={{ padding: '40px 36px' }}>
          {/* Google */}
          <button onClick={handleGoogle} disabled={googleLoading} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginBottom: 24, gap: 10 }}>
            {googleLoading ? <span className="spinner" /> : (
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.6 5.1C9.8 39.7 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.2C40.8 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
            )}
            Continue with Google
          </button>

          <div className="divider" style={{ marginBottom: 24 }}>or sign up with email</div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8, fontFamily: 'Oswald', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Display Name</label>
              <input name="displayName" type="text" required placeholder="Your vibe name" className="input-vibe" value={form.displayName} onChange={handleChange} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8, fontFamily: 'Oswald', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Email</label>
              <input name="email" type="email" required placeholder="you@example.com" className="input-vibe" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8, fontFamily: 'Oswald', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Password</label>
              <input name="password" type="password" required placeholder="Min 6 characters" className="input-vibe" value={form.password} onChange={handleChange} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8, fontFamily: 'Oswald', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Confirm Password</label>
              <input name="confirm" type="password" required placeholder="Repeat password" className="input-vibe" value={form.confirm} onChange={handleChange} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px' }}>
              {loading ? <span className="spinner" /> : 'Create Account 🚀'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem', marginTop: 24 }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--green)', textDecoration: 'none', fontWeight: 500 }}>Log In</Link>
        </p>
      </div>
    </div>
  )
}

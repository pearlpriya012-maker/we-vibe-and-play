// src/app/api/youtube/oauth/callback/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/settings?yt=error`)
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_CLIENT_ID?.trim(),
        client_secret: process.env.YOUTUBE_CLIENT_SECRET?.trim(),
        redirect_uri: `${APP_URL}/api/youtube/oauth/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()

    if (!tokens.access_token) {
      return NextResponse.redirect(`${APP_URL}/settings?yt=error`)
    }

    // Store tokens in a cookie temporarily — client will pick up and save to Firestore
    const response = NextResponse.redirect(`${APP_URL}/settings?yt=success`)
    response.cookies.set('yt_access_token', tokens.access_token, { httpOnly: false, maxAge: 60, secure: true, sameSite: 'strict' })
    response.cookies.set('yt_refresh_token', tokens.refresh_token || '', { httpOnly: false, maxAge: 60, secure: true, sameSite: 'strict' })

    return response
  } catch (err) {
    console.error('YouTube OAuth callback error:', err)
    return NextResponse.redirect(`${APP_URL}/settings?yt=error`)
  }
}

// src/app/api/youtube/refresh/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { refreshToken } = await request.json()
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 400 })
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID?.trim(),
        client_secret: process.env.YOUTUBE_CLIENT_SECRET?.trim(),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await res.json()
    if (!data.access_token) {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
    }

    return NextResponse.json({ accessToken: data.access_token })
  } catch (err) {
    return NextResponse.json({ error: 'Token refresh error' }, { status: 500 })
  }
}

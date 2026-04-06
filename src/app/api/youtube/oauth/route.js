// src/app/api/youtube/oauth/route.js
import { NextResponse } from 'next/server'

export async function GET() {
  const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID?.trim()
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL?.trim()}/api/youtube/oauth/callback`
  const SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
  ].join(' ')

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')

  return NextResponse.redirect(url.toString())
}

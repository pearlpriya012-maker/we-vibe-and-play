// src/app/api/youtube/playlists/route.js
import { NextResponse } from 'next/server'

export async function GET(request) {
  const authHeader = request.headers.get('Authorization')
  const accessToken = authHeader?.replace('Bearer ', '')

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated with YouTube' }, { status: 401 })
  }

  try {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=25',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'YouTube API error' }, { status: res.status })
    }

    const data = await res.json()
    const playlists = (data.items || []).map((item) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      itemCount: item.contentDetails?.itemCount,
    }))

    return NextResponse.json({ playlists })
  } catch (err) {
    console.error('Playlists error:', err)
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 })
  }
}

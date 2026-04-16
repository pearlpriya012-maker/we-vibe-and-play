import { NextResponse } from 'next/server'

function parseLRC(lrc) {
  const lines = []
  for (const line of lrc.split('\n')) {
    const match = line.match(/\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/)
    if (match) {
      const time = parseInt(match[1]) * 60 + parseFloat(match[2])
      const text = match[3].trim()
      if (text) lines.push({ time, text })
    }
  }
  return lines.sort((a, b) => a.time - b.time)
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const artist = searchParams.get('artist') || ''
  const duration = parseFloat(searchParams.get('duration') || '0')

  if (!title) return NextResponse.json({ lines: [], plain: null, synced: false })

  try {
    let res = await fetch(
      `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}&duration=${Math.round(duration)}`,
      { headers: { 'Lrclib-Client': 'WeVibe/1.0' }, next: { revalidate: 3600 } }
    )
    let data = res.ok ? await res.json() : null

    // Fallback: search if exact match has no lyrics
    if (!data?.syncedLyrics && !data?.plainLyrics) {
      const sr = await fetch(
        `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`,
        { headers: { 'Lrclib-Client': 'WeVibe/1.0' } }
      )
      if (sr.ok) {
        const results = await sr.json()
        data = results.find(r => r.syncedLyrics) || results[0] || null
      }
    }

    if (!data) return NextResponse.json({ lines: [], plain: null, synced: false })

    if (data.syncedLyrics) {
      return NextResponse.json({
        lines: parseLRC(data.syncedLyrics),
        plain: data.plainLyrics || null,
        synced: true,
      })
    }

    return NextResponse.json({ lines: [], plain: data.plainLyrics || null, synced: false })
  } catch {
    return NextResponse.json({ lines: [], plain: null, synced: false })
  }
}

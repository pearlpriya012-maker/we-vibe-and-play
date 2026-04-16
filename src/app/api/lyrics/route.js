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

// Returns true if the text is predominantly Latin-script (English-readable)
function isLatin(text) {
  if (!text || text.length < 5) return true
  const sample = text.slice(0, 300)
  const latinCount = (sample.match(/[\u0000-\u024F]/g) || []).length
  return latinCount / sample.length > 0.7
}

// Pick the best result: prefer synced + Latin script
function pickBest(results) {
  if (!Array.isArray(results) || !results.length) return null
  const latinSynced = results.find(r => r.syncedLyrics && isLatin(r.syncedLyrics))
  if (latinSynced) return latinSynced
  const latinPlain = results.find(r => r.plainLyrics && isLatin(r.plainLyrics))
  if (latinPlain) return latinPlain
  // Fall back to any result with synced lyrics even if non-Latin
  return results.find(r => r.syncedLyrics) || results[0] || null
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const artist = searchParams.get('artist') || ''
  const duration = parseFloat(searchParams.get('duration') || '0')

  if (!title) return NextResponse.json({ lines: [], plain: null, synced: false })

  // Strip non-ASCII from title/artist for better lrclib matching
  // (Telugu/Hindi YouTube titles won't match English lrclib entries)
  const cleanTitle  = title.replace(/[^\x00-\x7F]+/g, ' ').replace(/\s+/g, ' ').trim()
  const cleanArtist = artist.replace(/[^\x00-\x7F]+/g, ' ').replace(/\s+/g, ' ').trim()

  try {
    // 1. Exact match with duration
    let res = await fetch(
      `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}&duration=${Math.round(duration)}`,
      { headers: { 'Lrclib-Client': 'WeVibe/1.0' }, next: { revalidate: 3600 } }
    )
    let data = res.ok ? await res.json() : null

    // 2. If exact match has no lyrics or non-Latin lyrics, search for better result
    const exactOk = data && (data.syncedLyrics || data.plainLyrics) &&
                    isLatin(data.syncedLyrics || data.plainLyrics)
    if (!exactOk) {
      const sr = await fetch(
        `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`,
        { headers: { 'Lrclib-Client': 'WeVibe/1.0' } }
      )
      if (sr.ok) {
        const results = await sr.json()
        const best = pickBest(results)
        if (best) data = best
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

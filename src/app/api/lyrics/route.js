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

// Remove YouTube-specific noise from titles so lrclib can match them
function normalizeTitle(raw) {
  return raw
    // Strip non-ASCII (Telugu, Hindi, etc.)
    .replace(/[^\x00-\x7F]+/g, ' ')
    // Remove bracketed/parenthesized junk: (Official Video), [4K], (feat. X), (Lyric Video), etc.
    .replace(/\((?:official|lyrics?|lyric|video|audio|mv|hd|4k|ft\.?|feat\.?|with|prod\.?)[^)]*\)/gi, '')
    .replace(/\[(?:official|lyrics?|lyric|video|audio|mv|hd|4k|ft\.?|feat\.?|with|prod\.?)[^\]]*\]/gi, '')
    // Remove trailing separators and labels: "| Sony Music", "- Topic", "· Album", etc.
    .replace(/[\|\·•—–]\s*.+$/g, '')
    .replace(/\s*-\s*(official|lyrics?|audio|video|hd|4k|topic|music|records?|entertainment)\s*$/gi, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ').trim()
}

function normalizeArtist(raw) {
  return raw
    .replace(/[^\x00-\x7F]+/g, ' ')
    .replace(/\s*-\s*Topic\s*$/i, '')
    .replace(/\s+/g, ' ').trim()
}

// Search lrclib with a given title+artist, return best Latin result
async function searchLrclib(title, artist) {
  const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`
  const r = await fetch(url, { headers: { 'Lrclib-Client': 'WeVibe/1.0' } })
  if (!r.ok) return null
  const results = await r.json()
  return pickBest(results)
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const artist = searchParams.get('artist') || ''
  const duration = parseFloat(searchParams.get('duration') || '0')

  if (!title) return NextResponse.json({ lines: [], plain: null, synced: false })

  const cleanTitle  = normalizeTitle(title)
  const cleanArtist = normalizeArtist(artist)

  try {
    let data = null

    // 1. Exact match (title + artist + duration) — fastest, highest accuracy
    const res = await fetch(
      `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}&duration=${Math.round(duration)}`,
      { headers: { 'Lrclib-Client': 'WeVibe/1.0' }, next: { revalidate: 3600 } }
    )
    const exact = res.ok ? await res.json() : null
    if (exact && (exact.syncedLyrics || exact.plainLyrics) && isLatin(exact.syncedLyrics || exact.plainLyrics)) {
      data = exact
    }

    // 2. Search with cleaned title + artist
    if (!data) {
      data = await searchLrclib(cleanTitle, cleanArtist)
    }

    // 3. Search with title only (no artist) — catches mismatched artist names
    if (!data) {
      data = await searchLrclib(cleanTitle, '')
    }

    // 4. Further strip the title: remove everything after " - " (e.g. "Song Name - Artist")
    if (!data && cleanTitle.includes(' - ')) {
      const shortTitle = cleanTitle.split(' - ')[0].trim()
      data = await searchLrclib(shortTitle, cleanArtist)
      if (!data) data = await searchLrclib(shortTitle, '')
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

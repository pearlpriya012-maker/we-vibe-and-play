// src/app/api/groq/recommendations/route.js
import { NextResponse } from 'next/server'

const JSON_FORMAT = `Respond ONLY with valid JSON — no markdown, no extra text, no comments:
{
  "recommendations": [
    { "title": "Song Title", "artist": "Artist Name", "reasoning": "One sentence why" }
  ]
}`

function buildPrompt(mode, genre, currentTrack, queueTitles, participantCount, playlistContext, seenTitles = [], refreshSeed = 0) {
  const avoid = seenTitles.length > 0
    ? `\n\nDo NOT include any of these already-shown songs:\n${seenTitles.slice(0, 40).join(', ')}`
    : ''
  const variation = refreshSeed > 0
    ? ` (batch ${refreshSeed + 1} — pick a completely DIFFERENT set from usual AI picks, explore less-obvious choices)`
    : ''

  if (mode === 'trending') {
    return `You are a music recommendation AI. List exactly 20 massively popular songs from the last 5 years that virtually everyone knows — chart-topping hits spanning pop, hip-hop, R&B, EDM, Latin, and K-pop${variation}. Every entry MUST have a real artist name.${avoid}\n\n${JSON_FORMAT}`
  }
  if (mode === 'genre') {
    return `You are a music recommendation AI. The user wants: "${genre}"\n\nSuggest exactly 20 real songs that perfectly match this mood, vibe, or genre${variation}. Mix well-known tracks with hidden gems from different eras. Every entry MUST have a real, accurate artist name.${avoid}\n\n${JSON_FORMAT}`
  }
  // AUTO mode
  const ctx = []
  if (currentTrack?.title) ctx.push(`Currently playing: "${currentTrack.title}" by "${currentTrack.channelTitle || 'Unknown'}"`)
  if (queueTitles?.length > 0) ctx.push(`Coming up next: ${queueTitles.slice(0, 5).join(', ')}`)
  if (participantCount > 1) ctx.push(`${participantCount} people are listening together`)
  if (playlistContext?.length > 0) ctx.push(`Listener's playlists hint they enjoy: ${playlistContext.slice(0, 6).join(', ')}`)
  const contextStr = ctx.length > 0 ? ctx.join('\n') : 'No specific context — recommend crowd-pleasing, universally loved songs'
  return `You are a personalized music recommendation AI for a collaborative listening room.\n\n${contextStr}\n\nRecommend exactly 20 songs that fit the current vibe${variation}. Vary the tempo, decade, and sub-genre while staying cohesive. ALWAYS include accurate artist names — never leave artist blank.${avoid}\n\n${JSON_FORMAT}`
}

export async function POST(request) {
  const { mode = 'auto', genre = '', userApiKey, currentTrack, queueTitles = [], participantCount = 1, playlistContext = [], seenTitles = [], refreshSeed = 0 } = await request.json()

  const GROQ_API_KEY = (userApiKey || '').trim() || process.env.GROQ_API_KEY?.trim()
  if (!GROQ_API_KEY) return NextResponse.json({ error: 'No Groq API key available. Add one in AI Bond settings.' }, { status: 500 })

  const prompt = buildPrompt(mode, genre, currentTrack, queueTitles, participantCount, playlistContext, seenTitles, refreshSeed)

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.8, max_tokens: 1024 }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

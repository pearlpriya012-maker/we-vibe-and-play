// src/app/api/gemini/recommendations/route.js
import { NextResponse } from 'next/server'

const JSON_FORMAT = `Respond ONLY with valid JSON, no markdown, no extra text:
{
  "recommendations": [
    { "title": "Song Title", "artist": "Artist Name", "reasoning": "Brief explanation" }
  ]
}`

function buildPrompt(mode, genre, currentTrack, queueTitles, participantCount, playlistContext) {
  if (mode === 'trending') {
    return `You are a music recommendation AI. List exactly 20 globally trending songs right now across diverse genres. Include mainstream hits, viral songs, and chart-toppers from genres like pop, hip-hop, R&B, EDM, K-pop, and more.\n\n${JSON_FORMAT}`
  }
  if (mode === 'genre') {
    return `You are a music recommendation AI. The user is looking for: "${genre}"\n\nInterpret this as a mood, vibe, genre, or natural language description. Suggest exactly 20 songs that perfectly match what the user wants.\n\n${JSON_FORMAT}`
  }
  // AUTO mode
  const ctx = []
  if (currentTrack?.title) ctx.push(`Current track: "${currentTrack.title}" by "${currentTrack.channelTitle || 'Unknown'}"`)
  if (queueTitles?.length > 0) ctx.push(`Queue: ${queueTitles.slice(0, 5).join(', ')}`)
  if (participantCount > 1) ctx.push(`${participantCount} people vibing together`)
  if (playlistContext?.length > 0) ctx.push(`User's playlists: ${playlistContext.slice(0, 6).join(', ')}`)
  return `You are a personalized music recommendation AI for a collaborative listening room.\n\n${ctx.join('\n') || 'No current context.'}\n\nGenerate exactly 20 diverse but cohesive recommendations matching the current vibe. Consider genre, energy, mood, and the social listening context.\n\n${JSON_FORMAT}`
}

export async function POST(request) {
  const { mode = 'auto', genre = '', userApiKey, currentTrack, queueTitles = [], participantCount = 1, playlistContext = [] } = await request.json()

  if (!userApiKey?.trim()) {
    return NextResponse.json({ error: 'Gemini API key required. Get yours free at aistudio.google.com/apikey' }, { status: 400 })
  }

  const prompt = buildPrompt(mode, genre, currentTrack, queueTitles, participantCount, playlistContext)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${userApiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

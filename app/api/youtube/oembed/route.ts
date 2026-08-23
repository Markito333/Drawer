import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    })
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch video' }, { status: res.status })

    const html = await res.text()

    const titleMatch = html.match(/<title>([^<]*)<\/title>/)
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'Video de YouTube'

    const thumbnailMatch = html.match(/"thumbnailUrl"\s*:\s*"([^"]+)"/)
    const thumbnailUrl = thumbnailMatch
      ? thumbnailMatch[1].replace(/\\/g, '')
      : null

    const authorMatch = html.match(/"author"\s*:\s*"[^"]*","name"\s*:\s*"([^"]+)"/)
    const author = authorMatch ? authorMatch[1] : ''

    const videoIdMatch = html.match(/\/vi\/([a-zA-Z0-9_-]{11})\//)
    const fallbackThumb = videoIdMatch
      ? `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`
      : null

    return NextResponse.json({
      title,
      thumbnail_url: thumbnailUrl || fallbackThumb,
      author_name: author,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

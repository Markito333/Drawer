import { NextResponse } from 'next/server'

function extractHandle(url: string): string | null {
  const patterns = [
    /(?:youtube\.com|youtu\.be)\/channel\/@([a-zA-Z0-9_-]+)/i,
    /(?:youtube\.com|youtu\.be)\/@([a-zA-Z0-9_-]+)/i,
    /(?:youtube\.com|youtu\.be)\/c\/([a-zA-Z0-9_-]+)/i,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function extractChannelId(url: string): string | null {
  const channelMatch = url.match(/(?:youtube\.com|youtu\.be)\/channel\/(UC[a-zA-Z0-9_-]{22})/i)
  if (channelMatch) return channelMatch[1]

  if (/^UC[a-zA-Z0-9_-]{22}$/.test(url.trim())) return url.trim()

  return null
}

async function resolveChannelId(channelIdOrHandle: string): Promise<string | null> {
  if (channelIdOrHandle.startsWith('UC') && channelIdOrHandle.length === 24) return channelIdOrHandle

  try {
    const pageUrl = `https://www.youtube.com/@${channelIdOrHandle}`
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
    })
    const html = await res.text()

    const match = html.match(/"channelId"\s*:\s*"([UC][a-zA-Z0-9_-]{22})"/)
    if (match) return match[1]

    const rssMatch = html.match(/href="[^"]*channel_id=([UC][a-zA-Z0-9_-]{22})"/i)
    if (rssMatch) return rssMatch[1]

    const ytInitialMatch = html.match(/ytInitialData\s*=\s*({.*?});\s*<\/script>/)
    if (ytInitialMatch) {
      try {
        const data = JSON.parse(ytInitialMatch[1])
        const cid = data?.metadata?.channelMetadataRenderer?.externalId
          || data?.header?.c4TabbedHeaderRenderer?.channelId
          || data?.sidebar?.playlistSidebarRenderer?.items?.[0]?.playlistSidebarPrimaryInfoRenderer?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId
        if (cid && cid.startsWith('UC')) return cid
      } catch { /* ignore parse errors */ }
    }

    return null
  } catch {
    return null
  }
}

interface VideoEntry {
  id: string
  title: string
  url: string
  thumbnail: string
  published: string
}

function extractAvatar(html: string): string | null {
  const imgMatch = html.match(/<link\s+rel="image_src"\s+href="([^"]+)"/i)
  if (imgMatch) return imgMatch[1]

  const ytInitialMatch = html.match(/ytInitialData\s*=\s*({.*?});\s*<\/script>/)
  if (ytInitialMatch) {
    try {
      const data = JSON.parse(ytInitialMatch[1])
      const avatar = data?.metadata?.channelMetadataRenderer?.avatar?.thumbnails?.[0]?.url
        || data?.header?.c4TabbedHeaderRenderer?.avatar?.thumbnails?.[0]?.url
      if (avatar) return avatar
    } catch { /* ignore */ }
  }

  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  try {
    let extracted = extractChannelId(url)
    let handle: string | null = null
    let channelPageHtml: string | null = null
    if (!extracted) {
      handle = extractHandle(url)
      if (!handle) return NextResponse.json({ error: 'Invalid YouTube channel URL' }, { status: 400 })
    }

    const channelId = extracted ? await resolveChannelId(extracted) : await resolveChannelId(handle!)
    if (!channelId) return NextResponse.json({ error: 'Could not resolve channel' }, { status: 404 })

    let avatar: string | null = null
    if (extracted || channelId.startsWith('UC')) {
      try {
        const pageRes = await fetch(`https://www.youtube.com/channel/${channelId}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        })
        channelPageHtml = await pageRes.text()
        avatar = extractAvatar(channelPageHtml)
      } catch { /* ignore */ }
    }
    if (!avatar && handle) {
      try {
        const pageRes = await fetch(`https://www.youtube.com/@${handle}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        })
        const html = await pageRes.text()
        avatar = extractAvatar(html)
      } catch { /* ignore */ }
    }

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const rssRes = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    if (!rssRes.ok) return NextResponse.json({ error: 'RSS feed failed' }, { status: rssRes.status })

    const xml = await rssRes.text()

    const entries: VideoEntry[] = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi
    let entryMatch: RegExpExecArray | null

    while ((entryMatch = entryRegex.exec(xml)) !== null && entries.length < 3) {
      const block = entryMatch[1]
      const idMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
      const titleMatch = block.match(/<title>([^<]+)<\/title>/)
      const publishedMatch = block.match(/<published>([^<]+)<\/published>/)
      if (!idMatch) continue

      entries.push({
        id: idMatch[1],
        title: titleMatch?.[1] ?? 'Sin título',
        url: `https://www.youtube.com/watch?v=${idMatch[1]}`,
        thumbnail: `https://img.youtube.com/vi/${idMatch[1]}/hqdefault.jpg`,
        published: publishedMatch?.[1] ?? '',
      })
    }

    return NextResponse.json({
      channelId,
      avatar,
      videos: entries.slice(0, 3),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 })
  }
}

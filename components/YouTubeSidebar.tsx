'use client'

import { useEffect, useState } from 'react'
import { extractYouTubeUrls, getYouTubeVideoId } from '@/lib/links'

interface VideoInfo {
  id: string
  url: string
  title: string
  thumbnail: string
  author: string
}

interface Props {
  content: string
}

export default function YouTubeSidebar({ content }: Props) {
  const [videos, setVideos] = useState<VideoInfo[]>([])

  useEffect(() => {
    const urls = extractYouTubeUrls(content)
    if (urls.length === 0) { setVideos([]); return }

    let cancelled = false
    const fetchVideos = async () => {
      const results: VideoInfo[] = []
      for (const url of urls) {
        const id = getYouTubeVideoId(url)
        if (!id) continue
        try {
          const res = await fetch(`/api/youtube/oembed?url=${encodeURIComponent(url)}`)
          const data = await res.json()
          results.push({
            id,
            url,
            title: data.title || 'Video de YouTube',
            thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            author: data.author_name || '',
          })
        } catch {
          results.push({
            id,
            url,
            title: 'Video de YouTube',
            thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            author: '',
          })
        }
      }
      if (!cancelled) setVideos(results)
    }
    fetchVideos()
    return () => { cancelled = true }
  }, [content])

  if (videos.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Videos</p>
      <div className="space-y-2">
        {videos.map(v => (
          <a
            key={v.id}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors bg-white dark:bg-zinc-900 shadow-sm"
          >
            <div className="relative">
              <img
                src={v.thumbnail}
                alt={v.title}
                className="w-full aspect-video object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                <svg className="w-10 h-10 text-white opacity-80 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug">{v.title}</p>
              {v.author && (
                <p className="text-[10px] text-zinc-400 mt-1">{v.author}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

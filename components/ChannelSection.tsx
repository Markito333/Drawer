'use client'

import { useEffect, useState } from 'react'
import CloseButton from './CloseButton'

interface ChannelVideo {
  id: string
  title: string
  url: string
  thumbnail: string
  published: string
}

interface ChannelData {
  avatar: string
  videos: ChannelVideo[]
}

interface Props {
  channels: { id: string; name?: string }[]
}

export default function ChannelSection({ channels }: Props) {
  const [channelData, setChannelData] = useState<Record<string, ChannelData>>({})
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (channels.length === 0) {
      setChannelData({})
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all(channels.map(async (ch) => {
      const url = ch.id.startsWith('http') ? ch.id : `https://www.youtube.com/channel/${ch.id}`
      try {
        const res = await fetch(`/api/youtube/channel?url=${encodeURIComponent(url)}`)
        const data = await res.json()
        return { id: ch.id, data: { avatar: data.avatar || '', videos: data.videos || [] } }
      } catch {
        return { id: ch.id, data: { avatar: '', videos: [] } }
      }
    })).then(results => {
      if (!cancelled) {
        const map: Record<string, ChannelData> = {}
        results.forEach(r => { map[r.id] = r.data })
        setChannelData(map)
      }
    }).finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [channels])

  if (channels.length === 0) return null

  const allVideos = channels.flatMap(ch => (channelData[ch.id]?.videos || []))
  const maxShow = 4
  const showAvatars = channels.slice(0, maxShow)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="relative flex items-center shrink-0 ml-1"
        title={`${channels.length} canal${channels.length !== 1 ? 'es' : ''} vinculado${channels.length !== 1 ? 's' : ''}`}
      >
        {showAvatars.map((ch, i) => (
          <div
            key={ch.id}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm bg-zinc-100 dark:bg-zinc-800"
            style={{ marginLeft: i > 0 ? '-10px' : '0', zIndex: showAvatars.length - i }}
          >
            {channelData[ch.id]?.avatar ? (
              <img src={channelData[ch.id].avatar!} alt={ch.name || 'Canal'} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                {ch.name ? ch.name.charAt(0).toUpperCase() : '?'}
              </span>
            )}
          </div>
        ))}
        {channels.length > maxShow && (
          <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 shadow-sm" style={{ marginLeft: '-10px' }}>
            +{channels.length - maxShow}
          </div>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40" onClick={() => setShowModal(false)}>
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl mx-4 p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Canales vinculados</p>
              <CloseButton onClick={() => setShowModal(false)} />
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <span className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-transparent animate-spin" />
              </div>
            )}

            {!loading && channels.map(ch => {
              const data = channelData[ch.id]
              const vids = data?.videos || []
              return (
                <div key={ch.id} className="mb-5 last:mb-0">
                  <div className="flex items-center gap-2 mb-2.5">
                    {data?.avatar && <img src={data.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />}
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{ch.name || ch.id}</p>
                  </div>
                  {vids.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {vids.map(v => (
                        <a
                          key={v.id}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex-shrink-0 w-52 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors bg-zinc-50 dark:bg-zinc-800/50"
                        >
                          <div className="relative">
                            <img src={v.thumbnail} alt={v.title} className="w-full aspect-video object-cover" loading="lazy" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                              <svg className="w-10 h-10 text-white opacity-80" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug">{v.title}</p>
                            {v.published && <p className="text-[10px] text-zinc-400 mt-1">{new Date(v.published).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 py-2">Sin videos disponibles</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

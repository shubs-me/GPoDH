import Link from 'next/link'
import Image from 'next/image'
import type { Video } from '@/lib/videos'
import { CATEGORY_LABELS } from '@/lib/videos'
import { plainText } from '@/components/ui/RichText'

const PALETTE = [
  { border: '#D4614A', text: '#F5A090' },
  { border: '#E09C2A', text: '#F5CC70' },
  { border: '#1A8070', text: '#70D5BF' },
  { border: '#2A6B8A', text: '#70B8D8' },
]

export default function VideoCard({ video, index = 0 }: { video: Video; index?: number }) {
  const palette = PALETTE[index % PALETTE.length]
  const thumb = video.thumbnailUrl
    ?? `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`

  return (
    <Link
      href={`/videos/${video.slug}`}
      className="video-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        textDecoration: 'none',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${palette.border}`,
        background: 'var(--bg-card)',
        overflow: 'hidden',
        transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0D1E1C', overflow: 'hidden' }}>
        <Image
          src={thumb}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          style={{ objectFit: 'cover', objectPosition: video.thumbnailPosition ?? 'center' }}
        />
        {/* Play overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.28)',
            transition: 'background var(--transition-fast)',
          }}
          className="video-card-overlay"
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={palette.border}>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>

        {/* Category pill */}
        {video.category && (
          <span
            style={{
              position: 'absolute',
              top: '0.625rem',
              left: '0.625rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '100px',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '0.5625rem',
              letterSpacing: '0.12em',
              color: palette.text,
              textTransform: 'uppercase',
            }}
          >
            {CATEGORY_LABELS[video.category]}
          </span>
        )}

        {/* Duration pill */}
        {video.duration && (
          <span
            style={{
              position: 'absolute',
              bottom: '0.625rem',
              right: '0.625rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              background: 'rgba(0,0,0,0.7)',
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '0.625rem',
              color: '#fff',
              letterSpacing: '0.05em',
            }}
          >
            {video.duration}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <p
          style={{
            fontFamily: 'var(--font-dm-mono, var(--font-mono))',
            fontSize: '0.625rem',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          {video.date}
        </p>

        <h3
          style={{
            fontFamily: 'var(--font-cormorant, var(--font-display))',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {video.title}
        </h3>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {plainText(video.description)}
        </p>

        <p
          style={{
            marginTop: 'auto',
            paddingTop: '0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--accent-teal)',
            fontFamily: 'var(--font-dm-sans, sans-serif)',
          }}
        >
          &#9654; Watch
        </p>
      </div>

      <style>{`
        .video-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important;
        }
        .video-card:hover .video-card-overlay {
          background: rgba(0,0,0,0.18) !important;
        }
      `}</style>
    </Link>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { plainText } from '@/components/ui/RichText'
import { Episode } from '@/lib/episodes'

interface EpisodeCardProps {
  episode: Episode
}

const CARD_PALETTES = [
  {
    border: '#D4614A',
    artworkBg: 'linear-gradient(145deg, #2C1510 0%, #6B2918 55%, #A03520 100%)',
    artworkText: '#F5A090',
  },
  {
    border: '#E09C2A',
    artworkBg: 'linear-gradient(145deg, #2A1A05 0%, #6B4510 55%, #9A6815 100%)',
    artworkText: '#F5CC70',
  },
  {
    border: '#1A8070',
    artworkBg: 'linear-gradient(145deg, #071A18 0%, #1A4A42 55%, #1A7060 100%)',
    artworkText: '#70D5BF',
  },
  {
    border: '#2A6B8A',
    artworkBg: 'linear-gradient(145deg, #071018 0%, #1A3A52 55%, #1A5A80 100%)',
    artworkText: '#70B8D8',
  },
]

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  const num = typeof episode.episodeNumber === 'number'
    ? episode.episodeNumber
    : parseInt(String(episode.episodeNumber)) || 0
  const palette = CARD_PALETTES[num % CARD_PALETTES.length]

  return (
    <Link
      href={`/episodes/${episode.slug}`}
      className="episode-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'var(--transition-slow)',
        boxShadow: 'var(--shadow-card)',
        textDecoration: 'none',
        color: 'inherit',
        borderTop: `3px solid ${palette.border}`,
      }}
    >
      {/* Artwork */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '1',
          background: episode.artworkUrl ? 'var(--bg-surface)' : palette.artworkBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {episode.artworkUrl ? (
          <Image
            src={episode.artworkUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 380px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '1rem',
              letterSpacing: '0.1em',
              color: palette.artworkText,
              fontWeight: 400,
            }}
          >
            GPODH
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.375rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1 }}>
        {/* Episode number + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: 'var(--accent-coral)',
              fontWeight: 400,
            }}
          >
            #{episode.episodeNumber}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {episode.date}
          </p>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: 'var(--font-cormorant, var(--font-display))',
            fontSize: '1.3125rem',
            fontWeight: 700,
            lineHeight: 1.25,
            color: 'var(--text-primary)',
          }}
        >
          {episode.title}
        </h3>

        {/* Guest */}
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {episode.guest} &middot; {episode.guestRole}
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {plainText(episode.description)}
        </p>

        {/* CTA */}
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--accent-coral)',
            fontWeight: 600,
            marginTop: '0.25rem',
          }}
        >
          &#8594; Listen
        </p>
      </div>

      <style>{`
        .episode-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-accent) !important;
          box-shadow: var(--shadow-elevated) !important;
        }
      `}</style>
    </Link>
  )
}

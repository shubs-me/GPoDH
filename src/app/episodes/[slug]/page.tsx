import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { withUtm } from '@/lib/utm'
import ConsultingBridge from '@/components/ui/ConsultingBridge'
import EmailSignup from '@/components/sections/EmailSignup'
import TranscriptToggle from '@/components/ui/TranscriptToggle'
import RelatedEpisodes from '@/components/ui/RelatedEpisodes'
import ShareButtons from '@/components/ui/ShareButtons'
import RichText from '@/components/ui/RichText'
import EpisodePlayer from '@/components/ui/EpisodePlayer'
import { episodes } from '@/lib/episodes'
import { PLATFORMS, SITE, SITE_URL } from '@/lib/constants'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return episodes.map((ep) => ({ slug: ep.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const episode = episodes.find((e) => e.slug === slug)
  if (!episode) return {}
  return {
    title: episode.title, // root template appends "| Global Perspectives on Digital Health"
    description: episode.description,
    openGraph: {
      type: 'article',
      title: episode.title,
      description: episode.description,
      url: `${SITE_URL}/episodes/${episode.slug}`,
      ...(episode.artworkUrl && { images: [episode.artworkUrl] }),
    },
    ...(episode.audioUrl && { other: { 'og:audio': episode.audioUrl } }),
  }
}

export default async function EpisodePage({ params }: Props) {
  const { slug } = await params
  const episode = episodes.find((e) => e.slug === slug)
  if (!episode) notFound()

  // Co-hosted episodes: show each guest with their own job title when any is set
  const guestRoles =
    (episode.guestFaces?.length ?? 0) > 1 && episode.guestFaces!.some((g) => g.role)
      ? episode.guestFaces!
      : null

  // Sort episodes by episode number so prev/next are always sequential
  const epSortKey = (n: number | string) => {
    const s = String(n)
    const num = parseFloat(s) || 0
    const letter = s.replace(/[^A-Za-z]/g, '').toLowerCase()
    return num + (letter ? (letter.charCodeAt(0) - 96) * 0.1 : 0)
  }
  const sorted = [...episodes].sort((a, b) => epSortKey(a.episodeNumber ?? 0) - epSortKey(b.episodeNumber ?? 0))
  const currentIndex = sorted.findIndex((e) => e.id === episode.id)
  const prevEpisode = currentIndex > 0 ? sorted[currentIndex - 1] : null
  const nextEpisode = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null

  const episodeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: episode.title,
    description: episode.description,
    url: `${SITE_URL}/episodes/${episode.slug}`,
    ...(episode.episodeNumber && { episodeNumber: episode.episodeNumber }),
    ...(episode.artworkUrl && { image: episode.artworkUrl }),
    partOfSeries: { '@type': 'PodcastSeries', name: SITE.name, url: SITE_URL },
    ...(episode.audioUrl && {
      associatedMedia: { '@type': 'MediaObject', contentUrl: episode.audioUrl },
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(episodeJsonLd) }}
      />
      {/* ——— Hero ——— */}
      <section
        style={{
          padding: '7rem var(--gutter) 4rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left */}
          <div>
            {/* Breadcrumb + prev/next nav */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <Link
                href="/episodes"
                style={{
                  fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
              >
                &#8592; All episodes
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {prevEpisode ? (
                  <Link
                    href={`/episodes/${prevEpisode.slug}`}
                    title={`Ep ${prevEpisode.episodeNumber}: ${prevEpisode.title}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                    }}
                    className="ep-nav-link"
                  >
                    &#8592; Ep {prevEpisode.episodeNumber}
                  </Link>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      padding: '0.35rem 0.75rem',
                      border: '1px solid transparent',
                      fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                      fontSize: '0.6875rem',
                      color: 'transparent',
                      userSelect: 'none',
                    }}
                    aria-hidden="true"
                  >
                    &#8592; Ep 0
                  </span>
                )}

                {nextEpisode ? (
                  <Link
                    href={`/episodes/${nextEpisode.slug}`}
                    title={`Ep ${nextEpisode.episodeNumber}: ${nextEpisode.title}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.75rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                    }}
                    className="ep-nav-link"
                  >
                    Ep {nextEpisode.episodeNumber} &#8594;
                  </Link>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      padding: '0.35rem 0.75rem',
                      border: '1px solid transparent',
                      fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                      fontSize: '0.6875rem',
                      color: 'transparent',
                      userSelect: 'none',
                    }}
                    aria-hidden="true"
                  >
                    Ep 0 &#8594;
                  </span>
                )}
              </div>
            </div>

            {/* Eyebrow */}
            <p
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.15em',
                color: 'var(--accent-coral)',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              {episode.episodeNumber ? `Episode ${episode.episodeNumber}` : 'Episode'}
              {' · '}{episode.country}
            </p>

            {/* Title */}
            <h1
              style={{
                fontFamily: 'var(--font-cormorant, var(--font-display))',
                fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                marginBottom: '1.25rem',
              }}
            >
              {episode.title}
            </h1>

            {/* Guest */}
            <p
              style={{
                fontSize: '1.0625rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              {guestRoles ? (
                guestRoles.map((g) => (
                  <span key={g.name} style={{ display: 'block' }}>
                    <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{g.name}</strong>
                    {g.role && <> {' · '}{g.role}</>}
                  </span>
                ))
              ) : (
                <>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {episode.guest}
                  </strong>
                  {' · '}
                  {episode.guestRole}
                </>
              )}
            </p>

            {/* Meta */}
            <p
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '2rem',
              }}
            >
              {episode.date}
              {episode.duration && ` · ${episode.duration}`}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <p
                style={{
                  fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Listen on your preferred channel
              </p>

              {/* Platform links */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <a
                  href={withUtm(PLATFORMS.apple, { campaign: 'episode', content: 'platform-apple' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                  className="platform-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4zm0 14a6 6 0 0 0 6-6h2a8 8 0 0 1-7 7.93V20h3v2H8v-2h3v-3.07A8 8 0 0 1 4 10h2a6 6 0 0 0 6 6z"/>
                  </svg>
                  Apple Podcasts
                </a>
                <a
                  href={withUtm(PLATFORMS.spotify, { campaign: 'episode', content: 'platform-spotify' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                  className="platform-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Spotify
                </a>
                <a
                  href={withUtm(PLATFORMS.youtube, { campaign: 'episode', content: 'platform-youtube' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                  className="platform-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </a>
              </div>
            </div>
          </div>

          {/* Right: artwork */}
          <div
            style={{
              position: 'relative',
              aspectRatio: '1',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '420px',
              width: '100%',
              margin: '0 auto',
              border: '1px solid var(--border)',
            }}
          >
            {episode.splitHeroPhotos && (episode.guestFaces?.length ?? 0) > 1 ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${episode.guestFaces!.length}, 1fr)`,
                  gap: '2px',
                  background: 'var(--border)',
                }}
              >
                {episode.guestFaces!.map((g) => (
                  <div key={g.name} style={{ position: 'relative' }}>
                    <Image
                      src={g.artworkUrl}
                      alt={g.name}
                      fill
                      sizes="210px"
                      style={{ objectFit: 'cover', objectPosition: g.artworkPosition ?? 'center top' }}
                    />
                  </div>
                ))}
              </div>
            ) : episode.artworkUrl ? (
              <Image
                src={episode.artworkUrl}
                alt={episode.title}
                fill
                sizes="420px"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                    fontSize: '1rem',
                    letterSpacing: '0.15em',
                    color: 'var(--text-muted)',
                    display: 'block',
                    marginBottom: '0.75rem',
                  }}
                >
                  GPODH
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-cormorant, var(--font-display))',
                    fontSize: '1.25rem',
                    fontStyle: 'italic',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    display: 'block',
                  }}
                >
                  {episode.guest}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ——— 1. Podcast player ——— */}
      <section
        style={{
          padding: '3rem var(--gutter)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '0.6875rem',
              letterSpacing: '0.12em',
              color: 'var(--accent-coral)',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            Listen
          </p>
          <EpisodePlayer
            transistorUrl={episode.transistorUrl}
            spotifyEpisodeId={episode.spotifyEpisodeId}
            youtubeVideoId={episode.youtubeVideoId}
            title={episode.title}
            applePodcastsUrl={PLATFORMS.apple}
            spotifyShowUrl={PLATFORMS.spotify}
            youtubeShowUrl={PLATFORMS.youtube}
          />
        </div>
      </section>

      {/* ——— 2. Teaser video (only when teaserVideoUrl is set) ——— */}
      {episode.teaserVideoUrl && (
        <section
          style={{
            padding: '3rem var(--gutter)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                color: 'var(--accent-coral)',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              Watch
            </p>
            <div
              style={{
                maxWidth: '800px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(episode.teaserVideoUrl) ? (
                // Direct video file
                <video
                  src={episode.teaserVideoUrl}
                  controls
                  playsInline
                  style={{ width: '100%', display: 'block', borderRadius: 'var(--radius-md)' }}
                />
              ) : (
                // Embeddable iframe (YouTube, Vimeo, Substack, etc.)
                <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
                  <iframe
                    src={episode.teaserVideoUrl}
                    title={`${episode.title} — teaser`}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ——— Overview ——— */}
      <section style={{ padding: '5rem var(--gutter)' }}>
        <div
          style={{
            maxWidth: 'var(--max-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: '4rem',
          }}
        >
          {/* Description */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                color: 'var(--accent-coral)',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              About this episode
            </p>
            <p
              style={{
                fontSize: '1.0625rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                marginBottom: '1.5rem',
              }}
            >
              {episode.description}
            </p>

            {/* Theme tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: episode.pullQuote ? '2rem' : 0 }}>
              {episode.themes.map((theme) => (
                <Link
                  key={theme}
                  href={`/episodes?theme=${encodeURIComponent(theme)}`}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '100px',
                    border: '1px solid var(--border)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-dm-sans, sans-serif)',
                    transition: 'all var(--transition-fast)',
                  }}
                  className="theme-tag"
                >
                  {theme}
                </Link>
              ))}
            </div>

            {/* Pull quote */}
            {episode.pullQuote && (
              <blockquote
                style={{
                  background: 'var(--accent-coral)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem 2.25rem',
                  margin: 0,
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant, var(--font-display))',
                    fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
                    fontWeight: 600,
                    fontStyle: 'italic',
                    color: '#ffffff',
                    lineHeight: 1.45,
                    margin: '0 0 1rem',
                  }}
                >
                  &ldquo;{episode.pullQuote}&rdquo;
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.65)',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  {episode.guest}
                </p>
              </blockquote>
            )}
          </div>

          {/* Topics */}
          {episode.topics && episode.topics.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.12em',
                  color: 'var(--accent-coral)',
                  textTransform: 'uppercase',
                  marginBottom: '1.25rem',
                }}
              >
                What we cover
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {episode.topics.map((topic, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '0.875rem',
                      alignItems: 'flex-start',
                      fontSize: '0.9375rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--accent-coral)',
                        fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                        fontSize: '0.625rem',
                        marginTop: '0.35rem',
                        flexShrink: 0,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Guest bio */}
        {episode.bio && (
          <div
            style={{
              maxWidth: 'var(--max-width)',
              margin: '4rem auto 0',
              paddingTop: '4rem',
              borderTop: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: '3rem',
              alignItems: 'start',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.12em',
                  color: 'var(--accent-coral)',
                  textTransform: 'uppercase',
                  marginBottom: '1rem',
                }}
              >
                About the guest
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-cormorant, var(--font-display))',
                  fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                  lineHeight: 1.2,
                }}
              >
                {episode.guest}
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {guestRoles
                  ? guestRoles.map((g) => (g.role ? `${g.name}: ${g.role}` : g.name)).join(' · ')
                  : episode.guestRole}
              </p>
            </div>
            <div>
              <RichText
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  marginBottom: episode.guestLinkedIn ? '1.25rem' : 0,
                }}
              >
                {episode.bio}
              </RichText>
              {episode.guestLinkedIn && (
                <a
                  href={withUtm(episode.guestLinkedIn, { campaign: 'episode', content: 'guest-linkedin' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                    letterSpacing: '0.08em',
                    color: 'var(--accent-coral)',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ——— Chapters timeline ——— */}
      {episode.timestamps && episode.timestamps.length > 0 && (
        <section
          style={{
            padding: '3rem var(--gutter)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                color: 'var(--accent-coral)',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              Chapters
            </p>

            {/* Timeline — two-column grid on wider screens */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: '0',
              }}
            >
              {episode.timestamps.map((ts, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.75rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                      fontSize: '0.625rem',
                      letterSpacing: '0.1em',
                      color: 'var(--accent-coral)',
                      flexShrink: 0,
                      minWidth: '3.5rem',
                    }}
                  >
                    {ts.time}
                  </span>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {ts.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ——— Video ——— */}
      {episode.youtubeVideoId && (episode.transistorUrl || episode.spotifyEpisodeId) && (
        <section
          style={{
            padding: '5rem var(--gutter)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                gap: '2rem',
                alignItems: 'center',
              }}
            >
              {/* Video embed — constrained to roughly half the page */}
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.12em',
                    color: 'var(--accent-coral)',
                    textTransform: 'uppercase',
                    marginBottom: '1rem',
                  }}
                >
                  Watch
                </p>
                <div
                  style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    height: 0,
                    overflow: 'hidden',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${episode.youtubeVideoId}`}
                    title={`Watch ${episode.title} on YouTube`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Right: call to action */}
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-cormorant, var(--font-display))',
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    marginBottom: '0.75rem',
                  }}
                >
                  Prefer to watch?
                </p>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    marginBottom: '1.25rem',
                  }}
                >
                  This episode is also available as a full video on YouTube.
                </p>
                <a
                  href={withUtm(`https://www.youtube.com/watch?v=${episode.youtubeVideoId}`, { campaign: 'episode', content: 'watch-youtube' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.875rem',
                    color: 'var(--accent-coral)',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-dm-sans, sans-serif)',
                  }}
                >
                  Open on YouTube &#8599;
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ——— Transcript ——— */}
      <section
        style={{
          padding: '5rem var(--gutter)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '0.6875rem',
              letterSpacing: '0.12em',
              color: 'var(--accent-coral)',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            Transcript
          </p>

          {episode.transcript ? (
            <TranscriptToggle transcript={episode.transcript} guest={episode.guest} />
          ) : (
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                fontFamily: 'var(--font-dm-sans, sans-serif)',
              }}
            >
              Transcript coming soon.
            </p>
          )}
        </div>
      </section>

      {/* ——— Consulting bridge ——— */}
      <section
        style={{
          background: 'var(--bg-secondary)',
          padding: '5rem var(--gutter)',
          borderTop: '2px solid var(--accent-coral)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                color: 'var(--accent-coral)',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Working in digital health?
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-cormorant, var(--font-display))',
                fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
              }}
            >
              Heard something relevant to your work?
            </h2>
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                maxWidth: '44ch',
              }}
            >
              Shubs consults on clinical leadership, evidence strategy, and digital health market access. If this conversation sparked something, it is worth a conversation.
            </p>
          </div>
          <div>
            <ConsultingBridge variant="card" />
          </div>
        </div>
      </section>

      {/* ——— Share ——— */}
      <ShareButtons path={`/episodes/${episode.slug}`} title={episode.title} guest={episode.guest} />

      {/* ——— Related episodes ——— */}
      <RelatedEpisodes episode={episode} />

      {/* ——— Email signup ——— */}
      <EmailSignup />

      <style>{`
        .theme-tag:hover {
          border-color: var(--accent-coral) !important;
          color: var(--accent-coral) !important;
        }
        .ep-nav-link:hover {
          border-color: var(--accent-coral) !important;
          color: var(--accent-coral) !important;
        }
        .platform-link:hover {
          color: var(--accent-coral) !important;
        }
      `}</style>
    </>
  )
}

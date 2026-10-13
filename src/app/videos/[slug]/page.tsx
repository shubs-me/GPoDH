import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ShareButtons from '@/components/ui/ShareButtons'
import VideoCard from '@/components/ui/VideoCard'
import EmailSignup from '@/components/sections/EmailSignup'
import RichText, { plainText } from '@/components/ui/RichText'
import TranscriptToggle from '@/components/ui/TranscriptToggle'
import { videos, CATEGORY_LABELS } from '@/lib/videos'
import { videoTranscripts } from '@/lib/video-transcripts'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return videos.map((v) => ({ slug: v.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const video = videos.find((v) => v.slug === slug)
  if (!video) return {}
  const thumb = `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`
  return {
    title: video.title, // root template appends "| Global Perspectives on Digital Health"
    description: plainText(video.description),
    openGraph: {
      type: 'video.other',
      title: video.title,
      description: plainText(video.description),
      images: [thumb],
    },
  }
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params
  const video = videos.find((v) => v.slug === slug)
  if (!video) notFound()

  const related = videos
    .filter((v) => v.id !== video.id)
    .slice(0, 3)

  // Prefer an editor-entered transcript from the CMS; fall back to the bundled
  // transcript library. (Matches the merge order used by video search.)
  const transcript = video.transcript ?? videoTranscripts[video.slug]

  return (
    <>
      {/* ——— Hero ——— */}
      <section style={{ padding: '7rem var(--gutter) 3rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <Link
              href="/videos"
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              &#8592; All videos
            </Link>
            {video.category && (
              <>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span
                  style={{
                    fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.12em',
                    color: 'var(--accent-coral)',
                    textTransform: 'uppercase',
                  }}
                >
                  {CATEGORY_LABELS[video.category]}
                </span>
              </>
            )}
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-cormorant, var(--font-display))',
              fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              maxWidth: '22ch',
            }}
          >
            {video.title}
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '0.6875rem',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {video.date}
            {video.duration && ` · ${video.duration}`}
          </p>
        </div>
      </section>

      {/* ——— Embed ——— */}
      <section style={{ padding: '3rem var(--gutter)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <div
            style={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              overflow: 'hidden',
              borderRadius: 'var(--radius-lg)',
              background: '#0D1E1C',
            }}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}?rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="eager"
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
      </section>

      {/* ——— Description ——— */}
      <section style={{ padding: '4rem var(--gutter)', borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            maxWidth: 'var(--max-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: '4rem',
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
              About this video
            </p>
            <RichText
              style={{
                fontSize: '1.0625rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
              }}
            >
              {video.description}
            </RichText>
          </div>

          {video.tags && video.tags.length > 0 && (
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
                Topics
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '100px',
                      border: '1px solid var(--border)',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-dm-sans, sans-serif)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ——— Transcript ——— */}
      {transcript && (
        <section style={{ padding: '4rem var(--gutter)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                color: 'var(--accent-coral)',
                textTransform: 'uppercase',
                marginBottom: '1.5rem',
              }}
            >
              Transcript
            </p>
            <TranscriptToggle transcript={transcript} />
          </div>
        </section>
      )}

      {/* ——— Share ——— */}
      <ShareButtons path={`/videos/${video.slug}`} title={video.title} guest="GPODH" />

      {/* ——— More videos ——— */}
      {related.length > 0 && (
        <section style={{ padding: '5rem var(--gutter)' }}>
          <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
            <p
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                color: 'var(--accent-coral)',
                textTransform: 'uppercase',
                marginBottom: '2rem',
              }}
            >
              More videos
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                gap: '1.5rem',
              }}
            >
              {related.map((v, i) => (
                <VideoCard key={v.id} video={v} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <EmailSignup />
    </>
  )
}

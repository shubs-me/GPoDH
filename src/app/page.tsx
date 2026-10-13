import Link from 'next/link'
import Image from 'next/image'
import LatestEpisodesCarousel from '@/components/sections/LatestEpisodesCarousel'
import LatestVideosCarousel from '@/components/sections/LatestVideosCarousel'
import ScrollReveal from '@/components/ui/ScrollReveal'
import RichText from '@/components/ui/RichText'
import EmailSignup from '@/components/sections/EmailSignup'
import GlobeSection from '@/components/sections/GlobeSection'
import HeroGlobeWrapper from '@/components/ui/HeroGlobeWrapper'
import OrgMarquee from '@/components/ui/OrgMarquee'
import HostIntroStrip from '@/components/ui/HostIntroStrip'
import TrailerModal from '@/components/ui/TrailerModal'
import FeaturedEpisodeBanner from '@/components/ui/FeaturedEpisodeBanner'
import type { Metadata } from 'next'
import { episodes } from '@/lib/episodes'
import { videos } from '@/lib/videos'
import content from '@/data/site/home.json'

export const metadata: Metadata = {
  title: { absolute: content.meta.title },
  description: content.meta.description,
}

// Editable copy lives in src/data/site/home.json. The arrays below hold the
// design-only parts (accent colours, SVG icons, animations) that stay fixed in
// code, zipped onto the editable text by index.
const showCardAccents = ['var(--accent-coral)', 'var(--accent-amber)', '#3EC9A7']

const personaDesign = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
    accent: 'var(--accent-coral)',
    borderColor: 'rgba(212,97,74,0.35)',
    motionClass: 'icon-heartbeat',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21h6M12 3C8.686 3 6 5.686 6 9c0 2.21 1.197 4.14 3 5.197V17a1 1 0 001 1h4a1 1 0 001-1v-2.803C16.803 13.14 18 11.21 18 9c0-3.314-2.686-6-6-6z"/>
      </svg>
    ),
    accent: 'var(--accent-amber)',
    borderColor: 'rgba(224,156,42,0.35)',
    motionClass: 'icon-glow',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    accent: '#3EC9A7',
    borderColor: 'rgba(62,201,167,0.35)',
    motionClass: 'icon-spin',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    accent: '#5BB8D4',
    borderColor: 'rgba(91,184,212,0.35)',
    motionClass: 'icon-float',
  },
]

const { hero, about, showCards, promo, whoListens, testimonials, orgMarquee, latestEpisodes: latestCopy, featuredVideos, finalCta } = content
const listenerPersonas = whoListens.personas.map((p, i) => ({ ...p, ...personaDesign[i] }))

export default function HomePage() {
  const latestEpisodes = [...episodes]
    .sort((a, b) => (Number(b.episodeNumber) || 0) - (Number(a.episodeNumber) || 0))
    .slice(0, 10)

  // Featured banner: an explicitly flagged episode, otherwise the newest.
  const featuredEpisode = episodes.find((e) => e.featured) ?? latestEpisodes[0]


  return (
    <>
      {/* ——— Hero ——— */}
      <section
        style={{
          // Cap the hero height so content doesn't float in a huge empty band on
          // tall monitors — full-screen on short viewports, capped on big ones.
          minHeight: 'min(100svh, 720px)',
          display: 'flex',
          alignItems: 'center',
          padding: '7rem var(--gutter) 3rem',
          background: 'radial-gradient(ellipse at 90% 10%, rgba(212,97,74,0.07) 0%, transparent 55%), radial-gradient(ellipse at 5% 85%, rgba(224,156,42,0.05) 0%, transparent 50%), var(--bg-primary)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--max-width)',
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left */}
          <div>
            <p
              className="animate-fade-up"
              style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.15em',
                color: 'var(--accent-coral)',
                textTransform: 'uppercase',
                marginBottom: '1.5rem',
                animationDelay: '0ms',
              }}
            >
              {hero.eyebrow}
            </p>
            <h1
              className="animate-fade-up"
              style={{
                fontFamily: 'var(--font-cormorant, var(--font-display))',
                fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                fontWeight: 700,
                lineHeight: 1.05,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                animationDelay: '100ms',
              }}
            >
              {hero.title}
            </h1>
            <p
              className="animate-fade-up"
              style={{
                fontFamily: 'var(--font-cormorant, var(--font-display))',
                fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--text-secondary)',
                marginBottom: '1.75rem',
                lineHeight: 1.4,
                animationDelay: '160ms',
              }}
            >
              {hero.subtitle}
            </p>
            <div
              className="animate-fade-up"
              style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', animationDelay: '350ms' }}
            >
              <Link
                href={hero.primaryCta.href}
                style={{
                  display: 'inline-block',
                  padding: '0.875rem 1.75rem',
                  background: 'var(--accent-coral)',
                  color: '#fff',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {hero.primaryCta.text}
              </Link>
              <a
                href={hero.secondaryCta.href}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {hero.secondaryCta.text}
              </a>
            </div>
          </div>

          {/* Right: animated hero globe */}
          <div
            className="animate-fade-up"
            style={{
              aspectRatio: '1',
              maxWidth: '480px',
              width: '100%',
              margin: '0 auto',
              animationDelay: '300ms',
            }}
          >
            <HeroGlobeWrapper />
          </div>
        </div>
      </section>

      {/* ——— Featured latest episode banner ——— */}
      {featuredEpisode && <FeaturedEpisodeBanner episode={featuredEpisode} />}

      {/* ——— Gradient divider ——— */}
      <div style={{ height: '3px', background: 'linear-gradient(to right, var(--accent-coral), #3EC9A7, var(--accent-coral))' }} />

      {/* ——— About the Show ——— */}
      <section
        id="about-section"
        style={{
          padding: '5rem var(--gutter)',
          background: 'radial-gradient(ellipse at 0% 80%, rgba(212,97,74,0.06) 0%, transparent 55%), var(--bg-primary)',
        }}
      >
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
              gap: '3.5rem',
              alignItems: 'center',
              marginBottom: '3rem',
            }}
          >
            {/* Text */}
            <div>
              <ScrollReveal>
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
                  {about.eyebrow}
                </p>
              </ScrollReveal>
              <ScrollReveal delay={80}>
                <h2
                  style={{
                    fontFamily: 'var(--font-cormorant, var(--font-display))',
                    fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                    marginBottom: '2rem',
                  }}
                >
                  {about.heading}
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={130}>
                <RichText style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem' }}>
                  {about.body1}
                </RichText>
              </ScrollReveal>
              <ScrollReveal delay={160}>
                <RichText style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {about.body2}
                </RichText>
              </ScrollReveal>
            </div>

            {/* Trailer video */}
            <ScrollReveal delay={200}>
              <p
                style={{
                  fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                  fontSize: '0.6rem',
                  letterSpacing: '0.14em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.75rem',
                }}
              >
                {about.trailerLabel}
              </p>
              <TrailerModal copy={about.trailer} />
            </ScrollReveal>
          </div>

          {/* Three question cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '1.5rem',
            }}
          >
            {showCards.map((card, i) => (
              <ScrollReveal key={card.eyebrow} delay={i * 80}>
                <div
                  style={{
                    position: 'relative',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderTop: `4px solid ${showCardAccents[i]}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '2.25rem',
                    height: '100%',
                    overflow: 'hidden',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  }}
                >
                  <span aria-hidden style={{
                    position: 'absolute',
                    bottom: '-0.75rem',
                    right: '1.25rem',
                    fontSize: '9rem',
                    fontFamily: 'var(--font-cormorant, serif)',
                    fontWeight: 700,
                    color: showCardAccents[i],
                    opacity: 0.07,
                    lineHeight: 1,
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}>?</span>
                  <p
                    style={{
                      fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.15em',
                      color: showCardAccents[i],
                      textTransform: 'uppercase',
                      marginBottom: '1rem',
                    }}
                  >
                    {card.eyebrow}
                  </p>
                  <p style={{
                    color: 'var(--text-primary)',
                    lineHeight: 1.65,
                    fontSize: 'clamp(0.9375rem, 1.5vw, 1.0625rem)',
                    fontWeight: 500,
                    position: 'relative',
                  }}>
                    {card.text}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Compact host intro ——— */}
      <HostIntroStrip />

      {/* ——— Promo photo strip ——— */}
      <section className="promo-strip" style={{ position: 'relative', overflow: 'hidden', height: 'clamp(340px, 42vw, 540px)' }}>
        <Image
          src={promo.image}
          alt={promo.alt}
          fill
          // Faces sit ~45-50% down the frame (lots of wall above them), so centre
          // the crop there and use a taller strip to show more of both people.
          style={{ objectFit: 'cover', objectPosition: 'center 50%' }}
          sizes="100vw"
        />
        {/* Right-side gradient — Shubs is on the left, text sits on the darkened right */}
        <div className="promo-grad" style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to left, rgba(15,12,10,0.82) 0%, rgba(15,12,10,0.6) 40%, rgba(15,12,10,0.08) 68%, transparent 100%)',
        }} />
        <div className="promo-outer" style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--gutter)',
        }}>
          <div className="promo-inner" style={{ maxWidth: 'var(--max-width)', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
            <div className="promo-text" style={{ maxWidth: '460px', textAlign: 'right' }}>
              <p style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.625rem',
                letterSpacing: '0.16em',
                color: 'var(--accent-coral)',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}>
                {promo.eyebrow}
              </p>
              <blockquote style={{
                fontFamily: 'var(--font-cormorant, var(--font-display))',
                fontSize: 'clamp(1.5rem, 2.8vw, 2.5rem)',
                fontWeight: 700,
                fontStyle: 'italic',
                color: '#fff',
                lineHeight: 1.2,
                margin: '0 0 1.25rem',
              }}>
                &ldquo;{promo.quote}&rdquo;
              </blockquote>
              <p style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
              }}>
                {promo.attribution}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Who listens ——— */}
      <style>{`
        /* Promo photo strip: on phones the right-aligned quote crowds the frame.
           Anchor it bottom-left, full width, over a bottom-up gradient. */
        @media (max-width: 640px) {
          .promo-grad { background: linear-gradient(to top, rgba(15,12,10,0.92) 0%, rgba(15,12,10,0.5) 45%, rgba(15,12,10,0.12) 78%, transparent 100%) !important; }
          .promo-outer { align-items: flex-end !important; padding-bottom: 1.75rem !important; }
          .promo-inner { justify-content: flex-start !important; }
          .promo-text { max-width: 100% !important; text-align: left !important; }
        }
        @keyframes heartbeat {
          0%, 60%, 100% { transform: scale(1); }
          50%            { transform: scale(1.22); }
          55%            { transform: scale(1.1); }
        }
        .icon-heartbeat { animation: heartbeat 2.2s ease-in-out infinite; }

        @keyframes bulb-blink {
          0%, 3%    { opacity: 0.15; filter: none; }
          12%, 62%  { opacity: 1; filter: drop-shadow(0 0 8px rgba(224,156,42,0.9)) drop-shadow(0 0 20px rgba(224,156,42,0.35)); }
          67%       { opacity: 0.08; filter: none; }
          70%       { opacity: 0.85; filter: drop-shadow(0 0 5px rgba(224,156,42,0.6)); }
          73%       { opacity: 0.08; filter: none; }
          78%, 97%  { opacity: 1; filter: drop-shadow(0 0 8px rgba(224,156,42,0.9)) drop-shadow(0 0 20px rgba(224,156,42,0.35)); }
          100%      { opacity: 0.15; filter: none; }
        }
        .icon-glow { animation: bulb-blink 5s ease-in-out infinite; }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .icon-spin { animation: spin-slow 14s linear infinite; }

        @keyframes draw-main {
          0%, 5%    { stroke-dashoffset: 40; }
          40%, 75%  { stroke-dashoffset: 0; }
          90%, 100% { stroke-dashoffset: 40; }
        }
        @keyframes draw-arrow {
          0%, 18%   { stroke-dashoffset: 15; }
          50%, 75%  { stroke-dashoffset: 0; }
          90%, 100% { stroke-dashoffset: 15; }
        }
        .icon-float svg polyline:first-child {
          stroke-dasharray: 40;
          animation: draw-main 3.5s ease-in-out infinite;
        }
        .icon-float svg polyline:last-child {
          stroke-dasharray: 15;
          animation: draw-arrow 3.5s ease-in-out infinite;
        }
      `}</style>
      <section
        style={{
          background: 'var(--bg-dark)',
          padding: '6rem var(--gutter)',
        }}
      >
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>

          <ScrollReveal>
            <div style={{ marginBottom: '3.5rem' }}>
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
                {whoListens.eyebrow}
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-cormorant, var(--font-display))',
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.2,
                  maxWidth: '36rem',
                }}
              >
                {whoListens.heading}
              </h2>
            </div>
          </ScrollReveal>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '1.25rem',
              marginBottom: '4rem',
            }}
          >
            {listenerPersonas.map((persona, i) => (
              <ScrollReveal key={persona.label} delay={i * 70}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '2.25rem 1.5rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${persona.borderColor}`,
                    borderRadius: 'var(--radius-lg)',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      border: `2px solid ${persona.accent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1.25rem',
                      color: persona.accent,
                      flexShrink: 0,
                    }}
                  >
                    <div className={persona.motionClass} style={{ display: 'flex' }}>
                      {persona.icon}
                    </div>
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-cormorant, var(--font-display))',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: '#ffffff',
                      marginBottom: '0.5rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {persona.label}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.6 }}>
                    {persona.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', justifyContent: 'center', marginTop: '0.875rem' }}>
                    {persona.tags.map(tag => (
                      <span key={tag} style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '100px',
                        border: `1px solid ${persona.accent}`,
                        fontSize: '0.6875rem',
                        color: persona.accent,
                        fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                        letterSpacing: '0.05em',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ——— Testimonials ——— */}
      <section style={{ background: 'linear-gradient(120deg, #C4522A 0%, #D4614A 40%, #C9933A 100%)', padding: '4rem var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <ScrollReveal>
            <p style={{
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '0.625rem',
              letterSpacing: '0.16em',
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              marginBottom: '2.5rem',
              textAlign: 'center',
            }}>
              {testimonials.eyebrow}
            </p>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
            {testimonials.quotes.map((quote, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <blockquote style={{ borderLeft: '3px solid rgba(255,255,255,0.4)', paddingLeft: '1.5rem' }}>
                  <p style={{
                    fontFamily: 'var(--font-cormorant, var(--font-display))',
                    fontSize: '1.25rem',
                    fontStyle: 'italic',
                    color: '#ffffff',
                    lineHeight: 1.6,
                  }}>
                    &ldquo;{quote}&rdquo;
                  </p>
                </blockquote>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Globe ——— */}
      <GlobeSection />

      {/* ——— Org Marquee ——— */}
      <div>
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-dm-mono, var(--font-mono))',
          fontSize: '0.625rem',
          letterSpacing: '0.14em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          padding: '2rem 0 0.75rem',
        }}>
          {orgMarquee.label}
        </p>
        <OrgMarquee />
      </div>

      {/* ——— Latest Episodes ——— */}
      <section style={{ padding: '5rem var(--gutter)', background: 'radial-gradient(ellipse at 100% 0%, rgba(62,201,167,0.06) 0%, transparent 55%), var(--bg-primary)' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '2.5rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <ScrollReveal>
                <p
                  style={{
                    fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.12em',
                    color: 'var(--accent-coral)',
                    textTransform: 'uppercase',
                    marginBottom: '0.625rem',
                  }}
                >
                  {latestCopy.eyebrow}
                </p>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <h2
                  style={{
                    fontFamily: 'var(--font-cormorant, var(--font-display))',
                    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {latestCopy.heading}
                </h2>
              </ScrollReveal>
            </div>
            <Link
              href="/episodes"
              style={{
                fontSize: '0.875rem',
                color: 'var(--accent-coral)',
                textDecoration: 'none',
              }}
            >
              {latestCopy.linkText}
            </Link>
          </div>

          <LatestEpisodesCarousel episodes={latestEpisodes} />
        </div>
      </section>

      {/* ——— Featured Videos ——— */}
      {videos.length > 0 && (
        <section
          style={{
            padding: '5rem var(--gutter)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '2.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <ScrollReveal>
                  <p
                    style={{
                      fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.12em',
                      color: 'var(--accent-coral)',
                      textTransform: 'uppercase',
                      marginBottom: '0.625rem',
                    }}
                  >
                    {featuredVideos.eyebrow}
                  </p>
                </ScrollReveal>
                <ScrollReveal delay={100}>
                  <h2
                    style={{
                      fontFamily: 'var(--font-cormorant, var(--font-display))',
                      fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {featuredVideos.heading}
                  </h2>
                </ScrollReveal>
              </div>
              <Link
                href="/videos"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--accent-coral)',
                  textDecoration: 'none',
                }}
              >
                {featuredVideos.linkText}
              </Link>
            </div>

            <ScrollReveal>
              <LatestVideosCarousel videos={videos.slice(0, 10)} />
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ——— Email Subscribe ——— */}
      <EmailSignup />

      {/* ——— Platform Follow ——— */}
      <section
        style={{
          padding: '5rem var(--gutter)',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          background: 'var(--bg-secondary)',
        }}
      >
        <ScrollReveal>
          <p
            style={{
              fontFamily: 'var(--font-cormorant, var(--font-display))',
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
              lineHeight: 1.2,
            }}
          >
            {finalCta.heading}
          </p>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'var(--text-secondary)',
              marginBottom: '2rem',
            }}
          >
            {finalCta.body}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <Link
              href={finalCta.buttonHref}
              style={{
                display: 'inline-block',
                padding: '0.875rem 1.75rem',
                background: 'var(--accent-coral)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9375rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              {finalCta.buttonText}
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  )
}

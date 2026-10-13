'use client'

import { useState, useCallback, useMemo, useRef, useEffect, useDeferredValue, Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Fuse from 'fuse.js'
import { videos, orderedVideos, CATEGORY_LABELS, featuredVideo } from '@/lib/videos'
import type { VideoCategory } from '@/lib/videos'
import VideoCard from '@/components/ui/VideoCard'
import EmailSignupTile from '@/components/ui/EmailSignupTile'
import SurpriseRoller from '@/components/ui/SurpriseRoller'
import { videoTranscripts } from '@/lib/video-transcripts'
import { expandQuery } from '@/lib/concept-map'
import { plainText } from '@/components/ui/RichText'


const ALL_CATEGORIES: VideoCategory[] = ['talk', 'panel', 'explainer', 'clip', 'hot-take']

export default function VideoPageClient() {
  // ── Featured (flagged video, else newest) ────────────────────────────────
  const featured = featuredVideo

  // ── Surprise modal state ──────────────────────────────────────────────────
  const [surpriseVideo, setSurpriseVideo] = useState<typeof videos[0] | null>(null)
  const [rolling, setRolling] = useState(false)
  const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Search state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  // Input stays bound to `query` (instant typing); the expensive search reads
  // `deferredQuery`, which React lets lag behind under load.
  const deferredQuery = useDeferredValue(query)
  const [activeCategory, setActiveCategory] = useState<VideoCategory | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Fuse instance ─────────────────────────────────────────────────────────
  // Lowercased transcripts (CMS field, falling back to the legacy per-slug
  // store), prepared once for the cheap exact-substring pass. They are NOT put
  // in the Fuse index: fuzzy-scanning ~1.3MB of transcript per term froze the
  // page on every keystroke.
  const transcriptIndex = useMemo(
    () => videos.map((v) => ({ id: v.id, text: (v.transcript ?? videoTranscripts[v.slug] ?? '').toLowerCase() })),
    []
  )

  const fuse = useMemo(
    () =>
      new Fuse(videos, {
        keys: [
          { name: 'title',       weight: 0.45 },
          { name: 'tags',        weight: 0.30 },
          { name: 'description', weight: 0.25 },
        ],
        threshold: 0.38,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    []
  )

  // ── Semantic expansion ────────────────────────────────────────────────────
  const { terms: expandedTerms, concepts: matchedConcepts } = useMemo(
    () => expandQuery(deferredQuery),
    [deferredQuery]
  )

  // ── Filtered results ──────────────────────────────────────────────────────
  const filteredVideos = useMemo(() => {
    const base = activeCategory
      ? orderedVideos.filter(v => v.category === activeCategory)
      : orderedVideos

    if (!deferredQuery.trim()) return base

    const scoreMap = new Map<string, number>()
    expandedTerms.forEach((term, i) => {
      const weight = i === 0 ? 1 : 0.55
      fuse.search(term).forEach(({ item, score }) => {
        const s = (1 - (score ?? 1)) * weight
        scoreMap.set(item.id, Math.max(scoreMap.get(item.id) ?? 0, s))
      })
      // Transcript depth: cheap exact match only, ranked below field hits.
      if (term.length >= 3) {
        transcriptIndex.forEach(({ id, text }) => {
          if (text.includes(term)) {
            scoreMap.set(id, Math.max(scoreMap.get(id) ?? 0, 0.3 * weight))
          }
        })
      }
    })

    const scored = base
      .filter(v => scoreMap.has(v.id))
      .sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0))

    return scored
  }, [deferredQuery, expandedTerms, fuse, transcriptIndex, activeCategory])

  // ── Surprise me — opens a random video in a modal ────────────────────────
  const surpriseLabels = useMemo(() => videos.map((v) => v.title), [])

  const surprise = useCallback(() => {
    const pool = filteredVideos.length > 0 ? filteredVideos : videos
    if (pool.length === 0) return
    setSurpriseVideo(pool[Math.floor(Math.random() * pool.length)])
    // Roll the dice for a beat before revealing the pick.
    setRolling(true)
    if (rollTimer.current) clearTimeout(rollTimer.current)
    const reduce =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    rollTimer.current = setTimeout(() => setRolling(false), reduce ? 120 : 900)
  }, [filteredVideos])

  const closeSurprise = useCallback(() => {
    if (rollTimer.current) clearTimeout(rollTimer.current)
    setRolling(false)
    setSurpriseVideo(null)
  }, [])

  // Clear any pending reveal timer on unmount.
  useEffect(() => () => { if (rollTimer.current) clearTimeout(rollTimer.current) }, [])

  // ── Suggestions dropdown ──────────────────────────────────────────────────
  interface Suggestion {
    type: 'video' | 'concept'
    label: string
    sublabel?: string
    slug?: string
  }

  const suggestions = useMemo((): Suggestion[] => {
    if (!deferredQuery.trim() || deferredQuery.trim().length < 2) return []
    const sugs: Suggestion[] = []
    matchedConcepts.forEach(c => {
      sugs.push({ type: 'concept', label: `Expanding search to: ${c} and related terms` })
    })
    filteredVideos.slice(0, 5).forEach(v => {
      sugs.push({ type: 'video', label: v.title, sublabel: v.date, slug: v.slug })
    })
    return sugs.slice(0, 7)
  }, [deferredQuery, filteredVideos, matchedConcepts])

  // ── Close dropdown on outside click / close modal on Escape ─────────────
  useEffect(() => {
    function handleMouse(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        setSurpriseVideo(null)
      }
    }
    document.addEventListener('mousedown', handleMouse)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleMouse)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIdx(i => (i + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIdx(i => (i - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setHighlightedIdx(-1)
      }
    },
    [showSuggestions, suggestions.length]
  )

  const thumb = featured.thumbnailUrl
    ?? `https://img.youtube.com/vi/${featured.youtubeVideoId}/maxresdefault.jpg`

  const hasFilters = query || activeCategory

  return (
    <>
      <style>{`
        /* Stack the search field above the "Surprise me" button on phones so the
           input keeps full width (otherwise its placeholder truncates). */
        @media (max-width: 560px) {
          .search-row { flex-direction: column; align-items: stretch; }
          .search-row .surprise-btn { width: 100%; justify-content: center; }
        }
        /* Trim the featured video's vertical footprint on phones (desktop unchanged). */
        @media (max-width: 768px) {
          .featured-section { padding-top: 2.25rem !important; padding-bottom: 2.5rem !important; }
          .featured-label-row { margin-bottom: 1.1rem !important; }
          .featured-grid { gap: 1.4rem !important; }
          .featured-content { gap: 0.85rem !important; }
          .featured-desc { -webkit-line-clamp: 2 !important; }
        }
        .watch-btn:hover { background: var(--accent-coral-dim) !important; }
        .featured-play-ring:hover { transform: scale(1.1); }
        .surprise-btn:hover { background: rgba(255,255,255,0.12) !important; border-color: rgba(255,255,255,0.5) !important; }
        .surprise-btn:hover .dice-cube { animation: dice-roll 1.1s ease-in-out infinite; }
        .dice-wrap { display: inline-block; width: 18px; height: 18px; perspective: 80px; flex-shrink: 0; vertical-align: middle; }
        .dice-cube { display: block; width: 18px; height: 18px; position: relative; transform-style: preserve-3d; transform: rotateX(-20deg) rotateY(25deg); transition: transform 0.3s ease; }
        .face { display: block; position: absolute; width: 18px; height: 18px; background: #fff; border: 1.5px solid rgba(0,0,0,0.18); border-radius: 3px; box-sizing: border-box; }
        .dot { display: block; position: absolute; width: 3.5px; height: 3.5px; border-radius: 50%; background: #D4614A; transform: translate(-50%, -50%); }
        .df1 { transform: translateZ(9px); }
        .df2 { transform: rotateY(180deg) translateZ(9px); }
        .df3 { transform: rotateY(90deg) translateZ(9px); }
        .df4 { transform: rotateY(-90deg) translateZ(9px); }
        .df5 { transform: rotateX(90deg) translateZ(9px); }
        .df6 { transform: rotateX(-90deg) translateZ(9px); }
        @keyframes dice-roll {
          0%   { transform: rotateX(-20deg)  rotateY(25deg); }
          16%  { transform: rotateX(-110deg) rotateY(80deg); }
          33%  { transform: rotateX(-200deg) rotateY(170deg); }
          50%  { transform: rotateX(-290deg) rotateY(260deg); }
          66%  { transform: rotateX(-380deg) rotateY(350deg); }
          83%  { transform: rotateX(-430deg) rotateY(430deg); }
          100% { transform: rotateX(-20deg)  rotateY(385deg); }
        }
        @keyframes surprise-in {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* ——— Surprise modal ——— */}
      {surpriseVideo && (
        <div
          onClick={closeSurprise}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'var(--bg-dark, #0D1E1C)',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              maxWidth: '820px',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              animation: 'surprise-in 0.28s ease',
            }}
          >
            {rolling ? (
              <SurpriseRoller labels={surpriseLabels} caption="Picking a video…" />
            ) : (
            <>
            {/* YouTube embed */}
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${surpriseVideo.youtubeVideoId}?autoplay=1&rel=0`}
                title={surpriseVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            {/* Info bar */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {surpriseVideo.category && (
                  <p style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '0.5625rem', letterSpacing: '0.12em', color: 'var(--accent-coral)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {CATEGORY_LABELS[surpriseVideo.category]}
                  </p>
                )}
                <h3 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem', lineHeight: 1.2 }}>
                  {surpriseVideo.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {plainText(surpriseVideo.description)}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                <Link
                  href={`/videos/${surpriseVideo.slug}`}
                  onClick={closeSurprise}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-coral)', color: '#fff', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                  Full page
                </Link>
                <button
                  onClick={surprise}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                  </svg>
                  Another one
                </button>
              </div>
            </div>
            </>
            )}

            {/* Close */}
            <button
              onClick={closeSurprise}
              aria-label="Close"
              style={{ position: 'absolute', top: '1rem', right: '1rem', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ——— Hero ——— */}
      <section style={{ padding: 'clamp(7rem, 3rem + 11vw, 10rem) var(--gutter) 4rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <p
            className="animate-fade-up"
            style={{ fontFamily: 'var(--font-dm-mono, var(--font-mono))', fontSize: '0.6875rem', letterSpacing: '0.15em', color: 'var(--accent-coral)', textTransform: 'uppercase', marginBottom: '1.5rem', animationDelay: '0ms' }}
          >
            Video
          </p>
          <h1
            className="animate-fade-up"
            style={{ fontFamily: 'var(--font-cormorant, var(--font-display))', fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.05, marginBottom: '1rem', animationDelay: '100ms' }}
          >
            Talks, panels, and conversations.
          </h1>
          <Link
            href="/episodes"
            style={{ display: 'inline-flex', fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s', animationDelay: '200ms' }}
            className="videos-episodes-link animate-fade-up"
          >
            Prefer audio? Browse all episodes &#8594;
          </Link>
        </div>
        <style>{`.videos-episodes-link:hover { color: var(--accent-coral) !important; }`}</style>
      </section>

      {/* ——— Featured ——— */}
      <section className="featured-section" style={{ padding: '4rem var(--gutter) 5rem' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>

          {/* Label row */}
          <div className="featured-label-row" style={{ marginBottom: '2rem' }}>
            <p style={{
              fontFamily: 'var(--font-dm-mono, var(--font-mono))',
              fontSize: '0.6875rem',
              letterSpacing: '0.15em',
              color: 'var(--accent-coral)',
              textTransform: 'uppercase',
            }}>
              Featured
            </p>
          </div>

          {/* Two-column layout */}
          <div className="featured-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}>

            {/* Thumbnail */}
            <Link href={`/videos/${featured.slug}`} style={{ display: 'block', textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9', background: '#060F0D' }}>
                <Image
                  src={thumb}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 760px) 100vw, 50vw"
                  className="featured-thumb"
                  style={{ objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div
                    className="featured-play-ring"
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.95)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#D4614A">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
                {featured.category && (
                  <span style={{
                    position: 'absolute',
                    top: '0.75rem',
                    left: '0.75rem',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '100px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                    fontSize: '0.5625rem',
                    letterSpacing: '0.12em',
                    color: '#ffffff',
                    textTransform: 'uppercase',
                  }}>
                    {CATEGORY_LABELS[featured.category]}
                  </span>
                )}
              </div>
            </Link>

            {/* Content */}
            <div className="featured-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{
                fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>
                {featured.date}
              </p>

              <h2 style={{
                fontFamily: 'var(--font-cormorant, var(--font-display))',
                fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                margin: 0,
              }}>
                {featured.title}
              </h2>

              <p className="featured-desc" style={{
                fontSize: '0.9375rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {plainText(featured.description)}
              </p>

              {featured.tags && featured.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {featured.tags.slice(0, 4).map(tag => (
                    <span key={tag} style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '100px',
                      border: '1px solid var(--border)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-dm-mono, var(--font-mono))',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ paddingTop: '0.25rem' }}>
                <Link
                  href={`/videos/${featured.slug}`}
                  className="watch-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-coral)',
                    color: '#ffffff',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  Watch now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Search + grid ——— */}
      <section style={{ padding: '5rem var(--gutter)' }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>

          {/* Search bar row */}
          <div className="search-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>

            {/* Search input wrapper */}
            <div style={{ position: 'relative', flex: 1 }}>
              {/* Search icon */}
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }}
              >
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <input
                ref={inputRef}
                type="search"
                placeholder="Search by meaning: try 'AI', 'usaid cuts', 'digital health Africa'"
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setShowSuggestions(true)
                  setHighlightedIdx(-1)
                }}
                onFocus={() => {
                  setShowSuggestions(true)
                  if (inputRef.current) inputRef.current.style.borderColor = 'var(--accent-coral)'
                }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '0.8rem 6.5rem 0.8rem 2.75rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9375rem',
                  color: 'var(--text-primary)',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-dm-sans, sans-serif)',
                  transition: 'border-color var(--transition-fast)',
                }}
              />

              {/* "Smart" badge */}
              <div style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.6rem',
                background: 'linear-gradient(120deg, var(--accent-coral), var(--accent-amber))',
                borderRadius: '100px',
                pointerEvents: 'none',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M12 2L9.19 9.19 2 12l7.19 2.81L12 22l2.81-7.19L22 12l-7.19-2.81z" />
                </svg>
                <span style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '0.5625rem', letterSpacing: '0.1em', color: '#fff', textTransform: 'uppercase' }}>
                  Smart
                </span>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-elevated)',
                    zIndex: 50,
                    overflow: 'hidden',
                  }}
                >
                  {matchedConcepts.length > 0 && (
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(90deg, rgba(212,97,74,0.06), rgba(224,156,42,0.04))',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--accent-coral)" aria-hidden="true">
                        <path d="M12 2L9.19 9.19 2 12l7.19 2.81L12 22l2.81-7.19L22 12l-7.19-2.81z" />
                      </svg>
                      <span style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '0.5625rem', letterSpacing: '0.1em', color: 'var(--accent-coral)', textTransform: 'uppercase' }}>
                        Expanding to: {matchedConcepts.join(', ')} and related terms
                      </span>
                    </div>
                  )}

                  {suggestions.map((sug, i) => {
                    const isHighlighted = i === highlightedIdx
                    if (sug.type === 'video' && sug.slug) {
                      return (
                        <Link
                          key={`vid-${sug.slug}`}
                          href={`/videos/${sug.slug}`}
                          onMouseEnter={() => setHighlightedIdx(i)}
                          onClick={() => setShowSuggestions(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.625rem 1rem',
                            textDecoration: 'none',
                            background: isHighlighted ? 'var(--bg-secondary)' : 'transparent',
                            transition: 'background var(--transition-fast)',
                            borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                          <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans, sans-serif)', margin: 0 }}>
                              {sug.label}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-mono, monospace)', margin: 0 }}>
                              {sug.sublabel}
                            </p>
                          </div>
                        </Link>
                      )
                    }
                    // concept row — informational only
                    return (
                      <div
                        key={`concept-${i}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem 1rem',
                          borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--accent-amber)" aria-hidden="true">
                          <path d="M12 2L9.19 9.19 2 12l7.19 2.81L12 22l2.81-7.19L22 12l-7.19-2.81z" />
                        </svg>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-mono, monospace)', fontStyle: 'italic' }}>
                          {sug.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Surprise me */}
            <button
              onClick={surprise}
              className="surprise-btn"
              title="Pick a random video"
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.125rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-dm-sans, sans-serif)',
                cursor: 'pointer',
                transition: 'background 0.15s ease, border-color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span className="dice-wrap">
                <span className="dice-cube">
                  <span className="face df1"><span className="dot" style={{ left: '50%', top: '50%' }} /></span>
                  <span className="face df2">
                    <span className="dot" style={{ left: '28%', top: '25%' }} /><span className="dot" style={{ left: '72%', top: '25%' }} />
                    <span className="dot" style={{ left: '28%', top: '50%' }} /><span className="dot" style={{ left: '72%', top: '50%' }} />
                    <span className="dot" style={{ left: '28%', top: '75%' }} /><span className="dot" style={{ left: '72%', top: '75%' }} />
                  </span>
                  <span className="face df3">
                    <span className="dot" style={{ left: '28%', top: '25%' }} />
                    <span className="dot" style={{ left: '50%', top: '50%' }} />
                    <span className="dot" style={{ left: '72%', top: '75%' }} />
                  </span>
                  <span className="face df4">
                    <span className="dot" style={{ left: '28%', top: '28%' }} /><span className="dot" style={{ left: '72%', top: '28%' }} />
                    <span className="dot" style={{ left: '28%', top: '72%' }} /><span className="dot" style={{ left: '72%', top: '72%' }} />
                  </span>
                  <span className="face df5">
                    <span className="dot" style={{ left: '28%', top: '25%' }} /><span className="dot" style={{ left: '72%', top: '25%' }} />
                    <span className="dot" style={{ left: '50%', top: '50%' }} />
                    <span className="dot" style={{ left: '28%', top: '75%' }} /><span className="dot" style={{ left: '72%', top: '75%' }} />
                  </span>
                  <span className="face df6">
                    <span className="dot" style={{ left: '28%', top: '28%' }} />
                    <span className="dot" style={{ left: '72%', top: '72%' }} />
                  </span>
                </span>
              </span>
              Surprise me
            </button>
          </div>

          {/* Category filter pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '2rem' }}>
            {ALL_CATEGORIES.map(cat => {
              const active = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(active ? null : cat)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '100px',
                    border: `1px solid ${active ? 'var(--accent-coral)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-coral)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    fontFamily: 'var(--font-dm-sans, sans-serif)',
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              )
            })}

            {/* Results count + clear */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <p style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}{hasFilters ? ' found' : ' total'}
              </p>
              {hasFilters && (
                <button
                  onClick={() => { setQuery(''); setActiveCategory(null) }}
                  style={{ fontSize: '0.8125rem', color: 'var(--accent-coral)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          {filteredVideos.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: '1.75rem',
            }}>
              {filteredVideos.map((video, i) => {
                const firstTileAt = Math.min(5, filteredVideos.length - 1)
                const secondTileAt = filteredVideos.length >= 16 ? Math.floor(filteredVideos.length * 0.6) : -1
                return (
                  <Fragment key={video.id}>
                    <VideoCard video={video} index={i} />
                    {i === firstTileAt && (
                      <EmailSignupTile title="Get new videos and episodes in your inbox." />
                    )}
                    {i === secondTileAt && secondTileAt !== firstTileAt && (
                      <EmailSignupTile
                        eyebrow="Never miss a drop"
                        title="New videos, straight to your inbox."
                      />
                    )}
                  </Fragment>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                No videos match your search.
              </p>
              <button
                onClick={() => { setQuery(''); setActiveCategory(null) }}
                style={{ fontSize: '0.875rem', color: 'var(--accent-coral)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-dm-sans, sans-serif)' }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

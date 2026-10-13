'use client'

import { useState, useMemo, useRef, useEffect, useCallback, useDeferredValue, Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Fuse from 'fuse.js'
import EpisodeCard from '@/components/ui/EpisodeCard'
import EmailSignupTile from '@/components/ui/EmailSignupTile'
import SurpriseRoller from '@/components/ui/SurpriseRoller'
import { Episode } from '@/lib/episodes'
import { plainText } from '@/components/ui/RichText'
import { expandQuery } from '@/lib/concept-map'

interface EpisodeFilterProps {
  episodes: Episode[]
  allThemes: string[]
  allCountries: string[]
}


// ─── Suggestion types ────────────────────────────────────────────────────────
interface Suggestion {
  type: 'episode' | 'theme' | 'concept'
  label: string
  sublabel?: string
  episode?: Episode
  theme?: string
}

export default function EpisodeFilter({ episodes, allThemes, allCountries }: EpisodeFilterProps) {
  const [query, setQuery] = useState('')
  // The input stays bound to `query` so typing is instant; the expensive search
  // recompute reads `deferredQuery`, which React lets lag behind under load.
  const deferredQuery = useDeferredValue(query)
  const [activeThemes, setActiveThemes] = useState<string[]>([])
  const [activeCountry, setActiveCountry] = useState<string | null>(null)
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const [surpriseEpisode, setSurpriseEpisode] = useState<Episode | null>(null)
  const [rolling, setRolling] = useState(false)
  const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Fuse instance (memoised — rebuilt only when episodes change) ─────────
  const fuse = useMemo(
    () =>
      new Fuse(episodes, {
        keys: [
          { name: 'title',             weight: 0.35 },
          { name: 'guest',             weight: 0.28 },
          { name: 'description',       weight: 0.18 },
          { name: 'themes',            weight: 0.22 },
          { name: 'topics',            weight: 0.18 },
          { name: 'tags',              weight: 0.12 },
          { name: 'guestRole',         weight: 0.12 },
          { name: 'country',           weight: 0.12 },
          // Deeper page copy. Low weights so a strong title/guest match still
          // ranks above a passing mention.
          { name: 'pullQuote',         weight: 0.10 },
          { name: 'timestamps.label',  weight: 0.10 },
          { name: 'bio',               weight: 0.07 },
          // NB: `transcript` is deliberately NOT indexed here. Fuzzy-scanning
          // ~800KB of transcript per search term froze the page; transcripts are
          // matched separately via a cheap exact-substring pass (see `filtered`).
        ],
        threshold: 0.38,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [episodes]
  )

  // Lowercased transcripts, prepared once, for the cheap exact-substring pass.
  const transcriptIndex = useMemo(
    () => episodes.map((ep) => ({ id: ep.id, text: (ep.transcript ?? '').toLowerCase() })),
    [episodes]
  )

  // ── Semantic expansion for current query ─────────────────────────────────
  const { terms: expandedTerms, concepts: matchedConcepts } = useMemo(
    () => expandQuery(deferredQuery),
    [deferredQuery]
  )

  // ── Full filtered results (used for the episode grid) ────────────────────
  const filtered = useMemo(() => {
    // Theme/country filters apply regardless
    const base = episodes.filter((ep) => {
      // Multi-select topics: keep an episode if it matches ANY selected theme.
      if (activeThemes.length > 0 && !ep.themes.some((t) => activeThemes.includes(t))) return false
      if (activeCountry && ep.country !== activeCountry) return false
      return true
    })

    const epNum = (ep: Episode) =>
      typeof ep.episodeNumber === 'number' ? ep.episodeNumber : parseFloat(String(ep.episodeNumber)) || 0

    if (!deferredQuery.trim()) return [...base].sort((a, b) => epNum(b) - epNum(a))

    // Score each episode: a fuzzy Fuse match on the light fields, plus a cheap
    // exact-substring match in the transcript. Both are bounded by the capped
    // number of expanded terms, so a keystroke can no longer block the page.
    const scoreMap = new Map<string, number>()
    expandedTerms.forEach((term, i) => {
      // Decay bonus for synonym terms so original query terms rank higher
      const weight = i === 0 ? 1 : 0.55
      fuse.search(term).forEach(({ item, score }) => {
        const s = (1 - (score ?? 1)) * weight
        scoreMap.set(item.id, Math.max(scoreMap.get(item.id) ?? 0, s))
      })
      // Transcript depth: exact mentions only (cheap), ranked below field hits.
      if (term.length >= 3) {
        transcriptIndex.forEach(({ id, text }) => {
          if (text.includes(term)) {
            scoreMap.set(id, Math.max(scoreMap.get(id) ?? 0, 0.3 * weight))
          }
        })
      }
    })

    return base
      .filter((ep) => scoreMap.has(ep.id))
      .sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0))
  }, [episodes, deferredQuery, expandedTerms, fuse, transcriptIndex, activeThemes, activeCountry])

  // ── Live suggestions (for dropdown) ──────────────────────────────────────
  const suggestions = useMemo((): Suggestion[] => {
    if (!deferredQuery.trim() || deferredQuery.trim().length < 2) return []

    const sugs: Suggestion[] = []

    // Concept suggestions first
    matchedConcepts.forEach((c) => {
      sugs.push({ type: 'concept', label: `Search by concept: ${c}` })
    })

    // Top episode matches
    const topEps = filtered.slice(0, 4)
    topEps.forEach((ep) => {
      sugs.push({
        type: 'episode',
        label: ep.title,
        sublabel: `Ep ${ep.episodeNumber} · ${ep.guest}`,
        episode: ep,
      })
    })

    // Matching themes
    const q = deferredQuery.toLowerCase()
    allThemes
      .filter((t) => t.toLowerCase().includes(q) && !activeThemes.includes(t))
      .slice(0, 3)
      .forEach((t) => {
        sugs.push({ type: 'theme', label: t, theme: t })
      })

    return sugs.slice(0, 7)
  }, [deferredQuery, filtered, matchedConcepts, allThemes, activeThemes])

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // ── Surprise me ──────────────────────────────────────────────────────────
  const surpriseLabels = useMemo(() => episodes.map((ep) => ep.title), [episodes])

  const surprise = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : episodes
    if (pool.length === 0) return
    setSurpriseEpisode(pool[Math.floor(Math.random() * pool.length)])
    // Roll the dice for a beat before revealing the pick.
    setRolling(true)
    if (rollTimer.current) clearTimeout(rollTimer.current)
    const reduce =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    rollTimer.current = setTimeout(() => setRolling(false), reduce ? 120 : 900)
  }, [filtered, episodes])

  const closeSurprise = useCallback(() => {
    if (rollTimer.current) clearTimeout(rollTimer.current)
    setRolling(false)
    setSurpriseEpisode(null)
  }, [])

  // Clear any pending reveal timer on unmount.
  useEffect(() => () => { if (rollTimer.current) clearTimeout(rollTimer.current) }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIdx((i) => (i + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
        setHighlightedIdx(-1)
        setSurpriseEpisode(null)
      } else if (e.key === 'Enter' && highlightedIdx >= 0) {
        e.preventDefault()
        const sug = suggestions[highlightedIdx]
        if (sug.type === 'theme' && sug.theme) {
          setActiveThemes((prev) => (prev.includes(sug.theme!) ? prev : [...prev, sug.theme!]))
          setQuery('')
        } else if (sug.type === 'concept') {
          // keep query, just close
        }
        setShowSuggestions(false)
        setHighlightedIdx(-1)
      }
    },
    [showSuggestions, suggestions, highlightedIdx]
  )

  // Top 10 themes by episode frequency
  const topThemes = useMemo(() => {
    const counts = new Map<string, number>()
    episodes.forEach((ep) => ep.themes.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)))
    return [...allThemes].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0)).slice(0, 10)
  }, [episodes, allThemes])

  const hasFilters = query || activeThemes.length > 0 || activeCountry

  return (
    <div>
      {/* ── Search + filters ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>

        {/* Smart search input + Surprise me */}
        <div className="search-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
            placeholder="Search by meaning: try 'AI in Africa' or 'funding'"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
              setHighlightedIdx(-1)
            }}
            onFocus={() => { setShowSuggestions(true); (inputRef.current as HTMLInputElement & { style: CSSStyleDeclaration }).style.borderColor = 'var(--accent-coral)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '0.8rem 7rem 0.8rem 2.75rem',
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

          {/* "Smart search" badge */}
          <div
            style={{
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
            }}
          >
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

              {/* Semantic expansion notice */}
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
                    Expanding search to include: {matchedConcepts.join(', ')} and related terms
                  </span>
                </div>
              )}

              {suggestions.map((sug, i) => {
                const isHighlighted = i === highlightedIdx
                if (sug.type === 'episode' && sug.episode) {
                  return (
                    <Link
                      key={`ep-${sug.episode.id}`}
                      href={`/episodes/${sug.episode.slug}`}
                      onMouseEnter={() => setHighlightedIdx(i)}
                      onClick={() => setShowSuggestions(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 1rem',
                        textDecoration: 'none',
                        background: isHighlighted ? 'var(--bg-surface)' : 'transparent',
                        transition: 'background var(--transition-fast)',
                        borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                      </svg>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans, sans-serif)' }}>
                          {sug.label}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-dm-mono, monospace)' }}>
                          {sug.sublabel}
                        </p>
                      </div>
                    </Link>
                  )
                }
                if (sug.type === 'theme' && sug.theme) {
                  return (
                    <button
                      key={`theme-${sug.theme}`}
                      onMouseEnter={() => setHighlightedIdx(i)}
                      onClick={() => {
                        setActiveThemes((prev) => (prev.includes(sug.theme!) ? prev : [...prev, sug.theme!]))
                        setQuery('')
                        setShowSuggestions(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.625rem 1rem',
                        width: '100%',
                        textAlign: 'left',
                        background: isHighlighted ? 'var(--bg-surface)' : 'transparent',
                        border: 'none',
                        borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                        transition: 'background var(--transition-fast)',
                        fontFamily: 'var(--font-dm-sans, sans-serif)',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                      <span style={{ fontSize: '0.875rem', color: 'var(--accent-coral)' }}>
                        Filter by topic: <strong>{sug.label}</strong>
                      </span>
                    </button>
                  )
                }
                if (sug.type === 'concept') {
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
                }
                return null
              })}
            </div>
          )}
        </div>

          {/* Surprise me */}
          <button
            onClick={surprise}
            className="surprise-btn"
            title="Pick a random episode"
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
                {/* Face 1 — front: 1 dot */}
                <span className="face df1">
                  <span className="dot" style={{ left: '50%', top: '50%' }} />
                </span>
                {/* Face 6 — back: 6 dots */}
                <span className="face df2">
                  <span className="dot" style={{ left: '28%', top: '25%' }} />
                  <span className="dot" style={{ left: '72%', top: '25%' }} />
                  <span className="dot" style={{ left: '28%', top: '50%' }} />
                  <span className="dot" style={{ left: '72%', top: '50%' }} />
                  <span className="dot" style={{ left: '28%', top: '75%' }} />
                  <span className="dot" style={{ left: '72%', top: '75%' }} />
                </span>
                {/* Face 3 — right: 3 dots */}
                <span className="face df3">
                  <span className="dot" style={{ left: '28%', top: '25%' }} />
                  <span className="dot" style={{ left: '50%', top: '50%' }} />
                  <span className="dot" style={{ left: '72%', top: '75%' }} />
                </span>
                {/* Face 4 — left: 4 dots */}
                <span className="face df4">
                  <span className="dot" style={{ left: '28%', top: '28%' }} />
                  <span className="dot" style={{ left: '72%', top: '28%' }} />
                  <span className="dot" style={{ left: '28%', top: '72%' }} />
                  <span className="dot" style={{ left: '72%', top: '72%' }} />
                </span>
                {/* Face 5 — top: 5 dots */}
                <span className="face df5">
                  <span className="dot" style={{ left: '28%', top: '25%' }} />
                  <span className="dot" style={{ left: '72%', top: '25%' }} />
                  <span className="dot" style={{ left: '50%', top: '50%' }} />
                  <span className="dot" style={{ left: '28%', top: '75%' }} />
                  <span className="dot" style={{ left: '72%', top: '75%' }} />
                </span>
                {/* Face 2 — bottom: 2 dots */}
                <span className="face df6">
                  <span className="dot" style={{ left: '28%', top: '28%' }} />
                  <span className="dot" style={{ left: '72%', top: '72%' }} />
                </span>
              </span>
            </span>
            Surprise me
          </button>
        </div>

        {/* Theme pills — top 10 by frequency */}
        <div>
          <p style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Topic
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {topThemes.map((theme) => {
              const active = activeThemes.includes(theme)
              const hovered = hoveredTheme === theme
              return (
                <button
                  key={theme}
                  aria-pressed={active}
                  onClick={() => setActiveThemes((prev) => (active ? prev.filter((t) => t !== theme) : [...prev, theme]))}
                  onMouseEnter={() => setHoveredTheme(theme)}
                  onMouseLeave={() => setHoveredTheme(null)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '100px',
                    border: `1px solid ${active ? 'var(--accent-coral)' : hovered ? 'var(--accent-coral)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-coral)' : hovered ? 'rgba(212,97,74,0.1)' : 'transparent',
                    color: active ? '#fff' : hovered ? 'var(--accent-coral)' : 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    fontFamily: 'var(--font-dm-sans, sans-serif)',
                  }}
                >
                  {theme}
                </button>
              )
            })}
          </div>
        </div>

        {/* Country pills */}
        <div>
          <p style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Country
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {allCountries.map((country) => {
              const active = activeCountry === country
              return (
                <button
                  key={country}
                  onClick={() => setActiveCountry(active ? null : country)}
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
                  {country}
                </button>
              )
            })}
          </div>
        </div>

        {/* Results count + clear */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
          <p style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {filtered.length} episode{filtered.length !== 1 ? 's' : ''}
            {hasFilters ? ' found' : ' total'}
          </p>
          {hasFilters && (
            <button
              onClick={() => { setQuery(''); setActiveThemes([]); setActiveCountry(null) }}
              style={{ fontSize: '0.8125rem', color: 'var(--accent-coral)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-dm-sans, sans-serif)' }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Surprise modal ───────────────────────────────────────────────── */}
      <style>{`
        /* On phones the search field shares a row with the "Surprise me" button,
           squeezing the input until its placeholder truncates. Stack them. */
        @media (max-width: 560px) {
          .search-row { flex-direction: column; align-items: stretch; }
          .search-row .surprise-btn { width: 100%; justify-content: center; }
        }
        .surprise-btn:hover { border-color: var(--accent-coral) !important; color: var(--accent-coral) !important; }

        /* ── 3D Dice ── */
        .dice-wrap {
          display: inline-block;
          width: 18px; height: 18px;
          perspective: 80px;
          flex-shrink: 0;
          vertical-align: middle;
        }
        .dice-cube {
          display: block;
          width: 18px; height: 18px;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(-20deg) rotateY(25deg);
          transition: transform 0.3s ease;
        }
        .surprise-btn:hover .dice-cube {
          animation: dice-roll 1.1s ease-in-out infinite;
        }
        .face {
          display: block;
          position: absolute;
          width: 18px; height: 18px;
          background: #fff;
          border: 1.5px solid rgba(0,0,0,0.18);
          border-radius: 3px;
          box-sizing: border-box;
        }
        .dot {
          display: block;
          position: absolute;
          width: 3.5px; height: 3.5px;
          border-radius: 50%;
          background: #D4614A;
          transform: translate(-50%, -50%);
        }
        .df1 { transform: translateZ(9px); }
        .df2 { transform: rotateY(180deg) translateZ(9px); }
        .df3 { transform: rotateY(90deg)  translateZ(9px); }
        .df4 { transform: rotateY(-90deg) translateZ(9px); }
        .df5 { transform: rotateX(90deg)  translateZ(9px); }
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
          from { opacity: 0; transform: scale(0.93) translateY(14px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {surpriseEpisode && (
        <div
          onClick={closeSurprise}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '640px',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
              animation: 'surprise-in 0.28s ease',
              position: 'relative',
            }}
          >
            {rolling ? (
              <SurpriseRoller labels={surpriseLabels} caption="Picking an episode…" />
            ) : (
            <>
            {/* Transistor embed or artwork header */}
            {surpriseEpisode.transistorUrl ? (
              <div style={{ padding: '1.5rem 1.5rem 0' }}>
                <iframe
                  width="100%"
                  height="180"
                  frameBorder="0"
                  scrolling="no"
                  src={surpriseEpisode.transistorUrl}
                  title={surpriseEpisode.title}
                  style={{ borderRadius: 'var(--radius-md)', display: 'block' }}
                />
              </div>
            ) : surpriseEpisode.artworkUrl ? (
              <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                <Image src={surpriseEpisode.artworkUrl} alt="" fill sizes="(max-width: 700px) 100vw, 420px" style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
              </div>
            ) : null}

            {/* Info */}
            <div style={{ padding: '1.25rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <p style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '0.5625rem', letterSpacing: '0.12em', color: 'var(--accent-coral)', textTransform: 'uppercase' }}>
                Ep {surpriseEpisode.episodeNumber} · {surpriseEpisode.date}
              </p>
              <h3 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
                {surpriseEpisode.title}
              </h3>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {surpriseEpisode.guest} · {surpriseEpisode.guestRole}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {plainText(surpriseEpisode.description)}
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <Link
                  href={`/episodes/${surpriseEpisode.slug}`}
                  onClick={closeSurprise}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)', background: 'var(--accent-coral)', color: '#fff', fontSize: '0.8125rem', fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  Full episode &#8594;
                </Link>
                <button
                  onClick={surprise}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-dm-sans, sans-serif)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="4"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"/>
                    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor"/>
                  </svg>
                  Try another
                </button>
              </div>
            </div>
            </>
            )}

            {/* Close */}
            <button
              onClick={closeSurprise}
              aria-label="Close"
              style={{ position: 'absolute', top: '1rem', right: '1rem', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── Episode grid ────────────────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
          {filtered.map((episode, i) => {
            const firstTileAt = Math.min(5, filtered.length - 1)
            const secondTileAt = filtered.length >= 16 ? Math.floor(filtered.length * 0.6) : -1
            return (
              <Fragment key={episode.id}>
                <EpisodeCard episode={episode} />
                {i === firstTileAt && <EmailSignupTile />}
                {i === secondTileAt && secondTileAt !== firstTileAt && (
                  <EmailSignupTile
                    eyebrow="Never miss an episode"
                    title="New conversations, straight to your inbox."
                  />
                )}
              </Fragment>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            No episodes match your search.
          </p>
          <button
            onClick={() => { setQuery(''); setActiveThemes([]); setActiveCountry(null) }}
            style={{ fontSize: '0.875rem', color: 'var(--accent-coral)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-dm-sans, sans-serif)' }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}

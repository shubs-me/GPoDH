'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface TrailerCopy {
  youtubeId: string
  thumbnail: string
  thumbnailAlt: string
}

// Accepts a bare video ID or any pasted YouTube link (watch, youtu.be, embed, shorts).
function toYoutubeId(input: string): string {
  const m = input.trim().match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/)
  return m ? m[1] : input.trim()
}

export default function TrailerModal({ copy }: { copy: TrailerCopy }) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) {
      el.showModal()
      document.body.style.overflow = 'hidden'
    } else {
      el.close()
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape (dialog handles it natively, but we need to sync state)
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const onCancel = () => setOpen(false)
    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
  }, [])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) setOpen(false)
  }

  return (
    <>
      {/* ── Thumbnail trigger ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Watch the GPODH trailer"
        style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
      >
        <div
          style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            overflow: 'hidden',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
          }}
        >
          <Image
            src={copy.thumbnail}
            alt={copy.thumbnailAlt}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
            sizes="(min-width: 760px) 50vw, 100vw"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />
          {/* logo */}
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem' }}>
            <Image
              src="/logo-gpodh.png"
              alt="GPODH"
              width={120}
              height={33}
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
            />
          </div>
          {/* play button */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.18)',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent-coral)">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </button>

      {/* ── Modal ── */}
      <style>{`
        dialog.trailer-modal {
          border: none;
          border-radius: var(--radius-lg);
          background: #000;
          padding: 0;
          width: min(860px, 94vw);
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          position: fixed;
          inset: 0;
          margin: auto;
        }
        dialog.trailer-modal::backdrop {
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(6px);
        }
      `}</style>

      <dialog ref={dialogRef} className="trailer-modal" onClick={handleBackdropClick}>
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close trailer"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            color: '#fff',
            zIndex: 1,
          }}
        >
          ×
        </button>

        {/* Video — src only set while open so it stops on close */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          {open && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${toYoutubeId(copy.youtubeId)}?autoplay=1`}
              title="GPODH Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0,
                borderRadius: 'var(--radius-lg)',
              }}
            />
          )}
        </div>
      </dialog>
    </>
  )
}

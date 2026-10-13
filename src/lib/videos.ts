import videosData from '@/data/videos.json'

export type VideoCategory = 'talk' | 'panel' | 'explainer' | 'clip' | 'hot-take'

export interface Video {
  id: string
  slug: string
  title: string
  description: string
  youtubeVideoId: string
  date: string
  duration?: string
  category?: VideoCategory
  tags?: string[]
  thumbnailUrl?: string            // override auto-generated YouTube thumbnail if needed
  thumbnailPosition?: string       // CSS objectPosition for thumbnailUrl, e.g. 'center 20%'
  featured?: boolean               // pin as the featured video; otherwise the first entry is used
  pinned?: boolean                 // show first in the /videos grid
  order?: number                   // grid position among numbered videos (1 = first)
  transcript?: string              // optional transcript; included in smart search
}

// ─── Video library ────────────────────────────────────────────────────────────
// The list lives in src/data/videos.json (under the "videos" key) so it can be
// edited in the CMS (see public/admin) and by the automated YouTube sync
// (.github/workflows/sync-videos.yml), which opens a pull request whenever the
// channel publishes a video not already listed here. Newest videos go first; the
// first entry is treated as the featured video unless another sets "featured": true.
export const videos: Video[] = (videosData as { videos: unknown[] })
  .videos as unknown as Video[]

// The featured video shown at the top of /videos: an explicitly flagged entry,
// otherwise the first (newest) one.
export const featuredVideo: Video = videos.find((v) => v.featured) ?? videos[0]

// Grid order on /videos: pinned videos first, then videos with a numeric
// `order` (ascending), then everything else in list order.
export const orderedVideos: Video[] = videos
  .map((v, i) => ({ v, i }))
  .sort((a, b) => {
    if (!!a.v.pinned !== !!b.v.pinned) return a.v.pinned ? -1 : 1
    const ao = a.v.order ?? Infinity
    const bo = b.v.order ?? Infinity
    return ao !== bo ? ao - bo : a.i - b.i
  })
  .map(({ v }) => v)

export const CATEGORY_LABELS: Record<VideoCategory, string> = {
  talk:      'Talk',
  panel:     'Panel',
  explainer: 'Explainer',
  clip:      'Clip',
  'hot-take': 'Hot take',
}

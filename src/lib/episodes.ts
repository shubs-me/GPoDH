import episodesData from '@/data/episodes.json'

export interface Timestamp {
  time: string
  label: string
}

// One guest's face in the floating face cloud on /episodes. Used to give a
// multi-guest episode several individual faces instead of one combined photo.
export interface GuestFace {
  name: string
  artworkUrl: string
  artworkPosition?: string   // CSS object-position override, e.g. 'top center'
}

export interface Episode {
  id: string
  slug: string
  episodeNumber?: number | string
  title: string
  guest: string
  guestRole: string
  date: string
  duration?: string
  description: string
  artworkUrl?: string
  artworkPosition?: string   // CSS object-position override for the single Guest photo
  guestFaces?: GuestFace[]   // multi-guest: individual faces shown in the /episodes cloud
  themes: string[]
  country: string
  tags: string[]
  // Embed player URLs - paste the full share/embed URL from each platform:
  //   Transistor: copy the share link from share.transistor.fm/e/... and paste as-is
  //   Spotify episode:    open.spotify.com/episode/{spotifyEpisodeId}
  //   YouTube video:      youtube.com/watch?v={youtubeVideoId}
  transistorUrl?: string      // full URL e.g. "https://share.transistor.fm/e/abc12345"
  audioUrl?: string           // direct MP3 URL for og:audio meta tag
  spotifyEpisodeId?: string
  youtubeVideoId?: string
  teaserVideoUrl?: string     // short teaser/clip — direct .mp4 URL or embeddable iframe URL
  // Rich content for episode landing pages
  bio?: string
  topics?: string[]
  timestamps?: Timestamp[]
  pullQuote?: string
  transcript?: string
  guestLinkedIn?: string
  featured?: boolean          // pin as the featured episode; otherwise the newest is used
}

// ─── Episode library ──────────────────────────────────────────────────────────
// The list lives in src/data/episodes.json (under the "episodes" key) so it can
// be edited in the CMS (see public/admin) and by hand. Order is preserved as
// authored; newest first.
// The CMS drops empty list fields from the JSON, so themes/tags can be missing
// on a freshly added entry. Default them so one incomplete save can't break
// the build (every consumer treats them as arrays).
export const episodes: Episode[] = (
  (episodesData as { episodes: unknown[] }).episodes as Partial<Episode>[]
).map((e) => ({
  ...e,
  themes: e.themes ?? [],
  tags: e.tags ?? [],
  // Transistor's share-page link (/s/ID) refuses to load in an iframe; the
  // embeddable form is /e/ID. Accept either when pasted into the CMS.
  transistorUrl: e.transistorUrl?.replace(
    /^(https?:\/\/share\.transistor\.fm)\/s\//,
    '$1/e/'
  ),
})) as Episode[]

export const ALL_THEMES = [...new Set(episodes.flatMap((e) => e.themes))].sort()
export const ALL_COUNTRIES = [...new Set(episodes.map((e) => e.country))].sort()

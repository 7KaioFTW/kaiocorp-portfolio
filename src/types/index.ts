export interface MapStats {
  minutesPlayed: string;
  minutesPlayedRank?: number;
  favorites: string;
  favoritesRank?: number;
  allTimePeak: number;
  day1Retention: string;
  day7Retention: string;
  avgPlaytime: string;
}

export interface FortniteMap {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  creator: string;
  description: string;
  tags: string[];
  mapType: "UEFN" | "Creative";
  maxPlayers: number;
  released: string;
  updated: string;
  version: number;
  ageRating: string;
  xpStatus?: string;
  /**
   * Internal flag: map is delisted on Fortnite. **Intentionally NOT reflected on the
   * public site** — disabled maps are still shown as live everywhere (leaderboard,
   * detail page, sitemap, réalisations showcase) by product decision. Do not "fix" the
   * display to hide/label them.
   */
  disabled?: boolean;
  /** Pinned at the top of the /maps leaderboard, above the minutes-played ranking (product decision). */
  pinned?: boolean;
  brand?: string;
  stats: MapStats;
  fortniteGgUrl: string;
  thumbnail: string;
  featured: boolean;
}

export interface Collaborator {
  name: string;
  role: string;
  mapsCount: number;
  description: string;
}

// Note: aggregate figures (map count, collaborator count, total minutes) are NOT stored
// in creator.json — they are computed in src/lib/stats.ts from the source JSON files.
export interface Creator {
  name: string;
  fullName: string;
  role: string;
  company: string;
  email: string;
  website: string;
  bio: string;
  skills: string[];
  collaborators: Collaborator[];
  social: {
    twitter: string;
    fortniteGg: string;
  };
}

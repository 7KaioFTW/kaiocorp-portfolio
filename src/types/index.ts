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
  disabled?: boolean;
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

export interface AggregateStats {
  totalMaps: number;
  totalMinutesPlayed: string;
  totalFavorites: string;
  highestAllTimePeak: number;
  totalCollaborators: number;
}

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
  aggregateStats: AggregateStats;
  social: {
    twitter: string;
    fortniteGg: string;
  };
}

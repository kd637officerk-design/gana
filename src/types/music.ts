export type NavTab = 'queue' | 'tracks' | 'albums' | 'artists' | 'playlists';

export type RepeatMode = 'off' | 'all' | 'one';

export interface SynthProfile {
  rootFreq: number;
  bpm: number;
  scaleIntervals: number[];
  padWarmth: number;
  rainLevel: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  artwork: string;
  format: string;
  sourceType: 'synth' | 'local';
  audioUrl?: string;
  synthProfile?: SynthProfile;
  isFavorite?: boolean;
  isCloaked?: boolean;
  hasOriginalArt?: boolean;
  addedAt: number;
}

export interface QueueSlot {
  id: string;
  name: string;
  trackIds: string[];
  currentIndex: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
}

export interface WallpaperPreset {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  isCustom?: boolean;
}

export interface EqSettings {
  bands: [number, number, number, number, number]; // dB (-12 to +12)
  preset: string;
  caveReverb: boolean;
}

export interface WallpaperAppearance {
  selectedId: string;
  dimmer: number; // 0 to 85 (%)
  blur: number; // 0 to 20 (px)
  panelOpacity: number; // 30 to 90 (%)
}

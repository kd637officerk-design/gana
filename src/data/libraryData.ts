import { Playlist, QueueSlot, Track, WallpaperPreset } from '../types/music';

export const COVER_MIDNIGHT_ECHOES = '/src/assets/images/cover_midnight_echoes_1794801312996.jpg';
export const COVER_SUBTERRANEAN_DRIFT = '/src/assets/images/cover_subterranean_drift_1794801313113.jpg';

export const INITIAL_WALLPAPERS: WallpaperPreset[] = [
  {
    id: 'obsidian-cave',
    name: 'Obsidian Cave',
    subtitle: 'Lantern & underground lake',
    url: '/src/assets/images/wallpaper_obsidian_cave_1794801311237.jpg',
  },
  {
    id: 'twilight-valley',
    name: 'Twilight Valley',
    subtitle: 'Misty dusk ridge view',
    url: '/src/assets/images/wallpaper_rainy_skyline_1794801311983.jpg',
  },
  {
    id: 'listening-room',
    name: 'Listening Room',
    subtitle: 'Warm tungsten walnut studio',
    url: '/src/assets/images/wallpaper_listening_room_1794801312314.jpg',
  },
  {
    id: 'mystery-living-room',
    name: 'Late Night TV',
    subtitle: 'Uploaded app cover scene',
    url: '/assets/aistudio/1794798316811_13f5c3b0.jpg',
  },
];

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'cave-1',
    title: 'Lantern Over Still Water',
    artist: 'Bill & The Cave Ensemble',
    album: 'Midnight Echoes',
    duration: 218,
    artwork: COVER_MIDNIGHT_ECHOES,
    format: 'FLAC · 24-bit',
    sourceType: 'synth',
    isFavorite: true,
    addedAt: 1,
    synthProfile: {
      rootFreq: 130.81, // C3
      bpm: 68,
      scaleIntervals: [0, 3, 7, 10, 14],
      padWarmth: 620,
      rainLevel: 0.045,
    },
  },
  {
    id: 'cave-2',
    title: 'Basalt Resonance',
    artist: 'Bill & The Cave Ensemble',
    album: 'Midnight Echoes',
    duration: 194,
    artwork: COVER_MIDNIGHT_ECHOES,
    format: 'FLAC · 24-bit',
    sourceType: 'synth',
    isFavorite: false,
    addedAt: 2,
    synthProfile: {
      rootFreq: 110.0, // A2
      bpm: 64,
      scaleIntervals: [0, 3, 7, 10, 12],
      padWarmth: 520,
      rainLevel: 0.03,
    },
  },
  {
    id: 'cave-3',
    title: 'Amber Tungsten',
    artist: 'Nocturne Unit',
    album: 'Midnight Echoes',
    duration: 242,
    artwork: COVER_MIDNIGHT_ECHOES,
    format: 'OGG · 320 kbps',
    sourceType: 'synth',
    isFavorite: true,
    addedAt: 3,
    synthProfile: {
      rootFreq: 146.83, // D3
      bpm: 72,
      scaleIntervals: [0, 2, 5, 7, 10],
      padWarmth: 740,
      rainLevel: 0.02,
    },
  },
  {
    id: 'cave-4',
    title: 'Slate Horizon',
    artist: 'Nocturne Unit',
    album: 'Midnight Echoes',
    duration: 176,
    artwork: COVER_MIDNIGHT_ECHOES,
    format: 'FLAC · 24-bit',
    sourceType: 'synth',
    isFavorite: false,
    addedAt: 4,
    synthProfile: {
      rootFreq: 123.47, // B2
      bpm: 60,
      scaleIntervals: [0, 3, 5, 7, 11],
      padWarmth: 580,
      rainLevel: 0.05,
    },
  },
  {
    id: 'cave-5',
    title: 'Subterranean Drift',
    artist: 'Low Tide Collective',
    album: 'Subterranean Drift',
    duration: 230,
    artwork: COVER_SUBTERRANEAN_DRIFT,
    format: 'FLAC · 24-bit',
    sourceType: 'synth',
    isFavorite: true,
    addedAt: 5,
    synthProfile: {
      rootFreq: 98.0, // G2
      bpm: 58,
      scaleIntervals: [0, 3, 7, 9, 14],
      padWarmth: 480,
      rainLevel: 0.06,
    },
  },
  {
    id: 'cave-6',
    title: 'Silver Ripple Study',
    artist: 'Low Tide Collective',
    album: 'Subterranean Drift',
    duration: 188,
    artwork: COVER_SUBTERRANEAN_DRIFT,
    format: 'MP3 · 320 kbps',
    sourceType: 'synth',
    isFavorite: false,
    addedAt: 6,
    synthProfile: {
      rootFreq: 164.81, // E3
      bpm: 74,
      scaleIntervals: [0, 4, 7, 11, 14],
      padWarmth: 690,
      rainLevel: 0.025,
    },
  },
  {
    id: 'cave-7',
    title: 'Rain on Windowpane',
    artist: 'K. Vance',
    album: 'Subterranean Drift',
    duration: 205,
    artwork: COVER_SUBTERRANEAN_DRIFT,
    format: 'OGG · 320 kbps',
    sourceType: 'synth',
    isFavorite: false,
    addedAt: 7,
    synthProfile: {
      rootFreq: 138.59, // C#3
      bpm: 66,
      scaleIntervals: [0, 3, 7, 10, 15],
      padWarmth: 560,
      rainLevel: 0.075,
    },
  },
  {
    id: 'cave-8',
    title: 'Deep Focus Chamber',
    artist: 'K. Vance',
    album: 'Subterranean Drift',
    duration: 264,
    artwork: COVER_SUBTERRANEAN_DRIFT,
    format: 'FLAC · 24-bit',
    sourceType: 'synth',
    isFavorite: true,
    addedAt: 8,
    synthProfile: {
      rootFreq: 116.54, // A#2
      bpm: 62,
      scaleIntervals: [0, 2, 7, 9, 12],
      padWarmth: 500,
      rainLevel: 0.035,
    },
  },
];

export const INITIAL_QUEUES: QueueSlot[] = [
  {
    id: 'queue-main',
    name: 'Main',
    trackIds: ['cave-1', 'cave-2', 'cave-3', 'cave-5', 'cave-6', 'cave-8'],
    currentIndex: 0,
  },
  {
    id: 'queue-night',
    name: 'Late Night',
    trackIds: ['cave-5', 'cave-7', 'cave-4', 'cave-1'],
    currentIndex: 0,
  },
  {
    id: 'queue-focus',
    name: 'Deep Focus',
    trackIds: ['cave-8', 'cave-2', 'cave-6', 'cave-3'],
    currentIndex: 0,
  },
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-essentials',
    name: 'Cave Essentials',
    description: 'Core ambient sessions tuned for warm cavern acoustics.',
    trackIds: ['cave-1', 'cave-3', 'cave-5', 'cave-8'],
  },
  {
    id: 'pl-rain',
    name: 'Rain & Obsidian',
    description: 'Low-tempo textures for twilight listening.',
    trackIds: ['cave-4', 'cave-5', 'cave-7'],
  },
];

export const EQ_PRESETS: Record<string, [number, number, number, number, number]> = {
  Flat: [0, 0, 0, 0, 0],
  'Cave Warmth': [3.5, 2.0, -0.5, 1.5, 2.5],
  'Deep Bass': [6.5, 4.0, 0.5, -1.0, 0.5],
  'Vocal Clarity': [-2.0, 0.5, 3.5, 4.0, 2.0],
  'Late Night': [2.0, 1.5, 0.0, -1.5, -2.5],
};

export const EQ_FREQUENCIES = ['60 Hz', '230 Hz', '910 Hz', '3.6 kHz', '14 kHz'];

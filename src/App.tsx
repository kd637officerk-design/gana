import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BottomPlayerDock } from './components/BottomPlayerDock';
import { FeatureModals } from './components/FeatureModals';
import { LibraryViews } from './components/LibraryViews';
import { MusicoletNavTabs } from './components/MusicoletNavTabs';
import { TopFeatureBar } from './components/TopFeatureBar';
import {
  COVER_MIDNIGHT_ECHOES,
  INITIAL_PLAYLISTS,
  INITIAL_QUEUES,
  INITIAL_TRACKS,
  INITIAL_WALLPAPERS,
} from './data/libraryData';
import {
  EqSettings,
  NavTab,
  Playlist,
  QueueSlot,
  RepeatMode,
  Track,
  WallpaperAppearance,
  WallpaperPreset,
} from './types/music';
import { audioEngine } from './utils/audioEngine';
import { extractAudioMetadata } from './utils/audioMetadata';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [queues, setQueues] = useState<QueueSlot[]>(INITIAL_QUEUES);
  const [activeQueueId, setActiveQueueId] = useState<string>(INITIAL_QUEUES[0].id);
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);

  const [activeTab, setActiveTab] = useState<NavTab>('queue');
  const [searchQuery, setSearchQuery] = useState('');

  // Playback state
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(INITIAL_TRACKS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.78);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');

  // Bill's Cave features state
  const [activeModal, setActiveModal] = useState<'eq' | 'wallpaper' | 'sleep' | 'cloak' | null>(
    null
  );
  const [zenMode, setZenMode] = useState(false);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [inspectingTrackId, setInspectingTrackId] = useState<string | null>(null);

  // Cloak Access state
  const [cloakPin, setCloakPin] = useState<string>(() => {
    try {
      return localStorage.getItem('bills-cave-cloak-pin') ?? '';
    } catch {
      return '';
    }
  });
  const [cloakUnlocked, setCloakUnlocked] = useState(false);

  const [eqSettings, setEqSettings] = useState<EqSettings>({
    bands: [0, 0, 0, 0, 0],
    preset: 'Flat',
    caveReverb: false,
  });

  const [wallpapers, setWallpapers] = useState<WallpaperPreset[]>(INITIAL_WALLPAPERS);
  const [appearance, setAppearance] = useState<WallpaperAppearance>({
    selectedId: INITIAL_WALLPAPERS[0].id,
    dimmer: 16,
    blur: 0,
    panelOpacity: 44,
  });

  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cloakFileInputRef = useRef<HTMLInputElement | null>(null);

  // Public visible tracks exclude cloaked songs unless explicitly restored
  const visibleTracks = useMemo(() => tracks.filter((t) => !t.isCloaked), [tracks]);
  const cloakedTracks = useMemo(() => tracks.filter((t) => Boolean(t.isCloaked)), [tracks]);

  const stateRef = useRef({
    tracks,
    visibleTracks,
    queues,
    activeQueueId,
    currentTrackId,
    shuffle,
    repeatMode,
  });
  stateRef.current = {
    tracks,
    visibleTracks,
    queues,
    activeQueueId,
    currentTrackId,
    shuffle,
    repeatMode,
  };

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrackId) ?? null,
    [tracks, currentTrackId]
  );

  const inspectingTrack = useMemo(
    () => tracks.find((t) => t.id === inspectingTrackId) ?? null,
    [tracks, inspectingTrackId]
  );

  const activeWallpaper = useMemo(
    () => wallpapers.find((w) => w.id === appearance.selectedId) ?? wallpapers[0],
    [wallpapers, appearance.selectedId]
  );

  const playTrackById = useCallback((trackId: string, queueIdOverride?: string, queueIdx?: number) => {
    const target = stateRef.current.tracks.find((t) => t.id === trackId);
    if (!target) return;

    setCurrentTrackId(target.id);
    setCurrentTime(0);
    setIsPlaying(true);

    if (queueIdOverride !== undefined && queueIdx !== undefined) {
      setQueues((prev) =>
        prev.map((q) => (q.id === queueIdOverride ? { ...q, currentIndex: queueIdx } : q))
      );
    }

    void audioEngine.playTrack(target, 0);
  }, []);

  const handleNext = useCallback(() => {
    const {
      queues: qs,
      activeQueueId: qId,
      shuffle: isShuffle,
      repeatMode: repeat,
      visibleTracks: vis,
    } = stateRef.current;
    const visSet = new Set(vis.map((t) => t.id));
    const queue = qs.find((q) => q.id === qId);
    const playableIds = queue ? queue.trackIds.filter((id) => visSet.has(id)) : [];
    if (!queue || playableIds.length === 0) return;

    if (repeat === 'one' && stateRef.current.currentTrackId) {
      playTrackById(stateRef.current.currentTrackId, queue.id, queue.currentIndex);
      return;
    }

    const currentPos = Math.max(
      0,
      playableIds.indexOf(stateRef.current.currentTrackId ?? playableIds[0])
    );
    let nextPos = currentPos + 1;

    if (isShuffle && playableIds.length > 1) {
      let randPos = currentPos;
      while (randPos === currentPos) {
        randPos = Math.floor(Math.random() * playableIds.length);
      }
      nextPos = randPos;
    } else if (nextPos >= playableIds.length) {
      if (repeat === 'all') {
        nextPos = 0;
      } else {
        setIsPlaying(false);
        audioEngine.pause();
        return;
      }
    }

    const nextId = playableIds[nextPos];
    if (nextId) {
      const rawIdx = queue.trackIds.indexOf(nextId);
      playTrackById(nextId, queue.id, rawIdx >= 0 ? rawIdx : 0);
    }
  }, [playTrackById]);

  const handlePrev = useCallback(() => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }
    const visSet = new Set(visibleTracks.map((t) => t.id));
    const queue = queues.find((q) => q.id === activeQueueId);
    const playableIds = queue ? queue.trackIds.filter((id) => visSet.has(id)) : [];
    if (!queue || playableIds.length === 0) return;

    const currentPos = Math.max(0, playableIds.indexOf(currentTrackId ?? playableIds[0]));
    const prevPos = currentPos > 0 ? currentPos - 1 : playableIds.length - 1;
    const prevId = playableIds[prevPos];
    if (prevId) {
      const rawIdx = queue.trackIds.indexOf(prevId);
      playTrackById(prevId, queue.id, rawIdx >= 0 ? rawIdx : 0);
    }
  }, [activeQueueId, currentTime, currentTrackId, playTrackById, queues, visibleTracks]);

  useEffect(() => {
    audioEngine.setCallbacks(
      (time) => setCurrentTime(time),
      () => handleNext()
    );
  }, [handleNext]);

  useEffect(() => {
    if (sleepRemaining === null) return;
    const id = window.setInterval(() => {
      setSleepRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          audioEngine.pause();
          setIsPlaying(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [sleepRemaining]);

  const handleTogglePlay = useCallback(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (currentTime === 0) {
        void audioEngine.playTrack(currentTrack, 0);
      } else {
        void audioEngine.resume();
      }
    }
  }, [currentTime, currentTrack, isPlaying]);

  const handleStop = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
  }, []);

  // Sync Android Media Notification & Windows Media Transport Controls (SMTC)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    let cancelled = false;

    const updateMetadata = async () => {
      if (!currentTrack) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        return;
      }

      let resolvedArt = currentTrack.artwork;
      if (resolvedArt.startsWith('blob:')) {
        try {
          const blob = await fetch(resolvedArt).then((r) => r.blob());
          resolvedArt = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve(typeof reader.result === 'string' ? reader.result : currentTrack.artwork);
            reader.onerror = () => resolve(currentTrack.artwork);
            reader.readAsDataURL(blob);
          });
        } catch {
          resolvedArt = `${window.location.origin}/pwa-512x512.png`;
        }
      } else if (
        !resolvedArt.startsWith('http') &&
        !resolvedArt.startsWith('data:')
      ) {
        resolvedArt = `${window.location.origin}${resolvedArt.startsWith('/') ? '' : '/'}${resolvedArt}`;
      }

      if (cancelled) return;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [
          { src: resolvedArt, sizes: '512x512', type: 'image/jpeg' },
          { src: `${window.location.origin}/pwa-512x512.png`, sizes: '512x512', type: 'image/png' },
        ],
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    };

    void updateMetadata();
    return () => {
      cancelled = true;
    };
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const safeSetHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // ignore unsupported media session actions on older browsers
      }
    };

    safeSetHandler('play', () => {
      if (!isPlaying && currentTrack) handleTogglePlay();
    });
    safeSetHandler('pause', () => {
      if (isPlaying) handleTogglePlay();
    });
    safeSetHandler('stop', () => {
      handleStop();
    });
    safeSetHandler('previoustrack', () => {
      handlePrev();
    });
    safeSetHandler('nexttrack', () => {
      handleNext();
    });
    safeSetHandler('seekbackward', (details) => {
      const offset = details.seekOffset ?? 10;
      const nextPos = Math.max(0, currentTime - offset);
      audioEngine.seek(nextPos);
      setCurrentTime(nextPos);
    });
    safeSetHandler('seekforward', (details) => {
      const offset = details.seekOffset ?? 10;
      const maxDur = currentTrack?.duration ?? currentTime + offset;
      const nextPos = Math.min(maxDur, currentTime + offset);
      audioEngine.seek(nextPos);
      setCurrentTime(nextPos);
    });
    safeSetHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') {
        audioEngine.seek(details.seekTime);
        setCurrentTime(details.seekTime);
      }
    });

    return () => {
      safeSetHandler('play', null);
      safeSetHandler('pause', null);
      safeSetHandler('stop', null);
      safeSetHandler('previoustrack', null);
      safeSetHandler('nexttrack', null);
      safeSetHandler('seekbackward', null);
      safeSetHandler('seekforward', null);
      safeSetHandler('seekto', null);
    };
  }, [currentTime, currentTrack, handleNext, handlePrev, handleStop, handleTogglePlay, isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;
    try {
      if (typeof navigator.mediaSession.setPositionState === 'function') {
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, currentTrack.duration),
          playbackRate: 1,
          position: Math.min(currentTime, Math.max(1, currentTrack.duration)),
        });
      }
    } catch {
      // ignore invalid position state during track switch
    }
  }, [currentTime, currentTrack]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        audioEngine.seek(currentTime + 5);
      } else if (e.code === 'ArrowLeft') {
        audioEngine.seek(Math.max(0, currentTime - 5));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentTime, handleTogglePlay]);

  const handleImportAudioFiles = async (files: FileList | File[], importAsCloaked = false) => {
    const fileArr = Array.from(files);
    const audioFiles = fileArr.filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|m4b|flac|aac)$/i.test(f.name)
    );
    if (audioFiles.length === 0) return;

    // Check if an accompanying cover image file was dropped alongside audiobooks
    const companionImage = fileArr.find((f) => f.type.startsWith('image/'));
    const companionArtUrl = companionImage ? URL.createObjectURL(companionImage) : undefined;

    const importedTracks: Track[] = [];

    for (const file of audioFiles) {
      const objectUrl = URL.createObjectURL(file);
      const [duration, meta] = await Promise.all([
        new Promise<number>((resolve) => {
          const probe = new Audio();
          probe.src = objectUrl;
          probe.addEventListener('loadedmetadata', () => {
            resolve(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 180);
          });
          probe.addEventListener('error', () => resolve(180));
        }),
        extractAudioMetadata(file),
      ]);

      const fallbackTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      const ext = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';
      const resolvedArt = meta.artworkUrl || companionArtUrl || COVER_MIDNIGHT_ECHOES;

      importedTracks.push({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: meta.title || fallbackTitle,
        artist: meta.artist || (ext === 'M4B' ? 'Audiobook' : 'Local Audio'),
        album: meta.album || (ext === 'M4B' ? fallbackTitle : "Bill's Library"),
        duration,
        artwork: resolvedArt,
        hasOriginalArt: Boolean(meta.artworkUrl || companionArtUrl),
        format: ext,
        sourceType: 'local',
        audioUrl: objectUrl,
        isFavorite: false,
        isCloaked: importAsCloaked,
        addedAt: Date.now(),
      });
    }

    setTracks((prev) => [...importedTracks, ...prev]);

    if (!importAsCloaked) {
      setQueues((prev) =>
        prev.map((q) =>
          q.id === activeQueueId
            ? {
                ...q,
                trackIds: [...importedTracks.map((t) => t.id), ...q.trackIds],
                currentIndex: 0,
              }
            : q
        )
      );
      setActiveTab('queue');
      if (importedTracks[0]) {
        setCurrentTrackId(importedTracks[0].id);
        setCurrentTime(0);
        setIsPlaying(true);
        void audioEngine.playTrack(importedTracks[0], 0);
      }
    }
  };

  const handleToggleCloak = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isCloaked: !t.isCloaked } : t))
    );
    // If we just cloaked the currently playing track while vault is locked, pause or switch safely
    if (currentTrackId === trackId) {
      const target = tracks.find((t) => t.id === trackId);
      if (target && !target.isCloaked && !cloakUnlocked) {
        audioEngine.pause();
        setIsPlaying(false);
        const fallback = visibleTracks.find((t) => t.id !== trackId) ?? null;
        setCurrentTrackId(fallback?.id ?? null);
        setCurrentTime(0);
      }
    }
  };

  const handleLockCloak = () => {
    setCloakUnlocked(false);
    setActiveModal(null);
    // Hide playback if a cloaked track was playing
    if (currentTrack?.isCloaked) {
      audioEngine.pause();
      setIsPlaying(false);
      setCurrentTrackId(visibleTracks[0]?.id ?? null);
      setCurrentTime(0);
    }
  };

  const handleReplaceTrackArtwork = (trackId: string, file: File) => {
    const newUrl = URL.createObjectURL(file);
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, artwork: newUrl, hasOriginalArt: true } : t))
    );
  };

  const handleUploadWallpaper = (file: File) => {
    const url = URL.createObjectURL(file);
    const id = `custom-wp-${Date.now()}`;
    const name = file.name.replace(/\.[^/.]+$/, '').slice(0, 22) || 'Custom Wallpaper';
    setWallpapers((prev) => [...prev, { id, name, subtitle: 'Custom upload', url, isCustom: true }]);
    setAppearance((prev) => ({ ...prev, selectedId: id }));
  };

  const handlePlayTrackFromQueue = (idx: number) => {
    const queue = queues.find((q) => q.id === activeQueueId);
    if (!queue) return;
    const trackId = queue.trackIds[idx];
    if (trackId) {
      playTrackById(trackId, queue.id, idx);
    }
  };

  const handlePlayTrackDirect = (trackId: string) => {
    const queue = queues.find((q) => q.id === activeQueueId);
    if (!queue) {
      playTrackById(trackId);
      return;
    }
    const existingIdx = queue.trackIds.indexOf(trackId);
    if (existingIdx !== -1) {
      playTrackById(trackId, queue.id, existingIdx);
    } else {
      const nextTrackIds = [...queue.trackIds, trackId];
      const newIdx = nextTrackIds.length - 1;
      setQueues((prev) =>
        prev.map((q) =>
          q.id === activeQueueId ? { ...q, trackIds: nextTrackIds, currentIndex: newIdx } : q
        )
      );
      playTrackById(trackId);
    }
  };

  const handlePlayTrackList = (trackIds: string[]) => {
    if (trackIds.length === 0) return;
    setQueues((prev) =>
      prev.map((q) =>
        q.id === activeQueueId ? { ...q, trackIds: [...trackIds], currentIndex: 0 } : q
      )
    );
    setActiveTab('queue');
    playTrackById(trackIds[0], activeQueueId, 0);
  };

  const handleAddToQueue = (trackId: string) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.id === activeQueueId ? { ...q, trackIds: [...q.trackIds, trackId] } : q
      )
    );
  };

  const handleRemoveFromQueue = (idx: number) => {
    setQueues((prev) =>
      prev.map((q) => {
        if (q.id !== activeQueueId) return q;
        const nextIds = q.trackIds.filter((_, i) => i !== idx);
        const nextIndex = Math.max(0, Math.min(q.currentIndex, nextIds.length - 1));
        return { ...q, trackIds: nextIds, currentIndex: nextIndex };
      })
    );
  };

  const handleMoveQueueItem = (idx: number, dir: -1 | 1) => {
    setQueues((prev) =>
      prev.map((q) => {
        if (q.id !== activeQueueId) return q;
        const targetIdx = idx + dir;
        if (targetIdx < 0 || targetIdx >= q.trackIds.length) return q;
        const nextIds = [...q.trackIds];
        [nextIds[idx], nextIds[targetIdx]] = [nextIds[targetIdx], nextIds[idx]];
        let nextCurrent = q.currentIndex;
        if (q.currentIndex === idx) nextCurrent = targetIdx;
        else if (q.currentIndex === targetIdx) nextCurrent = idx;
        return { ...q, trackIds: nextIds, currentIndex: nextCurrent };
      })
    );
  };

  const handleShuffleQueue = () => {
    setQueues((prev) =>
      prev.map((q) => {
        if (q.id !== activeQueueId || q.trackIds.length < 2) return q;
        const shuffled = [...q.trackIds];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return { ...q, trackIds: shuffled, currentIndex: 0 };
      })
    );
  };

  const handleClearQueue = () => {
    setQueues((prev) =>
      prev.map((q) => (q.id === activeQueueId ? { ...q, trackIds: [], currentIndex: 0 } : q))
    );
  };

  const handleToggleFavorite = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  };

  const handleCreatePlaylist = (name: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description: 'Custom Bill’s Cave playlist',
      trackIds: [],
    };
    setPlaylists((prev) => [newPl, ...prev]);
  };

  const handleAddToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === playlistId && !pl.trackIds.includes(trackId)
          ? { ...pl, trackIds: [...pl.trackIds, trackId] }
          : pl
      )
    );
  };

  const handleRemoveFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === playlistId
          ? { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId) }
          : pl
      )
    );
  };

  const hudBg = `rgba(10, 12, 17, ${appearance.panelOpacity / 100})`;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden flex flex-col justify-between select-none"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingAudio(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setIsDraggingAudio(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingAudio(false);
        if (e.dataTransfer.files?.length) {
          void handleImportAudioFiles(e.dataTransfer.files, false);
        }
      }}
    >
      {/* Hidden Audio File Inputs (public + direct-to-cloak) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleImportAudioFiles(e.target.files, false);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={cloakFileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleImportAudioFiles(e.target.files, true);
          }
          e.target.value = '';
        }}
      />

      {/* FULL-BLEED BACKGROUND WALLPAPER */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#08090c]">
        <img
          src={activeWallpaper.url}
          alt={activeWallpaper.name}
          referrerPolicy="no-referrer"
          style={{
            filter: appearance.blur > 0 ? `blur(${appearance.blur}px)` : undefined,
            transform: appearance.blur > 0 ? 'scale(1.04)' : 'scale(1)',
          }}
          className="w-full h-full object-cover transition-transform duration-500"
        />
        <div
          style={{
            opacity: (zenMode ? Math.max(8, appearance.dimmer - 8) : appearance.dimmer) / 100,
          }}
          className="absolute inset-0 bg-[#07080c] transition-opacity duration-300"
        />
      </div>

      {/* SLIM TOP BAR: Bill's Cave Features */}
      <TopFeatureBar
        activeModal={activeModal}
        onToggleModal={(m) => setActiveModal((prev) => (prev === m ? null : m))}
        zenMode={zenMode}
        onToggleZenMode={() => setZenMode((prev) => !prev)}
        sleepRemaining={sleepRemaining}
        caveReverb={eqSettings.caveReverb}
        cloakedCount={cloakedTracks.length}
        cloakUnlocked={cloakUnlocked}
        onTriggerAddAudio={() => fileInputRef.current?.click()}
        panelOpacity={appearance.panelOpacity}
      />

      {/* OPEN WALLPAPER VIEWPORT + COMPACT BOTTOM-ANCHORED MUSICOLET PLAYER */}
      <main className="relative z-10 flex-1 min-h-0 flex flex-col justify-end px-3 sm:px-5 pb-3 pointer-events-none">
        <div
          style={{ backgroundColor: hudBg }}
          className="pointer-events-auto w-full max-w-2xl mx-auto rounded-2xl border border-white/[0.1] backdrop-blur-md shadow-2xl overflow-hidden flex flex-col transition-all duration-200"
        >
          {!zenMode && (
            <div className="flex flex-col h-[260px] sm:h-[285px]">
              <MusicoletNavTabs
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                panelOpacity={appearance.panelOpacity}
              />

              <LibraryViews
                activeTab={activeTab}
                tracks={visibleTracks}
                queues={queues}
                activeQueueId={activeQueueId}
                currentTrackId={currentTrackId}
                isPlaying={isPlaying}
                playlists={playlists}
                searchQuery={searchQuery}
                onSelectQueue={setActiveQueueId}
                onPlayTrackFromQueue={handlePlayTrackFromQueue}
                onPlayTrackDirect={handlePlayTrackDirect}
                onAddToQueue={handleAddToQueue}
                onRemoveFromQueue={handleRemoveFromQueue}
                onMoveQueueItem={handleMoveQueueItem}
                onShuffleQueue={handleShuffleQueue}
                onClearQueue={handleClearQueue}
                onToggleFavorite={handleToggleFavorite}
                onToggleCloak={handleToggleCloak}
                onInspectArtwork={(track) => setInspectingTrackId(track.id)}
                onCreatePlaylist={handleCreatePlaylist}
                onAddToPlaylist={handleAddToPlaylist}
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
                onPlayTrackList={handlePlayTrackList}
              />
            </div>
          )}

          <BottomPlayerDock
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            volume={volume}
            isMuted={isMuted}
            shuffle={shuffle}
            repeatMode={repeatMode}
            zenMode={zenMode}
            onToggleZenMode={() => setZenMode((prev) => !prev)}
            onTogglePlay={handleTogglePlay}
            onStop={handleStop}
            onPrev={handlePrev}
            onNext={handleNext}
            onSeek={(secs) => {
              audioEngine.seek(secs);
              setCurrentTime(secs);
            }}
            onVolumeChange={(val) => {
              setVolume(val);
              setIsMuted(val === 0);
              audioEngine.setVolume(val);
            }}
            onToggleMute={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              audioEngine.setVolume(nextMute ? 0 : volume);
            }}
            onToggleShuffle={() => setShuffle((prev) => !prev)}
            onCycleRepeat={() =>
              setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'))
            }
            onToggleFavorite={handleToggleFavorite}
            onInspectArtwork={(track) => setInspectingTrackId(track.id)}
          />
        </div>
      </main>

      {/* BILL'S CAVE FEATURE MODALS (EQ, Wallpapers, Sleep, Cloak, Original Cover Art) */}
      <FeatureModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        eqSettings={eqSettings}
        onUpdateEqBands={(bands, preset) => {
          setEqSettings((prev) => ({ ...prev, bands, preset }));
          audioEngine.setEqBands(bands);
        }}
        onToggleCaveReverb={() => {
          setEqSettings((prev) => {
            const next = !prev.caveReverb;
            audioEngine.setCaveReverb(next);
            return { ...prev, caveReverb: next };
          });
        }}
        wallpapers={wallpapers}
        appearance={appearance}
        onUpdateAppearance={(patch) => setAppearance((prev) => ({ ...prev, ...patch }))}
        onUploadWallpaper={handleUploadWallpaper}
        sleepRemaining={sleepRemaining}
        onSetSleepTimer={(mins) => setSleepRemaining(mins === null ? null : mins * 60)}
        cloakedTracks={cloakedTracks}
        cloakPin={cloakPin}
        cloakUnlocked={cloakUnlocked}
        onUnlockCloak={(attempt) => {
          if (!cloakPin || attempt === cloakPin) {
            setCloakUnlocked(true);
            return true;
          }
          return false;
        }}
        onLockCloak={handleLockCloak}
        onSetCloakPin={(newPin) => {
          setCloakPin(newPin);
          try {
            if (newPin) localStorage.setItem('bills-cave-cloak-pin', newPin);
            else localStorage.removeItem('bills-cave-cloak-pin');
          } catch {
            // ignore storage errors
          }
        }}
        onPlayCloakedTrack={(id) => playTrackById(id)}
        onToggleCloak={handleToggleCloak}
        onImportCloakedAudio={() => cloakFileInputRef.current?.click()}
        inspectingTrack={inspectingTrack}
        onCloseInspectArtwork={() => setInspectingTrackId(null)}
        onReplaceTrackArtwork={handleReplaceTrackArtwork}
      />

      {/* DRAG-AND-DROP AUDIO OVERLAY */}
      {isDraggingAudio && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-none">
          <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-zinc-950/90 px-8 py-6 text-center">
            <p className="font-display text-base font-semibold text-amber-300">
              Drop audio or audiobooks into Bill&apos;s Cave
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Extracts original embedded cover art from MP3, M4B, M4A, and FLAC files.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

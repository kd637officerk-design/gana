import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { RepeatMode, Track } from '../types/music';
import { audioEngine, formatDuration } from '../utils/audioEngine';

interface BottomPlayerDockProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  zenMode: boolean;
  onToggleZenMode: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onInspectArtwork: (track: Track) => void;
}

export const BottomPlayerDock: React.FC<BottomPlayerDockProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  volume,
  isMuted,
  shuffle,
  repeatMode,
  zenMode,
  onToggleZenMode,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onToggleFavorite,
  onInspectArtwork,
}) => {
  const [bars, setBars] = useState<number[]>(Array(6).fill(0.16));

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(6).fill(0.16));
      return;
    }
    let rafId = 0;
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (now - lastUpdate > 80) {
        setBars(audioEngine.getFrequencyBars(6));
        lastUpdate = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const duration = currentTrack?.duration || 1;
  const progressPct = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  return (
    <div className="px-3.5 py-2 border-t border-white/[0.08] bg-black/25">
      {/* Slim Scrubber Row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-mono-tabular text-[10px] text-zinc-400 w-8 text-right shrink-0">
          {formatDuration(currentTime)}
        </span>
        <div className="relative flex-1 flex items-center h-3">
          <div className="w-full h-[3px] rounded-full bg-white/15 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-amber-400 transition-[width] duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.5}
            value={Math.min(currentTime, duration)}
            onChange={(e) => onSeek(Number(e.target.value))}
            disabled={!currentTrack}
            aria-label="Seek track position"
            className="cave-slider absolute inset-0 w-full opacity-0 hover:opacity-100 focus-visible:opacity-100"
          />
        </div>
        <span className="font-mono-tabular text-[10px] text-zinc-400 w-8 shrink-0">
          {formatDuration(currentTrack?.duration ?? 0)}
        </span>
      </div>

      {/* Ultra-compact Control Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Clickable 36px Artwork (opens full original art) + Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {currentTrack ? (
            <button
              type="button"
              onClick={() => onInspectArtwork(currentTrack)}
              title="View original audiobook / track cover art"
              aria-label="View original cover art"
              className="group relative w-9 h-9 rounded-md overflow-hidden bg-zinc-900 border border-white/10 hover:border-amber-400 shrink-0 transition-colors"
            >
              <img
                src={currentTrack.artwork}
                alt={`${currentTrack.album} cover`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Maximize2 className="w-3 h-3 text-amber-300" />
              </span>
            </button>
          ) : (
            <div className="w-9 h-9 rounded-md bg-white/[0.05] border border-white/10 shrink-0 flex items-center justify-center text-zinc-500 text-[10px]">
              --
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-zinc-100 truncate">
                {currentTrack ? currentTrack.title : 'Select a track'}
              </p>
              {currentTrack && (
                <div className="hidden sm:flex items-end gap-[2px] h-2.5 shrink-0" aria-hidden="true">
                  {bars.slice(0, 4).map((val, idx) => (
                    <span
                      key={idx}
                      className="w-[2px] rounded-full bg-amber-400/85 transition-transform duration-75 origin-bottom"
                      style={{ height: '10px', transform: `scaleY(${isPlaying ? val : 0.2})` }}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              {currentTrack
                ? `${currentTrack.artist} · ${currentTrack.album}`
                : 'Ready in Bill’s Cave'}
            </p>
          </div>
        </div>

        {/* Center: Compact Transport */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleShuffle}
            aria-label="Toggle shuffle"
            aria-pressed={shuffle}
            className={`w-7 h-7 hidden sm:flex items-center justify-center rounded-full transition-colors ${
              shuffle ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onPrev}
            disabled={!currentTrack}
            aria-label="Previous track"
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-200 hover:bg-white/10 disabled:opacity-40 transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!currentTrack}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-40 shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!currentTrack}
            aria-label="Next track"
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-200 hover:bg-white/10 disabled:opacity-40 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onCycleRepeat}
            aria-label={`Repeat mode: ${repeatMode}`}
            className={`w-7 h-7 hidden sm:flex items-center justify-center rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-amber-400 bg-amber-400/10' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-3.5 h-3.5" />
            ) : (
              <Repeat className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Right: Favorite + Volume + Expand/Collapse */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {currentTrack && (
            <button
              type="button"
              onClick={() => onToggleFavorite(currentTrack.id)}
              aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`w-7 h-7 hidden sm:flex items-center justify-center rounded-full transition-colors ${
                currentTrack.isFavorite
                  ? 'text-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          <div className="hidden md:flex items-center gap-1.5 w-20">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-zinc-400 hover:text-zinc-200 p-0.5"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Master volume"
              className="cave-slider w-full"
            />
          </div>

          <button
            type="button"
            onClick={onToggleZenMode}
            title={zenMode ? 'Show library tabs' : 'Collapse library to mini-player'}
            aria-label={zenMode ? 'Show library tabs' : 'Collapse library to mini-player'}
            className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
          >
            {zenMode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

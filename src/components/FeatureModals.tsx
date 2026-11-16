import React, { useRef, useState } from 'react';
import { Eye, ImagePlus, Lock, Play, Plus, Shield, Unlock, Upload, X } from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../data/libraryData';
import { EqSettings, Track, WallpaperAppearance, WallpaperPreset } from '../types/music';
import { formatDuration } from '../utils/audioEngine';

interface FeatureModalsProps {
  activeModal: 'eq' | 'wallpaper' | 'sleep' | 'cloak' | null;
  onClose: () => void;
  eqSettings: EqSettings;
  onUpdateEqBands: (bands: [number, number, number, number, number], preset: string) => void;
  onToggleCaveReverb: () => void;
  wallpapers: WallpaperPreset[];
  appearance: WallpaperAppearance;
  onUpdateAppearance: (patch: Partial<WallpaperAppearance>) => void;
  onUploadWallpaper: (file: File) => void;
  sleepRemaining: number | null;
  onSetSleepTimer: (minutes: number | null) => void;
  // Cloak Access props
  cloakedTracks: Track[];
  cloakPin: string;
  cloakUnlocked: boolean;
  onUnlockCloak: (pinAttempt: string) => boolean;
  onLockCloak: () => void;
  onSetCloakPin: (newPin: string) => void;
  onPlayCloakedTrack: (trackId: string) => void;
  onToggleCloak: (trackId: string) => void;
  onImportCloakedAudio: () => void;
  // Original Art Viewer props
  inspectingTrack: Track | null;
  onCloseInspectArtwork: () => void;
  onReplaceTrackArtwork: (trackId: string, file: File) => void;
}

export const FeatureModals: React.FC<FeatureModalsProps> = ({
  activeModal,
  onClose,
  eqSettings,
  onUpdateEqBands,
  onToggleCaveReverb,
  wallpapers,
  appearance,
  onUpdateAppearance,
  onUploadWallpaper,
  sleepRemaining,
  onSetSleepTimer,
  cloakedTracks,
  cloakPin,
  cloakUnlocked,
  onUnlockCloak,
  onLockCloak,
  onSetCloakPin,
  onPlayCloakedTrack,
  onToggleCloak,
  onImportCloakedAudio,
  inspectingTrack,
  onCloseInspectArtwork,
  onReplaceTrackArtwork,
}) => {
  const wallpaperInputRef = useRef<HTMLInputElement | null>(null);
  const coverArtInputRef = useRef<HTMLInputElement | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [newPinDraft, setNewPinDraft] = useState('');
  const [editingPin, setEditingPin] = useState(false);

  if (!activeModal && !inspectingTrack) return null;

  return (
    <>
      {/* FEATURE MODALS (EQ, Wallpapers, Sleep, Cloak Access) */}
      {activeModal && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center pt-14 px-4 bg-black/50 backdrop-blur-xs"
          onClick={onClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#0B0D12]/92 border border-white/[0.12] backdrop-blur-xl p-4 shadow-2xl text-zinc-100 max-h-[82vh] overflow-y-auto cave-scroll"
          >
            {/* CAVE EQ & ACOUSTICS */}
            {activeModal === 'eq' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-sm font-semibold text-zinc-100">
                      Cave Acoustics &amp; 5-Band EQ
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Real-time Web Audio shaping across every track.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close Equalizer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(EQ_PRESETS).map(([name, bands]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onUpdateEqBands([...bands], name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        eqSettings.preset === name
                          ? 'bg-amber-400 text-zinc-950'
                          : 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12]'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5 pt-1">
                  {EQ_FREQUENCIES.map((freq, idx) => {
                    const val = eqSettings.bands[idx];
                    return (
                      <div key={freq} className="flex items-center gap-3">
                        <span className="font-mono-tabular text-[11px] text-zinc-400 w-12 shrink-0">
                          {freq}
                        </span>
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={0.5}
                          value={val}
                          onChange={(e) => {
                            const next = [...eqSettings.bands] as [number, number, number, number, number];
                            next[idx] = Number(e.target.value);
                            onUpdateEqBands(next, 'Custom');
                          }}
                          aria-label={`${freq} gain`}
                          className="cave-slider flex-1"
                        />
                        <span className="font-mono-tabular text-[11px] text-amber-300 w-12 text-right shrink-0">
                          {val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1)} dB
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                  <div>
                    <p className="text-xs font-medium text-zinc-100">Cave Spatial Reverb</p>
                    <p className="text-[11px] text-zinc-400">
                      Subtle stereo cavern reflection.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={eqSettings.caveReverb}
                    onClick={onToggleCaveReverb}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                      eqSettings.caveReverb ? 'bg-amber-400' : 'bg-white/15'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-zinc-950 transition-transform ${
                        eqSettings.caveReverb ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* CLOAK ACCESS VAULT */}
            {activeModal === 'cloak' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <div>
                      <h2 className="font-display text-sm font-semibold text-zinc-100">
                        Cloak Access
                      </h2>
                      <p className="text-[11px] text-zinc-400">
                        {cloakedTracks.length} {cloakedTracks.length === 1 ? 'song' : 'songs'} hidden from public tabs
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close Cloak Access"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!cloakUnlocked ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const ok = onUnlockCloak(pinInput);
                      if (!ok) {
                        setPinError('Incorrect PIN');
                      } else {
                        setPinInput('');
                        setPinError('');
                      }
                    }}
                    className="space-y-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-3.5"
                  >
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {cloakPin
                          ? 'Enter your Cloak PIN to view and play cloaked songs.'
                          : 'Cloak Access is currently locked.'}
                      </span>
                    </div>

                    {cloakPin && (
                      <div className="space-y-1">
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={8}
                          value={pinInput}
                          onChange={(e) => {
                            setPinInput(e.target.value);
                            setPinError('');
                          }}
                          placeholder="Enter PIN..."
                          aria-label="Cloak Access PIN"
                          className="w-full h-8 px-3 rounded-lg bg-black/40 border border-white/15 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                        />
                        {pinError && <p className="text-[11px] text-rose-400">{pinError}</p>}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full h-8 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock Cloak Access</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {/* Cloak Toolbar */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={onImportCloakedAudio}
                        className="h-7 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Import to Cloak</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingPin((prev) => !prev)}
                          className="h-7 px-2.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-[11px] text-zinc-200 transition-colors"
                        >
                          {cloakPin ? 'Change PIN' : 'Set PIN'}
                        </button>
                        <button
                          type="button"
                          onClick={onLockCloak}
                          className="h-7 px-2.5 rounded-lg bg-white/[0.07] hover:bg-rose-500/20 hover:text-rose-300 text-[11px] text-zinc-200 flex items-center gap-1 transition-colors"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Lock</span>
                        </button>
                      </div>
                    </div>

                    {editingPin && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          onSetCloakPin(newPinDraft.trim());
                          setNewPinDraft('');
                          setEditingPin(false);
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.04] border border-white/10"
                      >
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={8}
                          value={newPinDraft}
                          onChange={(e) => setNewPinDraft(e.target.value)}
                          placeholder="New PIN (blank = no PIN)"
                          aria-label="New Cloak PIN"
                          className="flex-1 h-7 px-2.5 rounded bg-black/40 border border-white/15 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="submit"
                          className="h-7 px-3 rounded bg-amber-400 text-zinc-950 text-xs font-semibold"
                        >
                          Save
                        </button>
                      </form>
                    )}

                    {/* Cloaked Songs List */}
                    <div className="max-h-56 overflow-y-auto cave-scroll space-y-1">
                      {cloakedTracks.length === 0 ? (
                        <div className="py-6 text-center rounded-xl border border-dashed border-white/10">
                          <p className="text-xs text-zinc-300">No cloaked songs yet</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Click the cloak icon on any song or import directly here.
                          </p>
                        </div>
                      ) : (
                        cloakedTracks.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => onPlayCloakedTrack(track.id)}
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                            >
                              <img
                                src={track.artwork}
                                alt={track.title}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded object-cover border border-white/10 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-zinc-100 truncate">
                                  {track.title}
                                </p>
                                <p className="text-[11px] text-zinc-400 truncate">
                                  {track.artist} · {formatDuration(track.duration)}
                                </p>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onPlayCloakedTrack(track.id)}
                                aria-label="Play cloaked song"
                                className="w-7 h-7 flex items-center justify-center rounded-md text-amber-400 hover:bg-white/10"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleCloak(track.id)}
                                title="Restore to public library"
                                aria-label="Restore to public library"
                                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WALLPAPER STUDIO */}
            {activeModal === 'wallpaper' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-sm font-semibold text-zinc-100">
                      Wallpaper &amp; Glass Studio
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Dial in panel transparency so your background wallpaper stands out.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close Wallpaper Studio"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {wallpapers.map((wp) => {
                    const isSelected = wp.id === appearance.selectedId;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => onUpdateAppearance({ selectedId: wp.id })}
                        className={`text-left rounded-xl overflow-hidden border transition-all ${
                          isSelected
                            ? 'border-amber-400 ring-1 ring-amber-400/50'
                            : 'border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="aspect-video w-full bg-zinc-900 overflow-hidden">
                          <img
                            src={wp.url}
                            alt={wp.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="px-2 py-1.5 bg-black/40">
                          <p className="text-[11px] font-medium text-zinc-100 truncate">{wp.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <input
                    ref={wallpaperInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadWallpaper(file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => wallpaperInputRef.current?.click()}
                    className="w-full h-9 px-3 rounded-xl border border-dashed border-white/20 hover:border-amber-400/60 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-medium text-zinc-200 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Custom Wallpaper</span>
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-300 w-28 shrink-0">Panel Opacity</span>
                    <input
                      type="range"
                      min={20}
                      max={88}
                      step={1}
                      value={appearance.panelOpacity}
                      onChange={(e) => onUpdateAppearance({ panelOpacity: Number(e.target.value) })}
                      className="cave-slider flex-1"
                    />
                    <span className="font-mono-tabular text-[11px] text-amber-300 w-9 text-right">
                      {appearance.panelOpacity}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-300 w-28 shrink-0">Dimmer</span>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={1}
                      value={appearance.dimmer}
                      onChange={(e) => onUpdateAppearance({ dimmer: Number(e.target.value) })}
                      className="cave-slider flex-1"
                    />
                    <span className="font-mono-tabular text-[11px] text-amber-300 w-9 text-right">
                      {appearance.dimmer}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-300 w-28 shrink-0">Blur</span>
                    <input
                      type="range"
                      min={0}
                      max={16}
                      step={1}
                      value={appearance.blur}
                      onChange={(e) => onUpdateAppearance({ blur: Number(e.target.value) })}
                      className="cave-slider flex-1"
                    />
                    <span className="font-mono-tabular text-[11px] text-amber-300 w-9 text-right">
                      {appearance.blur}px
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SLEEP TIMER */}
            {activeModal === 'sleep' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-sm font-semibold text-zinc-100">
                      Sleep Timer
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {sleepRemaining !== null
                        ? `Playback pauses in ${formatDuration(sleepRemaining)}`
                        : 'Automatically pause playback after a set duration.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close Sleep Timer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[null, 15, 30, 45, 60, 90].map((mins) => {
                    const label = mins === null ? 'Off' : `${mins} min`;
                    const isSelected =
                      (mins === null && sleepRemaining === null) ||
                      (mins !== null &&
                        sleepRemaining !== null &&
                        Math.ceil(sleepRemaining / 60) === mins);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          onSetSleepTimer(mins);
                          onClose();
                        }}
                        className={`h-9 rounded-xl text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-amber-400 text-zinc-950 font-semibold'
                            : 'bg-white/[0.06] text-zinc-200 hover:bg-white/[0.12]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORIGINAL AUDIOBOOK / TRACK COVER ART VIEWER */}
      {inspectingTrack && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={onCloseInspectArtwork}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#0B0D12]/95 border border-white/15 p-4 shadow-2xl text-zinc-100 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-sm font-semibold text-zinc-100 truncate">
                  {inspectingTrack.title}
                </h2>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {inspectingTrack.artist} · {inspectingTrack.album} · {inspectingTrack.format}
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseInspectArtwork}
                aria-label="Close cover art viewer"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/10 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center max-h-[55vh]">
              <img
                src={inspectingTrack.artwork}
                alt={`${inspectingTrack.title} original cover art`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[55vh] object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-zinc-400">
                {inspectingTrack.hasOriginalArt
                  ? 'Original embedded cover art'
                  : 'Default sleeve · Attach original art anytime'}
              </span>

              <input
                ref={coverArtInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onReplaceTrackArtwork(inspectingTrack.id, file);
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => coverArtInputRef.current?.click()}
                className="h-8 px-3 rounded-lg bg-white/[0.08] hover:bg-amber-400 hover:text-zinc-950 text-xs font-medium text-zinc-100 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>Set Cover Art</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

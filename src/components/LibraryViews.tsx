import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Disc,
  EyeOff,
  Heart,
  ListPlus,
  Play,
  Plus,
  Shuffle,
  Trash2,
  User,
} from 'lucide-react';
import { NavTab, Playlist, QueueSlot, Track } from '../types/music';
import { formatDuration } from '../utils/audioEngine';

interface LibraryViewsProps {
  activeTab: NavTab;
  tracks: Track[];
  queues: QueueSlot[];
  activeQueueId: string;
  currentTrackId: string | null;
  isPlaying: boolean;
  playlists: Playlist[];
  searchQuery: string;
  onSelectQueue: (queueId: string) => void;
  onPlayTrackFromQueue: (index: number) => void;
  onPlayTrackDirect: (trackId: string) => void;
  onAddToQueue: (trackId: string) => void;
  onRemoveFromQueue: (index: number) => void;
  onMoveQueueItem: (index: number, direction: -1 | 1) => void;
  onShuffleQueue: () => void;
  onClearQueue: () => void;
  onToggleFavorite: (trackId: string) => void;
  onToggleCloak: (trackId: string) => void;
  onInspectArtwork: (track: Track) => void;
  onCreatePlaylist: (name: string) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onRemoveFromPlaylist: (playlistId: string, trackId: string) => void;
  onPlayTrackList: (trackIds: string[]) => void;
}

type SortKey = 'default' | 'title' | 'artist' | 'duration';

export const LibraryViews: React.FC<LibraryViewsProps> = ({
  activeTab,
  tracks,
  queues,
  activeQueueId,
  currentTrackId,
  isPlaying,
  playlists,
  searchQuery,
  onSelectQueue,
  onPlayTrackFromQueue,
  onPlayTrackDirect,
  onAddToQueue,
  onRemoveFromQueue,
  onMoveQueueItem,
  onShuffleQueue,
  onClearQueue,
  onToggleFavorite,
  onToggleCloak,
  onInspectArtwork,
  onCreatePlaylist,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onPlayTrackList,
}) => {
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>('pl-essentials');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistPickerTrackId, setPlaylistPickerTrackId] = useState<string | null>(null);

  const trackMap = useMemo(() => {
    const map = new Map<string, Track>();
    tracks.forEach((t) => map.set(t.id, t));
    return map;
  }, [tracks]);

  const activeQueue = useMemo(
    () => queues.find((q) => q.id === activeQueueId) ?? queues[0],
    [queues, activeQueueId]
  );

  const query = searchQuery.trim().toLowerCase();

  const filteredTracks = useMemo(() => {
    const base = query
      ? tracks.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            t.artist.toLowerCase().includes(query) ||
            t.album.toLowerCase().includes(query)
        )
      : tracks;

    const copy = [...base];
    if (sortBy === 'title') copy.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'artist') copy.sort((a, b) => a.artist.localeCompare(b.artist));
    else if (sortBy === 'duration') copy.sort((a, b) => a.duration - b.duration);
    return copy;
  }, [tracks, query, sortBy]);

  const albums = useMemo(() => {
    const grouped = new Map<string, { name: string; artist: string; artwork: string; tracks: Track[] }>();
    filteredTracks.forEach((t) => {
      const existing = grouped.get(t.album);
      if (existing) {
        existing.tracks.push(t);
      } else {
        grouped.set(t.album, {
          name: t.album,
          artist: t.artist,
          artwork: t.artwork,
          tracks: [t],
        });
      }
    });
    return Array.from(grouped.values());
  }, [filteredTracks]);

  const artists = useMemo(() => {
    const grouped = new Map<string, { name: string; artwork: string; tracks: Track[]; albums: Set<string> }>();
    filteredTracks.forEach((t) => {
      const existing = grouped.get(t.artist);
      if (existing) {
        existing.tracks.push(t);
        existing.albums.add(t.album);
      } else {
        grouped.set(t.artist, {
          name: t.artist,
          artwork: t.artwork,
          tracks: [t],
          albums: new Set([t.album]),
        });
      }
    });
    return Array.from(grouped.values());
  }, [filteredTracks]);

  const favoriteTracks = useMemo(
    () => filteredTracks.filter((t) => t.isFavorite),
    [filteredTracks]
  );

  const renderTrackRow = (
    track: Track,
    options: {
      indexLabel?: number;
      isActiveRow?: boolean;
      onPlay: () => void;
      queueIndex?: number;
      queueTotal?: number;
      playlistId?: string;
    }
  ) => {
    const isCurrent = options.isActiveRow ?? track.id === currentTrackId;
    return (
      <div
        key={`${track.id}-${options.queueIndex ?? 'lib'}`}
        className={`group relative flex items-center justify-between gap-2 px-2 py-1 rounded-lg transition-colors ${
          isCurrent
            ? 'bg-amber-400/[0.12] text-zinc-100'
            : 'hover:bg-white/[0.06] text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {options.indexLabel !== undefined && (
            <span
              className={`font-mono-tabular text-[11px] w-4 text-right shrink-0 ${
                isCurrent ? 'text-amber-400 font-semibold' : 'text-zinc-500'
              }`}
            >
              {options.indexLabel + 1}
            </span>
          )}

          {/* Clickable 30px thumbnail to inspect original audiobook/album art */}
          <button
            type="button"
            onClick={() => onInspectArtwork(track)}
            title="View original cover art"
            aria-label={`View original cover art for ${track.title}`}
            className="relative w-7.5 h-7.5 rounded overflow-hidden bg-zinc-900 border border-white/10 hover:border-amber-400/70 shrink-0 transition-colors"
          >
            <img
              src={track.artwork}
              alt={`${track.album} art`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {isCurrent && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                <span className="text-[9px] font-semibold text-amber-400">
                  {isPlaying ? '▶' : '❚❚'}
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={options.onPlay}
            className="min-w-0 flex-1 text-left focus-visible:outline-none"
          >
            <p
              className={`text-xs font-medium truncate leading-tight ${
                isCurrent ? 'text-amber-300' : 'text-zinc-100'
              }`}
            >
              {track.title}
            </p>
            <p className="text-[11px] text-zinc-400 truncate leading-tight mt-0.5">
              {track.artist} · {track.album}
            </p>
          </button>
        </div>

        {/* Right: Tabular Duration & Compact Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="font-mono-tabular text-[11px] text-zinc-400 mr-1.5 hidden sm:inline">
            {formatDuration(track.duration)}
          </span>

          <button
            type="button"
            onClick={() => onToggleFavorite(track.id)}
            aria-label={track.isFavorite ? 'Remove favorite' : 'Favorite track'}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              track.isFavorite
                ? 'text-amber-400'
                : 'text-zinc-500 hover:text-zinc-200 opacity-60 group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onToggleCloak(track.id)}
            title={track.isCloaked ? 'Uncloak song' : 'Move to Cloak Access'}
            aria-label={track.isCloaked ? 'Uncloak song' : 'Move to Cloak Access'}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              track.isCloaked
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-zinc-500 hover:text-amber-300 opacity-60 group-hover:opacity-100'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>

          {options.queueIndex !== undefined ? (
            <>
              <button
                type="button"
                onClick={() => onMoveQueueItem(options.queueIndex!, -1)}
                disabled={options.queueIndex === 0}
                aria-label="Move up"
                className="w-7 h-7 hidden sm:flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/10 disabled:opacity-25 transition-colors"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onMoveQueueItem(options.queueIndex!, 1)}
                disabled={options.queueIndex === (options.queueTotal ?? 1) - 1}
                aria-label="Move down"
                className="w-7 h-7 hidden sm:flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/10 disabled:opacity-25 transition-colors"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveFromQueue(options.queueIndex!)}
                aria-label="Remove from queue"
                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onAddToQueue(track.id)}
                title="Add to active queue"
                aria-label="Add to active queue"
                className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
              >
                <ListPlus className="w-3.5 h-3.5" />
              </button>

              {options.playlistId ? (
                <button
                  type="button"
                  onClick={() => onRemoveFromPlaylist(options.playlistId!, track.id)}
                  title="Remove from playlist"
                  aria-label="Remove from playlist"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setPlaylistPickerTrackId((prev) => (prev === track.id ? null : track.id))
                    }
                    title="Add to playlist"
                    aria-label="Add to playlist"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {playlistPickerTrackId === track.id && (
                    <div className="absolute right-0 top-8 z-30 w-40 rounded-lg bg-zinc-950/95 border border-white/15 p-1 shadow-xl backdrop-blur-lg">
                      <p className="px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                        Add to playlist
                      </p>
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => {
                            onAddToPlaylist(pl.id, track.id);
                            setPlaylistPickerTrackId(null);
                          }}
                          className="w-full text-left px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/10 rounded truncate"
                        >
                          {pl.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* QUEUE TAB */}
      {activeTab === 'queue' && activeQueue && (
        <>
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {queues.map((q) => {
                const isSelected = q.id === activeQueue.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onSelectQueue(q.id)}
                    className={`h-6 px-2 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/35'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent'
                    }`}
                  >
                    {q.name} · {q.trackIds.filter((id) => trackMap.has(id)).length}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onShuffleQueue}
                disabled={activeQueue.trackIds.length < 2}
                className="h-6 px-2 rounded-md text-[11px] font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/[0.08] disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                <Shuffle className="w-3 h-3" />
                <span>Shuffle</span>
              </button>
              <button
                type="button"
                onClick={onClearQueue}
                disabled={activeQueue.trackIds.length === 0}
                className="h-6 px-2 rounded-md text-[11px] font-medium text-zinc-400 hover:text-rose-300 hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto cave-scroll p-1.5 space-y-0.5">
            {activeQueue.trackIds.filter((id) => trackMap.has(id)).length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs font-medium text-zinc-300">Queue empty</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Add tracks from Tracks or Albums.
                </p>
              </div>
            ) : (
              activeQueue.trackIds
                .map((id, idx) => ({ track: trackMap.get(id), idx }))
                .filter(
                  (item): item is { track: Track; idx: number } =>
                    Boolean(item.track) &&
                    (!query ||
                      item.track!.title.toLowerCase().includes(query) ||
                      item.track!.artist.toLowerCase().includes(query) ||
                      item.track!.album.toLowerCase().includes(query))
                )
                .map(({ track, idx }) =>
                  renderTrackRow(track, {
                    indexLabel: idx,
                    isActiveRow: idx === activeQueue.currentIndex && track.id === currentTrackId,
                    onPlay: () => onPlayTrackFromQueue(idx),
                    queueIndex: idx,
                    queueTotal: activeQueue.trackIds.length,
                  })
                )
            )}
          </div>
        </>
      )}

      {/* TRACKS TAB */}
      {activeTab === 'tracks' && (
        <>
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/[0.06]">
            <p className="text-[11px] text-zinc-400 font-mono-tabular">
              {filteredTracks.length} {filteredTracks.length === 1 ? 'track' : 'tracks'}
            </p>
            <div className="flex items-center gap-1.5">
              <select
                aria-label="Sort tracks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-6 px-2 rounded-md bg-white/[0.06] border border-white/10 text-[11px] text-zinc-200 focus:outline-none focus:border-amber-400"
              >
                <option value="default" className="bg-zinc-900">Default</option>
                <option value="title" className="bg-zinc-900">Title</option>
                <option value="artist" className="bg-zinc-900">Artist</option>
                <option value="duration" className="bg-zinc-900">Duration</option>
              </select>
              <button
                type="button"
                onClick={() => onPlayTrackList(filteredTracks.map((t) => t.id))}
                disabled={filteredTracks.length === 0}
                className="h-6 px-2.5 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-medium text-zinc-100 flex items-center gap-1 transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play All</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto cave-scroll p-1.5 space-y-0.5">
            {filteredTracks.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400">
                No tracks match &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredTracks.map((track, idx) =>
                renderTrackRow(track, {
                  indexLabel: idx,
                  onPlay: () => onPlayTrackDirect(track.id),
                })
              )
            )}
          </div>
        </>
      )}

      {/* ALBUMS TAB */}
      {activeTab === 'albums' && (
        <div className="flex-1 overflow-y-auto cave-scroll p-2 space-y-1.5">
          {albums.map((album) => {
            const isOpen = expandedAlbum === album.name;
            const totalDuration = album.tracks.reduce((acc, t) => acc + t.duration, 0);
            return (
              <div
                key={album.name}
                className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2.5 px-2.5 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (album.tracks[0]) onInspectArtwork(album.tracks[0]);
                    }}
                    title="View original album cover art"
                    className="w-9 h-9 rounded-md overflow-hidden bg-zinc-900 border border-white/10 hover:border-amber-400/70 shrink-0 transition-colors"
                  >
                    <img
                      src={album.artwork}
                      alt={`${album.name} cover`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedAlbum(isOpen ? null : album.name)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-100 truncate flex items-center gap-1">
                        <Disc className="w-3 h-3 text-amber-400/80 shrink-0" />
                        <span className="truncate">{album.name}</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate font-mono-tabular">
                        {album.artist} · {album.tracks.length} tracks · {formatDuration(totalDuration)}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onPlayTrackList(album.tracks.map((t) => t.id))}
                    className="h-7 px-2.5 rounded-md bg-white/[0.07] hover:bg-amber-400 hover:text-zinc-950 text-[11px] font-medium text-zinc-200 flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-white/[0.06] px-1.5 py-1 space-y-0.5">
                    {album.tracks.map((track, idx) =>
                      renderTrackRow(track, {
                        indexLabel: idx,
                        onPlay: () => onPlayTrackDirect(track.id),
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ARTISTS TAB */}
      {activeTab === 'artists' && (
        <div className="flex-1 overflow-y-auto cave-scroll p-2 space-y-1.5">
          {artists.map((artist) => {
            const isOpen = expandedArtist === artist.name;
            return (
              <div
                key={artist.name}
                className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2.5 px-2.5 py-1.5">
                  <button
                    type="button"
                    onClick={() => setExpandedArtist(isOpen ? null : artist.name)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center shrink-0 text-amber-300">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-100 truncate">{artist.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate font-mono-tabular">
                        {artist.albums.size} {artist.albums.size === 1 ? 'album' : 'albums'} ·{' '}
                        {artist.tracks.length} {artist.tracks.length === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onPlayTrackList(artist.tracks.map((t) => t.id))}
                    className="h-7 px-2.5 rounded-md bg-white/[0.07] hover:bg-amber-400 hover:text-zinc-950 text-[11px] font-medium text-zinc-200 flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-white/[0.06] px-1.5 py-1 space-y-0.5">
                    {artist.tracks.map((track, idx) =>
                      renderTrackRow(track, {
                        indexLabel: idx,
                        onPlay: () => onPlayTrackDirect(track.id),
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PLAYLISTS TAB */}
      {activeTab === 'playlists' && (
        <div className="flex-1 overflow-y-auto cave-scroll p-2 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newPlaylistName.trim()) return;
              onCreatePlaylist(newPlaylistName.trim());
              setNewPlaylistName('');
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New playlist..."
              aria-label="New playlist name"
              className="flex-1 h-7 px-2.5 rounded-md bg-white/[0.05] border border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!newPlaylistName.trim()}
              className="h-7 px-3 rounded-md bg-white/[0.09] hover:bg-amber-400 hover:text-zinc-950 disabled:opacity-40 text-[11px] font-medium text-zinc-200 transition-colors shrink-0"
            >
              Create
            </button>
          </form>

          {/* Favorites */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
            <div className="flex items-center justify-between gap-2.5 px-2.5 py-1.5">
              <button
                type="button"
                onClick={() =>
                  setExpandedPlaylist(expandedPlaylist === 'favorites' ? null : 'favorites')
                }
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
              >
                <div className="w-8 h-8 rounded-md bg-amber-400/15 border border-amber-400/25 flex items-center justify-center shrink-0 text-amber-400">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-100">Favorites</p>
                  <p className="text-[11px] text-zinc-400 font-mono-tabular">
                    {favoriteTracks.length} {favoriteTracks.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onPlayTrackList(favoriteTracks.map((t) => t.id))}
                disabled={favoriteTracks.length === 0}
                className="h-7 px-2.5 rounded-md bg-white/[0.07] hover:bg-amber-400 hover:text-zinc-950 disabled:opacity-40 text-[11px] font-medium text-zinc-200 flex items-center gap-1 transition-colors shrink-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play</span>
              </button>
            </div>
            {expandedPlaylist === 'favorites' && (
              <div className="border-t border-white/[0.06] px-1.5 py-1 space-y-0.5">
                {favoriteTracks.length === 0 ? (
                  <p className="px-2 py-2 text-[11px] text-zinc-500">
                    Tap the heart on any track to add it here.
                  </p>
                ) : (
                  favoriteTracks.map((track, idx) =>
                    renderTrackRow(track, {
                      indexLabel: idx,
                      onPlay: () => onPlayTrackDirect(track.id),
                    })
                  )
                )}
              </div>
            )}
          </div>

          {/* Custom Playlists */}
          {playlists.map((pl) => {
            const plTracks = pl.trackIds
              .map((id) => trackMap.get(id))
              .filter((t): t is Track => Boolean(t));
            const isOpen = expandedPlaylist === pl.id;
            return (
              <div
                key={pl.id}
                className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2.5 px-2.5 py-1.5">
                  <button
                    type="button"
                    onClick={() => setExpandedPlaylist(isOpen ? null : pl.id)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <div className="w-8 h-8 rounded-md overflow-hidden bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center text-[10px] text-zinc-500">
                      {plTracks[0] ? (
                        <img
                          src={plTracks[0].artwork}
                          alt={pl.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        'PL'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-100 truncate">{pl.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {plTracks.length} {plTracks.length === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPlayTrackList(plTracks.map((t) => t.id))}
                    disabled={plTracks.length === 0}
                    className="h-7 px-2.5 rounded-md bg-white/[0.07] hover:bg-amber-400 hover:text-zinc-950 disabled:opacity-40 text-[11px] font-medium text-zinc-200 flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-white/[0.06] px-1.5 py-1 space-y-0.5">
                    {plTracks.length === 0 ? (
                      <p className="px-2 py-2 text-[11px] text-zinc-500">
                        Use + on any track to add it here.
                      </p>
                    ) : (
                      plTracks.map((track, idx) =>
                        renderTrackRow(track, {
                          indexLabel: idx,
                          onPlay: () => onPlayTrackDirect(track.id),
                          playlistId: pl.id,
                        })
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

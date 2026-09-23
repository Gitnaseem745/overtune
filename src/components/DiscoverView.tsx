'use client';

import { useEffect, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl, getAccentColorHex, formatTime } from '../lib/utils';
import { TrackRow } from './TrackRow';
import { Track } from '../types/music';
import { 
  Disc3, Play, Pause, Folder, Sparkles, History, 
  Shuffle, Clock, Compass, ListPlus 
} from 'lucide-react';

export function DiscoverView() {
  const tracks = usePlayerStore((s) => s.tracks);
  const albums = usePlayerStore((s) => s.albums);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const selectAlbum = usePlayerStore((s) => s.selectAlbum);
  const setActiveTab = usePlayerStore((s) => s.setActiveTab);
  const playHistory = usePlayerStore((s) => s.playHistory);
  const loadPlayHistory = usePlayerStore((s) => s.loadPlayHistory);
  const forgottenFavorites = usePlayerStore((s) => s.forgottenFavorites);
  const recentAdditions = usePlayerStore((s) => s.recentAdditions);
  const loadMixes = usePlayerStore((s) => s.loadMixes);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const addTrackToPlaylist = usePlayerStore((s) => s.addTrackToPlaylist);
  const refreshLibrary = usePlayerStore((s) => s.refreshLibrary);

  const [savingMix, setSavingMix] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);
  const topTracks = tracks.slice(0, 10);

  useEffect(() => {
    loadPlayHistory();
    loadMixes();
  }, [loadPlayHistory, loadMixes]);

  const handleSaveMixAsPlaylist = async (name: string, mixTracks: Track[]) => {
    if (mixTracks.length === 0) return;
    setSavingMix(name);
    try {
      const pl = await createPlaylist(name);
      if (pl && typeof window !== 'undefined' && window.api) {
        for (const t of mixTracks) {
          await addTrackToPlaylist(pl.id, t.id);
        }
        await refreshLibrary();
        alert(`Saved "${name}" with ${mixTracks.length} tracks!`);
      }
    } catch (e) {
      console.error('Error saving mix:', e);
    } finally {
      setSavingMix(null);
    }
  };

  const handlePlayMix = (mixTracks: Track[], shuffle: boolean = false) => {
    if (mixTracks.length === 0) return;
    const list = shuffle ? [...mixTracks].sort(() => Math.random() - 0.5) : mixTracks;
    playTrack(list[0], list);
  };

  return (
    <div className="px-8 py-6 pb-36 space-y-10">
      
      {/* ── 1. Top Banner / Continue Listening Hero ── */}
      {currentTrack ? (
        <section className={`p-6 sm:p-7 rounded-3xl relative overflow-hidden transition-all border ${
          isDark 
            ? 'bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-[#181818] border-neutral-800' 
            : 'bg-gradient-to-r from-gray-50 via-white to-gray-50 border-gray-200/60 shadow-xs'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-lg bg-neutral-800 shrink-0 relative group">
                {currentTrack.cover_art ? (
                  <img 
                    src={getLocalUrl(currentTrack.cover_art)} 
                    alt={currentTrack.title} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    <Compass size={32} />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span 
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-black"
                    style={{ backgroundColor: accentHex }}
                  >
                    Continue Listening
                  </span>
                  {currentTime > 0 && (
                    <span className="text-xs text-neutral-400 font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">
                  {currentTrack.title}
                </h2>
                <p className={`text-xs sm:text-sm truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
                  {currentTrack.artist} • {currentTrack.album}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ backgroundColor: accentHex }}
                className="px-5 py-3 rounded-full font-bold text-xs text-black flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                <span>{isPlaying ? 'Pause' : 'Resume'}</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className={`p-7 rounded-3xl relative overflow-hidden transition-all ${
          isDark 
            ? 'bg-gradient-to-r from-neutral-900 via-neutral-900 to-[#181818] border border-neutral-800' 
            : 'bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-gray-200/60 shadow-xs'
        }`}>
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-black"
                style={{ backgroundColor: accentHex }}
              >
                Local-First Player
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to Overtone
            </h2>
            <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
              High-fidelity offline music player with zero online tracking. Enjoy your local lossless collection with seamless seeking, smart discovery, and local smart playlists.
            </p>
          </div>
        </section>
      )}

      {/* ── 2. Smart Mixes & Discovery Section ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: accentHex }} />
            <h3 className="text-xl font-bold tracking-tight">Personal Mixes</h3>
          </div>
          <button 
            onClick={() => setActiveTab('SmartPlaylists')}
            className="text-xs font-bold hover:underline"
            style={{ color: accentHex }}
          >
            Custom Smart Playlists →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mix 1: Forgotten Favorites */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                >
                  <History size={16} />
                </div>
                <h4 className="font-bold text-sm">Forgotten Favorites</h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {forgottenFavorites.length} tracks
              </span>
            </div>
            <p className={`text-xs mb-4 line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Highly-rated tracks from your library you haven&apos;t listened to in the last 30 days.
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={forgottenFavorites.length === 0}
                onClick={() => handlePlayMix(forgottenFavorites, false)}
                style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition hover:opacity-90 disabled:opacity-40"
              >
                <Play size={13} fill="currentColor" />
                Play Mix
              </button>
              <button
                disabled={forgottenFavorites.length === 0}
                onClick={() => handlePlayMix(forgottenFavorites, true)}
                className={`p-2 rounded-xl border text-xs transition ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-gray-200 hover:bg-gray-100'
                } disabled:opacity-40`}
                title="Shuffle mix"
              >
                <Shuffle size={14} />
              </button>
              <button
                disabled={forgottenFavorites.length === 0 || savingMix === 'Forgotten Favorites'}
                onClick={() => handleSaveMixAsPlaylist('Forgotten Favorites', forgottenFavorites)}
                className={`p-2 rounded-xl border text-xs transition ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                } disabled:opacity-40`}
                title="Save as regular playlist"
              >
                <ListPlus size={14} />
              </button>
            </div>
          </div>

          {/* Mix 2: Recent Additions */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500/20 text-blue-400"
                >
                  <Sparkles size={16} />
                </div>
                <h4 className="font-bold text-sm">Recent Additions</h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {recentAdditions.length} tracks
              </span>
            </div>
            <p className={`text-xs mb-4 line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              The freshest audio tracks imported into your local library.
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={recentAdditions.length === 0}
                onClick={() => handlePlayMix(recentAdditions, false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition bg-blue-500/20 text-blue-400 hover:opacity-90 disabled:opacity-40"
              >
                <Play size={13} fill="currentColor" />
                Play Mix
              </button>
              <button
                disabled={recentAdditions.length === 0}
                onClick={() => handlePlayMix(recentAdditions, true)}
                className={`p-2 rounded-xl border text-xs transition ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-gray-200 hover:bg-gray-100'
                } disabled:opacity-40`}
                title="Shuffle mix"
              >
                <Shuffle size={14} />
              </button>
              <button
                disabled={recentAdditions.length === 0 || savingMix === 'Recent Additions'}
                onClick={() => handleSaveMixAsPlaylist('Recent Additions', recentAdditions)}
                className={`p-2 rounded-xl border text-xs transition ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                } disabled:opacity-40`}
                title="Save as regular playlist"
              >
                <ListPlus size={14} />
              </button>
            </div>
          </div>

          {/* Mix 3: Quick Rediscovery */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-purple-500/20 text-purple-400"
                >
                  <Compass size={16} />
                </div>
                <h4 className="font-bold text-sm">Deep Catalog Gems</h4>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {Math.min(tracks.length, 25)} tracks
              </span>
            </div>
            <p className={`text-xs mb-4 line-clamp-2 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Random eclectic selection sampled directly from across your whole library.
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={tracks.length === 0}
                onClick={() => {
                  const sampled = [...tracks].sort(() => Math.random() - 0.5).slice(0, 25);
                  handlePlayMix(sampled, false);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition bg-purple-500/20 text-purple-400 hover:opacity-90 disabled:opacity-40"
              >
                <Play size={13} fill="currentColor" />
                Play Mix
              </button>
              <button
                disabled={tracks.length === 0}
                onClick={() => {
                  const sampled = [...tracks].sort(() => Math.random() - 0.5).slice(0, 25);
                  handlePlayMix(sampled, true);
                }}
                className={`p-2 rounded-xl border text-xs transition ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-gray-200 hover:bg-gray-100'
                } disabled:opacity-40`}
                title="Shuffle mix"
              >
                <Shuffle size={14} />
              </button>
              <button
                disabled={tracks.length === 0 || savingMix === 'Deep Catalog Gems'}
                onClick={() => {
                  const sampled = [...tracks].sort(() => Math.random() - 0.5).slice(0, 25);
                  handleSaveMixAsPlaylist('Deep Catalog Gems', sampled);
                }}
                className={`p-2 rounded-xl border text-xs transition ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                } disabled:opacity-40`}
                title="Save as regular playlist"
              >
                <ListPlus size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Recently Played Horizontal Row ── */}
      {playHistory.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History size={18} style={{ color: accentHex }} />
              <h3 className="text-xl font-bold tracking-tight">Recently Played</h3>
            </div>
            <button 
              onClick={() => setActiveTab('RecentlyPlayed')}
              className="text-xs font-bold hover:underline"
              style={{ color: accentHex }}
            >
              See All History ({playHistory.length}) →
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-none snap-x">
            {playHistory.slice(0, 10).map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => playTrack(item, playHistory)}
                className={`w-[160px] flex-shrink-0 group cursor-pointer snap-start p-3 rounded-2xl border transition-all duration-200 transform hover:-translate-y-1 ${
                  isDark
                    ? 'bg-[#181818] hover:bg-neutral-800/90 border-neutral-800/60 hover:shadow-xl'
                    : 'bg-white hover:bg-gray-50 border-gray-100 hover:shadow-lg'
                }`}
              >
                <div className="relative mb-2.5 rounded-xl overflow-hidden aspect-square shadow-xs bg-neutral-800">
                  {item.cover_art ? (
                    <img 
                      src={getLocalUrl(item.cover_art)} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      alt={item.title} 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600">
                      <Disc3 size={36} />
                    </div>
                  )}
                  <div 
                    className="absolute right-2 bottom-2 w-9 h-9 rounded-full flex items-center justify-center text-black shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200"
                    style={{ backgroundColor: accentHex }}
                  >
                    <Play fill="currentColor" size={15} className="ml-0.5" />
                  </div>
                </div>

                <h4 className="font-bold text-xs truncate leading-snug">{item.title}</h4>
                <p className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {item.artist}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-neutral-500">
                  <Clock size={10} />
                  <span>{new Date(item.played_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. Scanned Albums Horizontal Reel ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-tight">Scanned Albums</h3>
          <button 
            onClick={() => setActiveTab('Albums')}
            className="text-xs font-bold hover:underline"
            style={{ color: accentHex }}
          >
            See All ({albums.length})
          </button>
        </div>

        {albums.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-none snap-x">
            {albums.slice(0, 10).map((album) => (
              <div
                key={album.id}
                onClick={() => selectAlbum(album)}
                className={`w-[170px] flex-shrink-0 group cursor-pointer snap-start p-3 rounded-2xl border transition-all duration-200 transform hover:-translate-y-1 ${
                  isDark
                    ? 'bg-[#181818] hover:bg-neutral-800/90 border-neutral-800/60 hover:shadow-xl'
                    : 'bg-white hover:bg-gray-50 border-gray-100 hover:shadow-lg'
                }`}
              >
                <div className="relative mb-3 rounded-xl overflow-hidden aspect-square shadow-xs bg-neutral-800">
                  {album.cover_art ? (
                    <img 
                      src={getLocalUrl(album.cover_art)} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      alt={album.title} 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600">
                      <Disc3 size={40} className={isDark ? 'text-neutral-600' : 'text-gray-300'} />
                    </div>
                  )}
                  {/* Floating Play Button */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      const albumTracks = tracks.filter((t) => t.album === album.title);
                      if (albumTracks.length > 0) playTrack(albumTracks[0], albumTracks);
                    }}
                    className="absolute right-2.5 bottom-2.5 w-11 h-11 rounded-full flex items-center justify-center text-black shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: accentHex }}
                  >
                    <Play fill="currentColor" size={18} className="ml-0.5" />
                  </div>
                </div>

                <h4 className="font-bold text-xs sm:text-sm truncate leading-snug">{album.title}</h4>
                <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {album.artist} • {album.track_count} tracks
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-8 rounded-2xl border text-center ${
            isDark ? 'bg-neutral-900/40 border-neutral-800 text-neutral-400' : 'bg-amber-50/40 border-amber-100 text-amber-800'
          }`}>
            <Folder size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No albums scanned yet.</p>
            <button
              onClick={() => setActiveTab('Local Files')}
              className="mt-3 px-4 py-2 rounded-full text-xs font-bold shadow-xs text-black"
              style={{ backgroundColor: accentHex }}
            >
              Choose Music Folder
            </button>
          </div>
        )}
      </section>

      {/* ── 5. Main Track Table ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-tight">Recently Indexed Songs</h3>
          <button 
            onClick={() => setActiveTab('Songs')}
            className="text-xs font-bold hover:underline"
            style={{ color: accentHex }}
          >
            View All ({tracks.length})
          </button>
        </div>

        {tracks.length > 0 ? (
          <div className="w-full text-sm">
            {/* Table Header */}
            <div className={`grid grid-cols-[auto_1fr_1.2fr_90px_60px_40px] gap-4 text-[11px] uppercase font-bold pb-2.5 px-3 border-b ${
              isDark ? 'border-neutral-800 text-neutral-400' : 'border-gray-100 text-gray-400'
            }`}>
              <div className="w-7 text-center">#</div>
              <div>Title / Artist</div>
              <div>Album</div>
              <div>Genre</div>
              <div>Time</div>
              <div className="text-right">Like</div>
            </div>

            <div className="mt-2 space-y-1">
              {topTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  contextQueue={topTracks}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={`p-8 rounded-2xl border text-center ${
            isDark ? 'bg-neutral-900/40 border-neutral-800 text-neutral-400' : 'bg-gray-50 border-gray-100 text-gray-400'
          }`}>
            <p className="text-sm font-semibold">No songs available in the database.</p>
            <button
              onClick={() => setActiveTab('Local Files')}
              className="mt-3 px-4 py-2 rounded-full text-xs font-bold shadow-xs text-black"
              style={{ backgroundColor: accentHex }}
            >
              Scan a Folder
            </button>
          </div>
        )}
      </section>

    </div>
  );
}

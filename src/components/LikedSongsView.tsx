'use client';

import { useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { TrackRow } from './TrackRow';
import { Heart, Play, Shuffle, ChevronLeft } from 'lucide-react';

export function LikedSongsView() {
  const tracks = usePlayerStore((s) => s.tracks);
  const favorites = usePlayerStore((s) => s.favorites);
  const theme = usePlayerStore((s) => s.theme);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setShuffleOn = usePlayerStore((s) => s.setShuffleOn);
  const navigateBack = usePlayerStore((s) => s.navigateBack);

  const isDark = theme === 'dark';

  const favoriteTracks = useMemo(() => {
    return tracks.filter((t) => favorites.has(t.id));
  }, [tracks, favorites]);

  const totalDuration = useMemo(() => {
    const sec = favoriteTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const mins = Math.floor(sec / 60);
    return `${mins} min`;
  }, [favoriteTracks]);

  const handlePlayAll = (shuffle: boolean = false) => {
    if (favoriteTracks.length === 0) return;
    setShuffleOn(shuffle);
    const startIdx = shuffle ? Math.floor(Math.random() * favoriteTracks.length) : 0;
    playTrack(favoriteTracks[startIdx], favoriteTracks);
  };

  return (
    <div className="pb-36 space-y-6 select-none">
      
      {/* ── Spotify Iconic Gradient Hero ── */}
      <div className={`p-8 rounded-b-3xl relative overflow-hidden transition-colors ${
        isDark 
          ? 'bg-gradient-to-b from-indigo-900 via-purple-950 to-[#121212] border-b border-neutral-800' 
          : 'bg-gradient-to-b from-indigo-100 via-purple-50 to-white border-b border-gray-100'
      }`}>
        <button
          onClick={navigateBack}
          className={`mb-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-all ${
            isDark ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300' : 'bg-white hover:bg-gray-100 text-gray-700 shadow-xs'
          }`}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Big Purple Heart Square */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shadow-2xl flex-shrink-0 flex items-center justify-center text-white">
            <Heart fill="currentColor" size={72} />
          </div>

          {/* Info Details */}
          <div className="flex flex-col text-center sm:text-left min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Playlist
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mt-1">
              Liked Songs
            </h1>
            <p className={`text-xs sm:text-sm font-medium mt-2 ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>
              Your favorite local collection • {favoriteTracks.length} songs, {totalDuration}
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls & Track Table ── */}
      <div className="px-8 space-y-6">
        {favoriteTracks.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePlayAll(false)}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                isDark ? 'bg-[#1db954] text-black shadow-emerald-500/30' : 'bg-[#f9a826] text-white shadow-amber-500/30'
              }`}
              title="Play All Liked Songs"
            >
              <Play fill="currentColor" size={20} className="ml-0.5" />
            </button>

            <button
              onClick={() => handlePlayAll(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs border transition-all ${
                isDark
                  ? 'border-neutral-700 hover:bg-neutral-800 text-white'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Shuffle size={15} />
              Shuffle
            </button>
          </div>
        )}

        {/* Tracks List */}
        {favoriteTracks.length > 0 ? (
          <div className="w-full text-sm">
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
              {favoriteTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  contextQueue={favoriteTracks}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={`py-20 text-center rounded-2xl border border-dashed ${
            isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-400'
          }`}>
            <Heart size={44} className="mx-auto mb-2 opacity-30 text-red-400" />
            <p className="text-sm font-semibold">Songs you like will appear here.</p>
            <span className="text-xs text-neutral-400">Save songs by clicking the heart icon on any track row.</span>
          </div>
        )}
      </div>

    </div>
  );
}

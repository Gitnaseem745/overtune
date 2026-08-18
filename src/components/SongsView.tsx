'use client';

import { useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { TrackRow } from './TrackRow';
import { Music, Play, Shuffle } from 'lucide-react';
import { getAccentColorHex } from '../lib/utils';

export function SongsView() {
  const tracks = usePlayerStore((s) => s.tracks);
  const searchQuery = usePlayerStore((s) => s.searchQuery);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setShuffleOn = usePlayerStore((s) => s.setShuffleOn);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter((t) => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q)) ||
      (t.album && t.album.toLowerCase().includes(q)) ||
      (t.genre && t.genre.toLowerCase().includes(q))
    );
  }, [tracks, searchQuery]);

  const handlePlayAll = (shuffle: boolean = false) => {
    if (filteredTracks.length === 0) return;
    setShuffleOn(shuffle);
    const startIdx = shuffle ? Math.floor(Math.random() * filteredTracks.length) : 0;
    playTrack(filteredTracks[startIdx], filteredTracks);
  };

  return (
    <div className="px-8 py-6 pb-36 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            All Songs {searchQuery && <span className="text-sm font-normal text-neutral-400 font-sans">({filteredTracks.length} results)</span>}
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            {tracks.length} total indexed tracks in your local library
          </p>
        </div>

        {/* Play All & Shuffle Buttons */}
        {filteredTracks.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePlayAll(false)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs text-black shadow-md transition-all active:scale-95 hover:scale-105"
              style={{ 
                backgroundColor: accentHex,
                boxShadow: `0 4px 14px ${accentHex}35` 
              }}
            >
              <Play fill="currentColor" size={14} className="text-black" />
              Play All
            </button>
            <button
              onClick={() => handlePlayAll(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs border transition-all ${
                isDark
                  ? 'border-neutral-700 hover:bg-neutral-800 text-white'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Shuffle size={14} />
              Shuffle
            </button>
          </div>
        )}
      </div>

      {/* Tracks Table */}
      {filteredTracks.length > 0 ? (
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
            {filteredTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                contextQueue={filteredTracks}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={`py-20 text-center rounded-2xl border border-dashed ${
          isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-400'
        }`}>
          <Music size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No tracks match your query.</p>
          <span className="text-xs text-neutral-400">Try searching for a different song, artist, or album.</span>
        </div>
      )}
    </div>
  );
}

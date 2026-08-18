'use client';

import { useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl, getAccentColorHex } from '../lib/utils';
import { TrackRow } from './TrackRow';
import { Disc3, Mic2, Play, Shuffle, ChevronLeft } from 'lucide-react';

export function DetailView() {
  const activeTab = usePlayerStore((s) => s.activeTab);
  const selectedAlbum = usePlayerStore((s) => s.selectedAlbum);
  const selectedArtist = usePlayerStore((s) => s.selectedArtist);
  const tracks = usePlayerStore((s) => s.tracks);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setShuffleOn = usePlayerStore((s) => s.setShuffleOn);
  const navigateBack = usePlayerStore((s) => s.navigateBack);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);
  const isAlbum = activeTab === 'AlbumDetail' && selectedAlbum !== null;
  const isArtist = activeTab === 'ArtistDetail' && selectedArtist !== null;

  const detailTracks = useMemo(() => {
    if (isAlbum && selectedAlbum) {
      return tracks.filter((t) => t.album === selectedAlbum.title);
    }
    if (isArtist && selectedArtist) {
      return tracks.filter((t) => t.artist === selectedArtist.name);
    }
    return [];
  }, [tracks, isAlbum, isArtist, selectedAlbum, selectedArtist]);

  const totalDuration = useMemo(() => {
    const sec = detailTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const mins = Math.floor(sec / 60);
    return `${mins} min`;
  }, [detailTracks]);

  const handlePlayAll = (shuffle: boolean = false) => {
    if (detailTracks.length === 0) return;
    setShuffleOn(shuffle);
    const startIdx = shuffle ? Math.floor(Math.random() * detailTracks.length) : 0;
    playTrack(detailTracks[startIdx], detailTracks);
  };

  if (!isAlbum && !isArtist) return null;

  return (
    <div className="pb-36 space-y-6">
      
      {/* ── Big Hero Banner ── */}
      <div className={`p-8 rounded-b-3xl relative overflow-hidden transition-colors ${
        isDark 
          ? 'bg-gradient-to-b from-neutral-800 to-[#121212] border-b border-neutral-800' 
          : 'bg-gradient-to-b from-gray-100 to-white border-b border-gray-200/60'
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
          {/* Cover / Avatar */}
          <div className={`w-40 h-40 sm:w-48 sm:h-48 overflow-hidden shadow-2xl flex-shrink-0 flex items-center justify-center ${
            isArtist ? 'rounded-full' : 'rounded-2xl'
          } ${isDark ? 'bg-neutral-800' : 'bg-gray-100'}`}>
            {isAlbum && selectedAlbum?.cover_art ? (
              <img 
                src={getLocalUrl(selectedAlbum.cover_art)} 
                alt={selectedAlbum.title} 
                className="w-full h-full object-cover" 
              />
            ) : isAlbum ? (
              <Disc3 size={64} className={isDark ? 'text-neutral-600' : 'text-gray-400'} />
            ) : (
              <Mic2 size={64} style={{ color: accentHex }} />
            )}
          </div>

          {/* Info Details */}
          <div className="flex flex-col text-center sm:text-left min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              {isAlbum ? 'Album' : 'Artist'}
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mt-1 leading-tight line-clamp-2">
              {isAlbum ? selectedAlbum?.title : selectedArtist?.name}
            </h1>
            <p className={`text-xs sm:text-sm font-medium mt-2 ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>
              {isAlbum ? (
                <>
                  <span className="font-bold">{selectedAlbum?.artist}</span>
                  {selectedAlbum?.year ? ` • ${selectedAlbum.year}` : ''} • {detailTracks.length} tracks, {totalDuration}
                </>
              ) : (
                <>
                  {selectedArtist?.album_count} albums • {detailTracks.length} indexed songs
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls & Track Table ── */}
      <div className="px-8 space-y-6">
        {/* Play & Shuffle Actions */}
        {detailTracks.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePlayAll(false)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-black shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ 
                backgroundColor: accentHex,
                boxShadow: `0 4px 14px ${accentHex}40`
              }}
              title="Play All"
            >
              <Play fill="currentColor" size={20} className="ml-0.5 text-black" />
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
        {detailTracks.length > 0 ? (
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
              {detailTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  contextQueue={detailTracks}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={`py-16 text-center rounded-2xl border border-dashed ${
            isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-400'
          }`}>
            No tracks found in this category.
          </div>
        )}
      </div>

    </div>
  );
}

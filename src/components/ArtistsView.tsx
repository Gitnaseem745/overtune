'use client';

import { useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Mic2, Play } from 'lucide-react';

export function ArtistsView() {
  const artists = usePlayerStore((s) => s.artists);
  const tracks = usePlayerStore((s) => s.tracks);
  const searchQuery = usePlayerStore((s) => s.searchQuery);
  const theme = usePlayerStore((s) => s.theme);
  const selectArtist = usePlayerStore((s) => s.selectArtist);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const isDark = theme === 'dark';

  const filteredArtists = useMemo(() => {
    if (!searchQuery.trim()) return artists;
    const q = searchQuery.toLowerCase();
    return artists.filter((a) => a.name && a.name.toLowerCase().includes(q));
  }, [artists, searchQuery]);

  return (
    <div className="px-8 py-6 pb-36 space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Artists ({filteredArtists.length})
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
          Artists found in your music library
        </p>
      </div>

      {filteredArtists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 text-center">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => selectArtist(artist)}
              className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 transform hover:-translate-y-1 ${
                isDark
                  ? 'bg-[#181818] hover:bg-neutral-800/90 border-neutral-800/60 hover:shadow-xl'
                  : 'bg-white hover:bg-gray-50 border-gray-100 hover:shadow-lg'
              }`}
            >
              {/* Circular Avatar */}
              <div className="relative mb-3 mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-inner flex items-center justify-center bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-emerald-500/20 border border-neutral-700/20">
                <Mic2 size={36} className={isDark ? 'text-emerald-400' : 'text-[#f9a826]'} />
                
                {/* Floating Play Action */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const artistTracks = tracks.filter((t) => t.artist === artist.name);
                    if (artistTracks.length > 0) playTrack(artistTracks[0], artistTracks);
                  }}
                  className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}
                  title="Play Artist"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform ${
                    isDark ? 'bg-[#1db954] text-black' : 'bg-[#f9a826] text-white'
                  }`}>
                    <Play fill="currentColor" size={18} className="ml-0.5" />
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-xs sm:text-sm truncate leading-snug">{artist.name}</h4>
              <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                {artist.album_count} {artist.album_count === 1 ? 'album' : 'albums'} • {artist.track_count} tracks
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className={`py-20 text-center rounded-2xl border border-dashed ${
          isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-400'
        }`}>
          <Mic2 size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No artists found matching your query.</p>
        </div>
      )}
    </div>
  );
}

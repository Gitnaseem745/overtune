'use client';

import { useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getAccentColorHex } from '../lib/utils';
import { Mic2, Play } from 'lucide-react';

export function ArtistsView() {
  const artists = usePlayerStore((s) => s.artists);
  const tracks = usePlayerStore((s) => s.tracks);
  const searchQuery = usePlayerStore((s) => s.searchQuery);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const selectArtist = usePlayerStore((s) => s.selectArtist);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(165px,1fr))] gap-4 text-center">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => selectArtist(artist)}
              className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 transform hover:-translate-y-1 flex flex-col items-center min-w-0 ${
                isDark
                  ? 'bg-[#181818] hover:bg-neutral-800/90 border-neutral-800/60 hover:shadow-xl'
                  : 'bg-white hover:bg-gray-50 border-gray-100 hover:shadow-lg'
              }`}
            >
              {/* Circular Avatar Container */}
              <div className="relative mb-3 w-full max-w-[110px] sm:max-w-[120px] aspect-square rounded-full overflow-hidden shadow-inner flex items-center justify-center bg-gradient-to-br from-amber-500/15 via-orange-500/15 to-emerald-500/15 border border-neutral-700/20">
                <Mic2 size={32} style={{ color: accentHex }} />
                
                {/* Floating Play Action */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const artistTracks = tracks.filter((t) => t.artist === artist.name);
                    if (artistTracks.length > 0) playTrack(artistTracks[0], artistTracks);
                  }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Play Artist"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-black shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                    style={{ backgroundColor: accentHex }}
                  >
                    <Play fill="currentColor" size={16} className="ml-0.5 text-black" />
                  </div>
                </div>
              </div>

              <div className="w-full min-w-0">
                <h4 className="font-bold text-xs sm:text-sm truncate leading-snug">{artist.name}</h4>
                <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {artist.album_count} {artist.album_count === 1 ? 'album' : 'albums'} • {artist.track_count} tracks
                </p>
              </div>
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

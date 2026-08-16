'use client';

import { useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl, getAccentColorHex } from '../lib/utils';
import { Disc3, Play } from 'lucide-react';

export function AlbumsView() {
  const albums = usePlayerStore((s) => s.albums);
  const tracks = usePlayerStore((s) => s.tracks);
  const searchQuery = usePlayerStore((s) => s.searchQuery);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const selectAlbum = usePlayerStore((s) => s.selectAlbum);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return albums;
    const q = searchQuery.toLowerCase();
    return albums.filter((a) =>
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.artist && a.artist.toLowerCase().includes(q))
    );
  }, [albums, searchQuery]);

  return (
    <div className="px-8 py-6 pb-36 space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Albums ({filteredAlbums.length})
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
          Grouped album collections from your indexed files
        </p>
      </div>

      {filteredAlbums.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(165px,1fr))] gap-4">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => selectAlbum(album)}
              className={`group cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 transform hover:-translate-y-1 flex flex-col min-w-0 ${
                isDark
                  ? 'bg-[#181818] hover:bg-neutral-800/90 border-neutral-800/60 hover:shadow-xl'
                  : 'bg-white hover:bg-gray-50 border-gray-100 hover:shadow-lg'
              }`}
            >
              <div className="relative mb-3 rounded-xl overflow-hidden aspect-square shadow-sm bg-neutral-800 w-full">
                {album.cover_art ? (
                  <img
                    src={getLocalUrl(album.cover_art)}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600">
                    <Disc3 size={44} className={isDark ? 'text-neutral-600' : 'text-gray-300'} />
                  </div>
                )}

                {/* Floating Play Action */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    const albumTracks = tracks.filter((t) => t.album === album.title);
                    if (albumTracks.length > 0) playTrack(albumTracks[0], albumTracks);
                  }}
                  className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full flex items-center justify-center text-black shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: accentHex }}
                  title="Play Album"
                >
                  <Play fill="currentColor" size={16} className="ml-0.5 text-black" />
                </div>
              </div>

              <div className="w-full min-w-0">
                <h4 className="font-bold text-xs sm:text-sm truncate leading-snug">{album.title}</h4>
                <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {album.artist} • {album.track_count} tracks
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`py-20 text-center rounded-2xl border border-dashed ${
          isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-400'
        }`}>
          <Disc3 size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">No albums found matching your query.</p>
        </div>
      )}
    </div>
  );
}

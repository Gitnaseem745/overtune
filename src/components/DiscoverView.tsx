'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl, getAccentColorHex } from '../lib/utils';
import { TrackRow } from './TrackRow';
import { Disc3, Play, Folder } from 'lucide-react';

export function DiscoverView() {
  const tracks = usePlayerStore((s) => s.tracks);
  const albums = usePlayerStore((s) => s.albums);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const selectAlbum = usePlayerStore((s) => s.selectAlbum);
  const setActiveTab = usePlayerStore((s) => s.setActiveTab);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);
  const topTracks = tracks.slice(0, 10);

  return (
    <div className="px-8 py-6 pb-36 space-y-10">
      
      {/* Top Banner / Greeting */}
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
            High-fidelity offline music player with zero online tracking. Enjoy your local lossless collection with seamless seeking and smart library indexing.
          </p>
        </div>
      </section>

      {/* Scanned Albums Horizontal Reel */}
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
                <div className="relative mb-3 rounded-xl overflow-hidden aspect-square shadow-sm bg-neutral-800">
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
              className="mt-3 px-4 py-2 rounded-full text-xs font-bold shadow-sm text-black"
              style={{ backgroundColor: accentHex }}
            >
              Choose Music Folder
            </button>
          </div>
        )}
      </section>

      {/* Main Track Table */}
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

            {/* Track List */}
            <div className="mt-2 space-y-1">
              {topTracks.map((track, idx) => (
                <TrackRow 
                  key={track.id} 
                  track={track} 
                  index={idx} 
                  contextQueue={tracks} 
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={`py-12 text-center rounded-2xl border border-dashed ${
            isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-400'
          }`}>
            No audio tracks found. Head to Local Files to import audio.
          </div>
        )}
      </section>

    </div>
  );
}

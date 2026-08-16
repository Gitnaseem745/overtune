'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { ActiveTab, Playlist } from '../types/music';
import { 
  Compass, Music, Disc3, Mic2, Folder, 
  Library, Plus, Heart, ListMusic, FileUp 
} from 'lucide-react';

export function Sidebar() {
  const activeTab = usePlayerStore((s) => s.activeTab);
  const setActiveTab = usePlayerStore((s) => s.setActiveTab);
  const theme = usePlayerStore((s) => s.theme);
  const layout = usePlayerStore((s) => s.layout);
  const tracks = usePlayerStore((s) => s.tracks);
  const albums = usePlayerStore((s) => s.albums);
  const artists = usePlayerStore((s) => s.artists);
  const playlists = usePlayerStore((s) => s.playlists);
  const selectedPlaylist = usePlayerStore((s) => s.selectedPlaylist);
  const favorites = usePlayerStore((s) => s.favorites);
  const selectAlbum = usePlayerStore((s) => s.selectAlbum);
  const selectArtist = usePlayerStore((s) => s.selectArtist);
  const selectPlaylist = usePlayerStore((s) => s.selectPlaylist);
  const setCreatePlaylistOpen = usePlayerStore((s) => s.setCreatePlaylistOpen);

  const isDark = theme === 'dark';
  const isSpotifyLayout = layout === 'spotify';
  const accentColor = usePlayerStore((s) => s.accentColor);

  const accentHex = accentColor === 'green' ? '#1db954' : '#f9a826';

  const NavItem = ({ name, tab, icon: Icon, badge }: { name: string; tab: ActiveTab; icon: any; badge?: number }) => {
    const isActive = activeTab === tab;
    return (
      <li className="relative" onClick={() => setActiveTab(tab)}>
        {!isSpotifyLayout && isActive && (
          <div 
            className="absolute inset-y-0 left-0 w-1.5 rounded-r-full"
            style={{ backgroundColor: accentHex }} 
          />
        )}
        <button 
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isActive 
              ? isDark 
                ? 'bg-neutral-800 text-white font-bold' 
                : 'bg-gray-100/90 font-bold' 
              : isDark
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
          }`}
          style={{ color: isActive ? accentHex : undefined }}
        >
          <div className="flex items-center gap-3">
            <Icon size={18} style={{ color: isActive ? accentHex : undefined }} />
            <span>{name}</span>
          </div>
          {badge !== undefined && badge > 0 && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-200/70 text-gray-600'
            }`}>
              {badge}
            </span>
          )}
        </button>
      </li>
    );
  };

  // ── SPOTIFY PRO 3-COLUMN SIDEBAR ──
  if (isSpotifyLayout) {
    return (
      <aside className="w-72 flex flex-col gap-2 flex-shrink-0 select-none">
        {/* Top Mini Nav Box */}
        <div className={`rounded-2xl p-4 transition-colors ${
          isDark ? 'bg-[#181818] border border-neutral-800/80' : 'bg-white shadow-xs border border-gray-200/80'
        }`}>
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div 
              className="w-7 h-7 rounded-xl flex items-center justify-center text-black font-bold shadow-xs"
              style={{ backgroundColor: accentHex }}
            >
              <Music size={16} />
            </div>
            <span className="font-extrabold text-base tracking-tight">Overtone</span>
          </div>
          <ul className="space-y-1">
            <NavItem name="Home" tab="Discover" icon={Compass} />
            <NavItem name="Songs" tab="Songs" icon={Music} badge={tracks.length} />
          </ul>
        </div>

        {/* Your Library Box */}
        <div className={`flex-1 rounded-2xl p-4 flex flex-col overflow-hidden transition-colors ${
          isDark ? 'bg-[#181818] border border-neutral-800/80' : 'bg-white shadow-xs border border-gray-200/80'
        }`}>
          {/* Header with + Create Playlist */}
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors cursor-pointer">
              <Library size={18} />
              <span className="font-bold text-sm">Your Library</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCreatePlaylistOpen(true)}
                className={`p-1.5 rounded-full transition-colors ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'
                }`}
                title="Create New Playlist"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="flex items-center gap-1.5 px-1 mb-3 overflow-x-auto pb-1 scrollbar-none">
            <button 
              onClick={() => setActiveTab('Albums')} 
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'Albums' 
                  ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                  : (isDark ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }`}
            >
              Albums ({albums.length})
            </button>
            <button 
              onClick={() => setActiveTab('Artists')} 
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'Artists' 
                  ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                  : (isDark ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }`}
            >
              Artists ({artists.length})
            </button>
          </div>

          {/* Library Scroll List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {/* Liked Songs Entry */}
            <div
              onClick={() => setActiveTab('LikedSongs')}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                activeTab === 'LikedSongs'
                  ? isDark ? 'bg-neutral-800 text-white font-bold' : 'bg-amber-50 text-[#f9a826] font-bold'
                  : isDark ? 'hover:bg-neutral-800/60' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Heart fill="currentColor" size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs truncate">Liked Songs</span>
                <span className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-gray-400'}`}>
                  Playlist • {favorites.size} songs
                </span>
              </div>
            </div>

            {/* Native Playlists */}
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => selectPlaylist(playlist)}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                  activeTab === 'PlaylistDetail' && selectedPlaylist?.id === playlist.id
                    ? isDark ? 'bg-neutral-800 text-white font-bold' : 'bg-amber-50 text-[#f9a826] font-bold'
                    : isDark ? 'hover:bg-neutral-800/60' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-neutral-800 text-emerald-400' : 'bg-amber-50 text-[#f9a826]'
                }`}>
                  <ListMusic size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs truncate">{playlist.name}</span>
                  <span className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-gray-400'}`}>
                    Playlist • {playlist.track_count || 0} songs
                  </span>
                </div>
              </div>
            ))}

            {/* Quick Local Files Entry */}
            <div
              onClick={() => setActiveTab('Local Files')}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                activeTab === 'Local Files'
                  ? (isDark ? 'bg-neutral-800/80 text-emerald-400' : 'bg-amber-50 text-[#f9a826]')
                  : (isDark ? 'hover:bg-neutral-800/60' : 'hover:bg-gray-50')
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isDark ? 'bg-neutral-800 text-emerald-400' : 'bg-amber-100 text-[#f9a826]'
              }`}>
                <Folder size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs truncate">Local Storage</span>
                <span className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-gray-400'}`}>
                  {tracks.length} indexed tracks
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // ── CLASSIC 2-COLUMN SIDEBAR ──
  return (
    <aside 
      className={`w-60 border-r flex flex-col flex-shrink-0 z-10 transition-colors ${
        isDark 
          ? 'bg-[#181818] border-neutral-800/80 text-white' 
          : 'bg-[#f8f9fa] border-gray-100 text-gray-900'
      }`}
    >
      <div className="flex items-center gap-3 p-6 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md ${
          isDark ? 'bg-[#1db954] shadow-emerald-500/20' : 'bg-[#f9a826] shadow-amber-500/20'
        }`}>
          <Music size={18} />
        </div>
        <span className="text-lg font-bold tracking-tight">Overtone</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 space-y-6 px-3">
        <div>
          <h3 className={`text-[11px] uppercase font-bold px-3 mb-2 tracking-wider ${
            isDark ? 'text-neutral-500' : 'text-gray-400'
          }`}>
            Browse Library
          </h3>
          <ul className="space-y-0.5">
            <NavItem name="Discover" tab="Discover" icon={Compass} />
            <NavItem name="Songs" tab="Songs" icon={Music} badge={tracks.length} />
            <NavItem name="Albums" tab="Albums" icon={Disc3} badge={albums.length} />
            <NavItem name="Artists" tab="Artists" icon={Mic2} badge={artists.length} />
          </ul>
        </div>

        {/* Playlists Section in Classic Layout */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className={`text-[11px] uppercase font-bold tracking-wider ${
              isDark ? 'text-neutral-500' : 'text-gray-400'
            }`}>
              Playlists
            </h3>
            <button
              onClick={() => setCreatePlaylistOpen(true)}
              className={`p-1 rounded-md transition-colors ${
                isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500'
              }`}
              title="Create Playlist"
            >
              <Plus size={14} />
            </button>
          </div>

          <ul className="space-y-0.5">
            <NavItem name="Liked Songs" tab="LikedSongs" icon={Heart} badge={favorites.size} />
            {playlists.map((playlist) => {
              const isActive = activeTab === 'PlaylistDetail' && selectedPlaylist?.id === playlist.id;
              return (
                <li key={playlist.id} className="relative" onClick={() => selectPlaylist(playlist)}>
                  {isActive && (
                    <div className={`absolute inset-y-0 left-0 w-1.5 rounded-r-full ${
                      isDark ? 'bg-[#1db954]' : 'bg-[#f9a826]'
                    }`} />
                  )}
                  <button 
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive 
                        ? isDark 
                          ? 'bg-neutral-800 text-white font-bold' 
                          : 'bg-amber-50/70 text-[#f9a826] font-bold' 
                        : isDark
                          ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ListMusic size={15} className={isActive ? (isDark ? 'text-[#1db954]' : 'text-[#f9a826]') : ''} />
                      <span className="truncate">{playlist.name}</span>
                    </div>
                    {playlist.track_count !== undefined && playlist.track_count > 0 && (
                      <span className="text-[10px] font-mono text-neutral-400">
                        {playlist.track_count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className={`text-[11px] uppercase font-bold px-3 mb-2 tracking-wider ${
            isDark ? 'text-neutral-500' : 'text-gray-400'
          }`}>
            My Storage
          </h3>
          <ul className="space-y-0.5">
            <NavItem name="Local Files" tab="Local Files" icon={Folder} />
          </ul>
        </div>
      </div>
    </aside>
  );
}


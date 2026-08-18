'use client';

import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ActiveTab, Playlist } from '../types/music';
import { 
  Compass, Music, Disc3, Mic2, Folder, 
  Library, Plus, Heart, ListMusic,
  PanelLeftClose, PanelLeftOpen, EyeOff
} from 'lucide-react';
import { getAccentColorHex } from '../lib/utils';
import { OvertoneLogo } from './OvertoneLogo';

interface NavItemProps {
  name: string;
  tab: ActiveTab;
  icon: React.ElementType;
  badge?: number;
  activeTab: ActiveTab;
  isDark: boolean;
  isSpotifyLayout: boolean;
  isCollapsed: boolean;
  accentHex: string;
  onClick: (tab: ActiveTab) => void;
}

function NavItem({
  name,
  tab,
  icon: Icon,
  badge,
  activeTab,
  isDark,
  isSpotifyLayout,
  isCollapsed,
  accentHex,
  onClick,
}: NavItemProps) {
  const isActive = activeTab === tab;

  if (isCollapsed) {
    return (
      <li className="relative flex justify-center">
        {!isSpotifyLayout && isActive && (
          <div 
            className="absolute inset-y-1.5 left-0 w-1 rounded-r-full"
            style={{ backgroundColor: accentHex }} 
          />
        )}
        <button
          onClick={() => onClick(tab)}
          title={`${name}${badge !== undefined && badge > 0 ? ` (${badge})` : ''}`}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            isActive 
              ? isDark 
                ? 'bg-neutral-800 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-900 shadow-xs' 
              : isDark
                ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
          }`}
          style={{ color: isActive ? accentHex : undefined }}
        >
          <Icon size={20} style={{ color: isActive ? accentHex : undefined }} />
        </button>
      </li>
    );
  }

  return (
    <li className="relative" onClick={() => onClick(tab)}>
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
}

export function Sidebar() {
  const isSidebarOpen = usePlayerStore((s) => s.isSidebarOpen);
  const isSidebarCollapsed = usePlayerStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = usePlayerStore((s) => s.toggleSidebar);
  const toggleSidebarCollapse = usePlayerStore((s) => s.toggleSidebarCollapse);

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
  const selectPlaylist = usePlayerStore((s) => s.selectPlaylist);
  const setCreatePlaylistOpen = usePlayerStore((s) => s.setCreatePlaylistOpen);
  const accentColor = usePlayerStore((s) => s.accentColor);

  const isDark = theme === 'dark';
  const isSpotifyLayout = layout === 'spotify';
  const accentHex = getAccentColorHex(accentColor);

  // Hidden State
  if (!isSidebarOpen) {
    return null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. SPOTIFY PRO 3-COLUMN SIDEBAR
  // ──────────────────────────────────────────────────────────────────────────
  if (isSpotifyLayout) {
    return (
      <aside 
        className={`flex flex-col gap-2 flex-shrink-0 select-none transition-all duration-200 ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-72'
        }`}
      >
        {/* Top Mini Nav Box */}
        <div className={`rounded-2xl transition-colors ${
          isSidebarCollapsed ? 'p-2.5' : 'p-4'
        } ${
          isDark ? 'bg-[#181818] border border-neutral-800/80' : 'bg-white shadow-xs border border-gray-200/80'
        }`}>
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button 
                onClick={toggleSidebarCollapse}
                title="Expand Sidebar"
                className="p-1 rounded-xl hover:scale-105 transition-transform"
              >
                <OvertoneLogo size={28} rounded="xl" />
              </button>
              <ul className="space-y-1.5 w-full">
                <NavItem 
                  name="Home" 
                  tab="Discover" 
                  icon={Compass} 
                  activeTab={activeTab}
                  isDark={isDark}
                  isSpotifyLayout={isSpotifyLayout}
                  isCollapsed={isSidebarCollapsed}
                  accentHex={accentHex}
                  onClick={setActiveTab}
                />
                <NavItem 
                  name="Songs" 
                  tab="Songs" 
                  icon={Music} 
                  badge={tracks.length} 
                  activeTab={activeTab}
                  isDark={isDark}
                  isSpotifyLayout={isSpotifyLayout}
                  isCollapsed={isSidebarCollapsed}
                  accentHex={accentHex}
                  onClick={setActiveTab}
                />
              </ul>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <OvertoneLogo size={28} rounded="xl" />
                  <span className="font-extrabold text-base tracking-tight">Overtone</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleSidebarCollapse}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    title="Collapse Sidebar"
                  >
                    <PanelLeftClose size={16} />
                  </button>
                  <button
                    onClick={toggleSidebar}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    title="Hide Sidebar"
                  >
                    <EyeOff size={15} />
                  </button>
                </div>
              </div>
              <ul className="space-y-1">
                <NavItem 
                  name="Home" 
                  tab="Discover" 
                  icon={Compass} 
                  activeTab={activeTab}
                  isDark={isDark}
                  isSpotifyLayout={isSpotifyLayout}
                  isCollapsed={isSidebarCollapsed}
                  accentHex={accentHex}
                  onClick={setActiveTab}
                />
                <NavItem 
                  name="Songs" 
                  tab="Songs" 
                  icon={Music} 
                  badge={tracks.length} 
                  activeTab={activeTab}
                  isDark={isDark}
                  isSpotifyLayout={isSpotifyLayout}
                  isCollapsed={isSidebarCollapsed}
                  accentHex={accentHex}
                  onClick={setActiveTab}
                />
              </ul>
            </div>
          )}
        </div>

        {/* Your Library Box */}
        <div className={`flex-1 rounded-2xl flex flex-col overflow-hidden transition-colors ${
          isSidebarCollapsed ? 'p-2.5' : 'p-4'
        } ${
          isDark ? 'bg-[#181818] border border-neutral-800/80' : 'bg-white shadow-xs border border-gray-200/80'
        }`}>
          {/* Header */}
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2 mb-3">
              <button
                onClick={toggleSidebarCollapse}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Your Library - Click to Expand"
              >
                <Library size={20} />
              </button>
              <button 
                onClick={() => setCreatePlaylistOpen(true)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Create New Playlist"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 mb-3">
              <div 
                onClick={toggleSidebarCollapse}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Collapse Sidebar"
              >
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
                <button
                  onClick={toggleSidebarCollapse}
                  className={`p-1.5 rounded-full transition-colors ${
                    isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Quick Filter Tags (Expanded Only) */}
          {!isSidebarCollapsed && (
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
          )}

          {/* Library Scroll List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {/* Liked Songs Entry */}
            <div
              onClick={() => setActiveTab('LikedSongs')}
              title={`Liked Songs (${favorites.size} songs)`}
              className={`flex items-center rounded-xl cursor-pointer transition-all ${
                isSidebarCollapsed ? 'justify-center p-1.5' : 'gap-3 p-2'
              } ${
                activeTab === 'LikedSongs'
                  ? isDark ? 'bg-neutral-800 text-white font-bold' : 'bg-gray-100 font-bold'
                  : isDark ? 'hover:bg-neutral-800/60' : 'hover:bg-gray-50'
              }`}
              style={{ color: activeTab === 'LikedSongs' ? accentHex : undefined }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <Heart fill="currentColor" size={18} />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs truncate">Liked Songs</span>
                  <span className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-gray-400'}`}>
                    Playlist • {favorites.size} songs
                  </span>
                </div>
              )}
            </div>

            {/* Playlists */}
            {playlists.map((playlist) => {
              const isSelected = activeTab === 'PlaylistDetail' && selectedPlaylist?.id === playlist.id;
              return (
                <div
                  key={playlist.id}
                  onClick={() => selectPlaylist(playlist)}
                  title={`${playlist.name} (${playlist.track_count || 0} songs)`}
                  className={`flex items-center rounded-xl cursor-pointer transition-all ${
                    isSidebarCollapsed ? 'justify-center p-1.5' : 'gap-3 p-2'
                  } ${
                    isSelected
                      ? isDark ? 'bg-neutral-800 text-white font-bold' : 'bg-gray-100 font-bold'
                      : isDark ? 'hover:bg-neutral-800/60' : 'hover:bg-gray-50'
                  }`}
                  style={{ color: isSelected ? accentHex : undefined }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                  >
                    <ListMusic size={18} />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs truncate">{playlist.name}</span>
                      <span className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-gray-400'}`}>
                        Playlist • {playlist.track_count || 0} songs
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick Local Files Entry */}
            <div
              onClick={() => setActiveTab('Local Files')}
              title={`Local Storage (${tracks.length} tracks)`}
              className={`flex items-center rounded-xl cursor-pointer transition-all ${
                isSidebarCollapsed ? 'justify-center p-1.5' : 'gap-3 p-2'
              } ${
                activeTab === 'Local Files'
                  ? isDark ? 'bg-neutral-800/80 font-bold' : 'bg-gray-100 font-bold'
                  : isDark ? 'hover:bg-neutral-800/60' : 'hover:bg-gray-50'
              }`}
              style={{ color: activeTab === 'Local Files' ? accentHex : undefined }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
              >
                <Folder size={18} />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs truncate">Local Storage</span>
                  <span className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-gray-400'}`}>
                    {tracks.length} indexed tracks
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CLASSIC 2-COLUMN SIDEBAR
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <aside 
      className={`border-r flex flex-col flex-shrink-0 z-10 transition-all duration-200 select-none ${
        isSidebarCollapsed ? 'w-[72px]' : 'w-60'
      } ${
        isDark 
          ? 'bg-[#181818] border-neutral-800/80 text-white' 
          : 'bg-[#f8f9fa] border-gray-100 text-gray-900'
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center py-5' : 'justify-between p-5 mb-1'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebarCollapse}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Overtone'}
            className="hover:scale-105 transition-transform"
          >
            <OvertoneLogo size={30} rounded="xl" />
          </button>
          {!isSidebarCollapsed && (
            <span className="text-lg font-bold tracking-tight">Overtone</span>
          )}
        </div>
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleSidebarCollapse}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500'
              }`}
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
            <button
              onClick={toggleSidebar}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500'
              }`}
              title="Hide Sidebar"
            >
              <EyeOff size={14} />
            </button>
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto pb-28 space-y-6 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
        <div>
          {!isSidebarCollapsed && (
            <h3 className={`text-[11px] uppercase font-bold px-3 mb-2 tracking-wider ${
              isDark ? 'text-neutral-500' : 'text-gray-400'
            }`}>
              Browse Library
            </h3>
          )}
          <ul className="space-y-1">
            <NavItem 
              name="Discover" 
              tab="Discover" 
              icon={Compass} 
              activeTab={activeTab}
              isDark={isDark}
              isSpotifyLayout={isSpotifyLayout}
              isCollapsed={isSidebarCollapsed}
              accentHex={accentHex}
              onClick={setActiveTab}
            />
            <NavItem 
              name="Songs" 
              tab="Songs" 
              icon={Music} 
              badge={tracks.length} 
              activeTab={activeTab}
              isDark={isDark}
              isSpotifyLayout={isSpotifyLayout}
              isCollapsed={isSidebarCollapsed}
              accentHex={accentHex}
              onClick={setActiveTab}
            />
            <NavItem 
              name="Albums" 
              tab="Albums" 
              icon={Disc3} 
              badge={albums.length} 
              activeTab={activeTab}
              isDark={isDark}
              isSpotifyLayout={isSpotifyLayout}
              isCollapsed={isSidebarCollapsed}
              accentHex={accentHex}
              onClick={setActiveTab}
            />
            <NavItem 
              name="Artists" 
              tab="Artists" 
              icon={Mic2} 
              badge={artists.length} 
              activeTab={activeTab}
              isDark={isDark}
              isSpotifyLayout={isSpotifyLayout}
              isCollapsed={isSidebarCollapsed}
              accentHex={accentHex}
              onClick={setActiveTab}
            />
          </ul>
        </div>

        {/* Playlists Section */}
        <div>
          {!isSidebarCollapsed && (
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
          )}

          <ul className="space-y-1">
            <NavItem 
              name="Liked Songs" 
              tab="LikedSongs" 
              icon={Heart} 
              badge={favorites.size} 
              activeTab={activeTab}
              isDark={isDark}
              isSpotifyLayout={isSpotifyLayout}
              isCollapsed={isSidebarCollapsed}
              accentHex={accentHex}
              onClick={setActiveTab}
            />
            {playlists.map((playlist) => {
              const isActive = activeTab === 'PlaylistDetail' && selectedPlaylist?.id === playlist.id;
              if (isSidebarCollapsed) {
                return (
                  <li key={playlist.id} className="relative flex justify-center">
                    {isActive && (
                      <div 
                        className="absolute inset-y-1.5 left-0 w-1 rounded-r-full"
                        style={{ backgroundColor: accentHex }}
                      />
                    )}
                    <button 
                      onClick={() => selectPlaylist(playlist)}
                      title={`${playlist.name} (${playlist.track_count || 0} songs)`}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        isActive 
                          ? isDark 
                            ? 'bg-neutral-800 text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-900 shadow-xs' 
                          : isDark
                            ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
                      }`}
                      style={{ color: isActive ? accentHex : undefined }}
                    >
                      <ListMusic size={18} style={{ color: isActive ? accentHex : undefined }} />
                    </button>
                  </li>
                );
              }

              return (
                <li key={playlist.id} className="relative" onClick={() => selectPlaylist(playlist)}>
                  {isActive && (
                    <div 
                      className="absolute inset-y-0 left-0 w-1.5 rounded-r-full"
                      style={{ backgroundColor: accentHex }}
                    />
                  )}
                  <button 
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
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
                    <div className="flex items-center gap-2.5 truncate">
                      <ListMusic size={15} style={{ color: isActive ? accentHex : undefined }} />
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
          {!isSidebarCollapsed && (
            <h3 className={`text-[11px] uppercase font-bold px-3 mb-2 tracking-wider ${
              isDark ? 'text-neutral-500' : 'text-gray-400'
            }`}>
              My Storage
            </h3>
          )}
          <ul className="space-y-1">
            <NavItem 
              name="Local Files" 
              tab="Local Files" 
              icon={Folder} 
              activeTab={activeTab}
              isDark={isDark}
              isSpotifyLayout={isSpotifyLayout}
              isCollapsed={isSidebarCollapsed}
              accentHex={accentHex}
              onClick={setActiveTab}
            />
          </ul>
        </div>
      </div>
    </aside>
  );
}

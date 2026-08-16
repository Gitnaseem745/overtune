'use client';

import { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Track } from '../types/music';
import { getLocalUrl, formatTime } from '../lib/utils';
import { 
  Play, Pause, Heart, Music, Plus, 
  MoreHorizontal, ListPlus, Radio, Check 
} from 'lucide-react';

interface TrackRowProps {
  track: Track;
  index: number;
  contextQueue?: Track[];
}

export function TrackRow({ track, index, contextQueue }: TrackRowProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const favorites = usePlayerStore((s) => s.favorites);
  const playlists = usePlayerStore((s) => s.playlists);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playNextInQueue = usePlayerStore((s) => s.playNextInQueue);
  const addTrackToPlaylist = usePlayerStore((s) => s.addTrackToPlaylist);
  const setCreatePlaylistOpen = usePlayerStore((s) => s.setCreatePlaylistOpen);

  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistSubmenu, setPlaylistSubmenu] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const isActive = currentTrack?.id === track.id;
  const isFav = favorites.has(track.id);
  const accentHex = accentColor === 'green' ? '#1db954' : '#f9a826';

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPlaylistSubmenu(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const handleAddToPlaylist = async (playlistId: number, playlistName: string) => {
    await addTrackToPlaylist(playlistId, track.id);
    setAddedToast(playlistName);
    setMenuOpen(false);
    setPlaylistSubmenu(false);
    setTimeout(() => setAddedToast(null), 2000);
  };

  return (
    <div
      onClick={() => playTrack(track, contextQueue)}
      className={`grid grid-cols-[auto_1fr_1.2fr_90px_60px_60px] items-center gap-4 py-2.5 px-3 cursor-pointer rounded-xl transition-all duration-150 group select-none relative ${
        isActive
          ? isDark
            ? 'bg-neutral-800/90 text-white shadow-xs'
            : 'bg-white border shadow-xs'
          : isDark
            ? 'hover:bg-neutral-800/50 text-neutral-300'
            : 'hover:bg-gray-100/70 text-gray-800'
      }`}
      style={{
        borderColor: isActive ? (isDark ? undefined : `${accentHex}60`) : undefined,
      }}
    >
      {/* Track Index / Animated Bars / Play icon */}
      <div className="w-7 flex items-center justify-center font-mono text-xs">
        {isActive && isPlaying ? (
          <div className="flex items-end gap-0.5 h-3.5">
            <span className="w-0.5 h-3 animate-bounce" style={{ backgroundColor: accentHex, animationDelay: '0ms' }} />
            <span className="w-0.5 h-3.5 animate-bounce" style={{ backgroundColor: accentHex, animationDelay: '150ms' }} />
            <span className="w-0.5 h-2 animate-bounce" style={{ backgroundColor: accentHex, animationDelay: '300ms' }} />
          </div>
        ) : (
          <span 
            className="group-hover:hidden"
            style={{ color: isActive ? accentHex : undefined, fontWeight: isActive ? 'bold' : 'normal' }}
          >
            {index + 1}
          </span>
        )}
        <Play 
          fill="currentColor" 
          size={14} 
          className="hidden group-hover:block ml-0.5"
          style={{ color: accentHex }} 
        />
      </div>

      {/* Title & Artist & Thumbnail */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border ${
          isDark ? 'bg-neutral-800 border-neutral-700/60' : 'bg-gray-100 border-gray-200/60'
        }`}>
          {track.cover_art ? (
            <img src={getLocalUrl(track.cover_art)} className="w-full h-full object-cover" alt="Cover" />
          ) : (
            <Music size={16} className={isDark ? 'text-neutral-500' : 'text-gray-400'} />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span 
            className="font-semibold text-xs sm:text-sm truncate"
            style={{ color: isActive ? accentHex : isDark ? '#ffffff' : '#111827' }}
          >
            {track.title}
          </span>
          <span className={`text-[11px] sm:text-xs truncate ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            {track.artist}
          </span>
        </div>
      </div>

      {/* Album Title */}
      <div className={`text-xs truncate font-medium ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
        {track.album}
      </div>

      {/* Genre */}
      <div className={`text-[11px] truncate ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
        {track.genre || 'Audio'}
      </div>

      {/* Duration */}
      <div className={`text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-gray-600'}`}>
        {formatTime(track.duration)}
      </div>

      {/* Action: Like & More Menu */}
      <div className="flex items-center justify-end gap-1.5 relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track.id);
          }}
          className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
          title={isFav ? 'Liked' : 'Like'}
        >
          <Heart fill={isFav ? '#ef4444' : 'none'} className={isFav ? 'text-red-500' : ''} size={15} />
        </button>

        {/* More Options Menu Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 text-neutral-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          title="More options"
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            className={`absolute right-0 top-8 z-50 w-52 rounded-2xl shadow-2xl border p-1.5 text-xs animate-fadeIn ${
              isDark 
                ? 'bg-[#242424] border-neutral-700 text-white' 
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            {/* Play Next */}
            <button
              onClick={() => {
                playNextInQueue(track);
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-neutral-700/70' : 'hover:bg-gray-100'
              }`}
            >
              <Radio size={14} />
              <span>Play Next</span>
            </button>

            {/* Add to Queue */}
            <button
              onClick={() => {
                addToQueue(track);
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-neutral-700/70' : 'hover:bg-gray-100'
              }`}
            >
              <ListPlus size={14} />
              <span>Add to Queue</span>
            </button>

            <div className={`my-1 border-t ${isDark ? 'border-neutral-700' : 'border-gray-100'}`} />

            {/* Add to Playlist Submenu Trigger */}
            <div className="relative">
              <button
                onClick={() => setPlaylistSubmenu(!playlistSubmenu)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-neutral-700/70' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plus size={14} />
                  <span>Add to Playlist</span>
                </div>
                <span className="text-[10px] text-neutral-400">▶</span>
              </button>

              {/* Submenu of Playlists */}
              {playlistSubmenu && (
                <div className={`absolute right-full top-0 mr-1 w-48 rounded-2xl shadow-2xl border p-1.5 max-h-56 overflow-y-auto ${
                  isDark ? 'bg-[#242424] border-neutral-700 text-white' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setCreatePlaylistOpen(true);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold ${
                      isDark ? 'hover:bg-neutral-700/70 text-[#1db954]' : 'hover:bg-gray-100 text-[#f9a826]'
                    }`}
                  >
                    <Plus size={14} />
                    <span>New Playlist</span>
                  </button>

                  {playlists.length > 0 && <div className={`my-1 border-t ${isDark ? 'border-neutral-700' : 'border-gray-100'}`} />}

                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => handleAddToPlaylist(pl.id, pl.name)}
                      className={`w-full text-left px-3 py-2 rounded-xl truncate transition-colors ${
                        isDark ? 'hover:bg-neutral-700/70' : 'hover:bg-gray-100'
                      }`}
                    >
                      {pl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Added Notification Pill */}
        {addedToast && (
          <div className="absolute right-0 -top-7 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-md animate-fadeIn flex items-center gap-1 z-50 whitespace-nowrap">
            <Check size={10} />
            Added to {addedToast}
          </div>
        )}
      </div>
    </div>
  );
}


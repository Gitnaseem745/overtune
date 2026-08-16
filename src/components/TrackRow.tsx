'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { Track } from '../types/music';
import { getLocalUrl, formatTime } from '../lib/utils';
import { Play, Pause, Heart, Music, Plus, ListPlus } from 'lucide-react';

interface TrackRowProps {
  track: Track;
  index: number;
  contextQueue?: Track[];
}

export function TrackRow({ track, index, contextQueue }: TrackRowProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const theme = usePlayerStore((s) => s.theme);
  const favorites = usePlayerStore((s) => s.favorites);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const playNextInQueue = usePlayerStore((s) => s.playNextInQueue);

  const isDark = theme === 'dark';
  const isActive = currentTrack?.id === track.id;
  const isFav = favorites.has(track.id);

  return (
    <div
      onClick={() => playTrack(track, contextQueue)}
      className={`grid grid-cols-[auto_1fr_1.2fr_90px_60px_40px] items-center gap-4 py-2.5 px-3 cursor-pointer rounded-xl transition-all duration-150 group select-none ${
        isActive
          ? isDark
            ? 'bg-neutral-800/90 text-white shadow-xs'
            : 'bg-amber-50/80 border border-amber-200/60 shadow-xs'
          : isDark
            ? 'hover:bg-neutral-800/50 text-neutral-300'
            : 'hover:bg-gray-100/70 text-gray-800'
      }`}
    >
      {/* Track Index / Animated Bars / Play icon */}
      <div className="w-7 flex items-center justify-center font-mono text-xs">
        {isActive && isPlaying ? (
          <div className="flex items-end gap-0.5 h-3.5">
            <span className={`w-0.5 h-3 animate-bounce ${isDark ? 'bg-[#1db954]' : 'bg-[#f9a826]'}`} style={{ animationDelay: '0ms' }} />
            <span className={`w-0.5 h-3.5 animate-bounce ${isDark ? 'bg-[#1db954]' : 'bg-[#f9a826]'}`} style={{ animationDelay: '150ms' }} />
            <span className={`w-0.5 h-2 animate-bounce ${isDark ? 'bg-[#1db954]' : 'bg-[#f9a826]'}`} style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <span className={`group-hover:hidden ${isActive ? (isDark ? 'text-[#1db954] font-bold' : 'text-[#f9a826] font-bold') : 'text-neutral-400'}`}>
            {index + 1}
          </span>
        )}
        <Play 
          fill="currentColor" 
          size={14} 
          className={`hidden group-hover:block ml-0.5 ${
            isDark ? 'text-[#1db954]' : 'text-[#f9a826]'
          }`} 
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
          <span className={`font-semibold text-xs sm:text-sm truncate ${
            isActive ? (isDark ? 'text-[#1db954]' : 'text-[#f9a826]') : (isDark ? 'text-white' : 'text-gray-900')
          }`}>
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

      {/* Action / Like */}
      <div className="flex items-center justify-end gap-1">
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
      </div>
    </div>
  );
}

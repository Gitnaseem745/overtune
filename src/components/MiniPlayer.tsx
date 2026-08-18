'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl, formatTime, getAccentColorHex } from '../lib/utils';
import { 
  Play, Pause, SkipBack, SkipForward, Heart, Plus, 
  X, GripVertical, GripHorizontal, Disc3, Shuffle, Repeat 
} from 'lucide-react';

export function MiniPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const shuffleOn = usePlayerStore((s) => s.shuffleOn);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const favorites = usePlayerStore((s) => s.favorites);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);

  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setShuffleOn = usePlayerStore((s) => s.setShuffleOn);
  const cycleRepeatMode = usePlayerStore((s) => s.cycleRepeatMode);
  const handleNext = usePlayerStore((s) => s.handleNext);
  const handlePrev = usePlayerStore((s) => s.handlePrev);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const toggleMiniplayer = usePlayerStore((s) => s.toggleMiniplayer);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 340, height: 340 });
  const [isHovered, setIsHovered] = useState(false);

  // Measure window / container dimensions for auto-layout switching
  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== 'undefined') {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);
  const isCompact = dimensions.height < 185;
  const isLiked = currentTrack ? favorites.has(currentTrack.id) : false;
  const effectiveDuration = duration > 0 ? duration : (currentTrack?.duration || 0);
  const progressPercent = effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;

  const handleTogglePlay = () => {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const handleToggleShuffle = () => {
    setShuffleOn(!shuffleOn);
  };

  const handleToggleRepeat = () => {
    cycleRepeatMode();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    const event = new CustomEvent('audio-seek', { detail: { time: targetTime } });
    window.dispatchEvent(event);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. COMPACT HORIZONTAL BAR / PILL MODE (Height < 185px)
  // ──────────────────────────────────────────────────────────────────────────
  if (isCompact) {
    return (
      <div
        ref={containerRef}
        className={`w-full h-full flex flex-col justify-between select-none relative overflow-hidden transition-colors drag-region ${
          isDark 
            ? 'bg-[#0f0f0f] text-white border border-neutral-800/80 shadow-2xl' 
            : 'bg-white text-gray-900 border border-gray-200/80 shadow-xl'
        }`}
        style={{
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        {/* Main Content Row */}
        <div className="flex-1 flex items-center justify-between px-3 py-2 gap-3 min-w-0 drag-region">
          
          {/* Left: Exit & Drag Handle */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={toggleMiniplayer}
              className={`p-1.5 rounded-lg transition-colors no-drag-region ${
                isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-black'
              }`}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              title="Expand to Full Player"
            >
              <X size={16} />
            </button>
            <div 
              className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300 p-0.5 drag-region" 
              title="Drag Miniplayer"
              style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
              <GripVertical size={14} />
            </div>
          </div>

          {/* Cover Art */}
          <div className="flex-shrink-0 drag-region">
            {currentTrack?.cover_art ? (
              <img
                src={getLocalUrl(currentTrack.cover_art)}
                alt={currentTrack.title}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shadow-md pointer-events-none"
              />
            ) : (
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-md pointer-events-none ${
                isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-100 text-gray-400'
              }`}>
                <Disc3 size={22} />
              </div>
            )}
          </div>

          {/* Title & Artist */}
          <div className="flex flex-col min-w-0 flex-1 justify-center drag-region">
            <span className="font-bold text-xs sm:text-sm truncate leading-tight pointer-events-none">
              {currentTrack?.title || 'No track playing'}
            </span>
            <span className={`text-[11px] truncate mt-0.5 font-medium pointer-events-none ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {currentTrack?.artist || 'Select a song to play'}
            </span>
          </div>

          {/* Right Action & Controls */}
          <div className="flex items-center gap-2 flex-shrink-0 no-drag-region" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            {currentTrack && (
              <button
                onClick={() => toggleFavorite(currentTrack.id)}
                className={`p-1.5 rounded-full transition-transform active:scale-90 no-drag-region ${
                  isLiked ? 'text-rose-500' : isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-400 hover:text-black'
                }`}
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
              >
                {isLiked ? <Heart fill="currentColor" size={17} /> : <Plus size={18} />}
              </button>
            )}

            {/* Play/Pause Circle */}
            <button
              onClick={handleTogglePlay}
              disabled={!currentTrack}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed no-drag-region ${
                isDark ? 'bg-white text-black hover:bg-neutral-100' : 'bg-black text-white hover:bg-neutral-800'
              }`}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause fill="currentColor" size={16} />
              ) : (
                <Play fill="currentColor" size={16} className="ml-0.5" />
              )}
            </button>

            {/* Next Track Button */}
            <button
              onClick={handleNext}
              disabled={!currentTrack}
              className={`p-1.5 rounded-full transition-colors disabled:opacity-30 no-drag-region ${
                isDark ? 'hover:bg-neutral-800 text-neutral-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-black'
              }`}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              title="Next Track"
            >
              <SkipForward size={16} fill="currentColor" />
            </button>
          </div>

        </div>

        {/* Bottom Progress Line */}
        <div 
          className="w-full h-1 relative overflow-hidden drag-region" 
          style={{ 
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            WebkitAppRegion: 'drag' 
          } as React.CSSProperties}
        >
          <div 
            className="h-full transition-all duration-150"
            style={{ 
              width: `${progressPercent}%`,
              backgroundColor: accentHex 
            }}
          />
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. CARD / SQUARE MODE (Height >= 185px)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full h-full flex flex-col justify-between select-none relative overflow-hidden p-3.5 transition-colors drag-region ${
        isDark 
          ? 'bg-[#121212] text-white border border-neutral-800/80 shadow-2xl' 
          : 'bg-white text-gray-900 border border-gray-200/80 shadow-xl'
      }`}
      style={{
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Top Drag & Action Bar */}
      <div className="flex items-center justify-between z-20 drag-region">
        <div className="flex items-center gap-1.5 no-drag-region" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={handleToggleShuffle}
            className={`p-1.5 rounded-lg transition-colors no-drag-region ${
              shuffleOn ? '' : isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-400 hover:text-gray-600'
            }`}
            style={{ color: shuffleOn ? accentHex : undefined, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title={shuffleOn ? 'Shuffle On' : 'Shuffle Off'}
          >
            <Shuffle size={14} />
          </button>
          <button
            onClick={handleToggleRepeat}
            className={`p-1.5 rounded-lg transition-colors no-drag-region ${
              repeatMode !== 'off' ? '' : isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-400 hover:text-gray-600'
            }`}
            style={{ color: repeatMode !== 'off' ? accentHex : undefined, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat size={14} />
          </button>
        </div>

        {/* Center Drag Handle */}
        <div 
          className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-neutral-300 p-1 drag-region" 
          title="Drag Miniplayer"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <GripHorizontal size={18} />
        </div>

        {/* Right Close / Expand */}
        <div className="flex items-center gap-1 no-drag-region" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={toggleMiniplayer}
            className={`p-1.5 rounded-lg transition-colors no-drag-region ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-black'
            }`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="Expand to Full Player"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Center Artwork & Ambient Glow Card */}
      <div className="flex-1 flex items-center justify-center my-2 relative min-h-0">
        <div className="relative w-full h-full max-w-[280px] max-h-[280px] aspect-square rounded-2xl overflow-hidden shadow-2xl group flex items-center justify-center bg-neutral-900/50">
          {currentTrack?.cover_art ? (
            <img
              src={getLocalUrl(currentTrack.cover_art)}
              alt={currentTrack.title}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center rounded-2xl ${
              isDark ? 'bg-neutral-800 text-neutral-600' : 'bg-gray-100 text-gray-300'
            }`}>
              <Disc3 size={64} />
            </div>
          )}

          {/* Hover Playback Overlay Controls on Artwork */}
          <div 
            className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center gap-4 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              onClick={handlePrev}
              disabled={!currentTrack}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-30"
              title="Previous Track"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>

            <button
              onClick={handleTogglePlay}
              disabled={!currentTrack}
              className="w-12 h-12 rounded-full text-black hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{
                backgroundColor: accentHex,
                color: '#000000',
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause fill="currentColor" size={22} />
              ) : (
                <Play fill="currentColor" size={22} className="ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={!currentTrack}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-30"
              title="Next Track"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Track Details & Seekbar */}
      <div className="z-20 space-y-2 pt-1 no-drag-region" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Track Title, Artist, and Favorite */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-extrabold text-sm sm:text-base truncate leading-snug">
              {currentTrack?.title || 'No track playing'}
            </span>
            <span className={`text-xs truncate font-medium mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              {currentTrack?.artist || 'Select music to play'}
            </span>
          </div>

          {currentTrack && (
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`p-2 rounded-full transition-transform active:scale-90 flex-shrink-0 ${
                isLiked ? 'text-rose-500' : isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-400 hover:text-black'
              }`}
              title={isLiked ? 'Liked' : 'Like'}
            >
              {isLiked ? <Heart fill="currentColor" size={20} /> : <Plus size={20} />}
            </button>
          )}
        </div>

        {/* Timeline Slider & Time Row */}
        <div className="space-y-1">
          <div className="relative flex items-center group">
            <input
              type="range"
              min={0}
              max={effectiveDuration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!currentTrack}
              className="w-full h-1 group-hover:h-1.5 rounded-lg appearance-none cursor-pointer transition-all duration-150"
              style={{
                background: `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${progressPercent}%, ${
                  isDark ? '#333333' : '#e5e7eb'
                } ${progressPercent}%, ${isDark ? '#333333' : '#e5e7eb'} 100%)`,
              }}
            />
          </div>

          <div className={`flex items-center justify-between text-[10px] font-mono font-medium ${
            isDark ? 'text-neutral-500' : 'text-gray-400'
          }`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl, formatTime, getAccentColorHex } from '../lib/utils';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, VolumeX, Heart, Minimize2, Mic2, Disc3, 
  Music
} from 'lucide-react';

export function FullscreenPlayer() {
  const isFullscreenPlayerOpen = usePlayerStore((s) => s.isFullscreenPlayerOpen);
  const setFullscreenPlayerOpen = usePlayerStore((s) => s.setFullscreenPlayerOpen);
  const fullscreenMode = usePlayerStore((s) => s.fullscreenMode);
  const setFullscreenMode = usePlayerStore((s) => s.setFullscreenMode);
  const toggleFullscreenPlayer = usePlayerStore((s) => s.toggleFullscreenPlayer);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const shuffleOn = usePlayerStore((s) => s.shuffleOn);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const favorites = usePlayerStore((s) => s.favorites);
  const lyrics = usePlayerStore((s) => s.lyrics);
  const lyricOffset = usePlayerStore((s) => s.lyricOffset);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const selectedAlbum = usePlayerStore((s) => s.selectedAlbum);
  const selectedPlaylist = usePlayerStore((s) => s.selectedPlaylist);

  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const fetchLyrics = usePlayerStore((s) => s.fetchLyrics);

  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const lastTrackIdRef = useRef<number | null>(null);

  const accentHex = getAccentColorHex(accentColor);
  const isFav = currentTrack ? favorites.has(currentTrack.id) : false;
  const effectiveDuration = duration > 0 ? duration : (currentTrack?.duration || 0);
  const progressPercent = effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const volPercent = (isMuted ? 0 : volume) * 100;

  // Fetch lyrics when track changes
  useEffect(() => {
    if (currentTrack && currentTrack.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = currentTrack.id;
      fetchLyrics(currentTrack.path, currentTrack.id);
    }
  }, [currentTrack, fetchLyrics]);

  // ── 5-Second Inactivity Timer ──
  const scheduleIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 5000);
  }, []);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    scheduleIdleTimer();
  }, [scheduleIdleTimer]);

  useEffect(() => {
    if (!isFullscreenPlayerOpen) return;

    scheduleIdleTimer();

    const handleActivity = () => resetIdleTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [isFullscreenPlayerOpen, resetIdleTimer, scheduleIdleTimer]);

  // ── Keyboard Shortcuts (Esc to exit, Space to play/pause) ──
  useEffect(() => {
    if (!isFullscreenPlayerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setFullscreenPlayerOpen(false);
        if (typeof window !== 'undefined' && window.api?.toggleFullScreen && window.api?.isFullScreen) {
          window.api.isFullScreen().then((fs) => {
            if (fs) window.api?.toggleFullScreen().catch(console.error);
          });
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('audio-toggle-play'));
      } else if (e.key.toLowerCase() === 'l') {
        setFullscreenMode(fullscreenMode === 'lyrics' ? 'artwork' : 'lyrics');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenPlayerOpen, fullscreenMode, setFullscreenMode, setFullscreenPlayerOpen]);

  // ── Synced Lyrics Current Line ──
  const getActiveLineIndex = useCallback(() => {
    if (!lyrics || !lyrics.isSynced || lyrics.lines.length === 0) return -1;
    const adjustedTime = currentTime + (lyricOffset / 1000);
    let activeIdx = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (lyrics.lines[i].time <= adjustedTime) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  }, [currentTime, lyrics, lyricOffset]);

  const activeLineIndex = getActiveLineIndex();

  // Auto-scroll lyrics smoothly into center
  useEffect(() => {
    if (!lyrics?.isSynced || activeLineIndex < 0 || fullscreenMode !== 'lyrics') return;
    if (activeLineRef.current && lyricsScrollRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, lyrics?.isSynced, fullscreenMode]);

  // Playback control event dispatchers
  const handleTogglePlay = () => window.dispatchEvent(new CustomEvent('audio-toggle-play'));
  const handleNext = () => window.dispatchEvent(new CustomEvent('audio-next'));
  const handlePrev = () => window.dispatchEvent(new CustomEvent('audio-prev'));
  const handleToggleShuffle = () => window.dispatchEvent(new CustomEvent('audio-toggle-shuffle'));
  const handleCycleRepeat = () => window.dispatchEvent(new CustomEvent('audio-cycle-repeat'));
  const handleToggleMute = () => window.dispatchEvent(new CustomEvent('audio-toggle-mute'));

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    window.dispatchEvent(new CustomEvent('audio-seek', { detail: { time } }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    window.dispatchEvent(new CustomEvent('audio-set-volume', { detail: { volume: vol } }));
  };

  const handleLineClick = (time: number) => {
    if (!lyrics?.isSynced || time < 0) return;
    const seekTime = Math.max(0, time - (lyricOffset / 1000));
    window.dispatchEvent(new CustomEvent('audio-seek', { detail: { time: seekTime } }));
  };

  if (!isFullscreenPlayerOpen) return null;

  const headerTitle = selectedPlaylist?.name 
    || selectedAlbum?.title 
    || currentTrack?.album 
    || currentTrack?.artist 
    || 'Now Playing';

  return (
    <div 
      className={`fixed inset-0 z-50 bg-[#0d0d0d] text-white flex flex-col justify-between overflow-hidden select-none transition-all duration-500 ${
        isIdle ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* ── Ambient Background Glow from Cover Art ── */}
      {currentTrack?.cover_art && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 blur-3xl scale-125 transform transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${getLocalUrl(currentTrack.cover_art)})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
      )}

      {/* ── Top Bar ── */}
      <header 
        className={`relative z-20 flex items-center justify-between px-8 py-6 transition-all duration-700 ${
          isIdle ? 'opacity-0 -translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 max-w-sm">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold truncate">
            {headerTitle}
          </span>
        </div>

        {/* Center Pill: "To exit full screen, press Esc" */}
        <button
          onClick={() => toggleFullscreenPlayer()}
          className="px-4 py-1.5 rounded-full text-xs font-medium bg-black/40 hover:bg-black/60 border border-white/10 text-neutral-300 hover:text-white transition-all backdrop-blur-md flex items-center gap-1.5 shadow-sm"
          title="Exit Full Screen (Esc)"
        >
          <span>To exit full screen, press</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/15 rounded border border-white/20 text-white font-bold">
            Esc
          </kbd>
        </button>

        {/* Right Mode Switchers */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFullscreenMode(fullscreenMode === 'lyrics' ? 'artwork' : 'lyrics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              fullscreenMode === 'lyrics'
                ? 'bg-white text-black border-white shadow-lg'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md'
            }`}
            title={fullscreenMode === 'lyrics' ? 'Switch to Song Image' : 'Switch to Fullscreen Lyrics'}
          >
            {fullscreenMode === 'lyrics' ? <Disc3 size={15} /> : <Mic2 size={15} />}
            <span>{fullscreenMode === 'lyrics' ? 'Artwork' : 'Lyrics'}</span>
          </button>

          <button
            onClick={() => toggleFullscreenPlayer()}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white border border-white/10 transition-colors backdrop-blur-md"
            title="Exit Full Screen"
          >
            <Minimize2 size={16} />
          </button>
        </div>
      </header>

      {/* ── Main View Area (Centered Artwork or Fullscreen Lyrics) ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center min-h-0 w-full px-6 overflow-hidden">
        {/* 1. ARTWORK MODE */}
        {fullscreenMode === 'artwork' && (
          <div className="flex flex-col items-center justify-center max-w-2xl w-full text-center space-y-6">
            <div className="relative group aspect-square w-72 sm:w-96 md:w-[440px] max-h-[56vh] rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 flex items-center justify-center">
              {currentTrack?.cover_art ? (
                <img 
                  src={getLocalUrl(currentTrack.cover_art)} 
                  alt={currentTrack.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <Music size={96} className="text-neutral-700 animate-pulse" />
              )}
            </div>

            {/* Song Metadata under cover */}
            <div className="space-y-1.5 max-w-lg px-4">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate drop-shadow-md">
                {currentTrack?.title || 'No Track Selected'}
              </h1>
              <p className="text-base text-neutral-400 font-medium truncate">
                {currentTrack?.artist || 'Unknown Artist'} {currentTrack?.album ? `• ${currentTrack.album}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* 2. LYRICS MODE */}
        {fullscreenMode === 'lyrics' && (
          <div 
            ref={lyricsScrollRef}
            className="w-full max-w-4xl h-full overflow-y-auto no-scrollbar py-20 px-8 flex flex-col space-y-8 text-left"
          >
            {lyrics && lyrics.lines && lyrics.lines.length > 0 ? (
              lyrics.lines.map((line, idx) => {
                const isActive = lyrics.isSynced && idx === activeLineIndex;
                const isPast = lyrics.isSynced && activeLineIndex !== -1 && idx < activeLineIndex;

                return (
                  <div
                    key={`${line.time}_${idx}`}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => handleLineClick(line.time)}
                    className={`transition-all duration-300 font-black leading-relaxed tracking-tight cursor-pointer select-none ${
                      isActive
                        ? 'text-3xl sm:text-5xl md:text-6xl text-white transform scale-100 drop-shadow-lg'
                        : isPast
                          ? 'text-2xl sm:text-4xl md:text-5xl text-white/35 hover:text-white/70'
                          : 'text-2xl sm:text-4xl md:text-5xl text-neutral-500 hover:text-white/80'
                    }`}
                    style={{
                      color: isActive ? accentHex : undefined,
                    }}
                  >
                    {line.text || '♪'}
                  </div>
                );
              })
            ) : (
              <div className="m-auto text-center space-y-4">
                <Mic2 size={48} className="mx-auto text-neutral-600 animate-pulse" />
                <p className="text-xl font-bold text-neutral-400">No lyrics available for this song</p>
                <p className="text-sm text-neutral-500">
                  Place an adjacent .lrc or .txt sidecar file in your music folder to see synchronized lyrics.
                </p>
                <button
                  onClick={() => setFullscreenMode('artwork')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 transition-colors shadow-md"
                >
                  View Artwork
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Bottom Persistent Transport Bar ── */}
      <footer 
        className={`relative z-20 px-8 py-6 transition-all duration-700 bg-gradient-to-t from-black/90 via-black/60 to-transparent ${
          isIdle ? 'opacity-0 translate-y-8 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col space-y-3">
          {/* Progress Seek Bar */}
          <div className="flex items-center gap-3 w-full group">
            <span className="text-xs font-mono text-neutral-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center h-4">
              <input
                type="range"
                min={0}
                max={effectiveDuration > 0 ? effectiveDuration : 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                disabled={!currentTrack}
                style={{
                  background: `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%, rgba(255,255,255,0.2) 100%)`,
                  accentColor: accentHex,
                }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-hidden transition-all"
              />
            </div>

            <span className="text-xs font-mono text-neutral-400 w-10">
              {formatTime(effectiveDuration)}
            </span>
          </div>

          {/* Lower Control Bar: Track Info | Buttons | Volume & Actions */}
          <div className="flex items-center justify-between gap-4">
            {/* Left: Track Info */}
            <div className="flex items-center gap-3.5 min-w-[200px] w-1/4">
              {currentTrack?.cover_art && (
                <img
                  src={getLocalUrl(currentTrack.cover_art)}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-xl object-cover shadow-md border border-white/10 shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{currentTrack?.title || 'No Track'}</p>
                <p className="text-xs text-neutral-400 truncate">{currentTrack?.artist || 'Unknown Artist'}</p>
              </div>
              {currentTrack && (
                <button
                  onClick={() => toggleFavorite(currentTrack.id)}
                  className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart size={16} fill={isFav ? accentHex : 'none'} color={isFav ? accentHex : 'currentColor'} />
                </button>
              )}
            </div>

            {/* Center: Playback Controls */}
            <div className="flex items-center gap-5">
              <button 
                onClick={handleToggleShuffle}
                className="transition-colors p-1"
                style={{ color: shuffleOn ? accentHex : '#9ca3af' }}
                title={`Shuffle: ${shuffleOn ? 'On' : 'Off'}`}
              >
                <Shuffle size={18} />
              </button>

              <button 
                onClick={handlePrev}
                className="text-neutral-300 hover:text-white transition-colors p-1"
                title="Previous Track"
              >
                <SkipBack fill="currentColor" size={20} />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-12 h-12 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center transition-all shadow-xl"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause fill="black" size={22} /> : <Play fill="black" size={22} className="ml-0.5" />}
              </button>

              <button 
                onClick={handleNext}
                className="text-neutral-300 hover:text-white transition-colors p-1"
                title="Next Track"
              >
                <SkipForward fill="currentColor" size={20} />
              </button>

              <button 
                onClick={handleCycleRepeat}
                className="transition-colors p-1 relative"
                style={{ color: repeatMode !== 'off' ? accentHex : '#9ca3af' }}
                title={`Repeat: ${repeatMode}`}
              >
                <Repeat size={18} />
                {repeatMode === 'one' && (
                  <span 
                    className="absolute -top-1 -right-1 text-[8px] font-bold rounded-full w-3 h-3 flex items-center justify-center text-black"
                    style={{ backgroundColor: accentHex }}
                  >
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Right: Mode & Volume Controls */}
            <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
              <button
                onClick={() => setFullscreenMode(fullscreenMode === 'lyrics' ? 'artwork' : 'lyrics')}
                className={`p-2 rounded-xl transition-colors ${
                  fullscreenMode === 'lyrics' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
                }`}
                style={{ color: fullscreenMode === 'lyrics' ? accentHex : undefined }}
                title={fullscreenMode === 'lyrics' ? 'Switch to Artwork' : 'Switch to Lyrics'}
              >
                <Mic2 size={18} />
              </button>

              <button 
                onClick={handleToggleMute}
                className="text-neutral-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  background: `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${volPercent}%, rgba(255,255,255,0.2) ${volPercent}%, rgba(255,255,255,0.2) 100%)`,
                  accentColor: accentHex,
                }}
                className="w-24 h-1.5 rounded-full appearance-none cursor-pointer focus:outline-hidden transition-all"
              />

              <button
                onClick={() => toggleFullscreenPlayer()}
                className="p-2 text-neutral-400 hover:text-white transition-colors ml-1"
                title="Exit Full Screen (Esc)"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

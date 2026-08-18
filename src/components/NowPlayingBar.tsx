'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl, formatTime, getAccentColorHex } from '../lib/utils';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, VolumeX, Heart, Music, ListMusic, PictureInPicture2 
} from 'lucide-react';

export function NowPlayingBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const shuffleOn = usePlayerStore((s) => s.shuffleOn);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const audioError = usePlayerStore((s) => s.audioError);
  const theme = usePlayerStore((s) => s.theme);
  const layout = usePlayerStore((s) => s.layout);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const favorites = usePlayerStore((s) => s.favorites);
  const isRightPanelOpen = usePlayerStore((s) => s.isRightPanelOpen);
  const toggleMiniplayer = usePlayerStore((s) => s.toggleMiniplayer);

  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setIsMuted = usePlayerStore((s) => s.setIsMuted);
  const setShuffleOn = usePlayerStore((s) => s.setShuffleOn);
  const cycleRepeatMode = usePlayerStore((s) => s.cycleRepeatMode);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const toggleRightPanel = usePlayerStore((s) => s.toggleRightPanel);
  const handleNext = usePlayerStore((s) => s.handleNext);
  const handlePrev = usePlayerStore((s) => s.handlePrev);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const tracks = usePlayerStore((s) => s.tracks);

  const isDark = theme === 'dark';
  const isFav = currentTrack ? favorites.has(currentTrack.id) : false;
  const effectiveDuration = duration > 0 ? duration : (currentTrack?.duration || 0);

  const accentHex = getAccentColorHex(accentColor);

  // Calculate percentages for timeline & volume fill
  const progressPercent = effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const currentVol = isMuted ? 0 : volume;
  const volPercent = Math.min(100, Math.max(0, currentVol * 100));

  const trackBg = isDark ? '#282828' : '#e5e7eb';

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    const event = new CustomEvent('audio-seek', { detail: { time: targetTime } });
    window.dispatchEvent(event);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <footer 
      className={`h-24 flex items-center justify-between px-6 flex-shrink-0 z-40 border-t backdrop-blur-md transition-colors ${
        isDark 
          ? 'bg-[#181818]/95 border-neutral-800 text-white' 
          : 'bg-white/95 border-gray-100 text-gray-900 shadow-lg'
      }`}
    >
      {/* ── Left: Track Info & Like Button ── */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border shadow-sm ${
          isDark ? 'bg-neutral-800 border-neutral-700/60' : 'bg-gray-100 border-gray-200/60'
        }`}>
          {currentTrack?.cover_art ? (
            <img 
              src={getLocalUrl(currentTrack.cover_art)} 
              className="w-full h-full object-cover" 
              alt="Cover" 
            />
          ) : (
            <Music size={22} className={isDark ? 'text-neutral-500' : 'text-gray-400'} />
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-bold text-sm truncate leading-tight">
            {currentTrack ? currentTrack.title : 'No track selected'}
          </span>
          <span className={`text-xs truncate font-medium mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
            {currentTrack ? currentTrack.artist : 'Select a song to start listening'}
          </span>
          {audioError && (
            <span className="text-[11px] text-red-400 truncate mt-0.5" title={audioError}>
              ⚠ {audioError}
            </span>
          )}
        </div>

        {currentTrack && (
          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
            title={isFav ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          >
            <Heart 
              fill={isFav ? '#ef4444' : 'none'} 
              className={isFav ? 'text-red-500' : ''} 
              size={18} 
            />
          </button>
        )}
      </div>

      {/* ── Center: Transport Controls & Seek Slider ── */}
      <div className="flex-1 max-w-xl flex flex-col items-center px-4">
        {/* Buttons */}
        <div className="flex items-center gap-6 mb-1">
          <button 
            onClick={() => setShuffleOn(!shuffleOn)}
            className="transition-colors"
            style={{ color: shuffleOn ? accentHex : isDark ? '#a3a3a3' : '#9ca3af' }}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button 
            onClick={handlePrev}
            disabled={!currentTrack && tracks.length === 0}
            className={`transition disabled:opacity-30 ${
              isDark ? 'text-neutral-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Previous"
          >
            <SkipBack fill="currentColor" size={18} />
          </button>

          <button 
            onClick={() => {
              if (!currentTrack && tracks.length > 0) {
                playTrack(tracks[0]);
              } else if (currentTrack) {
                setIsPlaying(!isPlaying);
              }
            }}
            disabled={!currentTrack && tracks.length === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center text-black shadow-md transition-all transform hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{ 
              backgroundColor: accentHex,
              boxShadow: `0 4px 14px ${accentHex}40`
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause fill="currentColor" size={16} className="text-black" />
            ) : (
              <Play fill="currentColor" size={16} className="ml-0.5 text-black" />
            )}
          </button>

          <button 
            onClick={handleNext}
            disabled={!currentTrack && tracks.length === 0}
            className={`transition disabled:opacity-30 ${
              isDark ? 'text-neutral-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Next"
          >
            <SkipForward fill="currentColor" size={18} />
          </button>

          <button 
            onClick={cycleRepeatMode}
            className="relative transition-colors"
            style={{ color: repeatMode !== 'off' ? accentHex : isDark ? '#a3a3a3' : '#9ca3af' }}
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat size={16} />
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

        {/* ── Seek Bar with Filled Progress Track ── */}
        <div className="flex items-center w-full gap-3 relative group">
          <span className={`text-[11px] font-mono w-10 text-right ${isDark ? 'text-neutral-400' : 'text-gray-400'}`}>
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center h-6">
            {/* Background Track with Filled Gradient matching volume slider */}
            <input
              type="range"
              min={0}
              max={effectiveDuration > 0 ? effectiveDuration : 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!currentTrack}
              style={{
                background: `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${progressPercent}%, ${trackBg} ${progressPercent}%, ${trackBg} 100%)`,
                accentColor: accentHex,
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none transition-all"
            />
          </div>

          <span className={`text-[11px] font-mono w-10 ${isDark ? 'text-neutral-400' : 'text-gray-400'}`}>
            {formatTime(effectiveDuration)}
          </span>
        </div>
      </div>

      {/* ── Right: Queue Drawer Toggle & Volume ── */}
      <div className="w-1/4 min-w-[180px] flex items-center justify-end gap-3.5">
        {/* Toggle Right Panel (Spotify Layout) */}
        {layout === 'spotify' && (
          <button
            onClick={toggleRightPanel}
            className={`p-1.5 rounded-lg transition-colors ${
              isRightPanelOpen
                ? isDark ? 'bg-neutral-800' : 'bg-gray-100'
                : isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
            style={{ color: isRightPanelOpen ? accentHex : undefined }}
            title={isRightPanelOpen ? 'Hide Queue & Info Panel' : 'Show Queue & Info Panel'}
          >
            <ListMusic size={18} />
          </button>
        )}

        {/* Toggle Miniplayer Mode */}
        <button
          onClick={toggleMiniplayer}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Open Miniplayer"
        >
          <PictureInPicture2 size={18} />
        </button>

        <button 
          onClick={toggleMute}
          className={`transition-colors ${
            isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Volume Slider with Filled Progress Track */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          style={{
            background: `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${volPercent}%, ${trackBg} ${volPercent}%, ${trackBg} 100%)`,
            accentColor: accentHex,
          }}
          className="w-24 h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none transition-all"
        />
      </div>
    </footer>
  );
}

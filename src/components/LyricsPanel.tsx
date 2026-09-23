'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getAccentColorHex } from '../lib/utils';
import { 
  Mic2, X, Plus, Minus, RotateCcw, 
  Music, FileText, FileMusic 
} from 'lucide-react';

export function LyricsPanel() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const lyrics = usePlayerStore((s) => s.lyrics);
  const lyricOffset = usePlayerStore((s) => s.lyricOffset);
  const isLyricsPanelOpen = usePlayerStore((s) => s.isLyricsPanelOpen);
  const toggleLyricsPanel = usePlayerStore((s) => s.toggleLyricsPanel);
  const fetchLyrics = usePlayerStore((s) => s.fetchLyrics);
  const adjustLyricOffset = usePlayerStore((s) => s.adjustLyricOffset);
  const resetLyricOffset = usePlayerStore((s) => s.resetLyricOffset);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const lastTrackIdRef = useRef<number | null>(null);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  // Fetch lyrics when the track changes
  useEffect(() => {
    if (currentTrack && currentTrack.id !== lastTrackIdRef.current) {
      lastTrackIdRef.current = currentTrack.id;
      fetchLyrics(currentTrack.path, currentTrack.id);
    } else if (!currentTrack) {
      lastTrackIdRef.current = null;
    }
  }, [currentTrack, fetchLyrics]);

  // Find the currently active line index (for synced lyrics)
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

  // Auto-scroll to active line with smooth behavior
  useEffect(() => {
    if (!lyrics?.isSynced || activeLineIndex < 0) return;
    
    // Respect reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' 
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, lyrics?.isSynced]);

  // Click-to-seek on a synced line
  const handleLineClick = (time: number) => {
    if (!lyrics?.isSynced || time < 0) return;
    const adjustedTime = time - (lyricOffset / 1000);
    const seekTime = Math.max(0, adjustedTime);
    const event = new CustomEvent('audio-seek', { detail: { time: seekTime } });
    window.dispatchEvent(event);
  };

  // Keyboard navigation for the lyrics panel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      toggleLyricsPanel();
    }
  };

  if (!isLyricsPanelOpen) return null;

  // Source label for display
  const sourceLabel = lyrics?.source === 'lrc' ? 'LRC File' 
    : lyrics?.source === 'txt' ? 'Text File' 
    : lyrics?.source === 'embedded' ? 'Embedded' 
    : '';

  const SourceIcon = lyrics?.source === 'lrc' ? FileMusic 
    : lyrics?.source === 'txt' ? FileText 
    : lyrics?.source === 'embedded' ? Music 
    : Music;

  return (
    <div 
      className={`flex flex-col h-full transition-colors ${
        isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'
      }`}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Lyrics panel"
      tabIndex={-1}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${
        isDark ? 'border-neutral-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <Mic2 size={16} style={{ color: accentHex }} aria-hidden="true" />
          <span className="font-semibold text-sm truncate">Lyrics</span>
          {sourceLabel && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
              isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-200 text-gray-500'
            }`}>
              <SourceIcon size={10} aria-hidden="true" />
              {sourceLabel}
            </span>
          )}
        </div>
        <button
          onClick={toggleLyricsPanel}
          className={`p-1 rounded-lg transition-colors ${
            isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
          }`}
          aria-label="Close lyrics panel"
          title="Close lyrics panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Lyrics Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
        role="log"
        aria-label={lyrics?.isSynced ? 'Synchronized lyrics' : 'Lyrics text'}
        aria-live={lyrics?.isSynced ? 'polite' : 'off'}
      >
        {!currentTrack ? (
          /* No track selected */
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <Music size={40} className={isDark ? 'text-neutral-600' : 'text-gray-300'} aria-hidden="true" />
            <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
              No track selected
            </p>
          </div>
        ) : !lyrics || lyrics.source === 'none' || lyrics.lines.length === 0 ? (
          /* No lyrics found */
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
            <Mic2 size={40} className={isDark ? 'text-neutral-600' : 'text-gray-300'} aria-hidden="true" />
            <p className={`text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
              No lyrics available
            </p>
            <p className={`text-xs text-center max-w-[200px] ${isDark ? 'text-neutral-600' : 'text-gray-400'}`}>
              Place a <code className={`px-1 py-0.5 rounded text-[10px] ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`}>.lrc</code> or{' '}
              <code className={`px-1 py-0.5 rounded text-[10px] ${isDark ? 'bg-neutral-800' : 'bg-gray-200'}`}>.txt</code> file 
              next to the audio file with the same name
            </p>
          </div>
        ) : lyrics.isSynced ? (
          /* Synced LRC lyrics with active line emphasis */
          <div className="flex flex-col gap-1 pb-32 pt-16">
            {lyrics.lines.map((line, index) => {
              const isActive = index === activeLineIndex;
              const isPast = index < activeLineIndex;
              const hasText = line.text.trim().length > 0;

              if (!hasText) {
                return <div key={index} className="h-4" />;
              }

              return (
                <div
                  key={index}
                  ref={isActive ? activeLineRef : undefined}
                  onClick={() => handleLineClick(line.time)}
                  className={`py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-300 ${
                    isActive
                      ? 'font-bold text-lg scale-[1.02] origin-left'
                      : isPast
                        ? `text-sm ${isDark ? 'text-neutral-500' : 'text-gray-400'}`
                        : `text-sm ${isDark ? 'text-neutral-300' : 'text-gray-700'}`
                  } ${
                    isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-100'
                  }`}
                  style={{
                    color: isActive ? accentHex : undefined,
                    textShadow: isActive ? `0 0 20px ${accentHex}40` : undefined,
                  }}
                  role="button"
                  aria-label={`${isActive ? 'Currently playing: ' : ''}${line.text}. Click to seek.`}
                  aria-current={isActive ? 'true' : undefined}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleLineClick(line.time);
                    }
                  }}
                >
                  {line.text}
                </div>
              );
            })}
          </div>
        ) : (
          /* Plain text (unsynced) lyrics */
          <div className="flex flex-col gap-0.5 pb-8">
            {lyrics.lines.map((line, index) => (
              <p 
                key={index} 
                className={`text-sm leading-relaxed py-0.5 ${
                  line.text.trim() 
                    ? isDark ? 'text-neutral-300' : 'text-gray-700'
                    : 'h-3'
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Offset Controls (only for synced lyrics) */}
      {lyrics?.isSynced && currentTrack && (
        <div className={`flex items-center justify-between px-4 py-2 border-t flex-shrink-0 ${
          isDark ? 'border-neutral-800 bg-[#1a1a1a]' : 'border-gray-200 bg-gray-50'
        }`}>
          <span className={`text-[11px] font-medium ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
            Offset
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustLyricOffset(currentTrack.id, -100)}
              className={`p-1 rounded transition-colors ${
                isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
              }`}
              title="Decrease offset by 100ms (lyrics earlier)"
              aria-label="Decrease lyric offset"
            >
              <Minus size={14} />
            </button>
            <span className={`text-xs font-mono min-w-[60px] text-center ${
              isDark ? 'text-neutral-400' : 'text-gray-500'
            }`}>
              {lyricOffset >= 0 ? '+' : ''}{lyricOffset}ms
            </span>
            <button
              onClick={() => adjustLyricOffset(currentTrack.id, 100)}
              className={`p-1 rounded transition-colors ${
                isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
              }`}
              title="Increase offset by 100ms (lyrics later)"
              aria-label="Increase lyric offset"
            >
              <Plus size={14} />
            </button>
            {lyricOffset !== 0 && (
              <button
                onClick={() => resetLyricOffset(currentTrack.id)}
                className={`p-1 rounded transition-colors ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
                }`}
                title="Reset offset to 0"
                aria-label="Reset lyric offset"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

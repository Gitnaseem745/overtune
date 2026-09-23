'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl } from '../lib/utils';

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadedTrackIdRef = useRef<number | null>(null);
  const hasRecordedPlayRef = useRef<boolean>(false);
  const playStartTimeRef = useRef<number>(0);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setAudioError = usePlayerStore((s) => s.setAudioError);
  const handleNext = usePlayerStore((s) => s.handleNext);
  const handlePrev = usePlayerStore((s) => s.handlePrev);
  const refreshLibrary = usePlayerStore((s) => s.refreshLibrary);
  const updateTrackDurationInStore = usePlayerStore((s) => s.updateTrackDurationInStore);
  const recordPlayEvent = usePlayerStore((s) => s.recordPlayEvent);
  const savePlaybackState = usePlayerStore((s) => s.savePlaybackState);
  const restorePlaybackState = usePlayerStore((s) => s.restorePlaybackState);
  const loadRatingsAndTags = usePlayerStore((s) => s.loadRatingsAndTags);
  const loadSmartPlaylists = usePlayerStore((s) => s.loadSmartPlaylists);
  const loadMixes = usePlayerStore((s) => s.loadMixes);
  const loadDesktopSettings = usePlayerStore((s) => s.loadDesktopSettings);
  const reducedMotion = usePlayerStore((s) => s.reducedMotion);
  const textScale = usePlayerStore((s) => s.textScale);

  // Safe play helper to prevent unhandled AbortErrors from interruptions
  const safePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setAudioError(null);
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name === 'AbortError' || err.message?.includes('interrupted')) {
          return;
        }
        console.error('[AudioEngine] Play failed:', err);
        setAudioError(`Playback error: ${err.message}`);
        setIsPlaying(false);
      });
    }
  }, [setAudioError, setIsPlaying]);

  // Initial load of library, ratings, mixes, desktop settings, and playback state restore
  useEffect(() => {
    const init = async () => {
      await refreshLibrary();
      await Promise.all([
        loadRatingsAndTags(),
        loadSmartPlaylists(),
        loadMixes(),
        loadDesktopSettings(),
        restorePlaybackState(),
      ]);
    };
    init();

    if (typeof window !== 'undefined' && window.api?.onLibraryUpdated) {
      const cleanup = window.api.onLibraryUpdated(() => {
        refreshLibrary();
        loadMixes();
      });
      return cleanup;
    }
  }, [refreshLibrary, loadRatingsAndTags, loadSmartPlaylists, loadMixes, loadDesktopSettings, restorePlaybackState]);

  // Global Keyboard Shortcuts & Tray Listeners
  useEffect(() => {
    if (typeof window === 'undefined' || !window.api) return;

    const unsubs: Array<() => void> = [];

    if (window.api.onShortcutTogglePlay) {
      unsubs.push(window.api.onShortcutTogglePlay(() => {
        const store = usePlayerStore.getState();
        store.setIsPlaying(!store.isPlaying);
      }));
    }

    if (window.api.onShortcutNext) {
      unsubs.push(window.api.onShortcutNext(() => {
        usePlayerStore.getState().handleNext();
      }));
    }

    if (window.api.onShortcutPrev) {
      unsubs.push(window.api.onShortcutPrev(() => {
        usePlayerStore.getState().handlePrev();
      }));
    }

    if (window.api.onShortcutVolumeStep) {
      unsubs.push(window.api.onShortcutVolumeStep((delta: number) => {
        const curVol = usePlayerStore.getState().volume;
        const newVol = Math.min(1, Math.max(0, curVol + delta));
        usePlayerStore.getState().setVolume(newVol);
      }));
    }

    if (window.api.onShortcutToggleLyrics) {
      unsubs.push(window.api.onShortcutToggleLyrics(() => {
        usePlayerStore.getState().toggleLyricsPanel();
      }));
    }

    if (window.api.onShortcutToggleMiniplayer) {
      unsubs.push(window.api.onShortcutToggleMiniplayer(() => {
        usePlayerStore.getState().toggleMiniplayer();
      }));
    }

    if (window.api.onOpenSettings) {
      unsubs.push(window.api.onOpenSettings(() => {
        usePlayerStore.getState().setSettingsOpen(true);
      }));
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Synchronize documentElement classes for accessibility (reduced-motion, text-scale)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (reducedMotion) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('text-scale-small', 'text-scale-large');
      if (textScale === 'small') document.documentElement.classList.add('text-scale-small');
      if (textScale === 'large') document.documentElement.classList.add('text-scale-large');
    }
  }, [textScale]);

  // Update OS MediaSession metadata and action handlers
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      if (currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          artwork: currentTrack.cover_art ? [
            { src: getLocalUrl(currentTrack.cover_art), sizes: '512x512', type: 'image/png' }
          ] : [],
        });
      } else {
        navigator.mediaSession.metadata = null;
      }

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
          audioRef.current.currentTime = details.seekTime;
        }
      });
    }
  }, [currentTrack, setIsPlaying, handleNext, handlePrev]);

  // Update Tray and Desktop Notifications on Track / Play State change
  useEffect(() => {
    if (typeof window !== 'undefined' && window.api) {
      if (window.api.updateTrayTrack) {
        window.api.updateTrayTrack(
          currentTrack?.title || '',
          currentTrack?.artist || '',
          isPlaying
        );
      }
    }
  }, [currentTrack, isPlaying]);

  // 1. Handle Track Source Change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      // Only reload if the track ID actually changed
      if (loadedTrackIdRef.current !== currentTrack.id) {
        loadedTrackIdRef.current = currentTrack.id;
        hasRecordedPlayRef.current = false;
        playStartTimeRef.current = Date.now();
        setAudioError(null);

        const url = getLocalUrl(currentTrack.path);
        audio.src = url;
        audio.load();

        if (isPlaying) {
          safePlay();
        }

        savePlaybackState();

        // Trigger desktop notification for track change if enabled
        if (typeof window !== 'undefined' && window.api?.notifyTrackChanged) {
          window.api.notifyTrackChanged(currentTrack.title, currentTrack.artist, currentTrack.album);
        }
      }
    } else {
      loadedTrackIdRef.current = null;
      hasRecordedPlayRef.current = false;
      audio.removeAttribute('src');
      audio.load();
    }
  }, [currentTrack, isPlaying, safePlay, savePlaybackState, setAudioError]);

  // 2. Handle Play / Pause State Toggle
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      if (audio.paused) {
        safePlay();
      }
    } else {
      if (!audio.paused) {
        audio.pause();
        savePlaybackState();
      }
    }
  }, [isPlaying, currentTrack, safePlay, savePlaybackState]);

  // 3. Handle Volume & Mute Change
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Save playback state before window closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      savePlaybackState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [savePlaybackState]);

  // Audio element event listeners
  const onTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);

      // Record play event if listened for at least 30 seconds
      if (cur >= 30 && !hasRecordedPlayRef.current && currentTrack) {
        hasRecordedPlayRef.current = true;
        recordPlayEvent(currentTrack.id, Math.round(cur));
      }
    }
  };

  const handleDurationDetected = () => {
    if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      const dur = audioRef.current.duration;
      setDuration(dur);
      
      if (currentTrack && (!currentTrack.duration || currentTrack.duration <= 0)) {
        const roundedSec = Math.round(dur);
        updateTrackDurationInStore(currentTrack.id, roundedSec);
        if (typeof window !== 'undefined' && window.api?.updateTrackDuration) {
          window.api.updateTrackDuration(currentTrack.id, roundedSec);
        }
      }
    }
  };

  const onEnded = () => {
    // Record play event upon track completion if not recorded yet
    if (!hasRecordedPlayRef.current && currentTrack && audioRef.current) {
      hasRecordedPlayRef.current = true;
      recordPlayEvent(currentTrack.id, Math.round(audioRef.current.currentTime));
    }

    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        safePlay();
      }
    } else {
      handleNext();
    }
  };

  const onError = () => {
    if (audioRef.current?.error) {
      const msg = audioRef.current.error.message || `Media error code ${audioRef.current.error.code}`;
      console.error('[AudioEngine Error]', msg, audioRef.current.src);
      setAudioError(msg);
      setIsPlaying(false);
    }
  };

  // Expose an audio seek handler through custom event
  useEffect(() => {
    const handleSeekEvent = (e: CustomEvent<{ time: number }>) => {
      if (audioRef.current) {
        audioRef.current.currentTime = e.detail.time;
      }
    };
    window.addEventListener('audio-seek', handleSeekEvent as EventListener);
    return () => window.removeEventListener('audio-seek', handleSeekEvent as EventListener);
  }, []);

  return (
    <audio
      ref={audioRef}
      preload="auto"
      onTimeUpdate={onTimeUpdate}
      onLoadedMetadata={handleDurationDetected}
      onDurationChange={handleDurationDetected}
      onCanPlay={() => {
        if (isPlaying && audioRef.current?.paused) {
          safePlay();
        }
      }}
      onEnded={onEnded}
      onError={onError}
    />
  );
}

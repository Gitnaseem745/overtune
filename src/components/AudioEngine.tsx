'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl } from '../lib/utils';

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadedTrackIdRef = useRef<number | null>(null);

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
  const refreshLibrary = usePlayerStore((s) => s.refreshLibrary);
  const updateTrackDurationInStore = usePlayerStore((s) => s.updateTrackDurationInStore);

  // Initial load of library + real-time IPC watcher listener
  useEffect(() => {
    refreshLibrary();

    if (typeof window !== 'undefined' && window.api?.onLibraryUpdated) {
      const cleanup = window.api.onLibraryUpdated(() => {
        refreshLibrary();
      });
      return cleanup;
    }
  }, [refreshLibrary]);

  // Safe play helper to prevent unhandled AbortErrors from interruptions
  const safePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setAudioError(null);
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // AbortError is normal when switching tracks or pausing before load completes
        if (err.name === 'AbortError' || err.message?.includes('interrupted')) {
          return;
        }
        console.error('[AudioEngine] Play failed:', err);
        setAudioError(`Playback error: ${err.message}`);
        setIsPlaying(false);
      });
    }
  };

  // 1. Handle Track Source Change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      // Only reload if the track ID actually changed
      if (loadedTrackIdRef.current !== currentTrack.id) {
        loadedTrackIdRef.current = currentTrack.id;
        setAudioError(null);

        const url = getLocalUrl(currentTrack.path);
        audio.src = url;
        audio.load();

        if (isPlaying) {
          safePlay();
        }
      }
    } else {
      loadedTrackIdRef.current = null;
      audio.removeAttribute('src');
      audio.load();
    }
  }, [currentTrack?.id]);

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
      }
    }
  }, [isPlaying]);

  // 3. Handle Volume & Mute Change
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Audio element event listeners
  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
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

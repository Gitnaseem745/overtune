'use client';

import { useEffect, useRef } from 'react';
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
  const refreshLibrary = usePlayerStore((s) => s.refreshLibrary);
  const updateTrackDurationInStore = usePlayerStore((s) => s.updateTrackDurationInStore);
  const recordPlayEvent = usePlayerStore((s) => s.recordPlayEvent);
  const savePlaybackState = usePlayerStore((s) => s.savePlaybackState);
  const restorePlaybackState = usePlayerStore((s) => s.restorePlaybackState);
  const loadRatingsAndTags = usePlayerStore((s) => s.loadRatingsAndTags);
  const loadSmartPlaylists = usePlayerStore((s) => s.loadSmartPlaylists);
  const loadMixes = usePlayerStore((s) => s.loadMixes);

  // Initial load of library, ratings, mixes, and playback state restore
  useEffect(() => {
    const init = async () => {
      await refreshLibrary();
      await Promise.all([
        loadRatingsAndTags(),
        loadSmartPlaylists(),
        loadMixes(),
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
  }, [refreshLibrary, loadRatingsAndTags, loadSmartPlaylists, loadMixes, restorePlaybackState]);

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
      }
    } else {
      loadedTrackIdRef.current = null;
      hasRecordedPlayRef.current = false;
      audio.removeAttribute('src');
      audio.load();
    }
  }, [currentTrack, isPlaying, savePlaybackState]);

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
  }, [isPlaying, currentTrack, savePlaybackState]);

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

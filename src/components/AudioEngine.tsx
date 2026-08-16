'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl } from '../lib/utils';

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Handle Track Source change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      const url = getLocalUrl(currentTrack.path);
      if (audio.src !== url) {
        audio.src = url;
        audio.load();
        
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          if (isPlaying) {
            audio.play().catch((err) => {
              console.error('[AudioEngine] Play rejected:', err);
              setAudioError(`Playback error: ${err.message}`);
              setIsPlaying(false);
            });
          }
        };

        audio.addEventListener('canplay', onCanPlay);
      }
    } else {
      audio.removeAttribute('src');
    }
  }, [currentTrack]);

  // Handle Play/Pause state change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      if (audio.paused) {
        audio.play().catch((err) => {
          console.error('[AudioEngine] Play failed:', err);
          setAudioError(`Playback failed: ${err.message}`);
          setIsPlaying(false);
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  // Handle Volume & Mute change
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  const updateTrackDurationInStore = usePlayerStore((s) => s.updateTrackDurationInStore);

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

  const onLoadedMetadata = () => {
    handleDurationDetected();
  };

  const onDurationChange = () => {
    handleDurationDetected();
  };

  const onEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    } else {
      handleNext();
    }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  const onError = () => {
    if (audioRef.current?.error) {
      const msg = audioRef.current.error.message || `Media error code ${audioRef.current.error.code}`;
      console.error('[AudioEngine Error]', msg, audioRef.current.src);
      setAudioError(msg);
      setIsPlaying(false);
    }
  };

  // Expose an audio seek handler through custom event if needed
  useEffect(() => {
    const handleSeekEvent = (e: CustomEvent<{ time: number }>) => {
      if (audioRef.current) {
        audioRef.current.currentTime = e.detail.time;
      }
    };
    window.addEventListener('audio-seek' as any, handleSeekEvent);
    return () => window.removeEventListener('audio-seek' as any, handleSeekEvent);
  }, []);

  return (
    <audio
      ref={audioRef}
      preload="auto"
      onTimeUpdate={onTimeUpdate}
      onLoadedMetadata={onLoadedMetadata}
      onDurationChange={onDurationChange}
      onEnded={onEnded}
      onPlay={onPlay}
      onPause={onPause}
      onError={onError}
    />
  );
}

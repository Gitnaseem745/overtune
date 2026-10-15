/**
 * Overtone iOS — Now Playing Screen
 *
 * Dedicated player screen using the Sleek design system:
 * curved vinyl-inspired vinyl/artwork, radial volume control,
 * amber accents, lyrics modal, queue management, and playlist actions.
 */

import React, { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { SleekPlayerScreen } from '../src/components/sleek/SleekPlayerScreen';

export default function NowPlayingScreen() {
  const router = useRouter();
  const setNowPlayingOpen = usePlayerStore((s) => s.setNowPlayingOpen);

  useEffect(() => {
    setNowPlayingOpen(true);
    return () => {
      setNowPlayingOpen(false);
    };
  }, [setNowPlayingOpen]);

  const handleDismiss = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    try {
      // @ts-ignore
      if (typeof router.dismiss === 'function' && router.canDismiss?.()) {
        // @ts-ignore
        router.dismiss();
        return;
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      try {
        router.back();
      } catch {
        router.replace('/(tabs)');
      }
    }
  };

  return <SleekPlayerScreen onDismiss={handleDismiss} />;
}

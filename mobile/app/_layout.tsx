/**
 * Overtone iOS — Root Layout
 *
 * App-wide provider tree: Safe Area, Database initialization,
 * Audio session setup, and Expo Router stack configuration.
 */

import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useDatabase } from '../src/hooks/useDatabase';
import { useTheme } from '../src/hooks/useTheme';
import { AudioService } from '../src/services/audio/AudioService';
import { usePlayerStore } from '../src/store/usePlayerStore';

export default function RootLayout() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const { colors, isDark } = useTheme();
  const updatePlaybackStatus = usePlayerStore((s) => s.updatePlaybackStatus);
  const handleTrackEnded = usePlayerStore((s) => s.handleTrackEnded);

  useEffect(() => {
    // Configure audio session and event listeners
    AudioService.configureAudioSession();
    AudioService.setEventHandlers({
      onPlaybackStatusUpdate: (status) => {
        updatePlaybackStatus(
          status.currentTime,
          status.duration,
          status.isPlaying,
          status.isBuffering
        );
      },
      onTrackEnded: () => {
        handleTrackEnded();
      },
      onError: (err) => {
        console.warn('[AudioService Error]:', err);
      },
    });

    // Handle deep links from iOS Home Screen Widgets & Dynamic Island
    const handleDeepLink = (event: { url: string }) => {
      try {
        const parsed = Linking.parse(event.url);
        const action = (parsed.path || parsed.hostname || '').toLowerCase();
        if (action === 'play' || action === 'pause' || action === 'toggle') {
          usePlayerStore.getState().togglePlayPause();
        } else if (action === 'next') {
          usePlayerStore.getState().next();
        } else if (action === 'prev' || action === 'previous') {
          usePlayerStore.getState().previous();
        } else if (action === 'now-playing') {
          router.push('/now-playing');
        }
      } catch (err) {
        console.warn('[Widget DeepLink Error]:', err);
      }
    };

    const linkSub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      linkSub.remove();
      AudioService.teardown();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="now-playing"
          options={{
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="album/[id]"
          options={{
            title: 'Album',
            headerBackTitle: 'Library',
          }}
        />
        <Stack.Screen
          name="artist/[id]"
          options={{
            title: 'Artist',
            headerBackTitle: 'Library',
          }}
        />
        <Stack.Screen
          name="playlist/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sync/pair"
          options={{
            presentation: 'modal',
            title: 'Connect to Desktop',
          }}
        />
        <Stack.Screen
          name="sync/preview"
          options={{
            presentation: 'modal',
            title: 'Review Playlist Transfer',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

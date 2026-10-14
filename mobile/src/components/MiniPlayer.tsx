/**
 * Overtone iOS — Mini Player
 *
 * Compact player above the tab bar. Shows artwork, title/artist,
 * play/pause, and a clear affordance to open Now Playing.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Artwork } from './Artwork';
import { useTheme } from '../hooks/useTheme';
import { usePlayerStore } from '../store/usePlayerStore';
import { spacing, layout, artworkSizes, radii } from '../design/spacing';
import { typography } from '../design/typography';
import { useRouter } from 'expo-router';

export function MiniPlayer() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    isMiniPlayerVisible,
    isNowPlayingOpen,
    togglePlayPause,
    currentTime,
    duration,
  } = usePlayerStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!isMiniPlayerVisible || !currentTrack || isNowPlayingOpen) return null;

  const progress = duration > 0 ? currentTime / duration : 0;

  const handleOpen = () => {
    router.push('/now-playing');
  };

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePlayPause();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: colors.miniPlayer,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>

      <Pressable
        onPress={handleOpen}
        style={styles.content}
        accessibilityRole="button"
        accessibilityLabel={`Now playing: ${currentTrack.title}. Tap to expand.`}
      >
        <Artwork
          uri={currentTrack.artworkUri}
          size={artworkSizes.miniPlayer}
          borderRadius={radii.sm}
        />

        <View style={styles.info}>
          <Text
            style={[typography.subheadline, styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {currentTrack.title}
          </Text>
          <Text
            style={[typography.caption1, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {currentTrack.artistId ? `Artist` : 'Unknown Artist'}
          </Text>
        </View>

        <Pressable
          onPress={(e: any) => {
            e?.stopPropagation?.();
            handlePlayPause();
          }}
          hitSlop={12}
          style={styles.playButton}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <Text style={[styles.playIcon, { color: colors.textPrimary }]}>
            {isPlaying ? '⏸' : '▶️'}
          </Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: layout.tabBarHeight,
    left: 0,
    right: 0,
    height: layout.miniPlayerHeight,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontWeight: '600',
  },
  playButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 22,
  },
});

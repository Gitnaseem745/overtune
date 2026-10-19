/**
 * Overtone iOS — Sleek Mini Player
 *
 * Dark purple-indigo floating pill player matching "Badai Guys"
 * from sleek_theme_main_screen.jpg and sleek_theme_sidebar_screen.jpg.
 */

import React, { useRef, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SleekPlayIcon, SleekPauseIcon, SleekMusicNoteIcon } from './SleekIcons';
import { SleekLiveEqualizer } from './SleekLiveEqualizer';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useDatabase } from '../../hooks/useDatabase';
import { sleekTokens } from '../../design/colors';

interface SleekMiniPlayerProps {
  fallbackTitle?: string;
  fallbackArtist?: string;
}

export const SleekMiniPlayer = memo(function SleekMiniPlayer({
  fallbackTitle = 'No Track Playing',
  fallbackArtist = 'Select music to play',
}: SleekMiniPlayerProps) {
  const router = useRouter();
  const db = useDatabase();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const isNowPlayingOpen = usePlayerStore((s) => s.isNowPlayingOpen);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (isNowPlayingOpen) return null;

  const title = currentTrack?.title || fallbackTitle;
  // Resolve artist name: try DB lookup first, then fall back to track object fields
  const artist = useMemo(() => {
    if (!currentTrack) return fallbackArtist;
    // Try DB lookup by artistId
    if (currentTrack.artistId && db.isReady) {
      const dbName = db.artists.getNameById(currentTrack.artistId);
      if (dbName && dbName !== 'Unknown Artist') return dbName;
    }
    // Fall back to inline artist fields (common for synced desktop tracks)
    const anyTrack = currentTrack as any;
    return anyTrack.artist || anyTrack.artistName || fallbackArtist;
  }, [currentTrack, db.isReady, fallbackArtist]);

  const handleOpenNowPlaying = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/now-playing');
  };

  const handleTogglePlay = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePlayPause();
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  return (
    <Animated.View style={[styles.outerWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handleOpenNowPlaying}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pillContainer}
        accessibilityRole="button"
        accessibilityLabel={`Now playing ${title} by ${artist}`}
      >
        {/* Squircle Artwork */}
        <View style={styles.artworkContainer}>
          {currentTrack?.artworkUri ? (
            <>
              <Image
                source={{ uri: currentTrack.artworkUri }}
                style={styles.artwork}
                contentFit="cover"
                transition={150}
              />
              {isPlaying && (
                <View style={styles.playingOverlay} pointerEvents="none">
                  <View style={styles.playingOverlayBadge}>
                    <SleekLiveEqualizer isPlaying={true} color="#F9A826" size={14} barWidth={2.2} gap={2} />
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.fallbackArtwork}>
              {isPlaying ? (
                <SleekLiveEqualizer isPlaying={true} color="#D97706" size={18} barWidth={2.6} gap={2.2} />
              ) : (
                <SleekMusicNoteIcon size={20} color="#D97706" />
              )}
            </View>
          )}
        </View>

        {/* Title and Artist */}
        <View style={styles.infoBlock}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.artistText} numberOfLines={1}>
            {artist}
          </Text>
        </View>

        {/* Circular Play / Pause Button */}
        <Pressable
          onPress={handleTogglePlay}
          hitSlop={8}
          style={({ pressed }) => [
            styles.playButton,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <SleekPauseIcon size={14} color={sleekTokens.miniPlayerBtnIcon} />
          ) : (
            <SleekPlayIcon size={14} color={sleekTokens.miniPlayerBtnIcon} />
          )}
        </Pressable>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#1A1206',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  pillContainer: {
    height: 64,
    borderRadius: 28,
    backgroundColor: sleekTokens.miniPlayerBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  artworkContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FEF3C7',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  fallbackArtwork: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingOverlayBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 17, 8, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    color: sleekTokens.miniPlayerText,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  artistText: {
    color: sleekTokens.miniPlayerSub,
    fontSize: 12,
    fontWeight: '400',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: sleekTokens.miniPlayerBtn,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});

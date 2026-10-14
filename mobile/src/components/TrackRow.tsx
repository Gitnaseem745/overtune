/**
 * Overtone iOS — Track Row Component
 *
 * Reusable list item for songs with artwork, title, artist, duration,
 * and contextual actions.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Artwork } from './Artwork';
import { useTheme } from '../hooks/useTheme';
import { usePlayerStore } from '../store/usePlayerStore';
import { spacing, artworkSizes, MIN_TOUCH_TARGET } from '../design/spacing';
import { typography } from '../design/typography';
import { formatDuration } from '../services/files/FileImportService';
import type { MobileTrack } from '../domain/models';

interface TrackRowProps {
  track: MobileTrack;
  index?: number;
  showIndex?: boolean;
  isPlaying?: boolean;
  isFavorite?: boolean;
  onPress: (track: MobileTrack) => void;
  onLongPress?: (track: MobileTrack) => void;
  getArtistName?: (id: number | null) => string;
}

export function TrackRow({
  track,
  index,
  showIndex,
  isPlaying,
  isFavorite,
  onPress,
  onLongPress,
  getArtistName,
}: TrackRowProps) {
  const { colors } = useTheme();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const activeDuration = usePlayerStore((s) => s.duration);
  const artistName = getArtistName?.(track.artistId) ?? 'Unknown Artist';

  const effectiveDur =
    track.duration > 0
      ? track.duration
      : currentTrack?.id === track.id && (currentTrack.duration || activeDuration) > 0
      ? currentTrack.duration || activeDuration
      : 0;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(track);
  };

  return (
    <Pressable
      onPress={() => onPress(track)}
      onLongPress={handleLongPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.surfaceOverlay : 'transparent',
          minHeight: MIN_TOUCH_TARGET,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} by ${artistName}`}
      accessibilityState={{ selected: isPlaying }}
    >
      {showIndex && index !== undefined && (
        <Text style={[styles.index, { color: isPlaying ? colors.accent : colors.textTertiary }]}>
          {isPlaying ? '▶' : index + 1}
        </Text>
      )}

      <Artwork uri={track.artworkUri} size={artworkSizes.listRow} borderRadius={6} />

      <View style={styles.info}>
        <Text
          style={[
            typography.body,
            styles.title,
            { color: isPlaying ? colors.accent : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text
          style={[typography.subheadline, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {artistName}
        </Text>
      </View>

      <View style={styles.trailing}>
        {isFavorite && (
          <Text style={[styles.heartIcon, { color: colors.accent }]}>♥</Text>
        )}
        {effectiveDur > 0 && (
          <Text style={[typography.caption1, { color: colors.textTertiary }]}>
            {formatDuration(effectiveDur)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  index: {
    width: 28,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '500',
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  heartIcon: {
    fontSize: 12,
  },
});

/**
 * Overtone iOS — Album Card
 *
 * Grid item for album display with artwork and metadata.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Artwork } from './Artwork';
import { useTheme } from '../hooks/useTheme';
import { spacing, radii } from '../design/spacing';
import { typography } from '../design/typography';
import type { MobileAlbum } from '../domain/models';

interface AlbumCardProps {
  album: MobileAlbum;
  onPress: (album: MobileAlbum) => void;
  columns?: number;
}

export function AlbumCard({ album, onPress, columns = 2 }: AlbumCardProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.lg * (columns + 1)) / columns;

  return (
    <Pressable
      onPress={() => onPress(album)}
      style={({ pressed }: { pressed: boolean }) => [
        styles.container,
        { width: cardWidth, opacity: pressed ? 0.8 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${album.title} by ${album.artistName || 'Unknown Artist'}`}
    >
      <Artwork uri={album.artworkUri} size={cardWidth} borderRadius={radii.md} />
      <View style={styles.info}>
        <Text
          style={[typography.subheadline, { color: colors.textPrimary, fontWeight: '500' }]}
          numberOfLines={1}
        >
          {album.title}
        </Text>
        <Text
          style={[typography.caption1, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {album.artistName || 'Unknown Artist'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  info: {
    paddingHorizontal: 2,
    gap: 1,
  },
});

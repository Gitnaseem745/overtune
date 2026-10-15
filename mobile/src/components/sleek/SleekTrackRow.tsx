/**
 * Overtone iOS — Sleek Track Row
 *
 * Clean track row with squircle artwork matching "Balonku Ada 5 Meter"
 * and "Analog" from sleek_theme_main_screen.jpg and sleek_theme_sidebar_screen.jpg.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { SleekMoreIcon, SleekMusicNoteIcon } from './SleekIcons';
import { sleekTokens } from '../../design/colors';
import { formatDuration } from '../../services/files/FileImportService';

interface SleekTrackRowProps {
  title: string;
  artistSubtitle: string;
  duration?: number;
  imageSource?: any;
  artworkUri?: string | null;
  isPlaying?: boolean;
  onPress: () => void;
  onMorePress?: () => void;
}

export function SleekTrackRow({
  title,
  artistSubtitle,
  duration,
  imageSource,
  artworkUri,
  isPlaying,
  onPress,
  onMorePress,
}: SleekTrackRowProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const handleMore = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMorePress?.();
  };

  const source = imageSource || (artworkUri ? { uri: artworkUri } : null);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? 'rgba(249, 168, 38, 0.08)' : 'transparent' },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title} by ${artistSubtitle}`}
    >
      {/* Squircle Artwork */}
      <View style={styles.artworkContainer}>
        {source ? (
          <Image source={source} style={styles.artwork} contentFit="cover" transition={150} />
        ) : (
          <View style={styles.fallbackArtwork}>
            <SleekMusicNoteIcon size={22} color="#D97706" />
          </View>
        )}
      </View>

      {/* Info Block */}
      <View style={styles.infoBlock}>
        <Text
          style={[
            styles.titleText,
            { color: isPlaying ? '#F9A826' : sleekTokens.textPrimary },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={styles.subtitleText} numberOfLines={1}>
          {artistSubtitle}
        </Text>
      </View>

      {/* Track Duration */}
      {duration !== undefined && duration > 0 && (
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>
      )}

      {/* 3-Dot More Action */}
      <Pressable
        onPress={handleMore}
        hitSlop={12}
        style={styles.moreButton}
        accessibilityRole="button"
        accessibilityLabel="More options"
      >
        <SleekMoreIcon size={18} color="#A89F91" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  artworkContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FEF3C7',
    marginRight: 14,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  fallbackArtwork: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    color: '#D97706',
    fontSize: 20,
  },
  infoBlock: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.15,
    marginBottom: 3,
  },
  subtitleText: {
    color: sleekTokens.seeMoreText,
    fontSize: 12.5,
    fontWeight: '400',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: sleekTokens.seeMoreText,
    marginRight: 8,
  },
  moreButton: {
    padding: 6,
  },
});

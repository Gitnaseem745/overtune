/**
 * Overtone iOS — Artwork Component
 *
 * Displays album art with graceful fallback for missing artwork.
 * Uses expo-image for efficient rendering.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../hooks/useTheme';
import { radii } from '../design/spacing';
import { typography } from '../design/typography';

import { SleekMusicNoteIcon } from './sleek/SleekIcons';

interface ArtworkProps {
  uri: string | null | undefined;
  size: number;
  borderRadius?: number;
  fallbackIcon?: string;
}

export function Artwork({ uri, size, borderRadius = radii.md, fallbackIcon }: ArtworkProps) {
  const { colors } = useTheme();

  if (!uri) {
    return (
      <View
        style={[
          styles.fallback,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: '#1C1917',
            borderWidth: 1,
            borderColor: 'rgba(245, 158, 11, 0.2)',
          },
        ]}
      >
        {fallbackIcon && fallbackIcon !== '♫' ? (
          <Text
            style={[
              styles.fallbackIcon,
              { color: colors.textTertiary, fontSize: size * 0.35 },
            ]}
          >
            {fallbackIcon}
          </Text>
        ) : (
          <SleekMusicNoteIcon
            size={Math.max(14, Math.round(size * 0.44))}
            color="#D97706"
          />
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius }}
      contentFit="cover"
      transition={150}
      recyclingKey={uri}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    opacity: 0.5,
  },
});

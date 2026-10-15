/**
 * Overtone iOS — Sleek Empty State
 *
 * Luxury, Apple Music-grade empty state with amber ambient aura,
 * custom vector iconography, generous breathing room, and spring micro-interactions.
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  SleekHeartIcon,
  SleekPlaylistsIcon,
  SleekSearchIcon,
  SleekMusicNoteIcon,
  SleekImportIcon,
} from './SleekIcons';

export type SleekEmptyIconType = 'heart' | 'playlists' | 'search' | 'music' | 'import';

interface SleekEmptyStateProps {
  iconType: SleekEmptyIconType;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function SleekEmptyState({
  iconType,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: SleekEmptyStateProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 24,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePrimaryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAction?.();
  };

  const renderIcon = () => {
    switch (iconType) {
      case 'heart':
        return <SleekHeartIcon size={34} color="#F9A826" filled />;
      case 'playlists':
        return <SleekPlaylistsIcon size={34} color="#F9A826" />;
      case 'search':
        return <SleekSearchIcon size={34} color="#F9A826" />;
      case 'import':
        return <SleekImportIcon size={34} color="#F9A826" />;
      case 'music':
      default:
        return <SleekMusicNoteIcon size={34} color="#F9A826" />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Ambient Glow Badge */}
      <View style={styles.badgeWrapper}>
        <View style={styles.badgeGlow} />
        <View style={styles.badgeSquircle}>
          {renderIcon()}
        </View>
      </View>

      {/* Typography with generous white space */}
      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.subtitleText}>{subtitle}</Text>

      {/* Actions */}
      {actionLabel && onAction && (
        <Animated.View style={[styles.actionWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <Pressable
            onPress={handlePrimaryPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={styles.primaryButtonText}>{actionLabel}</Text>
          </Pressable>
        </Animated.View>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSecondaryAction();
          }}
          style={styles.secondaryButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={secondaryActionLabel}
        >
          <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 28,
    marginVertical: 14,
    backgroundColor: '#FFFDF5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  badgeWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  badgeGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 168, 38, 0.20)',
    transform: [{ scale: 1.15 }],
  },
  badgeSquircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1F180B',
    letterSpacing: 0.2,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#786C5A',
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: 24,
  },
  actionWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#F9A826',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 18,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#968D7B',
    fontWeight: '600',
    fontSize: 13,
  },
});

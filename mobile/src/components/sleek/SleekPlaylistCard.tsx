/**
 * Overtone iOS — Sleek Playlist Card
 *
 * Horizontal playlist card matching "Musik Pagi" and "Musik Anu"
 * from sleek_theme_main_screen.jpg and sleek_theme_sidebar_screen.jpg.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { SleekPlayIcon, SleekPlaylistsIcon } from './SleekIcons';
import { sleekTokens } from '../../design/colors';

interface SleekPlaylistCardProps {
  title: string;
  trackCount: number;
  imageSource?: any;
  artworkUri?: string | null;
  onPress: () => void;
  onPlayPress?: () => void;
}

export function SleekPlaylistCard({
  title,
  trackCount,
  imageSource,
  artworkUri,
  onPress,
  onPlayPress,
}: SleekPlaylistCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const handlePlay = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPlayPress) {
      onPlayPress();
    } else {
      onPress();
    }
  };

  const source = imageSource || (artworkUri ? { uri: artworkUri } : null);

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardContainer}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${trackCount} tracks`}
      >
        {/* Background Artwork or Warm Amber Procedural Icon */}
        {source ? (
          <Image
            source={source}
            style={styles.artwork}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={styles.proceduralArtwork}>
            <View style={styles.proceduralIconCircle}>
              <SleekPlaylistsIcon size={32} color="#D97706" />
            </View>
          </View>
        )}

        {/* Ambient Bottom Frosted Pill */}
        <View style={styles.bottomPill}>
          <View style={styles.textContainer}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.tracksText}>
              {trackCount === 1 ? '1 Track' : `${trackCount} Tracks`}
            </Text>
          </View>

          {/* Circular Play Button */}
          <Pressable
            onPress={handlePlay}
            hitSlop={6}
            style={({ pressed }) => [
              styles.playButton,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Play ${title}`}
          >
            <SleekPlayIcon size={14} color={sleekTokens.playPillIcon} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: 156,
    height: 148,
    borderRadius: 24,
    marginRight: 14,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  cardContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2A1C0A',
  },
  artwork: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  proceduralArtwork: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 42,
  },
  proceduralIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 18, 8, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tracksText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: sleekTokens.playPillBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2, // optical center for play triangle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

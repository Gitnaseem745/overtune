/**
 * Overtone iOS — Sleek Watery Download Button
 *
 * A Spotify-inspired download control featuring:
 * 1. Inside download button: displays 'total_downloaded/total_songs' numbers instead of 'downloading' text
 * 2. Animated yellow-amber watery wave fill animation that advances smoothly from left to right as songs are downloaded
 * 3. Continuous dual-frequency sinusoidal wave crests creating an organic liquid sloshing effect
 * 4. Haptic feedback on tap and completion
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { SleekImportIcon, SleekDownloadedIcon } from './SleekIcons';

interface SleekWateryDownloadButtonProps {
  isDownloading: boolean;
  downloadedCount: number;
  totalCount: number;
  streamTracksCount: number;
  onPress: () => void;
  disabled?: boolean;
}

export function SleekWateryDownloadButton({
  isDownloading,
  downloadedCount,
  totalCount,
  streamTracksCount,
  onPress,
  disabled = false,
}: SleekWateryDownloadButtonProps) {
  // Wave horizontal translation animations (dual waves for organic water slosh)
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  // Liquid fill width progress (0 -> 1)
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Subtle bobbing for download arrow while active
  const bobAnim = useRef(new Animated.Value(0)).current;

  // 1. Loop wave translations when downloading
  useEffect(() => {
    let loop1: Animated.CompositeAnimation | null = null;
    let loop2: Animated.CompositeAnimation | null = null;
    let bobLoop: Animated.CompositeAnimation | null = null;

    if (isDownloading) {
      loop1 = Animated.loop(
        Animated.timing(waveAnim1, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop2 = Animated.loop(
        Animated.timing(waveAnim2, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      bobLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bobAnim, {
            toValue: -2,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bobAnim, {
            toValue: 2,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

      loop1.start();
      loop2.start();
      bobLoop.start();
    } else {
      waveAnim1.setValue(0);
      waveAnim2.setValue(0);
      bobAnim.setValue(0);
    }

    return () => {
      loop1?.stop();
      loop2?.stop();
      bobLoop?.stop();
    };
  }, [isDownloading]);

  // 2. Animate fill width from left to right as downloadedCount increases
  useEffect(() => {
    if (isDownloading && totalCount > 0) {
      const target = Math.min(downloadedCount / totalCount, 1);
      Animated.timing(progressAnim, {
        toValue: target,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else if (!isDownloading) {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isDownloading, downloadedCount, totalCount]);

  const handlePress = () => {
    if (disabled || isDownloading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  // Interpolate 60px wave cycle
  const waveTranslate1 = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60],
  });
  const waveTranslate2 = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 0],
  });

  const fillWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // All tracks already downloaded state
  const isAllDownloaded = streamTracksCount === 0 && !isDownloading;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isDownloading || isAllDownloaded}
      style={({ pressed }) => [
        styles.container,
        pressed && !isDownloading && !isAllDownloaded && styles.containerPressed,
        isAllDownloaded && styles.containerCompleted,
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        isDownloading
          ? `Downloading ${downloadedCount} of ${totalCount} songs`
          : isAllDownloaded
          ? 'All songs downloaded for offline listening'
          : `Download ${streamTracksCount} songs for offline listening`
      }
    >
      {/* ── Watery Liquid Fill (advances from left to right) ──────────────── */}
      {isDownloading && (
        <Animated.View style={[styles.liquidWrapper, { width: fillWidth }]}>
          <View style={styles.liquidBase}>
            {/* Deep Amber Back Wave */}
            <Animated.View
              style={[
                styles.waveContainer,
                { transform: [{ translateX: waveTranslate1 }] },
              ]}
            >
              <Svg width={360} height={42} viewBox="0 0 360 42">
                <Path
                  d="M 0 6 Q 15 1, 30 6 T 60 6 Q 75 1, 90 6 T 120 6 Q 135 1, 150 6 T 180 6 Q 195 1, 210 6 T 240 6 Q 255 1, 270 6 T 300 6 Q 315 1, 330 6 T 360 6 L 360 42 L 0 42 Z"
                  fill="rgba(217, 119, 6, 0.42)"
                />
              </Svg>
            </Animated.View>

            {/* Honey Amber Front Wave */}
            <Animated.View
              style={[
                styles.waveContainer,
                { transform: [{ translateX: waveTranslate2 }] },
              ]}
            >
              <Svg width={360} height={42} viewBox="0 0 360 42">
                <Path
                  d="M 0 8 Q 15 13, 30 8 T 60 8 Q 75 13, 90 8 T 120 8 Q 135 13, 150 8 T 180 8 Q 195 13, 210 8 T 240 8 Q 255 13, 270 8 T 300 8 Q 315 13, 330 8 T 360 8 L 360 42 L 0 42 Z"
                  fill="rgba(251, 191, 36, 0.85)"
                />
              </Svg>
            </Animated.View>

            {/* Glowing Amber Liquid Base */}
            <View style={styles.liquidUnderlay} />
          </View>
        </Animated.View>
      )}

      {/* ── Content Row (Foreground text and icons) ────────────────────────── */}
      <View style={styles.contentRow} pointerEvents="none">
        {isDownloading ? (
          <>
            <Animated.View style={{ transform: [{ translateY: bobAnim }] }}>
              <SleekImportIcon size={14} color="#78350F" />
            </Animated.View>
            <Text style={styles.numbersText}>
              {downloadedCount}/{totalCount}
            </Text>
          </>
        ) : isAllDownloaded ? (
          <>
            <SleekDownloadedIcon size={13} color="#FFFFFF" fill="#D97706" />
            <Text style={styles.downloadedText}>Downloaded</Text>
          </>
        ) : (
          <>
            <SleekImportIcon size={14} color="#D97706" />
            <Text style={styles.readyText}>Download ({streamTracksCount})</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    minWidth: 124,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },
  containerCompleted: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  liquidWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  liquidBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F59E0B',
    overflow: 'hidden',
  },
  liquidUnderlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 30,
    backgroundColor: '#F59E0B',
  },
  waveContainer: {
    position: 'absolute',
    left: 0,
    top: -2,
    width: 360,
    height: 42,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  numbersText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.4,
  },
  readyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.1,
  },
  downloadedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.1,
  },
});

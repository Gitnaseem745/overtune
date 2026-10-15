/**
 * Overtone iOS — Sleek Live Equalizer Component
 *
 * Micro-animated 3-bar sound equalizer visualizer that dances
 * when audio is playing and rests cleanly when paused.
 * Powered by native driver scaleY animations for maximum performance.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export interface SleekLiveEqualizerProps {
  isPlaying?: boolean;
  color?: string;
  size?: number; // Total height in pt (default: 14)
  barWidth?: number; // Width of each bar (default: 2.2)
  gap?: number; // Gap between bars (default: 2)
  minScale?: number; // Resting height scale when paused (default: 0.3)
}

export function SleekLiveEqualizer({
  isPlaying = true,
  color = '#F9A826',
  size = 14,
  barWidth = 2.2,
  gap = 2,
  minScale = 0.3,
}: SleekLiveEqualizerProps) {
  const bar1 = useRef(new Animated.Value(minScale)).current;
  const bar2 = useRef(new Animated.Value(0.8)).current;
  const bar3 = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    if (!isPlaying) {
      Animated.parallel([
        Animated.timing(bar1, { toValue: minScale, duration: 250, useNativeDriver: true }),
        Animated.timing(bar2, { toValue: minScale * 1.4, duration: 250, useNativeDriver: true }),
        Animated.timing(bar3, { toValue: minScale, duration: 250, useNativeDriver: true }),
      ]).start();
      return;
    }

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar1, { toValue: 1.0, duration: 300, useNativeDriver: true }),
        Animated.timing(bar1, { toValue: 0.25, duration: 380, useNativeDriver: true }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar2, { toValue: 0.35, duration: 260, useNativeDriver: true }),
        Animated.timing(bar2, { toValue: 1.0, duration: 340, useNativeDriver: true }),
      ])
    );

    const loop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar3, { toValue: 0.9, duration: 360, useNativeDriver: true }),
        Animated.timing(bar3, { toValue: 0.2, duration: 280, useNativeDriver: true }),
      ])
    );

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [isPlaying, bar1, bar2, bar3, minScale]);

  return (
    <View style={[styles.container, { height: size, gap }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: size,
            borderRadius: barWidth / 2,
            backgroundColor: color,
            transform: [{ scaleY: bar1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: size,
            borderRadius: barWidth / 2,
            backgroundColor: color,
            transform: [{ scaleY: bar2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: size,
            borderRadius: barWidth / 2,
            backgroundColor: color,
            transform: [{ scaleY: bar3 }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    transformOrigin: 'bottom',
  },
});

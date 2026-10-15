/**
 * Overtone iOS — Sleek Header
 *
 * Vivid purple-violet gradient header matching sleek_theme_main_screen.jpg.
 * Contains the hamburger menu toggle, glowing bokeh dots,
 * greeting "Good Morning!", name "USER", and search button.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SleekMenuIcon, SleekSearchIcon } from './SleekIcons';
import { useDrawerStore } from '../../store/useDrawerStore';
import { sleekTokens } from '../../design/colors';

export function getDynamicGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning!';
  if (hour >= 12 && hour < 17) return 'Good Afternoon!';
  return 'Good Evening!';
}

interface SleekHeaderProps {
  greeting?: string;
  name?: string;
  onSearchPress?: () => void;
}

export function SleekHeader({
  greeting = getDynamicGreeting(),
  name = 'USER',
  onSearchPress,
}: SleekHeaderProps) {
  const router = useRouter();
  const { toggleDrawer, setActiveTab } = useDrawerStore();

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleDrawer();
  };

  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onSearchPress) {
      onSearchPress();
    } else {
      setActiveTab('search');
    }
  };

  return (
    <View style={styles.container}>
      {/* Unified Solid Header Background - Single rich violet shade, no two-color split */}
      <View style={styles.solidBg} />

      {/* Top Left Corner Smooth Glow */}
      <View style={styles.topLeftGlow} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 240 220">
          <Defs>
            <RadialGradient
              id="headerTopLeftGlow"
              cx="0%"
              cy="0%"
              r="100%"
              fx="0%"
              fy="0%"
            >
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <Stop offset="30%" stopColor="#FEF3C7" stopOpacity="0.30" />
              <Stop offset="65%" stopColor="#FDE68A" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="240" height="220" fill="url(#headerTopLeftGlow)" />
        </Svg>
      </View>

      {/* Floating Bokeh / Dots */}
      <View style={styles.bokeh1} />
      <View style={styles.bokeh2} />
      <View style={styles.bokeh3} />
      <View style={styles.bokeh4} />

      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleMenuPress}
          hitSlop={12}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Open sidebar menu"
        >
          <SleekMenuIcon size={24} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={handleSearch}
          hitSlop={12}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <SleekSearchIcon size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Greeting and User / Tab Name in Center */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>{greeting}</Text>
        <Text style={styles.nameText}>{name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    paddingTop: 52,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  solidBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: sleekTokens.headerGradientStart,
  },
  topLeftGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 220,
    zIndex: 1,
  },
  bokeh1: {
    position: 'absolute',
    top: 35,
    right: 70,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  bokeh2: {
    position: 'absolute',
    top: 80,
    left: 45,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bokeh3: {
    position: 'absolute',
    top: 110,
    right: 35,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  bokeh4: {
    position: 'absolute',
    top: 45,
    left: '48%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 38,
    zIndex: 2,
  },
  iconButton: {
    padding: 6,
  },
  greetingSection: {
    alignItems: 'center',
    marginTop: 12,
    zIndex: 2,
  },
  greetingText: {
    color: sleekTokens.headerSubtext,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  nameText: {
    color: sleekTokens.headerText,
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

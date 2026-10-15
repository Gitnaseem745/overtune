/**
 * Overtone iOS — Sleek 3D Drawer Layout Container
 *
 * Implements the signature 3D tilted multi-layer perspective card stack
 * from sleek_theme_sidebar_screen.jpg.
 *
 * Stacking:
 * 1. Base Layer: SleekDrawer (underneath on the left)
 * 2. 3D Card Stack:
 *    - Card 3: Deepest layer (scale 0.76, translateX ~135, rotate 11.5deg)
 *    - Card 2: Middle layer (scale 0.82, translateX ~175, rotate 9.4deg)
 *    - Card 1: Foremost layer (scale 0.88, translateX ~215, rotate 7.2deg, borderRadius 36px)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Pressable,
  PanResponder,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SleekDrawer } from './SleekDrawer';
import { useDrawerStore, type SleekNavTab } from '../../store/useDrawerStore';
import { sleekTokens } from '../../design/colors';

interface SleekDrawerLayoutProps {
  children: React.ReactNode;
  userName?: string;
  onSelectTab?: (tab: SleekNavTab) => void;
}

export function SleekDrawerLayout({
  children,
  userName = 'USER',
  onSelectTab,
}: SleekDrawerLayoutProps) {
  const { width, height } = useWindowDimensions();
  const { isOpen, closeDrawer, openDrawer, activeTab } = useDrawerStore();
  const isDashboard = activeTab === 'home';

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isOpen ? 1 : 0,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [isOpen, anim]);

  // Handle Pan Gestures for swiping open/close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger on horizontal swipe
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 && isOpen) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          closeDrawer();
        } else if (gestureState.dx > 60 && !isOpen) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          openDrawer();
        }
      },
    })
  ).current;

  // Transforms for Card 1 (Foremost / Live screen)
  const shiftDistance = Math.min(width * 0.58, 230);
  const card1TranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shiftDistance + 10],
  });
  const card1Scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });
  const card1Rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-4.4deg'],
  });

  // Transforms for Card 2 (Single background layer)
  const card2TranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shiftDistance * 0.85],
  });
  const card2Scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.82],
  });
  const card2Rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-12.5deg'],
  });
  const card2TargetOpacity = isDashboard ? 0.62 : 0.80;
  const card2Opacity = anim.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, card2TargetOpacity * 0.65, card2TargetOpacity],
  });

  const handleCardPressToClose = () => {
    if (isOpen) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      closeDrawer();
    }
  };

  return (
    <View style={styles.outerCanvas} {...panResponder.panHandlers}>
      {/* Ambient background decorative glow */}
      <View style={styles.ambientCanvasGlowTopLeft} />
      <View style={styles.ambientCanvasGlowTop} />
      <View style={styles.ambientCanvasGlowBottom} />

      {/* Underneath: The Sleek Drawer */}
      <View style={styles.drawerUnderlay}>
        <SleekDrawer userName={userName} onSelectTab={onSelectTab} />
      </View>

      {/* Exactly Two 3D Perspective Card Layers */}

      {/* Layer 2 (Duplicated Screen Showcase of Active Tab) */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.stackedCard,
          styles.card2,
          {
            width,
            height,
            opacity: card2Opacity,
            transform: [
              { perspective: 1000 },
              { translateX: card2TranslateX },
              { scale: card2Scale },
              { rotateZ: card2Rotate },
            ],
          },
        ]}
      >
        <View style={styles.card2Content} pointerEvents="none">
          {children}
        </View>
        <View
          style={[
            styles.card2DepthOverlay,
            isDashboard && styles.card2DepthOverlayDashboard,
          ]}
          pointerEvents="none"
        />
      </Animated.View>

      {/* Card 1 (Foremost Live Screen) */}
      <Animated.View
        style={[
          styles.card1Container,
          {
            width,
            height,
            borderRadius: isOpen ? sleekTokens.cardBorderRadius : 0,
            transform: [
              { perspective: 1000 },
              { translateX: card1TranslateX },
              { scale: card1Scale },
              { rotateZ: card1Rotate },
            ],
          },
        ]}
      >
        {/* Live app screen content */}
        <View
          style={[
            styles.card1Content,
            { borderRadius: isOpen ? sleekTokens.cardBorderRadius : 0 },
          ]}
        >
          {children}

          {/* Touch-to-close overlay when drawer is open */}
          {isOpen && (
            <Pressable
              onPress={handleCardPressToClose}
              style={styles.closeOverlay}
              accessibilityRole="button"
              accessibilityLabel="Close sidebar menu"
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerCanvas: {
    flex: 1,
    backgroundColor: sleekTokens.ambientCanvasBg,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientCanvasGlowTopLeft: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(251, 191, 36, 0.35)',
  },
  ambientCanvasGlowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(254, 243, 199, 0.7)',
  },
  ambientCanvasGlowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  drawerUnderlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  stackedCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: sleekTokens.cardBorderRadius,
    overflow: 'hidden',
  },
  card2: {
    zIndex: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: sleekTokens.cardBorderRadius,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: -14, height: 16 },
    shadowOpacity: 0.38,
    shadowRadius: 24,
    elevation: 14,
  },
  card2Content: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  card2DepthOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 18, 8, 0.07)',
    borderRadius: sleekTokens.cardBorderRadius,
  },
  card2DepthOverlayDashboard: {
    backgroundColor: 'rgba(243, 232, 206, 0.28)',
  },
  card1Container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: -18, height: 22 },
    shadowOpacity: 0.45,
    shadowRadius: 32,
    elevation: 25,
  },
  card1Content: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  closeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    zIndex: 99,
  },
});

/**
 * Overtone iOS — Sleek Player Screen (Now Playing)
 *
 * Pixel-to-pixel replica of sleek_theme_current_player_screen.jpg
 * with Sleek UI color system (lavender ambient canvas, white card,
 * glowing purple accent, circular volume arc, and working controls).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  PanResponder,
  Share,
  ActionSheetIOS,
  Platform,
  Alert,
  Animated,
  BackHandler,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  SleekPlayIcon,
  SleekPauseIcon,
  SleekHeartIcon,
  SleekSpeakerLowIcon,
  SleekSpeakerHighIcon,
  SleekSkipBackIcon,
  SleekSkipForwardIcon,
  SleekRepeatIcon,
  SleekShareIcon,
  SleekHorizontalMoreIcon,
  SleekChevronDownIcon,
  SleekLyricsIcon,
  SleekQueueIcon,
  SleekMusicNoteIcon,
} from './SleekIcons';
import { SleekLiveEqualizer } from './SleekLiveEqualizer';
import { QueueSheet } from '../QueueSheet';
import { LyricsView } from '../LyricsView';
import { SleekTrackActionSheet } from './SleekTrackActionSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useDatabase } from '../../hooks/useDatabase';
import { sleekTokens } from '../../design/colors';
import { formatDuration } from '../../services/files/FileImportService';

// Mathematically seamless looping cubic bezier wave paths across full header canvas
// Wave 1: Wavelength = 120, Total Width = 720 (6 full waves)
// Translating from 0 to -120 creates an infinite continuous flowing wave
const HEADER_WAVE1_PATH = [
  'M 0 50',
  'C 25 35, 35 35, 60 50',
  'C 85 65, 95 65, 120 50',
  'C 145 35, 155 35, 180 50',
  'C 205 65, 215 65, 240 50',
  'C 265 35, 275 35, 300 50',
  'C 325 65, 335 65, 360 50',
  'C 385 35, 395 35, 420 50',
  'C 445 65, 455 65, 480 50',
  'C 505 35, 515 35, 540 50',
  'C 565 65, 575 65, 600 50',
  'C 625 35, 635 35, 660 50',
  'C 685 65, 695 65, 720 50',
  'L 720 125',
  'L 0 125',
  'Z',
].join(' ');

// Wave 2: Wavelength = 90, Total Width = 720 (8 full waves)
// Translating from -90 to 0 creates an organic counter-flow liquid interference
const HEADER_WAVE2_PATH = [
  'M 0 60',
  'C 18.75 45, 26.25 45, 45 60',
  'C 63.75 75, 71.25 75, 90 60',
  'C 108.75 45, 116.25 45, 135 60',
  'C 153.75 75, 161.25 75, 180 60',
  'C 198.75 45, 206.25 45, 225 60',
  'C 243.75 75, 251.25 75, 270 60',
  'C 288.75 45, 296.25 45, 315 60',
  'C 333.75 75, 341.25 75, 360 60',
  'C 378.75 45, 386.25 45, 405 60',
  'C 423.75 75, 431.25 75, 450 60',
  'C 468.75 45, 476.25 45, 495 60',
  'C 513.75 75, 521.25 75, 540 60',
  'C 558.75 45, 566.25 45, 585 60',
  'C 603.75 75, 611.25 75, 630 60',
  'C 648.75 45, 656.25 45, 675 60',
  'C 693.75 75, 701.25 75, 720 60',
  'L 720 125',
  'L 0 125',
  'Z',
].join(' ');

interface SleekPlayerScreenProps {
  onDismiss?: () => void;
}

export function SleekPlayerScreen({ onDismiss }: SleekPlayerScreenProps = {}) {
  const router = useRouter();
  const db = useDatabase();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerVerticalPadding = Math.max(insets.top, 30);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    next,
    previous,
    seekTo,
    isSeeking,
    seekPosition,
    startSeeking,
    finishSeeking,
    repeatMode,
    cycleRepeatMode,
    volume,
    setVolume,
  } = usePlayerStore();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [progressBarWidth, setProgressBarWidth] = useState(width - 80);

  // Fallback metadata for seamless display matching the reference
  const trackTitle = currentTrack?.title || '';
  const trackArtist = currentTrack
    ? (currentTrack.artistId && db.isReady ? db.artists.getNameById(currentTrack.artistId) : 'Nusrat Fateh Ali Khan')
    : 'Nusrat Fateh Ali Khan';
  const trackDuration = duration > 0 ? duration : 214;
  const effectiveTime = isSeeking ? seekPosition : currentTime;
  const remainingTime = Math.max(0, trackDuration - effectiveTime);

  // Sync favorite state
  useEffect(() => {
    if (db.isReady && currentTrack) {
      setIsFavorite(db.favorites.isFavorite(currentTrack.id));
    }
  }, [db.isReady, currentTrack]);

  // Morphing pill: cycles between "Now playing" and "Go back" every 3 seconds with micro-animation
  const [pillMode, setPillMode] = useState<'now_playing' | 'go_back'>('now_playing');
  const pillFadeAnim = useRef(new Animated.Value(1)).current;
  const pillTranslateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Lift and fade out
      Animated.parallel([
        Animated.timing(pillFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pillTranslateAnim, {
          toValue: -4,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 2. Switch text mode
        setPillMode((prev) => (prev === 'now_playing' ? 'go_back' : 'now_playing'));
        pillTranslateAnim.setValue(4);

        // 3. Drop in and fade in
        Animated.parallel([
          Animated.timing(pillFadeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(pillTranslateAnim, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [pillFadeAnim, pillTranslateAnim]);

  // Continuous waterflow wave animations in yellow/amber theme
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const shapesAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Continuous wave loop 1 (period 120, duration 3600ms)
    const wave1Loop = Animated.loop(
      Animated.timing(wave1Anim, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 2. Continuous counter-wave loop 2 (period 90, duration 5000ms)
    const wave2Loop = Animated.loop(
      Animated.timing(wave2Anim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 3. Gentle breathing/floating motion for scattered organic shapes
    const shapesLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shapesAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shapesAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    wave1Loop.start();
    wave2Loop.start();
    shapesLoop.start();

    return () => {
      wave1Loop.stop();
      wave2Loop.stop();
      shapesLoop.stop();
    };
  }, [wave1Anim, wave2Anim, shapesAnim]);

  const isDismissing = useRef(false);

  const handleDismiss = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    setTimeout(() => {
      isDismissing.current = false;
    }, 600);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
    if (onDismiss) {
      onDismiss();
    } else {
      try {
        // @ts-ignore
        if (typeof router.dismiss === 'function' && router.canDismiss?.()) {
          // @ts-ignore
          router.dismiss();
          return;
        }
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      } catch {
        try {
          router.back();
        } catch {
          router.replace('/(tabs)');
        }
      }
    }
  };

  useEffect(() => {
    isDismissing.current = false;

    const onBackPress = () => {
      handleDismiss();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentTrack && db.isReady) {
      const nextVal = !isFavorite;
      setIsFavorite(nextVal);
      db.favorites.toggle(currentTrack.id);
    } else {
      setIsFavorite(!isFavorite);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Listening to "${trackTitle}" by ${trackArtist} on Overtone!`,
      });
    } catch {
      // Ignored
    }
  };

  const handleAddToPlaylist = () => {
    if (!currentTrack || !db.isReady) return;
    const pls = db.playlists.getAll();
    if (pls.length === 0) {
      Alert.alert('No Playlists', 'Create a playlist first in the Playlists tab.');
      return;
    }
    Alert.alert(
      'Add to Playlist',
      `Add "${currentTrack.title}" to:`,
      [
        ...pls.slice(0, 6).map((p) => ({
          text: p.name,
          onPress: () => {
            if (db.playlists.hasTrack(p.id, currentTrack.id)) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              Alert.alert(
                'Already in Playlist',
                `"${currentTrack.title}" is already in "${p.name}". A song can only be added once per playlist.`,
                [{ text: 'OK', style: 'default' }]
              );
              return;
            }
            db.playlists.addTrack(p.id, currentTrack.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Added', `"${currentTrack.title}" added to "${p.name}".`);
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMoreOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActionSheetOpen(true);
  };

  // ── Circular Radial Volume Arc Math ─────────────────────────────────
  // Canvas: 270x270, Center: (135, 135), Arc Radius: 114
  const CX = 135;
  const CY = 135;
  const ARC_R = 114;
  const START_ANGLE = 190;
  const END_ANGLE = 350;
  const SWEEP_ANGLE = END_ANGLE - START_ANGLE; // 160 degrees

  const safeVolume = typeof volume === 'number' ? Math.max(0, Math.min(1, volume)) : 0.75;
  const currentArcAngle = START_ANGLE + safeVolume * SWEEP_ANGLE;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = CX + ARC_R * Math.cos(toRad(START_ANGLE));
  const y1 = CY + ARC_R * Math.sin(toRad(START_ANGLE));
  const x2 = CX + ARC_R * Math.cos(toRad(END_ANGLE));
  const y2 = CY + ARC_R * Math.sin(toRad(END_ANGLE));
  const xv = CX + ARC_R * Math.cos(toRad(currentArcAngle));
  const yv = CY + ARC_R * Math.sin(toRad(currentArcAngle));

  const bgArcPath = `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${ARC_R} ${ARC_R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  const activeArcPath =
    safeVolume > 0.01
      ? `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${ARC_R} ${ARC_R} 0 0 1 ${xv.toFixed(1)} ${yv.toFixed(1)}`
      : '';

  // Arc touch gesture interaction
  const arcPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const dx = evt.nativeEvent.locationX - CX;
        const dy = evt.nativeEvent.locationY - CY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist >= 78 && dist <= 155;
      },
      onMoveShouldSetPanResponder: (evt) => {
        const dx = evt.nativeEvent.locationX - CX;
        const dy = evt.nativeEvent.locationY - CY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist >= 78 && dist <= 155;
      },
      onPanResponderGrant: (evt) => {
        handleArcTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
      onPanResponderMove: (evt) => {
        handleArcTouch(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
    })
  ).current;

  const handleArcTouch = (tx: number, ty: number) => {
    const dx = tx - CX;
    const dy = ty - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 75 || dist > 160) return;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    if (angle >= 165 && angle <= 360) {
      const clamped = Math.max(0, Math.min(1, (angle - START_ANGLE) / SWEEP_ANGLE));
      setVolume(clamped);
      Haptics.selectionAsync();
    }
  };

  // ── Linear Progress Scrubber PanResponder ────────────────────────────
  const progressPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = Math.max(0, Math.min(progressBarWidth, evt.nativeEvent.locationX));
        const pct = x / progressBarWidth;
        const targetSec = pct * trackDuration;
        startSeeking(targetSec);
        Haptics.selectionAsync();
      },
      onPanResponderMove: (evt) => {
        const x = Math.max(0, Math.min(progressBarWidth, evt.nativeEvent.locationX));
        const pct = x / progressBarWidth;
        const targetSec = pct * trackDuration;
        startSeeking(targetSec);
      },
      onPanResponderRelease: async () => {
        await finishSeeking();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  const hasArtwork = Boolean(currentTrack?.artworkUri);

  const progressFraction = trackDuration > 0 ? Math.min(1, Math.max(0, effectiveTime / trackDuration)) : 0;

  return (
    <View style={styles.outerCanvas}>
      {/* Top Header Section with Animated Continuous Waterflow Waves & Scattered Shapes Background */}
      <View
        style={[
          styles.topHeaderArea,
          { paddingTop: Math.max(insets.top, 24), paddingBottom: 16 },
        ]}
      >
        {/* Continuous Moving Waterflow Waves & Scattered Shapes Background for the Section */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Base warm amber / golden gradient background */}
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="headerBaseGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FFFDF5" stopOpacity="1" />
                <Stop offset="50%" stopColor="#FEF3C7" stopOpacity="0.96" />
                <Stop offset="100%" stopColor="#FDE68A" stopOpacity="0.9" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#headerBaseGrad)" />
          </Svg>

          {/* Moving Wave Layer 2 (Background Golden Flow - counter-direction) */}
          <Animated.View
            style={[
              styles.headerWaveContainer,
              {
                transform: [
                  {
                    translateX: wave2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-90, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={720} height={125} viewBox="0 0 720 125">
              <Defs>
                <LinearGradient id="headerWave2Grad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FDE68A" stopOpacity="0.55" />
                  <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
                </LinearGradient>
              </Defs>
              <Path d={HEADER_WAVE2_PATH} fill="url(#headerWave2Grad)" />
            </Svg>
          </Animated.View>

          {/* Moving Wave Layer 1 (Foreground Amber Flow) */}
          <Animated.View
            style={[
              styles.headerWaveContainer,
              {
                transform: [
                  {
                    translateX: wave1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -120],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width={720} height={125} viewBox="0 0 720 125">
              <Defs>
                <LinearGradient id="headerWave1Grad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.32" />
                  <Stop offset="100%" stopColor="#D97706" stopOpacity="0.45" />
                </LinearGradient>
              </Defs>
              <Path d={HEADER_WAVE1_PATH} fill="url(#headerWave1Grad)" />
            </Svg>
          </Animated.View>

          {/* Scattered Organic & Geometric Floating Shapes across Section Canvas */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: shapesAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.75, 1],
                }),
                transform: [
                  {
                    translateY: shapesAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.5, -1.5],
                    }),
                  },
                ],
              },
            ]}
          >
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              {/* Subtle sparkle 4-pt star on left */}
              <Path
                d="M 38,24 Q 38,29 43,29 Q 38,29 38,34 Q 38,29 33,29 Q 38,29 38,24 Z"
                fill="#F59E0B"
                opacity={0.45}
              />
              {/* Floating amber droplet */}
              <Circle cx={82} cy={55} r={3} fill="#D97706" opacity={0.35} />
              {/* Micro sunshine speck */}
              <Circle cx={135} cy={22} r={2} fill="#F59E0B" opacity={0.5} />
              {/* Micro star */}
              <Path
                d="M 188,42 Q 188,45 192,45 Q 188,45 188,48 Q 188,45 184,45 Q 188,45 188,42 Z"
                fill="#D97706"
                opacity={0.36}
              />
              {/* Micro sunshine speck right */}
              <Circle cx={272} cy={22} r={2} fill="#F59E0B" opacity={0.45} />
              {/* Floating diamond shape on right */}
              <Path
                d="M 318,48 L 322,52 L 318,56 L 314,52 Z"
                fill="#D97706"
                opacity={0.38}
              />
              {/* Floating droplet ring on far right */}
              <Circle
                cx={356}
                cy={32}
                r={3.2}
                stroke="#F59E0B"
                strokeWidth={1.2}
                fill="none"
                opacity={0.38}
              />
            </Svg>
          </Animated.View>
        </View>

        {/* Elevated Frosted Capsule Pill */}
        <Pressable
          onPress={handleDismiss}
          hitSlop={14}
          style={styles.nowPlayingPill}
          accessibilityRole="button"
          accessibilityLabel={pillMode === 'now_playing' ? 'Now playing, tap to dismiss' : 'Go back, tap to dismiss'}
        >
          {/* Morphing Foreground Content: SleekLiveEqualizer + "Now playing" or Chevron + "Go back" */}
          <Animated.View
            style={{
              opacity: pillFadeAnim,
              transform: [{ translateY: pillTranslateAnim }],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6.5,
              zIndex: 2,
            }}
          >
            {pillMode === 'now_playing' ? (
              <>
                <SleekLiveEqualizer
                  isPlaying={isPlaying}
                  color="#92400E"
                  size={13}
                  barWidth={2.4}
                  gap={2.2}
                />
                <Text style={styles.nowPlayingPillText}>Now playing</Text>
              </>
            ) : (
              <>
                <SleekChevronDownIcon size={14} color="#78350F" />
                <Text style={styles.nowPlayingPillText}>Go back</Text>
              </>
            )}
          </Animated.View>
        </Pressable>
      </View>

      {/* Main Curved White Player Card */}
      <View style={styles.mainCard}>
        {/* Grabber Handle Pill (also dismisses on tap) */}
        <Pressable
          onPress={handleDismiss}
          hitSlop={14}
          style={styles.handleContainer}
          accessibilityRole="button"
          accessibilityLabel="Dismiss handle"
        >
          <View style={styles.handlePill} />
        </Pressable>

        {/* Circular Artwork with Radial Volume Arc Slider */}
        <View style={styles.artworkSection}>
          {/* Radial Arc Container */}
          <View style={styles.arcContainer} {...arcPanResponder.panHandlers}>
            <Svg width={270} height={270} viewBox="0 0 270 270">
              <Defs>
                <LinearGradient id="sleekVolGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#F59E0B" />
                  <Stop offset="50%" stopColor="#F9A826" />
                  <Stop offset="100%" stopColor="#FCD34D" />
                </LinearGradient>
              </Defs>

              {/* Background Inactive Arc */}
              <Path
                d={bgArcPath}
                stroke="#F0ECE6"
                strokeWidth={4.5}
                strokeLinecap="round"
                fill="none"
              />

              {/* Active Amber Gradient Arc */}
              {activeArcPath ? (
                <Path
                  d={activeArcPath}
                  stroke="url(#sleekVolGrad)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  fill="none"
                />
              ) : null}

              {/* Volume Arc Thumb */}
              <Circle
                cx={xv}
                cy={yv}
                r={7.5}
                fill="#FFFFFF"
                stroke="#F9A826"
                strokeWidth={2.8}
              />
            </Svg>

            {/* Speaker Icons at Arc Ends */}
            <View style={styles.speakerLowPos} pointerEvents="none">
              <SleekSpeakerLowIcon size={17} color="#8A82A2" />
            </View>
            <View style={styles.speakerHighPos} pointerEvents="none">
              <SleekSpeakerHighIcon size={17} color="#8A82A2" />
            </View>

            {/* Circular Vinyl / Album Art Disc in Center */}
            <View style={styles.discWrapper} pointerEvents="none">
              <View style={styles.discGlow}>
                {hasArtwork ? (
                  <Image
                    source={{ uri: currentTrack!.artworkUri! }}
                    style={styles.discImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.proceduralDisc}>
                    <View style={styles.proceduralDiscGroove} />
                    <View style={styles.proceduralDiscCenter}>
                      <SleekMusicNoteIcon size={46} color="#D97706" />
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Track Title and Artist */}
        <View style={styles.metaSection}>
          <Text style={styles.titleText} numberOfLines={1}>
            {trackTitle}
          </Text>
          <Text style={styles.artistText} numberOfLines={1}>
            {trackArtist}
          </Text>
        </View>

        {/* Linear Progress Scrubber Bar & Timestamps */}
        <View style={styles.progressSection}>
          <View
            style={styles.scrubberTouchable}
            onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
            {...progressPanResponder.panHandlers}
          >
            <View style={styles.scrubberBg}>
              <View
                style={[
                  styles.scrubberFill,
                  { width: Math.max(0, Math.min(progressBarWidth, progressFraction * progressBarWidth)) },
                ]}
              />
            </View>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatDuration(effectiveTime)}</Text>
            <Text style={styles.timeText}>-{formatDuration(remainingTime)}</Text>
          </View>
        </View>

        {/* Primary Transport Controls (Prev, Play/Pause, Next) */}
        <View style={styles.transportRow}>
          {/* Previous Track Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              previous();
            }}
            hitSlop={12}
            style={styles.prevNextBtn}
            accessibilityRole="button"
            accessibilityLabel="Previous track"
          >
            <SleekSkipBackIcon size={20} color="#8A82A2" />
          </Pressable>

          {/* Large Glowing Play / Pause Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              togglePlayPause();
            }}
            hitSlop={12}
            style={styles.playPauseBtn}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          >
            <View style={styles.playPauseGlow}>
              {isPlaying ? (
                <SleekPauseIcon size={24} color="#FFFFFF" />
              ) : (
                <View style={{ marginLeft: 3 }}>
                  <SleekPlayIcon size={24} color="#FFFFFF" />
                </View>
              )}
            </View>
          </Pressable>

          {/* Next Track Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              next();
            }}
            hitSlop={12}
            style={styles.prevNextBtn}
            accessibilityRole="button"
            accessibilityLabel="Next track"
          >
            <SleekSkipForwardIcon size={20} color="#8A82A2" />
          </Pressable>
        </View>

        {/* Bottom Secondary Actions Bar */}
        <View style={styles.bottomBar}>
          {/* 1. Heart / Favorite */}
          <Pressable
            onPress={handleToggleFavorite}
            hitSlop={12}
            style={styles.bottomActionBtn}
            accessibilityRole="button"
            accessibilityLabel="Favorite"
          >
            <SleekHeartIcon
              size={21}
              color={isFavorite ? '#F9A826' : '#8A82A2'}
              fill={isFavorite ? '#F9A826' : 'none'}
            />
          </Pressable>

          {/* 2. Repeat */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              cycleRepeatMode();
            }}
            hitSlop={12}
            style={styles.bottomActionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Repeat mode: ${repeatMode}`}
          >
            <View style={{ position: 'relative' }}>
              <SleekRepeatIcon
                size={21}
                color={repeatMode !== 'off' ? '#F9A826' : '#8A82A2'}
              />
              {repeatMode === 'one' && (
                <View style={styles.repeatOneBadge}>
                  <Text style={styles.repeatOneText}>1</Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* 3. Lyrics */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsLyricsOpen(true);
            }}
            hitSlop={12}
            style={styles.bottomActionBtn}
            accessibilityRole="button"
            accessibilityLabel="View lyrics"
          >
            <SleekLyricsIcon size={21} color="#8A82A2" />
          </Pressable>

          {/* 4. Queue */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsQueueOpen(true);
            }}
            hitSlop={12}
            style={styles.bottomActionBtn}
            accessibilityRole="button"
            accessibilityLabel="View play queue"
          >
            <SleekQueueIcon size={21} color="#8A82A2" />
          </Pressable>

          {/* 5. More Options */}
          <Pressable
            onPress={handleMoreOptions}
            hitSlop={12}
            style={styles.bottomActionBtn}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <SleekHorizontalMoreIcon size={21} color="#8A82A2" />
          </Pressable>
        </View>
      </View>

      {/* Sheets */}
      <QueueSheet visible={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
      <LyricsView visible={isLyricsOpen} onClose={() => setIsLyricsOpen(false)} />
      <SleekTrackActionSheet
        visible={isActionSheetOpen}
        track={currentTrack}
        onClose={() => setIsActionSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerCanvas: {
    flex: 1,
    backgroundColor: sleekTokens.headerGradientStart, // warm amber - matches the rest of the screens headers bg
    justifyContent: 'space-between',
  },
  topHeaderArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 52,
    position: 'relative',
    overflow: 'hidden',
  },
  headerWaveContainer: {
    position: 'absolute',
    left: 0,
    bottom: -15,
    width: 720,
    height: 125,
  },
  nowPlayingPill: {
    paddingHorizontal: 16,
    height: 38,
    minWidth: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 2,
  },
  nowPlayingPillText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#451A03',
    letterSpacing: 0.25,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  mainCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: sleekTokens.cardBorderRadius,
    borderTopRightRadius: sleekTokens.cardBorderRadius,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 24,
    justifyContent: 'space-between',
    shadowColor: '#1A0B36',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 2,
    width: '100%',
  },
  handlePill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: sleekTokens.handlePill,
  },
  artworkSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  arcContainer: {
    width: 270,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  speakerLowPos: {
    position: 'absolute',
    left: 2,
    top: 107,
  },
  speakerHighPos: {
    position: 'absolute',
    right: -4,
    top: 107,
  },
  discWrapper: {
    position: 'absolute',
    top: 42,
    left: 42,
    width: 186,
    height: 186,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discGlow: {
    width: 184,
    height: 184,
    borderRadius: 92,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 14,
    backgroundColor: '#FFFFFF',
  },
  discImage: {
    width: 184,
    height: 184,
    borderRadius: 92,
  },
  proceduralDisc: {
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: '#1C1917',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    overflow: 'hidden',
  },
  proceduralDiscGroove: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  proceduralDiscCenter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#261F17',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  metaSection: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171424',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  artistText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A82A2',
    marginTop: 6,
    textAlign: 'center',
  },
  progressSection: {
    marginVertical: 4,
  },
  scrubberTouchable: {
    height: 28,
    justifyContent: 'center',
  },
  scrubberBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EDE8F6',
    overflow: 'hidden',
    position: 'relative',
  },
  scrubberFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F9A826',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9E9BB0',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginVertical: 6,
  },
  prevNextBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F7F3FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F9A826',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  playPauseGlow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F0FB',
  },
  bottomActionBtn: {
    padding: 8,
  },
  repeatOneBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#F9A826',
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
});

/**
 * Overtone iOS — Queue Sheet Component
 *
 * Shows the current playback queue, allows reordering and removing tracks,
 * jumping to tracks, and clearing the queue.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useDatabase } from '../hooks/useDatabase';
import { usePlayerStore } from '../store/usePlayerStore';
import { Artwork } from './Artwork';
import { SleekPlayIcon, SleekCloseIcon, SleekQueueIcon } from './sleek/SleekIcons';
import { spacing, radii, MIN_TOUCH_TARGET, artworkSizes } from '../design/spacing';
import { typography } from '../design/typography';
import { formatDuration } from '../services/files/FileImportService';
import type { MobileTrack } from '../domain/models';

interface QueueSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function QueueSheet({ visible, onClose }: QueueSheetProps) {
  const { colors } = useTheme();
  const db = useDatabase();
  const insets = useSafeAreaInsets();
  const {
    queue,
    queueIndex,
    currentTrack,
    loadAndPlay,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();

  // Generous top space to ensure modal has breathing room and avoids colliding with top notch or sheet boundary
  const topPadding = Math.max(insets.top > 0 ? insets.top + 8 : 26, 26);

  const handleTrackPress = (track: MobileTrack, index: number) => {
    Haptics.selectionAsync();
    loadAndPlay(track, queue, index);
  };

  const handleRemove = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFromQueue(index);
  };

  const renderTrackItem = ({ item, index }: { item: MobileTrack; index: number }) => {
    const isCurrent = index === queueIndex;
    const artistName = item.artistId && db.isReady ? db.artists.getNameById(item.artistId) : null;

    return (
      <Pressable
        onPress={() => handleTrackPress(item, index)}
        style={({ pressed }) => [
          styles.row,
          isCurrent && {
            backgroundColor: 'rgba(249, 168, 38, 0.08)',
            borderColor: 'rgba(249, 168, 38, 0.22)',
          },
          pressed && {
            backgroundColor: isCurrent ? 'rgba(249, 168, 38, 0.14)' : colors.surfaceOverlay,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${isCurrent ? 'now playing' : ''}`}
      >
        <View style={styles.indexColumn}>
          {isCurrent ? (
            <View style={[styles.activeIndicator, { backgroundColor: colors.accentSubtle }]}>
              <SleekPlayIcon size={11} color={colors.accent} />
            </View>
          ) : (
            <Text style={[styles.indexText, { color: colors.textTertiary }]}>
              {index + 1}
            </Text>
          )}
        </View>

        <Artwork uri={item.artworkUri} size={artworkSizes.listRow} borderRadius={radii.sm} />

        <View style={styles.trackInfo}>
          <Text
            style={[
              styles.trackTitle,
              { color: isCurrent ? colors.accent : colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.trackSubtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {(() => {
              const itemDuration =
                item.duration > 0
                  ? item.duration
                  : isCurrent && currentTrack?.duration && currentTrack.duration > 0
                  ? currentTrack.duration
                  : 0;
              const durText = itemDuration > 0 ? formatDuration(itemDuration) : '';
              if (artistName && durText) return `${artistName} · ${durText}`;
              if (artistName) return artistName;
              return durText;
            })()}
          </Text>
        </View>

        <Pressable
          onPress={() => handleRemove(index)}
          hitSlop={12}
          style={({ pressed }) => [
            styles.removeBtn,
            pressed && { opacity: 0.6 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.title} from queue`}
        >
          <View style={[styles.removeIconCircle, { backgroundColor: colors.surfaceOverlay }]}>
            <SleekCloseIcon size={11} color={colors.textTertiary} />
          </View>
        </Pressable>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Grabber Handle & Top Breathing Room */}
        <View style={[styles.grabberContainer, { paddingTop: topPadding }]}>
          <View style={[styles.grabberPill, { backgroundColor: colors.textTertiary }]} />
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Playing Next
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {queue.length === 0
                ? 'No upcoming tracks'
                : `${queue.length} track${queue.length === 1 ? '' : 's'}${
                    queueIndex >= 0 && queueIndex < queue.length
                      ? ` · Track ${queueIndex + 1} playing`
                      : ''
                  }`}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {queue.length > 0 && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  clearQueue();
                }}
                style={({ pressed }) => [
                  styles.clearBtn,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Clear queue"
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={({ pressed }) => [
                styles.doneBtn,
                { backgroundColor: colors.accent },
                pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>

        {/* Queue List */}
        {queue.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.badgeWrapper}>
              <View style={styles.badgeGlow} />
              <View style={styles.badgeSquircle}>
                <SleekQueueIcon size={32} color={colors.accent} />
              </View>
            </View>
            <Text style={[typography.title3, { color: colors.textPrimary, fontWeight: '700' }]}>
              Queue is Empty
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }]}>
              Play songs or albums to add them to your queue.
            </Text>
          </View>
        ) : (
          <FlatList
            data={queue}
            keyExtractor={(item: MobileTrack, index: number) => `${item.id}_${index}`}
            renderItem={renderTrackItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom + 28, 44) },
            ]}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grabberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: 16,
  },
  grabberPill: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(217, 79, 79, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D94F4F',
  },
  doneBtn: {
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  listContent: {
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: MIN_TOUCH_TARGET,
  },
  indexColumn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    width: 28,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  trackInfo: {
    flex: 1,
    gap: 3,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  trackSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  removeBtn: {
    padding: 2,
  },
  removeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 44,
  },
  badgeWrapper: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  badgeGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    opacity: 0.8,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  badgeSquircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

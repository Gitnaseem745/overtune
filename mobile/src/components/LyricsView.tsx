/**
 * Overtone iOS — Lyrics View Component
 *
 * Displays synchronized or plain-text lyrics with auto-scroll and highlight,
 * per-track timing adjustment offsets, and graceful fallback states.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useDatabase } from '../hooks/useDatabase';
import { usePlayerStore } from '../store/usePlayerStore';
import { LyricsService } from '../services/lyrics/LyricsService';
import { SleekLyricsIcon } from './sleek/SleekIcons';
import { spacing, radii } from '../design/spacing';
import { typography } from '../design/typography';
import type { LyricLine, LyricsData } from '../domain/models';

interface LyricsViewProps {
  visible: boolean;
  onClose: () => void;
  lines?: LyricLine[];
}

export function LyricsView({ visible, onClose, lines: propLines }: LyricsViewProps) {
  const { colors } = useTheme();
  const db = useDatabase();
  const insets = useSafeAreaInsets();
  const currentTime = usePlayerStore((s) => (visible ? s.currentTime : 0));
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const scrollViewRef = useRef<ScrollView>(null);

  const topPadding = Math.max(insets.top > 0 ? insets.top + 8 : 26, 26);

  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Load lyrics when modal opens or currentTrack changes
  useEffect(() => {
    if (!visible || !currentTrack) return;

    if (propLines && propLines.length > 0) {
      setLyricsData({
        lines: propLines,
        isSynced: propLines.some((l) => l.time >= 0),
        source: 'lrc',
        offset: 0,
      });
      return;
    }

    LyricsService.loadLyricsForTrack(currentTrack, db).then((data) => {
      setLyricsData(data);
      setOffsetMs(data.offset || 0);
    });
  }, [visible, currentTrack, propLines, db]);

  const activeLines = lyricsData?.lines || propLines || [];
  const effectiveTime = currentTime - offsetMs / 1000;

  // Find active line index for synced lyrics
  const activeIndex = activeLines.findIndex((line, i) => {
    if (line.time < 0) return false;
    const nextLine = activeLines[i + 1];
    if (nextLine && nextLine.time >= 0) {
      return effectiveTime >= line.time && effectiveTime < nextLine.time;
    }
    return effectiveTime >= line.time;
  });

  // Auto-scroll active line into center
  useEffect(() => {
    if (activeIndex >= 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: Math.max(0, activeIndex * 54 - 120),
        animated: true,
      });
    }
  }, [activeIndex]);

  const handleAdjustOffset = (deltaMs: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!currentTrack) return;
    const nextOffset = offsetMs + deltaMs;
    setOffsetMs(nextOffset);
    LyricsService.setLyricOffset(currentTrack.id, nextOffset, db);
  };

  const handleResetOffset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!currentTrack) return;
    setOffsetMs(0);
    LyricsService.setLyricOffset(currentTrack.id, 0, db);
  };

  const handleSavePastedLyrics = async () => {
    if (!pastedText.trim() || !currentTrack) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const saved = await LyricsService.saveLyricsForTrack(currentTrack.id, pastedText.trim());
    setLyricsData(saved);
    setIsEditing(false);
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
          <View style={{ flex: 1 }}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>Lyrics</Text>
            {currentTrack && (
              <Text
                style={[typography.caption1, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {currentTrack.title}
              </Text>
            )}
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={[typography.headline, { color: colors.accent, fontWeight: '700' }]}>Done</Text>
          </Pressable>
        </View>

        {/* Edit / Paste Modal state */}
        {isEditing ? (
          <View style={styles.editContainer}>
            <Text style={[typography.subheadline, { color: colors.textSecondary, marginBottom: 8 }]}>
              Paste LRC or plain text lyrics below:
            </Text>
            <TextInput
              style={[
                styles.editInput,
                { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
              ]}
              multiline
              value={pastedText}
              onChangeText={setPastedText}
              placeholder="[00:12.50] Lyric line 1&#10;[00:15.20] Lyric line 2..."
              placeholderTextColor={colors.textTertiary}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={() => setIsEditing(false)}
                style={[styles.modalBtn, { backgroundColor: colors.surfaceOverlay }]}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSavePastedLyrics}
                style={[styles.modalBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Lyrics</Text>
              </Pressable>
            </View>
          </View>
        ) : activeLines.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.badgeWrapper}>
              <View style={styles.badgeGlow} />
              <View style={styles.badgeSquircle}>
                <SleekLyricsIcon size={32} color="#F9A826" />
              </View>
            </View>
            <Text style={[typography.title3, { color: colors.textPrimary, fontWeight: '700' }]}>
              No Lyrics Available
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }]}>
              Place a .lrc file next to this audio file or paste synchronized lyrics.
            </Text>
            <Pressable
              onPress={() => setIsEditing(true)}
              style={({ pressed }) => [
                styles.addLyricsBtn,
                { backgroundColor: colors.accent },
                pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add lyrics"
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>+ Add Lyrics</Text>
            </Pressable>
          </View>
        ) : (
          /* Synced / Plain Lyrics Scroll */
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeLines.map((line, index) => {
              const isActive = index === activeIndex;
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    if (line.time >= 0) {
                      Haptics.selectionAsync();
                      seekTo(Math.max(0, line.time + offsetMs / 1000));
                    }
                  }}
                  style={[
                    styles.lineWrapper,
                    isActive && styles.activeLineWrapper,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Line: ${line.text}`}
                >
                  <Text
                    style={[
                      styles.lyricLine,
                      {
                        color: isActive ? colors.accent : colors.textPrimary,
                        opacity: isActive ? 1 : 0.45,
                        fontWeight: isActive ? '700' : '500',
                        fontSize: isActive ? 23 : 18,
                        transform: [{ scale: isActive ? 1.02 : 1 }],
                      },
                    ]}
                  >
                    {line.text}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Sync Offset Controls Toolbar (when synced lyrics exist) */}
        {!isEditing && lyricsData?.isSynced && activeLines.length > 0 && (
          <View style={[styles.offsetBar, { borderTopColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
            <Text style={[typography.caption2, { color: colors.textSecondary }]}>
              SYNC TIMING
            </Text>
            <View style={styles.offsetControls}>
              <Pressable
                onPress={() => handleAdjustOffset(-500)}
                style={[styles.offsetBtn, { backgroundColor: colors.surfaceOverlay }]}
                hitSlop={6}
              >
                <Text style={[styles.offsetBtnText, { color: colors.textPrimary }]}>-0.5s</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAdjustOffset(-100)}
                style={[styles.offsetBtn, { backgroundColor: colors.surfaceOverlay }]}
                hitSlop={6}
              >
                <Text style={[styles.offsetBtnText, { color: colors.textPrimary }]}>-0.1s</Text>
              </Pressable>

              <Pressable onPress={handleResetOffset} hitSlop={6}>
                <Text style={[styles.offsetLabel, { color: offsetMs !== 0 ? colors.accent : colors.textTertiary }]}>
                  {offsetMs === 0 ? '0.0s' : `${offsetMs > 0 ? '+' : ''}${(offsetMs / 1000).toFixed(1)}s`}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleAdjustOffset(100)}
                style={[styles.offsetBtn, { backgroundColor: colors.surfaceOverlay }]}
                hitSlop={6}
              >
                <Text style={[styles.offsetBtnText, { color: colors.textPrimary }]}>+0.1s</Text>
              </Pressable>
              <Pressable
                onPress={() => handleAdjustOffset(500)}
                style={[styles.offsetBtn, { backgroundColor: colors.surfaceOverlay }]}
                hitSlop={6}
              >
                <Text style={[styles.offsetBtnText, { color: colors.textPrimary }]}>+0.5s</Text>
              </Pressable>
            </View>
          </View>
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
    paddingBottom: 12,
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
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
  },
  lineWrapper: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeLineWrapper: {
    backgroundColor: 'rgba(249, 168, 38, 0.08)',
  },
  lyricLine: {
    lineHeight: 30,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
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
  addLyricsBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  offsetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  offsetControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offsetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  offsetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  offsetLabel: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'center',
  },
  editContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

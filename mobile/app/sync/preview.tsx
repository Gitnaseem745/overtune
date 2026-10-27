/**
 * Overtone iOS — Wi-Fi Sync Preview Screen
 *
 * Previews an incoming or outgoing playlist transfer, showing track matches,
 * unmatched tracks, and requiring user confirmation before committing to the database.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SleekAlert } from '../../src/components/sleek/SleekAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useDatabase } from '../../src/hooks/useDatabase';
import { spacing, radii, layout, MIN_TOUCH_TARGET } from '../../src/design/spacing';
import { typography } from '../../src/design/typography';
import { formatDuration } from '../../src/services/files/FileImportService';
import { SyncService } from '../../src/services/sync/SyncService';
import type { TrackMatchResult } from '../../src/domain/models';

export default function PlaylistPreviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const db = useDatabase();
  const params = useLocalSearchParams<{
    playlistName: string;
    matchesJson: string;
    sourceDeviceName?: string;
  }>();

  const playlistName = params.playlistName || 'Shared Playlist';
  const sourceDevice = params.sourceDeviceName || 'Desktop';
  const matches: TrackMatchResult[] = params.matchesJson ? JSON.parse(params.matchesJson) : [];

  const matchedCount = matches.filter((m) => m.localTrackId !== null).length;
  const unmatchedCount = matches.length - matchedCount;

  const [isCommitting, setIsCommitting] = useState(false);

  const handleImport = () => {
    if (!db.isReady) return;
    setIsCommitting(true);

    try {
      const pairedDevices = db.pairedDevices.getAll();
      const device =
        pairedDevices.find((d: any) => d.name === sourceDevice) ||
        pairedDevices[0] || { id: 'desktop', name: sourceDevice, ip: '127.0.0.1', port: 47848 };

      // 1. Create playlist
      const playlistId = db.playlists.create(playlistName, 'synced', sourceDevice);

      // 2. Add all tracks (local matched + Wi-Fi streamable)
      matches.forEach((m) => {
        if (m.localTrackId !== null) {
          db.playlists.addTrack(playlistId, m.localTrackId);
        } else {
          // Create track in library with stream URL from desktop
          const trackId = SyncService.importSingleTrack(device, m.syncTrack, db);
          db.playlists.addTrack(playlistId, trackId);
        }
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      SleekAlert.alert(
        'Playlist Imported',
        `"${playlistName}" with ${matches.length} track${matches.length === 1 ? '' : 's'} has been added to your Library.`,
        [
          {
            text: 'View Playlist',
            onPress: () => {
              router.replace(`/playlist/${playlistId}`);
            },
          },
        ]
      );
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      SleekAlert.alert('Import Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Summary Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={[typography.title2, styles.playlistTitle, { color: colors.textPrimary }]}>
          {playlistName}
        </Text>
        <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
          Received from {sourceDevice}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[typography.title3, { color: colors.textPrimary }]}>{matches.length}</Text>
            <Text style={[typography.caption2, { color: colors.textSecondary }]}>Total Songs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[typography.title3, { color: colors.success }]}>{matchedCount}</Text>
            <Text style={[typography.caption2, { color: colors.textSecondary }]}>Local Files</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[typography.title3, { color: unmatchedCount > 0 ? colors.accent : colors.textTertiary }]}>
              {unmatchedCount}
            </Text>
            <Text style={[typography.caption2, { color: colors.textSecondary }]}>Wi-Fi Stream</Text>
          </View>
        </View>

        <Text style={[typography.caption2, styles.noticeText, { color: colors.textTertiary }]}>
          All songs will be imported. Tracks not yet stored on your phone stream seamlessly over Wi-Fi from your computer.
        </Text>
      </View>

      {/* Matches List */}
      <FlatList
        data={matches}
        keyExtractor={(_: TrackMatchResult, index: number) => String(index)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }: { item: TrackMatchResult }) => {
          const isMatched = item.localTrackId !== null;
          return (
            <View
              style={[
                styles.trackRow,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.trackInfo}>
                <Text
                  style={[typography.body, { color: colors.textPrimary, fontWeight: '500' }]}
                  numberOfLines={1}
                >
                  {item.syncTrack.title}
                </Text>
                <Text
                  style={[typography.caption1, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.syncTrack.artist || 'Unknown Artist'} · {formatDuration(item.syncTrack.duration)}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isMatched
                      ? colors.success + '20'
                      : colors.accent + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isMatched ? colors.success : colors.accent },
                  ]}
                >
                  {isMatched ? 'Local File' : 'Wi-Fi Stream'}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Action Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleImport}
          disabled={isCommitting || matches.length === 0}
          style={[
            styles.commitBtn,
            { backgroundColor: matches.length > 0 ? colors.accent : colors.surfaceElevated },
          ]}
        >
          <Text style={styles.commitText}>
            {isCommitting ? 'Importing...' : `Import Playlist (${matches.length} Track${matches.length === 1 ? '' : 's'})`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  playlistTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginVertical: spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  noticeText: {
    textAlign: 'center',
    lineHeight: 16,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_TARGET,
  },
  trackInfo: {
    flex: 1,
    marginRight: spacing.md,
    gap: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.round,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commitBtn: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  commitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

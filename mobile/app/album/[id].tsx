/**
 * Overtone iOS — Album Detail Screen
 *
 * Displays album artwork, artist, year, track list, and Play/Shuffle actions.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useDatabase } from '../../src/hooks/useDatabase';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { Artwork } from '../../src/components/Artwork';
import { TrackRow } from '../../src/components/TrackRow';
import { EmptyState } from '../../src/components/EmptyState';
import { spacing, radii, layout } from '../../src/design/spacing';
import { typography } from '../../src/design/typography';
import { formatDuration, formatTotalDuration } from '../../src/services/files/FileImportService';
import type { MobileAlbum, MobileTrack } from '../../src/domain/models';

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const db = useDatabase();
  const { width } = useWindowDimensions();
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const loadAndPlay = usePlayerStore((s) => s.loadAndPlay);

  const [album, setAlbum] = useState<MobileAlbum | null>(null);
  const [tracks, setTracks] = useState<MobileTrack[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!db.isReady || !id) return;
    const albumId = parseInt(id, 10);
    const al = db.albums.getById(albumId);
    setAlbum(al);

    const trs = db.tracks.getByAlbum(albumId);
    setTracks(trs);

    setFavorites(db.favorites.getIds());
  }, [db.isReady, id]);

  if (!album) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="💿" title="Album Not Found" message="This album may have been deleted." />
      </SafeAreaView>
    );
  }

  const artSize = Math.min(width - spacing.xl * 2, 220);
  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    loadAndPlay(tracks[0], tracks, 0);
  };

  const handleShuffleAll = () => {
    if (tracks.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const randomIndex = Math.floor(Math.random() * tracks.length);
    loadAndPlay(tracks[randomIndex], tracks, randomIndex);
  };

  const handlePlayTrack = useCallback(
    (track: MobileTrack) => {
      const index = tracks.findIndex((t) => t.id === track.id);
      loadAndPlay(track, tracks, index >= 0 ? index : 0);
    },
    [loadAndPlay, tracks]
  );

  const renderTrackItem = useCallback(
    ({ item, index }: { item: MobileTrack; index: number }) => (
      <TrackRow
        track={item}
        index={index}
        showIndex
        isPlaying={currentTrackId === item.id && isPlaying}
        isFavorite={favorites.has(item.id)}
        onPress={handlePlayTrack}
      />
    ),
    [currentTrackId, isPlaying, favorites, handlePlayTrack]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 64,
      offset: 64 * index,
      index,
    }),
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={tracks}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTrackItem}
        getItemLayout={getItemLayout}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={{
          paddingBottom: layout.miniPlayerHeight + layout.tabBarHeight + spacing.xl,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.artWrapper}>
              <Artwork uri={album.artworkUri} size={artSize} borderRadius={radii.md} />
            </View>

            <Text style={[typography.title1, styles.title, { color: colors.textPrimary }]}>
              {album.title}
            </Text>
            <Text style={[typography.title3, { color: colors.accent }]}>
              {album.artistName || 'Unknown Artist'}
            </Text>

            <Text style={[typography.caption1, { color: colors.textTertiary, marginTop: 4 }]}>
              {tracks.length} song{tracks.length === 1 ? '' : 's'} · {formatTotalDuration(totalDuration)}
              {album.year ? ` · ${album.year}` : ''}
            </Text>

            {/* Play & Shuffle buttons */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={handlePlayAll}
                style={[styles.btn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.btnText}>▶ Play</Text>
              </Pressable>

              <Pressable
                onPress={handleShuffleAll}
                style={[styles.btn, { backgroundColor: colors.surfaceElevated }]}
              >
                <Text style={[styles.btnText, { color: colors.textPrimary }]}>🔀 Shuffle</Text>
              </Pressable>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  artWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

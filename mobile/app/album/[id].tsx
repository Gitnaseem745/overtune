/**
 * Overtone iOS — Album Detail Screen
 *
 * Displays album artwork, artist, year, track list, and Play/Shuffle actions.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
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
import { formatDuration } from '../../src/services/files/FileImportService';
import type { MobileAlbum, MobileTrack } from '../../src/domain/models';

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const db = useDatabase();
  const { width } = useWindowDimensions();
  const { loadAndPlay, currentTrack, isPlaying } = usePlayerStore();

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={tracks}
        keyExtractor={(item) => String(item.id)}
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
              {tracks.length} song{tracks.length === 1 ? '' : 's'} · {formatDuration(totalDuration)}
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
        renderItem={({ item, index }) => (
          <TrackRow
            track={item}
            index={index}
            showIndex
            isPlaying={currentTrack?.id === item.id && isPlaying}
            isFavorite={favorites.has(item.id)}
            onPress={(t) => loadAndPlay(t, tracks, index)}
          />
        )}
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

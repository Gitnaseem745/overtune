/**
 * Overtone iOS — Listen Screen
 *
 * Curated entry points into the listener's local collection:
 * recently played, favorites, recently added, and shuffle all.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useDatabase } from '../../src/hooks/useDatabase';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { TrackRow } from '../../src/components/TrackRow';
import { AlbumCard } from '../../src/components/AlbumCard';
import { EmptyState } from '../../src/components/EmptyState';
import { FileImportService } from '../../src/services/files/FileImportService';
import { spacing, radii, layout } from '../../src/design/spacing';
import { typography } from '../../src/design/typography';
import type { MobileTrack, MobileAlbum } from '../../src/domain/models';

export default function ListenScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const db = useDatabase();
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const loadAndPlay = usePlayerStore((s) => s.loadAndPlay);

  const [recentlyPlayed, setRecentlyPlayed] = useState<MobileTrack[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<MobileTrack[]>([]);
  const [albums, setAlbums] = useState<MobileAlbum[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [totalTrackCount, setTotalTrackCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(() => {
    if (!db.isReady) return;

    try {
      const count = db.tracks.getCount();
      setTotalTrackCount(count);

      const recent = db.tracks.getRecentlyPlayed(10);
      setRecentlyPlayed(recent);

      const added = db.tracks.getRecentlyAdded(10);
      setRecentlyAdded(added);

      const allAlbums = db.albums.getAll().slice(0, 8);
      setAlbums(allAlbums);

      const favIds = db.favorites.getIds();
      setFavorites(favIds);
    } catch (e) {
      console.warn('[Listen] Error loading data:', e);
    }
  }, [db.isReady]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleShuffleAll = () => {
    if (!db.isReady || totalTrackCount === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allTracks = db.tracks.getAll();
    const randomIndex = Math.floor(Math.random() * allTracks.length);
    loadAndPlay(allTracks[randomIndex], allTracks, randomIndex);
  };

  const handleImportMusic = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const assets = await FileImportService.pickFiles();
      if (assets.length > 0) {
        await FileImportService.importFilesAndSaveToLibrary(assets, db);
        loadData();
      }
    } catch (err) {
      console.error('[Listen] Import error:', err);
    }
  };

  const getArtistName = (id: number | null) => {
    if (!db.isReady || id === null) return 'Unknown Artist';
    return db.artists.getNameById(id);
  };

  if (db.isReady && totalTrackCount === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="🎵"
          title="Your Music, Everywhere"
          message="Import audio files from your Files app into Overtone for instant, private offline playback."
          actionLabel="Import Audio Files"
          onAction={handleImportMusic}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.miniPlayerHeight + layout.tabBarHeight + spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>Listen</Text>
          <Pressable
            onPress={handleImportMusic}
            style={[styles.importBtn, { backgroundColor: colors.surfaceElevated }]}
            hitSlop={8}
          >
            <Text style={[typography.subheadline, { color: colors.accent, fontWeight: '600' }]}>
              + Import
            </Text>
          </Pressable>
        </View>

        {/* Shuffle All Hero Banner */}
        <Pressable
          onPress={handleShuffleAll}
          style={({ pressed }) => [
            styles.heroCard,
            { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={styles.heroInfo}>
            <Text style={[typography.headline, { color: colors.textPrimary }]}>Shuffle Library</Text>
            <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
              {totalTrackCount} songs ready to play
            </Text>
          </View>
          <View style={[styles.shuffleIconBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.shuffleIconText}>🔀</Text>
          </View>
        </Pressable>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.title2, styles.sectionTitle, { color: colors.textPrimary }]}>
              Recently Played
            </Text>
            {recentlyPlayed.slice(0, 5).map((track, index) => (
              <TrackRow
                key={`recent_${track.id}_${index}`}
                track={track}
                isPlaying={currentTrackId === track.id && isPlaying}
                isFavorite={favorites.has(track.id)}
                getArtistName={getArtistName}
                onPress={(t) => loadAndPlay(t, recentlyPlayed, index)}
              />
            ))}
          </View>
        )}

        {/* Albums Carousel */}
        {albums.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.title2, styles.sectionTitle, { color: colors.textPrimary }]}>
              Albums
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {albums.map((album) => (
                <View key={album.id} style={{ width: 140 }}>
                  <AlbumCard
                    album={album}
                    onPress={(a) => router.push(`/album/${a.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.title2, styles.sectionTitle, { color: colors.textPrimary }]}>
              Recently Added
            </Text>
            {recentlyAdded.slice(0, 8).map((track, index) => (
              <TrackRow
                key={`added_${track.id}_${index}`}
                track={track}
                isPlaying={currentTrackId === track.id && isPlaying}
                isFavorite={favorites.has(track.id)}
                getArtistName={getArtistName}
                onPress={(t) => loadAndPlay(t, recentlyAdded, index)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  importBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.lg,
  },
  heroInfo: {
    gap: 4,
  },
  shuffleIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shuffleIconText: {
    fontSize: 20,
    color: '#FFF',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  horizontalScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});

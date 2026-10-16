/**
 * Overtone iOS — Artist Detail Screen
 *
 * Displays artist information, discography/albums carousel, and full track list.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useDatabase } from '../../src/hooks/useDatabase';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { TrackRow } from '../../src/components/TrackRow';
import { AlbumCard } from '../../src/components/AlbumCard';
import { EmptyState } from '../../src/components/EmptyState';
import { spacing, radii, layout } from '../../src/design/spacing';
import { typography } from '../../src/design/typography';
import type { MobileArtist, MobileAlbum, MobileTrack } from '../../src/domain/models';

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const db = useDatabase();
  const { loadAndPlay, currentTrack, isPlaying } = usePlayerStore();

  const [artist, setArtist] = useState<MobileArtist | null>(null);
  const [albums, setAlbums] = useState<MobileAlbum[]>([]);
  const [tracks, setTracks] = useState<MobileTrack[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!db.isReady || !id) return;
    const artistId = parseInt(id, 10);
    const art = db.artists.getById(artistId);
    setArtist(art);

    const als = db.albums.getByArtist(artistId);
    setAlbums(als);

    const trs = db.tracks.getByArtist(artistId);
    setTracks(trs);

    setFavorites(db.favorites.getIds());
  }, [db.isReady, id]);

  if (!artist) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="🎤" title="Artist Not Found" message="This artist has no tracks." />
      </SafeAreaView>
    );
  }

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
            <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.avatarText, { color: colors.accent }]}>
                {artist.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={[typography.largeTitle, styles.name, { color: colors.textPrimary }]}>
              {artist.name}
            </Text>

            <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
              {artist.albumCount} album{artist.albumCount === 1 ? '' : 's'} · {artist.trackCount} song{artist.trackCount === 1 ? '' : 's'}
            </Text>

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

            {albums.length > 0 && (
              <View style={styles.albumsSection}>
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
                        onPress={(a: MobileAlbum) => router.push(`/album/${a.id}`)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={[typography.title2, styles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>
              Songs
            </Text>
          </View>
        }
        renderItem={({ item, index }: { item: MobileTrack; index: number }) => (
          <TrackRow
            track={item}
            isPlaying={currentTrack?.id === item.id && isPlaying}
            isFavorite={favorites.has(item.id)}
            getArtistName={() => artist.name}
            onPress={(t: MobileTrack) => loadAndPlay(t, tracks, index)}
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
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
  },
  name: {
    textAlign: 'center',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
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
  albumsSection: {
    width: '100%',
    marginTop: spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  horizontalScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});

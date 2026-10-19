/**
 * Overtone iOS — Search Screen
 *
 * Instant search across songs, albums, artists, and playlists.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useDatabase } from '../../src/hooks/useDatabase';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { TrackRow } from '../../src/components/TrackRow';
import { AlbumCard } from '../../src/components/AlbumCard';
import { EmptyState } from '../../src/components/EmptyState';
import { spacing, radii, layout, MIN_TOUCH_TARGET } from '../../src/design/spacing';
import { typography } from '../../src/design/typography';
import type { SearchResults } from '../../src/domain/models';

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const db = useDatabase();
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const loadAndPlay = usePlayerStore((s) => s.loadAndPlay);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    tracks: [],
    albums: [],
    artists: [],
    playlists: [],
  });
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const executeSearch = useCallback((text: string) => {
    if (!db.isReady) return;
    const q = text.trim();
    if (!q) {
      setResults({ tracks: [], albums: [], artists: [], playlists: [] });
      return;
    }

    try {
      const res = db.search.search(q, 15);
      setResults(res);
      setFavorites(db.favorites.getIds());
    } catch (e) {
      console.warn('[Search] Error:', e);
    }
  }, [db.isReady]);

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  const hasResults =
    results.tracks.length > 0 ||
    results.albums.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0;

  const getArtistName = (id: number | null) => {
    if (!db.isReady || id === null) return 'Unknown Artist';
    return db.artists.getNameById(id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Songs, albums, artists, playlists"
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { color: colors.textPrimary }]}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Results View */}
      {!query.trim() ? (
        <EmptyState
          icon="🔍"
          title="Find Your Music"
          message="Search for any song, artist, album, or playlist in your local library."
        />
      ) : !hasResults ? (
        <EmptyState
          icon="❓"
          title="No Results Found"
          message={`No matches found for "${query}". Check spelling or try a different search.`}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.resultsScroll,
            { paddingBottom: layout.miniPlayerHeight + layout.tabBarHeight + spacing.xl },
          ]}
        >
          {/* Top Tracks */}
          {results.tracks.length > 0 && (
            <View style={styles.section}>
              <Text style={[typography.title3, styles.sectionTitle, { color: colors.textPrimary }]}>
                Songs
              </Text>
              {results.tracks.map((track, index) => (
                <TrackRow
                  key={`track_${track.id}`}
                  track={track}
                  isPlaying={currentTrackId === track.id && isPlaying}
                  isFavorite={favorites.has(track.id)}
                  getArtistName={getArtistName}
                  onPress={(t) => loadAndPlay(t, results.tracks, index)}
                />
              ))}
            </View>
          )}

          {/* Albums */}
          {results.albums.length > 0 && (
            <View style={styles.section}>
              <Text style={[typography.title3, styles.sectionTitle, { color: colors.textPrimary }]}>
                Albums
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {results.albums.map((album) => (
                  <View key={`album_${album.id}`} style={{ width: 140 }}>
                    <AlbumCard
                      album={album}
                      onPress={(a) => router.push(`/album/${a.id}`)}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <View style={styles.section}>
              <Text style={[typography.title3, styles.sectionTitle, { color: colors.textPrimary }]}>
                Artists
              </Text>
              {results.artists.map((artist) => (
                <Pressable
                  key={`artist_${artist.id}`}
                  onPress={() => router.push(`/artist/${artist.id}`)}
                  style={({ pressed }) => [
                    styles.artistRow,
                    {
                      backgroundColor: pressed ? colors.surfaceOverlay : 'transparent',
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[typography.headline, { color: colors.accent }]}>
                      {artist.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.artistInfo}>
                    <Text
                      style={[typography.body, { color: colors.textPrimary, fontWeight: '500' }]}
                    >
                      {artist.name}
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                      Artist · {artist.trackCount} song{artist.trackCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textTertiary }}>›</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Playlists */}
          {results.playlists.length > 0 && (
            <View style={styles.section}>
              <Text style={[typography.title3, styles.sectionTitle, { color: colors.textPrimary }]}>
                Playlists
              </Text>
              {results.playlists.map((playlist) => (
                <Pressable
                  key={`pl_${playlist.id}`}
                  onPress={() => router.push(`/playlist/${playlist.id}`)}
                  style={({ pressed }) => [
                    styles.playlistRow,
                    {
                      backgroundColor: pressed ? colors.surfaceOverlay : 'transparent',
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>📋</Text>
                  <View style={styles.playlistInfo}>
                    <Text
                      style={[typography.body, { color: colors.textPrimary, fontWeight: '500' }]}
                    >
                      {playlist.name}
                    </Text>
                    <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                      {playlist.trackCount} track{playlist.trackCount === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textTertiary }}>›</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radii.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  resultsScroll: {
    paddingTop: spacing.sm,
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
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_TARGET,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInfo: {
    flex: 1,
    gap: 2,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_TARGET,
  },
  playlistInfo: {
    flex: 1,
    gap: 2,
  },
});

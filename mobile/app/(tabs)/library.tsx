/**
 * Overtone iOS — Library Screen
 *
 * Full access to Songs, Albums, Artists, and Playlists.
 * Features segmented navigation, fast filtering, and in-app file import.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
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
import { spacing, radii, layout, MIN_TOUCH_TARGET } from '../../src/design/spacing';
import { typography } from '../../src/design/typography';
import type { MobileTrack, MobileAlbum, MobileArtist, MobilePlaylist } from '../../src/domain/models';

type Segment = 'songs' | 'albums' | 'artists' | 'playlists';

export default function LibraryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const db = useDatabase();
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const loadAndPlay = usePlayerStore((s) => s.loadAndPlay);

  const [activeSegment, setActiveSegment] = useState<Segment>('songs');
  const [filterText, setFilterText] = useState<string>('');

  const [tracks, setTracks] = useState<MobileTrack[]>([]);
  const [albums, setAlbums] = useState<MobileAlbum[]>([]);
  const [artists, setArtists] = useState<MobileArtist[]>([]);
  const [playlists, setPlaylists] = useState<MobilePlaylist[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const loadData = useCallback(() => {
    if (!db.isReady) return;
    try {
      setTracks(db.tracks.getAll());
      setAlbums(db.albums.getAll());
      setArtists(db.artists.getAll());
      setPlaylists(db.playlists.getAll());
      setFavorites(db.favorites.getIds());
    } catch (e) {
      console.warn('[Library] Failed to load:', e);
    }
  }, [db.isReady]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleImportMusic = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const assets = await FileImportService.pickFiles();
      if (assets.length > 0) {
        await FileImportService.importFilesAndSaveToLibrary(assets, db);
        loadData();
      }
    } catch (err) {
      console.error('[Library] Import error:', err);
    }
  };

  const handleCreatePlaylist = () => {
    Alert.prompt(
      'New Playlist',
      'Enter a name for this playlist',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (name?: string) => {
            if (name && name.trim()) {
              const id = db.playlists.create(name.trim(), 'local');
              loadData();
              router.push(`/playlist/${id}`);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getArtistName = useCallback((id: number | null) => {
    if (!db.isReady || id === null) return 'Unknown Artist';
    return db.artists.getNameById(id);
  }, [db.isReady]);

  // Filtered views
  const filteredTracks = useMemo(() => {
    if (!filterText) return tracks;
    const lower = filterText.toLowerCase();
    return tracks.filter((t) => t.title.toLowerCase().includes(lower));
  }, [tracks, filterText]);

  const filteredAlbums = useMemo(() => {
    if (!filterText) return albums;
    const lower = filterText.toLowerCase();
    return albums.filter((a) => a.title.toLowerCase().includes(lower));
  }, [albums, filterText]);

  const filteredArtists = useMemo(() => {
    if (!filterText) return artists;
    const lower = filterText.toLowerCase();
    return artists.filter((a) => a.name.toLowerCase().includes(lower));
  }, [artists, filterText]);

  const filteredPlaylists = useMemo(() => {
    if (!filterText) return playlists;
    const lower = filterText.toLowerCase();
    return playlists.filter((p) => p.name.toLowerCase().includes(lower));
  }, [playlists, filterText]);

  const handlePlayTrack = useCallback(
    (track: MobileTrack) => {
      const idx = filteredTracks.findIndex((t) => t.id === track.id);
      loadAndPlay(track, filteredTracks, idx >= 0 ? idx : 0);
    },
    [loadAndPlay, filteredTracks]
  );

  const renderTrackItem = useCallback(
    ({ item }: { item: MobileTrack }) => (
      <TrackRow
        track={item}
        isPlaying={currentTrackId === item.id && isPlaying}
        isFavorite={favorites.has(item.id)}
        getArtistName={getArtistName}
        onPress={handlePlayTrack}
      />
    ),
    [currentTrackId, isPlaying, favorites, getArtistName, handlePlayTrack]
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
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>Library</Text>
        <Pressable
          onPress={handleImportMusic}
          style={[styles.importBtn, { backgroundColor: colors.surfaceElevated }]}
        >
          <Text style={[typography.subheadline, { color: colors.accent, fontWeight: '600' }]}>
            + Import
          </Text>
        </Pressable>
      </View>

      {/* Segmented Controls */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceElevated }]}>
        {(['songs', 'albums', 'artists', 'playlists'] as Segment[]).map((seg) => (
          <Pressable
            key={seg}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveSegment(seg);
            }}
            style={[
              styles.segmentItem,
              activeSegment === seg && { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeSegment === seg ? '#FFF' : colors.textSecondary },
              ]}
            >
              {seg.charAt(0).toUpperCase() + seg.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Filter bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={{ color: colors.textTertiary, marginRight: spacing.xs }}>🔍</Text>
        <TextInput
          value={filterText}
          onChangeText={setFilterText}
          placeholder={`Filter ${activeSegment}...`}
          placeholderTextColor={colors.textTertiary}
          style={[styles.filterInput, { color: colors.textPrimary }]}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Segment Content */}
      {activeSegment === 'songs' && (
        <FlatList
          data={filteredTracks}
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
          ListEmptyComponent={
            <EmptyState
              icon="🎵"
              title="No Songs"
              message={filterText ? 'No songs match your filter.' : 'Your song library is empty.'}
              actionLabel={filterText ? undefined : 'Import Songs'}
              onAction={filterText ? undefined : handleImportMusic}
            />
          }
        />
      )}

      {activeSegment === 'albums' && (
        <FlatList
          data={filteredAlbums}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.albumColumnWrapper}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: layout.miniPlayerHeight + layout.tabBarHeight + spacing.xl,
          }}
          renderItem={({ item }) => (
            <AlbumCard
              album={item}
              onPress={(a) => router.push(`/album/${a.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="💿"
              title="No Albums"
              message={filterText ? 'No albums match your filter.' : 'No albums in your library yet.'}
            />
          }
        />
      )}

      {activeSegment === 'artists' && (
        <FlatList
          data={filteredArtists}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/artist/${item.id}`)}
              style={({ pressed }) => [
                styles.artistRow,
                {
                  backgroundColor: pressed ? colors.surfaceOverlay : 'transparent',
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={[styles.artistAvatar, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[typography.headline, { color: colors.accent }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.artistInfo}>
                <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '500' }]}>
                  {item.name}
                </Text>
                <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
                  {item.albumCount} album{item.albumCount === 1 ? '' : 's'} · {item.trackCount} song{item.trackCount === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={{ color: colors.textTertiary }}>›</Text>
            </Pressable>
          )}
          contentContainerStyle={{
            paddingBottom: layout.miniPlayerHeight + layout.tabBarHeight + spacing.xl,
          }}
          ListEmptyComponent={
            <EmptyState
              icon="🎤"
              title="No Artists"
              message={filterText ? 'No artists match your filter.' : 'No artists found in your library.'}
            />
          }
        />
      )}

      {activeSegment === 'playlists' && (
        <View style={{ flex: 1 }}>
          <View style={styles.playlistHeaderAction}>
            <Pressable
              onPress={handleCreatePlaylist}
              style={[styles.newPlaylistBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.newPlaylistText}>+ New Playlist</Text>
            </Pressable>
          </View>
          <FlatList
            data={filteredPlaylists}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/playlist/${item.id}`)}
                style={({ pressed }) => [
                  styles.playlistRow,
                  {
                    backgroundColor: pressed ? colors.surfaceOverlay : 'transparent',
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.playlistIconBox, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={{ fontSize: 20 }}>📋</Text>
                </View>
                <View style={styles.playlistInfo}>
                  <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '500' }]}>
                    {item.name}
                  </Text>
                  <Text style={[typography.subheadline, { color: colors.textSecondary }]}>
                    {item.trackCount} track{item.trackCount === 1 ? '' : 's'} · {item.source === 'synced' ? 'Synced from Desktop' : 'Local'}
                  </Text>
                </View>
                <Text style={{ color: colors.textTertiary }}>›</Text>
              </Pressable>
            )}
            contentContainerStyle={{
              paddingBottom: layout.miniPlayerHeight + layout.tabBarHeight + spacing.xl,
            }}
            ListEmptyComponent={
              <EmptyState
                icon="📋"
                title="No Playlists"
                message="Create playlists or sync them from your Overtone desktop app."
                actionLabel="Create Playlist"
                onAction={handleCreatePlaylist}
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  importBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    padding: 3,
    borderRadius: radii.md,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radii.md,
  },
  filterInput: {
    flex: 1,
    fontSize: 14,
  },
  albumColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  artistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInfo: {
    flex: 1,
    gap: 2,
  },
  playlistHeaderAction: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  newPlaylistBtn: {
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  newPlaylistText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  playlistIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
    gap: 2,
  },
});

/**
 * Overtone iOS — Sleek Alternative Views
 *
 * Dedicated screens for Favorites, Playlists, Search, and Settings
 * rendered seamlessly inside the Sleek Theme 3D Shell.
 * Full end-to-end behavior: real SQLite queries, playlist creation/management,
 * instant multi-category search, local file import, backup/restore, and Wi-Fi sync.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SleekHeader } from './SleekHeader';
import { SleekTrackRow } from './SleekTrackRow';
import {
  SleekSearchIcon,
  SleekPlayIcon,
  SleekRepeatIcon,
  SleekPlusIcon,
  SleekCloseIcon,
  SleekChevronRightIcon,
  SleekMusicNoteIcon,
  SleekImportIcon,
  SleekDesktopSyncIcon,
  SleekCheckIcon,
  SleekTrashIcon,
  SleekShareIcon,
  SleekMoreIcon,
} from './SleekIcons';
import { SleekEmptyState } from './SleekEmptyState';
import { SleekTrackActionSheet } from './SleekTrackActionSheet';
import { useDatabase } from '../../hooks/useDatabase';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUserStore } from '../../store/useUserStore';
import { useDrawerStore } from '../../store/useDrawerStore';
import { FileImportService, formatBytes, formatDuration } from '../../services/files/FileImportService';
import { BackupService } from '../../services/backup/BackupService';
import { SyncService } from '../../services/sync/SyncService';
import { sleekTokens } from '../../design/colors';
import type { MobileTrack, MobilePlaylist, SearchResults, PairedDevice } from '../../domain/models';

// ── 0. All Songs View (Desktop Overtone SongsView for iOS) ─────────────
export function SleekSongsView() {
  const db = useDatabase();
  const { loadAndPlay, currentTrack, isPlaying, duration } = usePlayerStore();
  const { setActiveTab } = useDrawerStore();
  const [tracks, setTracks] = useState<MobileTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'recent' | 'duration'>('title');
  const [actionTrack, setActionTrack] = useState<MobileTrack | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const loadTracks = useCallback(() => {
    if (!db.isReady) return;
    try {
      let orderSql = 'title COLLATE NOCASE ASC';
      if (sortBy === 'artist') orderSql = 'artist_id ASC, title COLLATE NOCASE ASC';
      if (sortBy === 'recent') orderSql = 'imported_at DESC';
      if (sortBy === 'duration') orderSql = 'duration DESC';
      const all = db.tracks.getAll(orderSql);
      setTracks(all);
    } catch (e) {
      console.warn('[SleekSongsView] Error loading tracks:', e);
    }
  }, [db.isReady, sortBy]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase().trim();
    return tracks.filter((t) => {
      const art = t.artistId && db.isReady ? db.artists.getNameById(t.artistId).toLowerCase() : '';
      const alb = t.albumId && db.isReady ? db.albums.getTitleById(t.albumId).toLowerCase() : '';
      return (
        t.title.toLowerCase().includes(q) ||
        art.includes(q) ||
        alb.includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q))
      );
    });
  }, [tracks, searchQuery, db.isReady]);

  const totalDuration = useMemo(() => {
    return filteredTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [filteredTracks]);

  const handlePlayAll = () => {
    if (filteredTracks.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    loadAndPlay(filteredTracks[0], filteredTracks, 0);
  };

  const handleShuffleAll = () => {
    if (filteredTracks.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const randomIndex = Math.floor(Math.random() * filteredTracks.length);
    loadAndPlay(filteredTracks[randomIndex], filteredTracks, randomIndex);
  };

  const handleQuickImport = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const picked = await FileImportService.pickFiles();
      if (picked.length === 0) return;

      setIsImporting(true);
      await FileImportService.importFilesAndSaveToLibrary(picked, db);
      setIsImporting(false);
      loadTracks();
    } catch (err) {
      setIsImporting(false);
      console.warn('[SleekSongsView] Import error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <SleekHeader greeting="All Songs" name="Library" />

      <View style={styles.sheetContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.handleContainer}><View style={styles.handlePill} /></View>

          {/* Section Header with Stats & Actions */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                All Tracks ({filteredTracks.length})
              </Text>
              <Text style={styles.songsSubtitle}>
                {formatDuration(totalDuration)} total listening time
              </Text>
            </View>

            {filteredTracks.length > 0 && (
              <View style={styles.headerActionBtns}>
                <Pressable
                  onPress={handlePlayAll}
                  style={styles.actionPillBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Play all songs"
                >
                  <SleekPlayIcon size={12} color="#FFFFFF" />
                  <Text style={styles.actionPillBtnText}>Play</Text>
                </Pressable>
                <Pressable
                  onPress={handleShuffleAll}
                  style={[styles.actionPillBtn, { backgroundColor: '#FEF3C7' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Shuffle all songs"
                >
                  <SleekRepeatIcon size={13} color="#92400E" />
                  <Text style={[styles.actionPillBtnText, { color: '#92400E' }]}>Shuffle</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Search Filter Bar */}
          <View style={[styles.searchBar, { marginTop: 12 }]}>
            <SleekSearchIcon size={17} color="#968D7B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter songs, artists, albums..."
              placeholderTextColor="#968D7B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="done"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <SleekCloseIcon size={15} color="#968D7B" />
              </Pressable>
            )}
          </View>

          {/* Sort Chips */}
          <View style={styles.sortChipsRow}>
            {(
              [
                { id: 'title', label: 'Title' },
                { id: 'artist', label: 'Artist' },
                { id: 'recent', label: 'Recent' },
                { id: 'duration', label: 'Duration' },
              ] as const
            ).map((chip) => {
              const isSelected = sortBy === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortBy(chip.id);
                  }}
                  style={[
                    styles.sortChip,
                    isSelected && styles.sortChipActive,
                  ]}
                >
                  <Text style={[styles.sortChipText, isSelected && styles.sortChipTextActive]}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Quick Import Banner */}
          <Pressable
            onPress={handleQuickImport}
            disabled={isImporting}
            style={styles.importBanner}
          >
            <View style={styles.importIconBadge}>
              <SleekImportIcon size={19} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.importBannerTitle}>
                {isImporting ? 'Importing Audio Files...' : 'Import Audio Files'}
              </Text>
              <Text style={styles.importBannerSubtitle}>
                Add .mp3, .flac, .m4a, or .wav from Files
              </Text>
            </View>
            <SleekChevronRightIcon size={16} color="#B5AC98" />
          </Pressable>

          {/* Tracks List */}
          <View style={{ gap: 8, marginTop: 10 }}>
            {filteredTracks.length > 0 ? (
              filteredTracks.map((track, index) => {
                const isPlayingItem = currentTrack?.id === track.id && isPlaying;
                const art = track.artistId && db.isReady ? db.artists.getNameById(track.artistId) : 'Unknown Artist';
                const alb = track.albumId && db.isReady ? db.albums.getTitleById(track.albumId) : '';
                const subtitle = alb ? `${art} · ${alb}` : art;

                return (
                  <SleekTrackRow
                    key={track.id}
                    title={track.title}
                    artistSubtitle={subtitle}
                    duration={track.duration > 0 ? track.duration : (currentTrack?.id === track.id && (currentTrack.duration || duration) > 0 ? (currentTrack.duration || duration) : 0)}
                    artworkUri={track.artworkUri}
                    isPlaying={isPlayingItem}
                    onPress={() => loadAndPlay(track, filteredTracks, index)}
                    onMorePress={() => setActionTrack(track)}
                  />
                );
              })
            ) : (
              <SleekEmptyState
                iconType="music"
                title={tracks.length === 0 ? 'No Songs Yet' : 'No Matching Songs'}
                subtitle={
                  tracks.length === 0
                    ? 'Import audio files from your iPhone or sync wirelessly from Overtone Desktop.'
                    : `No songs match "${searchQuery}". Clear search or try another query.`
                }
                actionLabel={tracks.length === 0 ? 'Import Audio Files' : 'Clear Search'}
                onAction={tracks.length === 0 ? handleQuickImport : () => setSearchQuery('')}
              />
            )}
          </View>
        </ScrollView>
      </View>

      <SleekTrackActionSheet
        visible={Boolean(actionTrack)}
        track={actionTrack}
        onClose={() => setActionTrack(null)}
        onTrackUpdated={() => loadTracks()}
        onTrackDeleted={() => loadTracks()}
      />
    </View>
  );
}

// ── 1. Favorites View ──────────────────────────────────────────────────
export function SleekFavoritesView() {
  const db = useDatabase();
  const { loadAndPlay, currentTrack, isPlaying, duration } = usePlayerStore();
  const { setActiveTab } = useDrawerStore();
  const [favoriteTracks, setFavoriteTracks] = useState<MobileTrack[]>([]);
  const [actionTrack, setActionTrack] = useState<MobileTrack | null>(null);

  const loadFavorites = useCallback(() => {
    if (!db.isReady) return;
    try {
      const favs = db.favorites.getAll();
      setFavoriteTracks(favs);
    } catch (e) {
      console.warn('[FavoritesView] Error loading favorites:', e);
    }
  }, [db.isReady]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handlePlayAll = () => {
    if (favoriteTracks.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    loadAndPlay(favoriteTracks[0], favoriteTracks, 0);
  };

  const handleShuffleAll = () => {
    if (favoriteTracks.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const randomIndex = Math.floor(Math.random() * favoriteTracks.length);
    loadAndPlay(favoriteTracks[randomIndex], favoriteTracks, randomIndex);
  };

  return (
    <View style={styles.container}>
      <SleekHeader greeting="Your Loved Tracks" name="Favorites" />

      <View style={styles.sheetContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.handleContainer}><View style={styles.handlePill} /></View>
          
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Liked Songs ({favoriteTracks.length})
            </Text>
            {favoriteTracks.length > 0 && (
              <View style={styles.headerActionBtns}>
                <Pressable
                  onPress={handlePlayAll}
                  style={styles.actionPillBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Play all favorites"
                >
                  <SleekPlayIcon size={12} color="#FFFFFF" />
                  <Text style={styles.actionPillBtnText}>Play</Text>
                </Pressable>
                <Pressable
                  onPress={handleShuffleAll}
                  style={[styles.actionPillBtn, { backgroundColor: '#FEF3C7' }]}
                  accessibilityRole="button"
                  accessibilityLabel="Shuffle all favorites"
                >
                  <SleekRepeatIcon size={13} color="#92400E" />
                  <Text style={[styles.actionPillBtnText, { color: '#92400E' }]}>Shuffle</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={{ gap: 8, marginTop: 16 }}>
            {favoriteTracks.length > 0 ? (
              favoriteTracks.map((track, index) => (
                <SleekTrackRow
                  key={track.id}
                  title={track.title}
                  artistSubtitle={track.artistId ? db.artists.getNameById(track.artistId) : 'Unknown Artist'}
                  duration={track.duration > 0 ? track.duration : (currentTrack?.id === track.id && (currentTrack.duration || duration) > 0 ? (currentTrack.duration || duration) : 0)}
                  artworkUri={track.artworkUri}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                  onPress={() => loadAndPlay(track, favoriteTracks, index)}
                  onMorePress={() => setActionTrack(track)}
                />
              ))
            ) : (
              <SleekEmptyState
                iconType="heart"
                title="No Favorites Yet"
                subtitle="Tap the heart icon on any song while listening to add it to your personal favorites collection."
                actionLabel="Browse Music"
                onAction={() => setActiveTab('home')}
              />
            )}
          </View>
        </ScrollView>
      </View>

      <SleekTrackActionSheet
        visible={Boolean(actionTrack)}
        track={actionTrack}
        onClose={() => setActionTrack(null)}
        onTrackUpdated={loadFavorites}
        onTrackDeleted={loadFavorites}
      />
    </View>
  );
}

// ── 2. Playlists View ──────────────────────────────────────────────────
export function SleekPlaylistsView() {
  const router = useRouter();
  const db = useDatabase();
  const [playlists, setPlaylists] = useState<MobilePlaylist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const loadPlaylists = useCallback(() => {
    if (!db.isReady) return;
    try {
      const all = db.playlists.getAll();
      setPlaylists(all);
    } catch (e) {
      console.warn('[PlaylistsView] Error loading playlists:', e);
    }
  }, [db.isReady]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleCreatePlaylist = () => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) {
      setIsCreating(false);
      return;
    }
    try {
      const plId = db.playlists.create(trimmed, 'local');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewPlaylistName('');
      setIsCreating(false);
      loadPlaylists();
      router.push(`/playlist/${plId}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const handlePlaylistOptions = (pl: MobilePlaylist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      pl.name,
      `${pl.trackCount} track${pl.trackCount === 1 ? '' : 's'}`,
      [
        {
          text: 'Open Playlist',
          onPress: () => router.push(`/playlist/${pl.id}`),
        },
        {
          text: 'Delete Playlist',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Playlist',
              `Are you sure you want to delete "${pl.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    db.playlists.delete(pl.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    loadPlaylists();
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SleekHeader greeting="Your Collection" name="Playlists" />

      <View style={styles.sheetContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.handleContainer}><View style={styles.handlePill} /></View>
          
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>All Playlists ({playlists.length})</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsCreating(true);
              }}
              style={styles.actionPillBtn}
              accessibilityRole="button"
              accessibilityLabel="Create new playlist"
            >
              <SleekPlusIcon size={12} color="#FFFFFF" />
              <Text style={styles.actionPillText}>New</Text>
            </Pressable>
          </View>

          {/* New Playlist Inline Prompt */}
          {isCreating && (
            <View style={styles.createCard}>
              <Text style={styles.createTitle}>New Playlist Name</Text>
              <View style={styles.createInputRow}>
                <TextInput
                  style={styles.createInput}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  placeholder="e.g. Chill Beats, Workout..."
                  placeholderTextColor="#9A91B3"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreatePlaylist}
                />
                <Pressable onPress={handleCreatePlaylist} style={styles.createSubmitBtn}>
                  <Text style={styles.createSubmitText}>Create</Text>
                </Pressable>
                <Pressable onPress={() => setIsCreating(false)} style={styles.createCancelBtn}>
                  <SleekCloseIcon size={14} color="#786C5A" />
                </Pressable>
              </View>
            </View>
          )}

          <View style={{ gap: 8, marginTop: 16 }}>
            {playlists.length > 0 ? (
              playlists.map((pl) => (
                <SleekTrackRow
                  key={pl.id}
                  title={pl.name}
                  artistSubtitle={`${pl.trackCount} track${pl.trackCount === 1 ? '' : 's'} · ${pl.source === 'synced' ? 'Synced from Desktop' : 'Local Playlist'}`}
                  artworkUri={pl.artworkUri}
                  onPress={() => router.push(`/playlist/${pl.id}`)}
                  onMorePress={() => handlePlaylistOptions(pl)}
                />
              ))
            ) : (
              <SleekEmptyState
                iconType="playlists"
                title="No Playlists Yet"
                subtitle="Organize your favorite music into custom playlists or sync them from your desktop app."
                actionLabel="+ Create Playlist"
                onAction={() => setIsCreating(true)}
              />
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ── 3. Search View ─────────────────────────────────────────────────────
export function SleekSearchView() {
  const router = useRouter();
  const db = useDatabase();
  const { loadAndPlay, currentTrack, isPlaying, duration } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');
  const [actionTrack, setActionTrack] = useState<MobileTrack | null>(null);
  const [results, setResults] = useState<SearchResults>({
    tracks: [],
    albums: [],
    artists: [],
    playlists: [],
  });

  const handleSearch = (text: string) => {
    setQuery(text);
    if (!text.trim() || !db.isReady) {
      setResults({ tracks: [], albums: [], artists: [], playlists: [] });
      return;
    }
    try {
      const res = db.search.search(text.trim(), 25);
      setResults(res);
    } catch {
      setResults({ tracks: [], albums: [], artists: [], playlists: [] });
    }
  };

  const hasAnyResults =
    results.tracks.length > 0 ||
    results.albums.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0;

  return (
    <View style={styles.container}>
      <SleekHeader greeting="Explore Library" name="Search" />

      <View style={styles.sheetContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.handleContainer}><View style={styles.handlePill} /></View>
          
          {/* Search Input Bar */}
          <View style={styles.searchBar}>
            <SleekSearchIcon size={18} color="#968D7B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs, artists, albums, playlists..."
              placeholderTextColor="#9A91B3"
              value={query}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <Pressable onPress={() => handleSearch('')} hitSlop={10}>
                <SleekCloseIcon size={14} color="#968D7B" />
              </Pressable>
            )}
          </View>

          {/* Filter Pills */}
          {query.trim().length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsRow}>
              {(['all', 'songs', 'artists', 'albums', 'playlists'] as const).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(cat);
                  }}
                  style={[
                    styles.filterPill,
                    category === cat && styles.filterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      category === cat && styles.filterPillTextActive,
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Results Sections */}
          {query.trim().length > 0 ? (
            hasAnyResults ? (
              <View style={{ gap: 20, marginTop: 16 }}>
                {/* Songs */}
                {(category === 'all' || category === 'songs') && results.tracks.length > 0 && (
                  <View>
                    <Text style={styles.subCategoryTitle}>Songs ({results.tracks.length})</Text>
                    <View style={{ gap: 8, marginTop: 6 }}>
                      {results.tracks.map((track, i) => (
                        <SleekTrackRow
                          key={track.id}
                          title={track.title}
                          artistSubtitle={track.artistId ? db.artists.getNameById(track.artistId) : 'Unknown Artist'}
                          duration={track.duration > 0 ? track.duration : (currentTrack?.id === track.id && (currentTrack.duration || duration) > 0 ? (currentTrack.duration || duration) : 0)}
                          artworkUri={track.artworkUri}
                          isPlaying={currentTrack?.id === track.id && isPlaying}
                          onPress={() => loadAndPlay(track, results.tracks, i)}
                          onMorePress={() => setActionTrack(track)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Artists */}
                {(category === 'all' || category === 'artists') && results.artists.length > 0 && (
                  <View>
                    <Text style={styles.subCategoryTitle}>Artists ({results.artists.length})</Text>
                    <View style={{ gap: 8, marginTop: 6 }}>
                      {results.artists.map((artist) => (
                        <Pressable
                          key={artist.id}
                          onPress={() => router.push(`/artist/${artist.id}`)}
                          style={styles.resultItemRow}
                        >
                          <View style={styles.artistSquircle}>
                            <Text style={styles.artistInitials}>
                              {artist.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultItemTitle}>{artist.name}</Text>
                            <Text style={styles.resultItemSub}>
                              {artist.albumCount} albums · {artist.trackCount} songs
                            </Text>
                          </View>
                          <SleekChevronRightIcon size={16} color="#B5AC98" />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Albums */}
                {(category === 'all' || category === 'albums') && results.albums.length > 0 && (
                  <View>
                    <Text style={styles.subCategoryTitle}>Albums ({results.albums.length})</Text>
                    <View style={{ gap: 8, marginTop: 6 }}>
                      {results.albums.map((album) => (
                        <Pressable
                          key={album.id}
                          onPress={() => router.push(`/album/${album.id}`)}
                          style={styles.resultItemRow}
                        >
                          {album.artworkUri ? (
                            <Image
                              source={{ uri: album.artworkUri }}
                              style={styles.albumArt}
                              contentFit="cover"
                            />
                          ) : (
                            <View style={[styles.albumArt, styles.albumArtFallback]}>
                              <SleekMusicNoteIcon size={20} color="#D97706" />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultItemTitle}>{album.title}</Text>
                            <Text style={styles.resultItemSub}>
                              {album.artistName || 'Unknown Artist'} · {album.trackCount} songs
                            </Text>
                          </View>
                          <SleekChevronRightIcon size={16} color="#B5AC98" />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Playlists */}
                {(category === 'all' || category === 'playlists') && results.playlists.length > 0 && (
                  <View>
                    <Text style={styles.subCategoryTitle}>Playlists ({results.playlists.length})</Text>
                    <View style={{ gap: 8, marginTop: 6 }}>
                      {results.playlists.map((pl) => (
                        <Pressable
                          key={pl.id}
                          onPress={() => router.push(`/playlist/${pl.id}`)}
                          style={styles.resultItemRow}
                        >
                          <View style={styles.playlistIconBox}>
                            <SleekMusicNoteIcon size={20} color="#D97706" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resultItemTitle}>{pl.name}</Text>
                            <Text style={styles.resultItemSub}>{pl.trackCount} songs</Text>
                          </View>
                          <SleekChevronRightIcon size={16} color="#B5AC98" />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <SleekEmptyState
                iconType="search"
                title="No Results Found"
                subtitle={`No matches found for "${query}". Check the spelling or try searching for a different song, artist, or album.`}
              />
            )
          ) : (
            /* Idle Search Discovery */
            <View style={styles.idleDiscoveryCard}>
              <View style={styles.idleDiscoveryIconBox}>
                <SleekSearchIcon size={24} color="#D97706" />
              </View>
              <Text style={styles.idleDiscoveryTitle}>Quick Music Discovery</Text>
              <Text style={styles.idleDiscoverySub}>
                Instant multi-category search across all your locally imported songs, artists, albums, and playlists.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <SleekTrackActionSheet
        visible={Boolean(actionTrack)}
        track={actionTrack}
        onClose={() => setActionTrack(null)}
        onTrackUpdated={() => handleSearch(query)}
        onTrackDeleted={() => handleSearch(query)}
      />
    </View>
  );
}

// ── 4. Settings View ───────────────────────────────────────────────────
export function SleekSettingsView() {
  const router = useRouter();
  const db = useDatabase();
  const { userName, setUserName, loadUserName } = useUserStore();
  const [gapless, setGapless] = useState(true);
  const [resumeOnLaunch, setResumeOnLaunch] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [isSaved, setIsSaved] = useState(false);

  // Storage stats
  const [storageUsage, setStorageUsage] = useState({ audioBytes: 0, artworkBytes: 0, totalBytes: 0 });
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);

  const loadSettingsData = useCallback(async () => {
    if (!db.isReady) return;
    try {
      loadUserName(db);
      setGapless(db.settings.get('gapless', 'true') === 'true');
      setResumeOnLaunch(db.settings.get('resumeOnLaunch', 'false') === 'true');
      setPairedDevices(db.pairedDevices.getAll());

      const usage = await FileImportService.getStorageUsage();
      setStorageUsage(usage);
    } catch (e) {
      console.warn('[SettingsView] Error loading data:', e);
    }
  }, [db.isReady, loadUserName]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  useEffect(() => {
    setEditName(userName);
  }, [userName]);

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUserName(trimmed, db);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleImportMusic = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const assets = await FileImportService.pickFiles();
      if (!assets || assets.length === 0) return;

      setIsImporting(true);
      setImportProgress(`Importing 0 of ${assets.length}...`);

      const result = await FileImportService.importFilesAndSaveToLibrary(
        assets,
        db,
        (curr, tot, fileName) => {
          setImportProgress(`Importing ${curr} of ${tot}: ${fileName.slice(0, 20)}...`);
        }
      );

      setIsImporting(false);
      setImportProgress(null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Import Complete',
        `Successfully imported ${result.imported} track${result.imported === 1 ? '' : 's'}.${result.failed > 0 ? ` (${result.failed} failed/unsupported)` : ''}`,
        [{ text: 'OK', onPress: loadSettingsData }]
      );
    } catch (err: any) {
      setIsImporting(false);
      setImportProgress(null);
      Alert.alert('Import Failed', err?.message || 'Could not import audio files');
    }
  };

  const handleExportBackup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await BackupService.exportBackup(db);
    if (res.success && res.filePath) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Backup Exported',
        'Your library, playlists, favorites, and settings have been safely backed up to a JSON file.',
        [
          { text: 'Done', style: 'cancel' },
          {
            text: 'Share / Save...',
            onPress: () => BackupService.shareBackup(res.filePath!),
          },
        ]
      );
    } else {
      Alert.alert('Backup Failed', res.error || 'Could not export backup');
    }
  };

  const handleRestoreBackup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const pick = await BackupService.pickBackupFile();
    if (pick.canceled || !pick.uri) return;

    const preview = await BackupService.previewBackup(pick.uri);
    if (!preview.valid || !preview.summary) {
      Alert.alert('Invalid Backup', preview.error || 'The selected file is not a valid Overtone backup.');
      return;
    }

    Alert.alert(
      'Confirm Restore',
      `Restore backup created on ${new Date(preview.summary.createdAt).toLocaleDateString()} with ${preview.summary.playlistCount} playlists and ${preview.summary.favoriteCount} favorites?\n\nExisting audio files will NOT be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'default',
          onPress: async () => {
            const restored = await BackupService.restoreBackup(pick.uri!, db);
            if (restored.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Restore Complete',
                `Restored ${restored.restoredPlaylists} playlists and ${restored.restoredFavorites} favorites.`,
                [{ text: 'OK', onPress: loadSettingsData }]
              );
            } else {
              Alert.alert('Restore Failed', restored.error || 'Could not restore backup.');
            }
          },
        },
      ]
    );
  };

  const handleRevokeDevice = (device: PairedDevice) => {
    Alert.alert(
      'Disconnect Desktop',
      `Are you sure you want to disconnect from "${device.name}"? Pairing credentials will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await SyncService.revoke(device.id);
            db.pairedDevices.revoke(device.id);
            loadSettingsData();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SleekHeader greeting="Preferences" name="Settings" />

      <View style={styles.sheetContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.handleContainer}><View style={styles.handlePill} /></View>
          
          {/* User Profile */}
          <Text style={[styles.sectionHeader, { marginTop: 14 }]}>User Profile</Text>
          <View style={styles.settingsCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatarSquircle}>
                <Text style={styles.avatarMonogramText}>
                  {(userName || 'O').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>ACTIVE PROFILE</Text>
                <Text style={styles.profileCurrentName}>{userName}</Text>
              </View>
            </View>

            <View style={styles.nameInputRow}>
              <TextInput
                style={styles.nameTextInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter custom username..."
                placeholderTextColor="#9A91B3"
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={25}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <Pressable
                onPress={handleSaveName}
                style={({ pressed }) => [
                  styles.saveBtn,
                  isSaved && { backgroundColor: '#10B981' },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Save username"
              >
                {isSaved ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <SleekCheckIcon size={14} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Saved</Text>
                  </View>
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Music Import */}
          <Text style={styles.sectionHeader}>Music Library & Import</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Import Audio Files</Text>
                <Text style={styles.settingDesc}>
                  Import MP3, FLAC, M4A, WAV, or AAC from iOS Files
                </Text>
                {isImporting && importProgress && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <ActivityIndicator size="small" color="#F9A826" />
                    <Text style={{ fontSize: 12, color: '#F9A826', fontWeight: '600' }}>
                      {importProgress}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={handleImportMusic}
                disabled={isImporting}
                style={({ pressed }) => [
                  styles.actionPill,
                  pressed && styles.actionPillPressed,
                  isImporting && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Import audio files from iOS Files"
              >
                <SleekImportIcon size={14} color="#92400E" />
                <Text style={styles.actionPillText}>{isImporting ? 'Importing…' : 'Import'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Backup & Restore */}
          <Text style={styles.sectionHeader}>Library Backup & Portability</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Export Library Backup</Text>
                <Text style={styles.settingDesc}>
                  Save playlists, favorites, and settings to a JSON backup file
                </Text>
              </View>
              <Pressable
                onPress={handleExportBackup}
                style={({ pressed }) => [
                  styles.actionPill,
                  pressed && styles.actionPillPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Export library backup"
              >
                <SleekShareIcon size={14} color="#92400E" />
                <Text style={styles.actionPillText}>Export</Text>
              </Pressable>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Restore from Backup</Text>
                <Text style={styles.settingDesc}>
                  Safely merge playlists and favorites from a backup file
                </Text>
              </View>
              <Pressable
                onPress={handleRestoreBackup}
                style={({ pressed }) => [
                  styles.actionPill,
                  pressed && styles.actionPillPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Restore library backup"
              >
                <SleekImportIcon size={14} color="#92400E" />
                <Text style={styles.actionPillText}>Restore</Text>
              </Pressable>
            </View>
          </View>

          {/* Storage Details */}
          <Text style={styles.sectionHeader}>Storage & Cache</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Audio Files</Text>
              </View>
              <View style={styles.storageBadge}>
                <Text style={styles.storageBadgeText}>{formatBytes(storageUsage.audioBytes)}</Text>
              </View>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Cached Artwork</Text>
              </View>
              <View style={styles.storageBadge}>
                <Text style={styles.storageBadgeText}>{formatBytes(storageUsage.artworkBytes)}</Text>
              </View>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, { fontWeight: '700' }]}>Total Storage</Text>
              </View>
              <View style={[styles.storageBadge, { backgroundColor: '#FDE68A' }]}>
                <Text style={[styles.storageBadgeText, { color: '#78350F' }]}>
                  {formatBytes(storageUsage.totalBytes)}
                </Text>
              </View>
            </View>
          </View>

          {/* Playback Preferences */}
          <Text style={styles.sectionHeader}>Playback</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Gapless Playback</Text>
                <Text style={styles.settingDesc}>Seamless transition between queued tracks</Text>
              </View>
              <Switch
                value={gapless}
                onValueChange={(val) => {
                  setGapless(val);
                  db.settings.set('gapless', val ? 'true' : 'false');
                }}
                trackColor={{ true: '#F9A826', false: '#EAE3D2' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Resume on Launch</Text>
                <Text style={styles.settingDesc}>Restore last played track and position</Text>
              </View>
              <Switch
                value={resumeOnLaunch}
                onValueChange={(val) => {
                  setResumeOnLaunch(val);
                  db.settings.set('resumeOnLaunch', val ? 'true' : 'false');
                }}
                trackColor={{ true: '#F9A826', false: '#EAE3D2' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Connectivity / Wi-Fi Sync */}
          <Text style={styles.sectionHeader}>Wi-Fi Desktop Sync</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Connect to Desktop</Text>
                <Text style={styles.settingDesc}>
                  Exchange playlists with Overtone on Mac or PC
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/sync/pair')}
                style={({ pressed }) => [
                  styles.actionPill,
                  pressed && styles.actionPillPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Connect to Desktop"
              >
                <SleekDesktopSyncIcon size={14} color="#92400E" />
                <Text style={styles.actionPillText}>Pair</Text>
              </Pressable>
            </View>

            {pairedDevices.length > 0 && (
              <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: '#FDE68A', paddingTop: 8 }}>
                <Text style={[styles.profileLabel, { marginBottom: 8 }]}>PAIRED DESKTOPS</Text>
                {pairedDevices.map((dev) => (
                  <View key={dev.id} style={styles.deviceRow}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.deviceNameText}>{dev.name}</Text>
                      <Text style={styles.deviceIpText}>{dev.ip}:{dev.port}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleRevokeDevice(dev)}
                      style={styles.disconnectBtn}
                      hitSlop={8}
                    >
                      <SleekTrashIcon size={13} color="#DC2626" />
                      <Text style={styles.disconnectText}>Disconnect</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* About */}
          <Text style={styles.sectionHeader}>About</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Version</Text>
              </View>
              <View style={styles.storageBadge}>
                <Text style={styles.storageBadgeText}>1.0.0 (Overtone iOS)</Text>
              </View>
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Architecture</Text>
              </View>
              <View style={styles.storageBadge}>
                <Text style={styles.storageBadgeText}>Local-First SQLite &bull; Private</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: sleekTokens.headerGradientStart,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: sleekTokens.cardBorderRadius,
    borderTopRightRadius: sleekTokens.cardBorderRadius,
    paddingTop: 10,
    marginTop: 10,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 120,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 6,
  },
  handlePill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EAE3D2',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F180B',
    letterSpacing: 0.2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#968D7B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 30,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F9A826',
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionPillBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 46,
    marginTop: 12,
    gap: 12,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#1F180B',
    paddingVertical: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 6,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F8F4EC',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EFE7D8',
  },
  filterPillActive: {
    backgroundColor: '#F9A826',
    borderColor: '#F9A826',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#786C5A',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subCategoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F180B',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  resultItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 12,
    gap: 14,
  },
  artistSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F9A826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInitials: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  albumArt: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  albumArtFallback: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultItemTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1F180B',
  },
  resultItemSub: {
    fontSize: 12,
    color: '#786C5A',
    marginTop: 2,
  },
  idleDiscoveryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 28,
    backgroundColor: '#FFFDF5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 22,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  idleDiscoveryIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  idleDiscoveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F180B',
    marginBottom: 6,
  },
  idleDiscoverySub: {
    fontSize: 13,
    color: '#786C5A',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  settingsCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  avatarSquircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#1C150A',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 168, 38, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMonogramText: {
    color: '#FBBF24',
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#968D7B',
    letterSpacing: 0.6,
  },
  profileCurrentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F180B',
    marginTop: 2,
  },
  nameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 4,
  },
  nameTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: '#1F180B',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  saveBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#F9A826',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F180B',
  },
  settingDesc: {
    fontSize: 12.5,
    color: '#786C5A',
    marginTop: 3,
    lineHeight: 17,
  },
  settingValue: {
    fontSize: 13,
    color: '#786C5A',
    fontWeight: '500',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#FDE68A',
    opacity: 0.5,
    marginVertical: 2,
  },
  storageBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  storageBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  actionPillPressed: {
    backgroundColor: '#FDE68A',
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.2,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  deviceNameText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F180B',
  },
  deviceIpText: {
    fontSize: 11.5,
    color: '#786C5A',
    marginTop: 2,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  disconnectText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#FFFDF5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F180B',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#786C5A',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F9A826',
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  createCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F9A826',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  createTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F180B',
    marginBottom: 10,
  },
  createInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    fontSize: 14,
    color: '#1F180B',
  },
  createSubmitBtn: {
    paddingHorizontal: 16,
    height: 42,
    backgroundColor: '#F9A826',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  createSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  createCancelBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F0ECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCancelText: {
    color: '#1F180B',
    fontSize: 14,
    fontWeight: '700',
  },
  songsSubtitle: {
    fontSize: 12.5,
    color: '#786C5A',
    marginTop: 2,
  },
  sortChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  sortChipActive: {
    backgroundColor: '#F9A826',
    borderColor: '#F9A826',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#786C5A',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  importBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginTop: 6,
  },
  importIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F180B',
  },
  importBannerSubtitle: {
    fontSize: 11.5,
    color: '#786C5A',
    marginTop: 1,
  },
});

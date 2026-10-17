/**
 * Overtone iOS — Sleek Playlist Detail Screen
 *
 * Implements the full native Sleek iOS experience for a single playlist:
 * 1. Golden procedural music card / album cover matching rest of the Sleek theme
 * 2. Small pencil edit icon on playlist card top-right for editing details & managing songs
 * 3. Back navigation header with desktop sync trigger
 * 4. Play, Shuffle, and "+ Add Songs" action pills
 * 5. SleekTrackRows with durations, squircle covers, and track action sheets
 * 6. Add Songs modal with duplicate song prevention & warning popups
 * 7. Edit Playlist modal with name editing, pin toggle, quick remove & bulk remove songs, and delete
 * 8. Persistent floating SleekMiniPlayer pinned at the bottom
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Platform,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useDatabase } from '../../src/hooks/useDatabase';
import { usePlayerStore } from '../../src/store/usePlayerStore';
import { SleekTrackRow } from '../../src/components/sleek/SleekTrackRow';
import { SleekMiniPlayer } from '../../src/components/sleek/SleekMiniPlayer';
import { SleekTrackActionSheet } from '../../src/components/sleek/SleekTrackActionSheet';
import { SleekWateryDownloadButton } from '../../src/components/sleek/SleekWateryDownloadButton';
import {
  SleekChevronLeftIcon,
  SleekPlayIcon,
  SleekShuffleIcon,
  SleekPlusIcon,
  SleekPlaylistsIcon,
  SleekDesktopSyncIcon,
  SleekSearchIcon,
  SleekCloseIcon,
  SleekCheckIcon,
  SleekMusicNoteIcon,
  SleekEditIcon,
  SleekTrashIcon,
  SleekImportIcon,
  SleekDownloadedIcon,
} from '../../src/components/sleek/SleekIcons';
import { SyncService } from '../../src/services/sync/SyncService';
import { FileImportService, formatDuration, formatTotalDuration } from '../../src/services/files/FileImportService';
import { sleekTokens } from '../../src/design/colors';
import { layout } from '../../src/design/spacing';
import type { MobilePlaylist, MobileTrack, PairedDevice } from '../../src/domain/models';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useDatabase();
  const { loadAndPlay, currentTrack, isPlaying } = usePlayerStore();

  const [playlist, setPlaylist] = useState<MobilePlaylist | null>(null);
  const [tracks, setTracks] = useState<MobileTrack[]>([]);
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  const [actionTrack, setActionTrack] = useState<MobileTrack | null>(null);

  // Add Songs Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [allLibraryTracks, setAllLibraryTracks] = useState<MobileTrack[]>([]);

  // Edit Playlist Details & Song Management Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedRemoveIds, setSelectedRemoveIds] = useState<Set<number>>(new Set());

  const loadData = useCallback(() => {
    if (!db.isReady || !id) return;
    const playlistId = parseInt(id, 10);
    const pl = db.playlists.getById(playlistId);
    setPlaylist(pl);

    const trs = db.playlists.getTracks(playlistId);
    setTracks(trs);

    setPairedDevices(db.pairedDevices.getAll());
  }, [db.isReady, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAllTracks = useCallback(() => {
    if (!db.isReady) return;
    setAllLibraryTracks(db.tracks.getAll());
  }, [db.isReady]);

  // ── Add Songs Handlers ────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadAllTracks();
    setAddSearchQuery('');
    setIsAddModalOpen(true);
  };

  const handleAddSongToPlaylist = (trackItem: MobileTrack) => {
    if (!db.isReady || !playlist) return;

    if (db.playlists.hasTrack(playlist.id, trackItem.id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Already in Playlist',
        `"${trackItem.title}" is already in "${playlist.name}". A song can only be added once to a playlist.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    const added = db.playlists.addTrack(playlist.id, trackItem.id);
    if (added) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Already in Playlist',
        `"${trackItem.title}" is already in "${playlist.name}".`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const filteredLibraryTracks = useMemo(() => {
    if (!addSearchQuery.trim()) return allLibraryTracks;
    const q = addSearchQuery.toLowerCase();
    return allLibraryTracks.filter((t) => {
      const titleMatch = t.title.toLowerCase().includes(q);
      const artistMatch = db.isReady && t.artistId ? db.artists.getNameById(t.artistId).toLowerCase().includes(q) : false;
      return titleMatch || artistMatch;
    });
  }, [allLibraryTracks, addSearchQuery, db]);

  // ── Edit Playlist Details & Song Management Handlers ─────────────────
  const handleOpenEditModal = () => {
    if (!playlist) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditName(playlist.name);
    setIsPinned(Boolean(playlist.isPinned));
    setSelectedRemoveIds(new Set());
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!playlist || !db.isReady) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      Alert.alert('Name Required', 'Please enter a valid playlist name.');
      return;
    }

    if (trimmed !== playlist.name) {
      db.playlists.rename(playlist.id, trimmed);
    }
    if (Boolean(playlist.isPinned) !== isPinned) {
      db.playlists.togglePin(playlist.id);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    loadData();
    setIsEditModalOpen(false);
  };

  const handleQuickRemoveSong = (trackId: number, trackTitle: string) => {
    if (!playlist || !db.isReady) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    db.playlists.removeTrack(playlist.id, trackId);
    setSelectedRemoveIds((prev) => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
    loadData();
  };

  const handleToggleSelectSong = (trackId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRemoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedRemoveIds.size === tracks.length) {
      setSelectedRemoveIds(new Set());
    } else {
      setSelectedRemoveIds(new Set(tracks.map((t) => t.id)));
    }
  };

  const handleBulkRemove = () => {
    if (!playlist || !db.isReady || selectedRemoveIds.size === 0) return;
    const count = selectedRemoveIds.size;
    Alert.alert(
      'Remove Songs',
      `Remove ${count} ${count === 1 ? 'song' : 'songs'} from "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            for (const trackId of selectedRemoveIds) {
              db.playlists.removeTrack(playlist.id, trackId);
            }
            setSelectedRemoveIds(new Set());
            loadData();
          },
        },
      ]
    );
  };

  const handleDeletePlaylist = () => {
    if (!playlist || !db.isReady) return;
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"? This will permanently remove the playlist.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            db.playlists.delete(playlist.id);
            setIsEditModalOpen(false);
            router.back();
          },
        },
      ]
    );
  };

  const totalDurationSeconds = useMemo(() => {
    return tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [tracks]);

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadedSongsCount, setDownloadedSongsCount] = useState(0);
  const [totalSongsToDownload, setTotalSongsToDownload] = useState(0);
  const [downloadingTrackId, setDownloadingTrackId] = useState<number | null>(null);

  const streamTracksCount = useMemo(() => {
    return tracks.filter((t) => t.fileUri?.startsWith('http://') || t.format === 'stream').length;
  }, [tracks]);

  const downloadedTracksCount = useMemo(() => {
    return tracks.filter((t) => Boolean(t.fileUri && !t.fileUri.startsWith('http://') && t.format !== 'stream')).length;
  }, [tracks]);

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

  const handleSendToDesktop = () => {
    if (!playlist) return;
    if (pairedDevices.length === 0) {
      Alert.alert(
        'No Paired Desktop',
        'Connect to your Overtone desktop app first in Settings → Wi-Fi Sync.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: () => router.push('/sync/pair') },
        ]
      );
      return;
    }

    const device = pairedDevices[0];
    Alert.alert(
      'Send to Desktop',
      `Send playlist "${playlist.name}" (${tracks.length} tracks) to ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const payload = {
              playlistName: playlist.name,
              tracks: tracks.map((t) => ({
                title: t.title,
                artist: db.artists.getNameById(t.artistId),
                album: db.albums.getTitleById(t.albumId),
                duration: t.duration,
                genre: t.genre || undefined,
              })),
            };

            const res = await SyncService.sendPlaylist(device, payload);
            if (res.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sent!', `Playlist sent to ${device.name}. Check desktop to confirm.`);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Transfer Failed', res.error || 'Could not send playlist.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadAllOffline = async () => {
    const toDownload = tracks.filter((t) => t.fileUri?.startsWith('http://') || t.format === 'stream');
    if (toDownload.length === 0 || isDownloadingAll || !db.isReady) return;

    setIsDownloadingAll(true);
    setTotalSongsToDownload(toDownload.length);
    setDownloadedSongsCount(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let successCount = 0;

    for (const tr of toDownload) {
      setDownloadingTrackId(tr.id);
      try {
        const res = await FileImportService.downloadRemoteTrack(tr.fileUri, tr.id, tr.title);
        if (res) {
          let localArtUri: string | undefined = undefined;
          if (tr.artworkUri && tr.artworkUri.startsWith('http://')) {
            const artRes = await FileImportService.downloadRemoteArtwork(tr.artworkUri, tr.id);
            if (artRes) localArtUri = artRes;
          }
          db.tracks.updateFileUri(tr.id, res.localUri, 'mp3', res.fileSize, localArtUri);
          successCount++;
          setDownloadedSongsCount(successCount);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          loadData();
        }
      } catch (err) {
        console.warn(`Failed downloading ${tr.title}:`, err);
      }
    }

    setDownloadingTrackId(null);
    setIsDownloadingAll(false);
    loadData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Download Finished',
      `Saved ${successCount} of ${toDownload.length} songs for offline listening.`
    );
  };

  const getArtistName = (artistId: number | null) => {
    if (!db.isReady || !artistId) return 'Unknown Artist';
    return db.artists.getNameById(artistId);
  };

  const playlistArtwork = playlist?.artworkUri || (tracks.length > 0 && tracks[0].artworkUri ? tracks[0].artworkUri : null);

  if (!playlist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <SleekChevronLeftIcon size={20} color="#1F180B" />
            <Text style={styles.backBtnText}>Playlists</Text>
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBadge}>
            <SleekPlaylistsIcon size={44} color="#D97706" />
          </View>
          <Text style={styles.emptyTitle}>Playlist Not Found</Text>
          <Text style={styles.emptyDesc}>This playlist may have been removed or renamed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to Playlists"
        >
          <SleekChevronLeftIcon size={20} color="#1F180B" />
          <Text style={styles.backBtnText}>Playlists</Text>
        </Pressable>

        <Text style={styles.navBarTitle} numberOfLines={1}>
          {playlist.name}
        </Text>

        <Pressable
          onPress={handleSendToDesktop}
          style={({ pressed }) => [styles.navBarIconBtn, pressed && styles.actionPillPressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Send playlist to Desktop"
        >
          <SleekDesktopSyncIcon size={19} color="#92400E" />
        </Pressable>
      </View>

      {/* ── Main Track List & Header ──────────────────────────────────── */}
      <FlatList
        data={tracks}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: layout.miniPlayerHeight + 48,
        }}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Golden Procedural Music Card / Artwork with Pencil Edit Badge */}
            <View style={styles.cardWrapper}>
              {playlistArtwork ? (
                <Image
                  source={{ uri: playlistArtwork }}
                  style={styles.cardArtwork}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={styles.proceduralCard}>
                  <View style={styles.goldenIconCircle}>
                    <SleekPlaylistsIcon size={44} color="#D97706" />
                  </View>
                </View>
              )}

              {/* Small Pencil Icon on Card Top-Right */}
              <Pressable
                onPress={handleOpenEditModal}
                style={({ pressed }) => [
                  styles.cardEditBadge,
                  pressed && { transform: [{ scale: 0.9 }] },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Edit playlist details and manage songs"
              >
                <SleekEditIcon size={14} color="#92400E" />
              </Pressable>
            </View>

            {/* Playlist Title */}
            <Text style={styles.titleText} numberOfLines={2}>
              {playlist.name}
            </Text>

            {/* Track count & Total Duration Details */}
            <View style={styles.metadataRow}>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>
                  {playlist.source === 'synced' ? 'Synced from Desktop' : 'Custom Playlist'}
                </Text>
              </View>
              {downloadedTracksCount > 0 && (
                <View style={styles.downloadStatusPill}>
                  <SleekDownloadedIcon size={12} color="#FFFFFF" fill="#D97706" />
                  <Text style={styles.downloadStatusPillText}>
                    {downloadedTracksCount === tracks.length
                      ? 'Downloaded'
                      : `${downloadedTracksCount}/${tracks.length} downloaded`}
                  </Text>
                </View>
              )}
              <Text style={styles.metadataText}>
                {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
                {totalDurationSeconds > 0 ? ` · ${formatTotalDuration(totalDurationSeconds)}` : ''}
              </Text>
            </View>

            {/* Action Buttons Scrollable Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.actionsScrollContent}
              style={styles.actionsScrollView}
            >
              {/* Play All Button */}
              <Pressable
                onPress={handlePlayAll}
                disabled={tracks.length === 0}
                style={({ pressed }) => [
                  styles.playAllBtn,
                  tracks.length === 0 && { opacity: 0.5 },
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Play all tracks"
              >
                <SleekPlayIcon size={14} color="#FFFFFF" />
                <Text style={styles.playAllBtnText}>Play</Text>
              </Pressable>

              {/* Shuffle Button */}
              <Pressable
                onPress={handleShuffleAll}
                disabled={tracks.length === 0}
                style={({ pressed }) => [
                  styles.actionPill,
                  tracks.length === 0 && { opacity: 0.5 },
                  pressed && styles.actionPillPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Shuffle tracks"
              >
                <SleekShuffleIcon size={14} color="#92400E" />
                <Text style={styles.actionPillText}>Shuffle</Text>
              </Pressable>

              {/* Add Songs Button */}
              <Pressable
                onPress={handleOpenAddModal}
                style={({ pressed }) => [
                  styles.actionPill,
                  pressed && styles.actionPillPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add songs to playlist"
              >
                <SleekPlusIcon size={14} color="#92400E" />
                <Text style={styles.actionPillText}>Add Songs</Text>
              </Pressable>

              {/* Download Offline Button with Amber Watery Wave Fill */}
              {(streamTracksCount > 0 || isDownloadingAll || (downloadedTracksCount > 0 && tracks.length > 0)) && (
                <SleekWateryDownloadButton
                  isDownloading={isDownloadingAll}
                  downloadedCount={downloadedSongsCount}
                  totalCount={totalSongsToDownload || streamTracksCount}
                  streamTracksCount={streamTracksCount}
                  onPress={handleDownloadAllOffline}
                />
              )}
            </ScrollView>

            {/* Divider */}
            <View style={styles.sectionDivider} />
          </View>
        }
        renderItem={({ item }: { item: MobileTrack }) => {
          const isDownloaded = Boolean(item.fileUri && !item.fileUri.startsWith('http://') && item.format !== 'stream');
          const isDownloading = downloadingTrackId === item.id;
          return (
            <SleekTrackRow
              title={item.title}
              artistSubtitle={getArtistName(item.artistId)}
              duration={item.duration}
              artworkUri={item.artworkUri}
              isPlaying={currentTrack?.id === item.id && isPlaying}
              isDownloaded={isDownloaded}
              isDownloading={isDownloading}
              onPress={() => loadAndPlay(item, tracks, tracks.findIndex((t) => t.id === item.id))}
              onMorePress={() => setActionTrack(item)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyListCard}>
            <View style={styles.emptyBadgeCircle}>
              <SleekMusicNoteIcon size={32} color="#D97706" />
            </View>
            <Text style={styles.emptyListTitle}>No Songs in Playlist</Text>
            <Text style={styles.emptyListDesc}>
              Tap the button below to browse your library and add tracks to this playlist.
            </Text>
            <Pressable
              onPress={handleOpenAddModal}
              style={({ pressed }) => [
                styles.emptyAddBtn,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <SleekPlusIcon size={16} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>Add Songs</Text>
            </Pressable>
          </View>
        }
      />

      {/* ── Sleek Track Action Sheet ──────────────────────────────────── */}
      <SleekTrackActionSheet
        visible={Boolean(actionTrack)}
        track={actionTrack}
        playlistId={playlist.id}
        playlistName={playlist.name}
        onClose={() => setActionTrack(null)}
        onTrackUpdated={loadData}
        onTrackDeleted={loadData}
        onTrackRemovedFromPlaylist={loadData}
      />

      {/* ── Add Songs to Playlist Modal ───────────────────────────────── */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Sheet Grabber Handle */}
          <View style={styles.modalGrabber} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Add Songs</Text>
              <Text style={styles.modalSubtitle}>to {playlist.name}</Text>
            </View>
            <Pressable
              onPress={() => setIsAddModalOpen(false)}
              style={styles.modalCloseBtn}
              hitSlop={8}
            >
              <SleekCloseIcon size={18} color="#786C5A" />
            </Pressable>
          </View>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <SleekSearchIcon size={18} color="#968D7B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search library tracks or artists..."
              placeholderTextColor="#A89F91"
              value={addSearchQuery}
              onChangeText={setAddSearchQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Library Tracks FlatList */}
          <FlatList
            data={filteredLibraryTracks}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            renderItem={({ item }: { item: MobileTrack }) => {
              const alreadyIn = db.isReady ? db.playlists.hasTrack(playlist.id, item.id) : false;
              const artist = getArtistName(item.artistId);

              return (
                <View style={styles.addTrackRow}>
                  <View style={styles.addTrackArtwork}>
                    {item.artworkUri ? (
                      <Image source={{ uri: item.artworkUri }} style={styles.fillImage} contentFit="cover" />
                    ) : (
                      <View style={styles.fallbackIconBadge}>
                        <SleekMusicNoteIcon size={18} color="#D97706" />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.addTrackTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.addTrackArtist} numberOfLines={1}>
                      {artist}
                    </Text>
                  </View>

                  {alreadyIn ? (
                    <Pressable
                      onPress={() => handleAddSongToPlaylist(item)}
                      style={styles.alreadyInPill}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.title} is already in playlist`}
                    >
                      <SleekCheckIcon size={12} color="#92400E" />
                      <Text style={styles.alreadyInPillText}>In Playlist</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => handleAddSongToPlaylist(item)}
                      style={({ pressed }) => [
                        styles.addPillBtn,
                        pressed && { transform: [{ scale: 0.94 }] },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.title} to playlist`}
                    >
                      <SleekPlusIcon size={13} color="#FFFFFF" />
                      <Text style={styles.addPillBtnText}>Add</Text>
                    </Pressable>
                  )}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: '#786C5A' }}>
                  {addSearchQuery ? 'No matching songs found' : 'No tracks in library'}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* ── Edit Playlist Details & Manage Songs Modal ────────────────── */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Sheet Grabber Handle */}
          <View style={styles.modalGrabber} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setIsEditModalOpen(false)}
              style={styles.modalCancelBtn}
              hitSlop={8}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>

            <Text style={styles.modalTitle}>Edit Playlist</Text>

            <Pressable
              onPress={handleSaveEdit}
              style={styles.modalSaveBtn}
              hitSlop={8}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </Pressable>
          </View>

          <FlatList
            data={tracks}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            ListHeaderComponent={
              <View style={{ paddingTop: 16 }}>
                {/* 1. Name Input Card */}
                <Text style={styles.inputSectionHeader}>PLAYLIST NAME</Text>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={styles.nameTextInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Playlist name..."
                    placeholderTextColor="#A89F91"
                    maxLength={40}
                    returnKeyType="done"
                    clearButtonMode="while-editing"
                  />
                </View>

                {/* 2. Pin to Top Option Card */}
                <View style={styles.optionRowCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>Pin to Top</Text>
                    <Text style={styles.optionDesc}>Keep this playlist at the top of your library</Text>
                  </View>
                  <Switch
                    value={isPinned}
                    onValueChange={setIsPinned}
                    trackColor={{ false: '#E2D9C8', true: '#FDE68A' }}
                    thumbColor={isPinned ? '#F9A826' : '#FFFFFF'}
                  />
                </View>

                {/* 3. Manage Songs Section Header & Bulk Bar */}
                <View style={styles.manageSongsHeaderRow}>
                  <Text style={styles.inputSectionHeader}>
                    MANAGE SONGS ({tracks.length})
                  </Text>
                  {tracks.length > 0 && (
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Pressable
                        onPress={handleToggleSelectAll}
                        style={styles.bulkSelectBtn}
                        hitSlop={6}
                      >
                        <Text style={styles.bulkSelectBtnText}>
                          {selectedRemoveIds.size === tracks.length ? 'Deselect All' : 'Select All'}
                        </Text>
                      </Pressable>

                      {selectedRemoveIds.size > 0 && (
                        <Pressable
                          onPress={handleBulkRemove}
                          style={styles.bulkRemoveBtn}
                          hitSlop={6}
                        >
                          <SleekTrashIcon size={13} color="#DC2626" />
                          <Text style={styles.bulkRemoveBtnText}>
                            Remove ({selectedRemoveIds.size})
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              </View>
            }
            renderItem={({ item }: { item: MobileTrack }) => {
              const isSelected = selectedRemoveIds.has(item.id);
              const artist = getArtistName(item.artistId);

              return (
                <View style={styles.manageSongRow}>
                  {/* Multi-Select Checkbox for Bulk Remove */}
                  <Pressable
                    onPress={() => handleToggleSelectSong(item.id)}
                    style={[
                      styles.checkboxBox,
                      isSelected && styles.checkboxBoxSelected,
                    ]}
                    hitSlop={6}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    {isSelected && <SleekCheckIcon size={12} color="#FFFFFF" />}
                  </Pressable>

                  {/* Artwork Thumbnail */}
                  <View style={styles.manageSongArtwork}>
                    {item.artworkUri ? (
                      <Image source={{ uri: item.artworkUri }} style={styles.fillImage} contentFit="cover" />
                    ) : (
                      <View style={styles.fallbackIconBadge}>
                        <SleekMusicNoteIcon size={16} color="#D97706" />
                      </View>
                    )}
                  </View>

                  {/* Title & Artist */}
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.manageSongTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.manageSongArtist} numberOfLines={1}>
                      {artist}
                    </Text>
                  </View>

                  {/* Quick Remove (1-tap) */}
                  <Pressable
                    onPress={() => handleQuickRemoveSong(item.id, item.title)}
                    style={styles.quickRemoveBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.title} from playlist`}
                  >
                    <SleekTrashIcon size={15} color="#DC2626" />
                  </Pressable>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyManageCard}>
                <Text style={styles.emptyManageText}>No songs in this playlist to remove.</Text>
              </View>
            }
            ListFooterComponent={
              <View style={{ marginTop: 28, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#FDE68A' }}>
                <Pressable
                  onPress={handleDeletePlaylist}
                  style={styles.deletePlaylistBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Delete playlist"
                >
                  <SleekTrashIcon size={16} color="#DC2626" />
                  <Text style={styles.deletePlaylistBtnText}>Delete Playlist</Text>
                </Pressable>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* ── Persistent Floating Mini Player ──────────────────────────── */}
      <View style={styles.floatingPlayerAnchor} pointerEvents="box-none">
        <SleekMiniPlayer />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(249, 168, 38, 0.15)',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F180B',
  },
  navBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F180B',
    maxWidth: 180,
    textAlign: 'center',
  },
  navBarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  cardWrapper: {
    position: 'relative',
    width: 136,
    height: 136,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  cardArtwork: {
    width: '100%',
    height: '100%',
  },
  cardEditBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  proceduralCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldenIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  titleText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#1F180B',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  badgePill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.2,
  },
  downloadStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  downloadStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.2,
  },
  metadataText: {
    fontSize: 13,
    color: '#786C5A',
    fontWeight: '500',
  },
  actionsScrollView: {
    width: '100%',
    marginBottom: 16,
  },
  actionsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: sleekTokens.accent,
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 21,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  playAllBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 15,
    height: 42,
    borderRadius: 21,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.2,
  },
  sectionDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(249, 168, 38, 0.2)',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F180B',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13.5,
    color: '#786C5A',
    textAlign: 'center',
  },
  emptyListCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: '#FFFDF5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 16,
  },
  emptyBadgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyListTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F180B',
    marginBottom: 6,
  },
  emptyListDesc: {
    fontSize: 13.5,
    color: '#786C5A',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9A826',
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalGrabber: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5DFD3',
    alignSelf: 'center',
    marginTop: Platform.OS === 'ios' ? 14 : 18,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 18 : 22,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(249, 168, 38, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F180B',
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#786C5A',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3E8CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#786C5A',
    fontWeight: '500',
  },
  modalSaveBtn: {
    backgroundColor: '#F9A826',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputSectionHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#968D7B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  nameInputContainer: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    justifyContent: 'center',
    marginBottom: 16,
  },
  nameTextInput: {
    fontSize: 15,
    color: '#1F180B',
    fontWeight: '600',
  },
  optionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  optionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F180B',
  },
  optionDesc: {
    fontSize: 12,
    color: '#786C5A',
    marginTop: 2,
  },
  manageSongsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bulkSelectBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bulkSelectBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  bulkRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bulkRemoveBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  manageSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1C7B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxBoxSelected: {
    backgroundColor: '#F9A826',
    borderColor: '#F9A826',
  },
  manageSongArtwork: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FEF3C7',
    marginRight: 10,
  },
  manageSongTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F180B',
  },
  manageSongArtist: {
    fontSize: 11.5,
    color: '#786C5A',
    marginTop: 1,
  },
  quickRemoveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyManageCard: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyManageText: {
    fontSize: 13.5,
    color: '#786C5A',
  },
  deletePlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
  },
  deletePlaylistBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F180B',
  },
  addTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  addTrackArtwork: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FEF3C7',
    marginRight: 12,
  },
  fillImage: {
    width: '100%',
    height: '100%',
  },
  fallbackIconBadge: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTrackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F180B',
  },
  addTrackArtist: {
    fontSize: 12,
    color: '#786C5A',
    marginTop: 2,
  },
  alreadyInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  alreadyInPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  addPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9A826',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingPlayerAnchor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
});

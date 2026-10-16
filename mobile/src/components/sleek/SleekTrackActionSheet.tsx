/**
 * Overtone iOS — Sleek Track Action Sheet
 *
 * Full-featured interactive modal for songs:
 * 1. Play Next / Add to Queue
 * 2. Toggle Favorite
 * 3. Add to Playlist (with live inline New Playlist creation)
 * 4. Edit Metadata (Rename title, artist, album, genre, track #)
 * 5. Remove from Playlist (when in playlist context)
 * 6. Remove / Delete from Library (with destructive confirmation)
 * 7. Share
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  SleekCloseIcon,
  SleekPlayIcon,
  SleekQueueIcon,
  SleekHeartIcon,
  SleekShareIcon,
  SleekPlaylistsIcon,
  SleekEditIcon,
  SleekTrashIcon,
  SleekPlusIcon,
  SleekCheckIcon,
  SleekChevronRightIcon,
  SleekMusicNoteIcon,
  SleekDesktopSyncIcon,
  SleekImportIcon,
} from './SleekIcons';
import { useDatabase } from '../../hooks/useDatabase';
import { usePlayerStore } from '../../store/usePlayerStore';
import { FileImportService, formatDuration } from '../../services/files/FileImportService';
import { SyncService } from '../../services/sync/SyncService';
import { sleekTokens } from '../../design/colors';
import type { MobileTrack, MobilePlaylist } from '../../domain/models';

interface SleekTrackActionSheetProps {
  visible: boolean;
  track: MobileTrack | null;
  playlistId?: number;
  playlistName?: string;
  onClose: () => void;
  onTrackUpdated?: (updatedTrack: MobileTrack) => void;
  onTrackDeleted?: (trackId: number) => void;
  onTrackRemovedFromPlaylist?: (trackId: number) => void;
}

type SheetView = 'menu' | 'addToPlaylist' | 'editMetadata';

export function SleekTrackActionSheet({
  visible,
  track,
  playlistId,
  playlistName,
  onClose,
  onTrackUpdated,
  onTrackDeleted,
  onTrackRemovedFromPlaylist,
}: SleekTrackActionSheetProps) {
  const db = useDatabase();
  const {
    currentTrack,
    duration: storeDuration,
    playNext,
    addToQueue,
    updateTrack,
    removeTrack,
  } = usePlayerStore();

  const effectiveDuration =
    track?.duration && track.duration > 0
      ? track.duration
      : currentTrack && currentTrack.id === track?.id && (currentTrack.duration || storeDuration) > 0
      ? currentTrack.duration || storeDuration
      : 0;

  const [currentView, setCurrentView] = useState<SheetView>('menu');
  const [isFav, setIsFav] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Playlists state
  const [playlists, setPlaylists] = useState<MobilePlaylist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedPlaylistId, setAddedPlaylistId] = useState<number | null>(null);

  // Edit Metadata state
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editTrackNumber, setEditTrackNumber] = useState('');

  // Artist & Album display names
  const [artistName, setArtistName] = useState('Unknown Artist');
  const [albumTitle, setAlbumTitle] = useState('Unknown Album');

  useEffect(() => {
    if (visible && track && db.isReady) {
      setCurrentView('menu');
      setAddedPlaylistId(null);
      setNewPlaylistName('');

      const fav = db.favorites.isFavorite(track.id);
      setIsFav(fav);

      const art = track.artistId ? db.artists.getNameById(track.artistId) : 'Unknown Artist';
      setArtistName(art);

      const alb = track.albumId ? db.albums.getTitleById(track.albumId) : 'Unknown Album';
      setAlbumTitle(alb);

      // Pre-fill edit form
      setEditTitle(track.title || '');
      setEditArtist(art !== 'Unknown Artist' ? art : '');
      setEditAlbum(alb !== 'Unknown Album' ? alb : '');
      setEditGenre(track.genre || '');
      setEditTrackNumber(track.trackNumber ? String(track.trackNumber) : '');

      // Load playlists
      setPlaylists(db.playlists.getAll());
    }
  }, [visible, track, db.isReady]);

  if (!track) return null;

  // 1. Play Next
  const handlePlayNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playNext(track);
    onClose();
  };

  // 2. Add to Queue
  const handleAddToQueue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToQueue(track);
    onClose();
  };

  // 3. Toggle Favorite
  const handleToggleFavorite = () => {
    if (!db.isReady) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = db.favorites.toggle(track.id);
    setIsFav(updated);
  };

  // 4. Native Share
  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Listening to "${track.title}" by ${artistName} on Overtone`,
        url: track.fileUri.startsWith('file://') ? track.fileUri : undefined,
      });
    } catch {
      // Ignored
    }
  };

  // 5. Add to Playlist
  const handleSelectPlaylist = (targetPlaylist: MobilePlaylist) => {
    if (!db.isReady) return;
    try {
      if (db.playlists.hasTrack(targetPlaylist.id, track.id)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Already in Playlist',
          `"${track.title}" is already in "${targetPlaylist.name}". A song can only be added once per playlist.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      db.playlists.addTrack(targetPlaylist.id, track.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddedPlaylistId(targetPlaylist.id);
      setTimeout(() => {
        onClose();
      }, 550);
    } catch (e) {
      console.warn('[TrackActionSheet] Error adding track to playlist:', e);
    }
  };

  // 6. Create New Playlist & Add
  const handleCreateAndAddPlaylist = () => {
    if (!db.isReady || !newPlaylistName.trim()) return;
    try {
      const createdId = db.playlists.create(newPlaylistName.trim());
      db.playlists.addTrack(createdId, track.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPlaylists(db.playlists.getAll());
      setAddedPlaylistId(createdId);
      setTimeout(() => {
        onClose();
      }, 550);
    } catch (e) {
      console.warn('[TrackActionSheet] Error creating playlist:', e);
    }
  };

  // 7. Save Edited Metadata
  const handleSaveMetadata = () => {
    if (!db.isReady) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      Alert.alert('Title Required', 'Please enter a valid title for the track.');
      return;
    }

    try {
      const parsedTrackNum = editTrackNumber.trim() ? parseInt(editTrackNumber.trim(), 10) : undefined;
      db.tracks.updateMetadata(
        track.id,
        {
          title: trimmedTitle,
          artistName: editArtist.trim() || undefined,
          albumTitle: editAlbum.trim() || undefined,
          genre: editGenre.trim() || undefined,
          trackNumber: isNaN(parsedTrackNum as number) ? undefined : parsedTrackNum,
        },
        db.artists,
        db.albums
      );

      const updated = db.tracks.getById(track.id);
      if (updated) {
        updateTrack(updated);
        onTrackUpdated?.(updated);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err) {
      console.warn('[TrackActionSheet] Error updating metadata:', err);
      Alert.alert('Error', 'Failed to update song metadata.');
    }
  };

  // 8. Remove from Current Playlist
  const handleRemoveFromPlaylist = () => {
    if (!playlistId || !db.isReady) return;
    Alert.alert(
      'Remove from Playlist',
      `Remove "${track.title}" from "${playlistName || 'this playlist'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            db.playlists.removeTrack(playlistId, track.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onTrackRemovedFromPlaylist?.(track.id);
            onClose();
          },
        },
      ]
    );
  };

  // 9. Delete from Library
  const handleDeleteTrack = () => {
    Alert.alert(
      'Delete Song',
      `Are you sure you want to remove "${track.title}" from your Overtone library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!db.isReady) return;
            db.tracks.delete(track.id);
            removeTrack(track.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onTrackDeleted?.(track.id);
            onClose();
          },
        },
      ]
    );
  };

  const isStreamTrack = Boolean(track?.fileUri?.startsWith('http://') || track?.format === 'stream');

  // 10. Download Remote Wi-Fi Streamed Track to iPhone Storage
  const handleDownloadOffline = async () => {
    if (!track?.fileUri || isDownloading) return;
    try {
      setIsDownloading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await FileImportService.downloadRemoteTrack(track.fileUri, track.id, track.title);
      if (res) {
        let localArtUri: string | undefined = undefined;
        if (track.artworkUri && track.artworkUri.startsWith('http://')) {
          const artRes = await FileImportService.downloadRemoteArtwork(track.artworkUri, track.id);
          if (artRes) localArtUri = artRes;
        }
        db.tracks.updateFileUri(track.id, res.localUri, 'mp3', res.fileSize, localArtUri);
        const updated: MobileTrack = {
          ...track,
          fileUri: res.localUri,
          format: 'mp3',
          fileSize: res.fileSize,
          ...(localArtUri ? { artworkUri: localArtUri } : {}),
        };
        updateTrack(updated);
        onTrackUpdated?.(updated);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Downloaded', `"${track.title}" is now saved on your iPhone for offline listening!`);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Download Failed', 'Could not download track. Make sure Overtone Desktop is running on the same Wi-Fi.');
      }
    } catch (err: any) {
      Alert.alert('Download Error', err?.message || 'Failed to download track');
    } finally {
      setIsDownloading(false);
    }
  };

  // 11. Send Single Track to Desktop
  const handleSendToDesktop = async () => {
    if (!track || !db.isReady || isSending) return;
    const paired = db.pairedDevices.getAll();
    if (paired.length === 0) {
      Alert.alert('No Paired Desktop', 'Connect to your computer first in Settings → Wi-Fi Desktop Sync.');
      return;
    }
    const device = paired[0];
    try {
      setIsSending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await SyncService.sendTrack(device, {
        title: track.title,
        artist: artistName,
        album: albumTitle,
        duration: effectiveDuration,
        genre: track.genre || undefined,
        trackNumber: track.trackNumber || undefined,
        fileUri: track.fileUri,
      });
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Sent to Desktop', `"${track.title}" was sent to ${device.name}.`);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Transfer Failed', res.error || 'Could not send song to desktop.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Transfer failed');
    } finally {
      setIsSending(false);
    }
  };

  // 12. Play Track on Desktop
  const handlePlayOnDesktop = async () => {
    if (!track || !db.isReady) return;
    const paired = db.pairedDevices.getAll();
    if (paired.length === 0) {
      Alert.alert('No Paired Desktop', 'Connect to your computer in Settings → Wi-Fi Desktop Sync.');
      return;
    }
    const device = paired[0];
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await SyncService.sendRemoteControl(device, 'playTrack', {
        title: track.title,
        artist: artistName,
        album: albumTitle,
      });
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Playing on Desktop', `Sent playback request to ${device.name}.`);
        onClose();
      } else {
        Alert.alert('Remote Control Failed', res.error || 'Could not reach desktop.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not send play request.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Top Grabber */}
          <View style={styles.handleContainer}>
            <View style={styles.handlePill} />
          </View>

          {/* Header Track Info */}
          <View style={styles.headerRow}>
            <View style={styles.artworkSquircle}>
              {track.artworkUri ? (
                <Image source={{ uri: track.artworkUri }} style={styles.artworkImage} contentFit="cover" />
              ) : (
                <View style={styles.artworkFallback}>
                  <SleekMusicNoteIcon size={22} color="#D97706" />
                </View>
              )}
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {artistName} · {albumTitle}
              </Text>
              <View style={styles.metaBadgeRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>
                    {track.format?.toUpperCase() || 'AUDIO'}
                  </Text>
                </View>
                <Text style={styles.metaDurationText}>
                  {effectiveDuration > 0 ? formatDuration(effectiveDuration) : '--:--'}
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <SleekCloseIcon size={18} color="#968D7B" />
            </Pressable>
          </View>

          {/* Quick Action Grid */}
          {currentView === 'menu' && (
            <View style={styles.quickActionsBar}>
              <Pressable onPress={handlePlayNext} style={styles.quickActionBtn}>
                <View style={styles.quickActionIconCircle}>
                  <SleekPlayIcon size={14} color="#F9A826" />
                </View>
                <Text style={styles.quickActionLabel}>Play Next</Text>
              </Pressable>

              <Pressable onPress={handleAddToQueue} style={styles.quickActionBtn}>
                <View style={styles.quickActionIconCircle}>
                  <SleekQueueIcon size={16} color="#F9A826" />
                </View>
                <Text style={styles.quickActionLabel}>Add Queue</Text>
              </Pressable>

              <Pressable onPress={handleToggleFavorite} style={styles.quickActionBtn}>
                <View style={[styles.quickActionIconCircle, isFav && { backgroundColor: '#FDE68A' }]}>
                  <SleekHeartIcon
                    size={16}
                    color={isFav ? '#D97706' : '#968D7B'}
                    fill={isFav ? '#D97706' : 'none'}
                  />
                </View>
                <Text style={[styles.quickActionLabel, isFav && { color: '#D97706' }]}>
                  {isFav ? 'Favorited' : 'Favorite'}
                </Text>
              </Pressable>

              <Pressable onPress={handleShare} style={styles.quickActionBtn}>
                <View style={styles.quickActionIconCircle}>
                  <SleekShareIcon size={15} color="#968D7B" />
                </View>
                <Text style={styles.quickActionLabel}>Share</Text>
              </Pressable>
            </View>
          )}

          {/* Content Switching between Menu, AddToPlaylist, and EditMetadata */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── 1. MAIN MENU ─────────────────────────────────── */}
            {currentView === 'menu' && (
              <View style={styles.menuList}>
                {/* Add to Playlist */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentView('addToPlaylist');
                  }}
                  style={styles.menuItemRow}
                >
                  <View style={styles.menuItemIconBox}>
                    <SleekPlaylistsIcon size={19} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemTitle}>Add to Playlist</Text>
                    <Text style={styles.menuItemDesc}>Organize into custom playlists</Text>
                  </View>
                  <SleekChevronRightIcon size={16} color="#B5AC98" />
                </Pressable>

                {/* Download for Offline (if streamed over Wi-Fi) */}
                {isStreamTrack && (
                  <Pressable onPress={handleDownloadOffline} disabled={isDownloading} style={styles.menuItemRow}>
                    <View style={[styles.menuItemIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <SleekImportIcon size={18} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuItemTitle}>
                        {isDownloading ? 'Downloading...' : 'Download to iPhone'}
                      </Text>
                      <Text style={styles.menuItemDesc}>Save locally for offline playback</Text>
                    </View>
                  </Pressable>
                )}

                {/* Send to Desktop */}
                <Pressable onPress={handleSendToDesktop} disabled={isSending} style={styles.menuItemRow}>
                  <View style={[styles.menuItemIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <SleekDesktopSyncIcon size={18} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemTitle}>
                      {isSending ? 'Sending...' : 'Send to Desktop'}
                    </Text>
                    <Text style={styles.menuItemDesc}>Share this song to paired computer</Text>
                  </View>
                </Pressable>

                {/* Play on Desktop */}
                <Pressable onPress={handlePlayOnDesktop} style={styles.menuItemRow}>
                  <View style={[styles.menuItemIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <SleekPlayIcon size={16} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemTitle}>Play on Desktop</Text>
                    <Text style={styles.menuItemDesc}>Stream playback through computer speakers</Text>
                  </View>
                </Pressable>

                {/* Edit Metadata & Rename */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentView('editMetadata');
                  }}
                  style={styles.menuItemRow}
                >
                  <View style={styles.menuItemIconBox}>
                    <SleekEditIcon size={18} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemTitle}>Edit Metadata & Rename</Text>
                    <Text style={styles.menuItemDesc}>Title, artist, album, genre, track #</Text>
                  </View>
                  <SleekChevronRightIcon size={16} color="#B5AC98" />
                </Pressable>

                {/* Remove from Playlist (if inside playlist) */}
                {Boolean(playlistId) && (
                  <Pressable onPress={handleRemoveFromPlaylist} style={styles.menuItemRow}>
                    <View style={[styles.menuItemIconBox, { backgroundColor: '#FEE2E2' }]}>
                      <SleekCloseIcon size={16} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuItemTitle, { color: '#DC2626' }]}>
                        Remove from Playlist
                      </Text>
                      <Text style={styles.menuItemDesc}>Remove from {playlistName || 'playlist'}</Text>
                    </View>
                  </Pressable>
                )}

                {/* Delete from Library */}
                <Pressable onPress={handleDeleteTrack} style={styles.menuItemRow}>
                  <View style={[styles.menuItemIconBox, { backgroundColor: '#FEE2E2' }]}>
                    <SleekTrashIcon size={18} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuItemTitle, { color: '#DC2626' }]}>
                      Delete Song
                    </Text>
                    <Text style={styles.menuItemDesc}>Remove from your device library</Text>
                  </View>
                </Pressable>
              </View>
            )}

            {/* ── 2. ADD TO PLAYLIST VIEW ──────────────────────── */}
            {currentView === 'addToPlaylist' && (
              <View style={styles.subViewContainer}>
                <View style={styles.subViewHeaderRow}>
                  <Pressable
                    onPress={() => setCurrentView('menu')}
                    style={styles.subViewBackBtn}
                  >
                    <Text style={styles.subViewBackText}>← Back</Text>
                  </Pressable>
                  <Text style={styles.subViewTitle}>Add to Playlist</Text>
                  <View style={{ width: 50 }} />
                </View>

                {/* Create New Playlist Input */}
                <View style={styles.newPlaylistCard}>
                  <Text style={styles.newPlaylistHeader}>CREATE NEW PLAYLIST</Text>
                  <View style={styles.newPlaylistInputRow}>
                    <TextInput
                      style={styles.newPlaylistInput}
                      value={newPlaylistName}
                      onChangeText={setNewPlaylistName}
                      placeholder="New playlist name..."
                      placeholderTextColor="#9A91B3"
                      maxLength={32}
                      returnKeyType="done"
                      onSubmitEditing={handleCreateAndAddPlaylist}
                    />
                    <Pressable
                      onPress={handleCreateAndAddPlaylist}
                      disabled={!newPlaylistName.trim()}
                      style={[
                        styles.newPlaylistBtn,
                        !newPlaylistName.trim() && { opacity: 0.5 },
                      ]}
                    >
                      <SleekPlusIcon size={16} color="#FFFFFF" />
                      <Text style={styles.newPlaylistBtnText}>Create</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Playlists List */}
                <Text style={styles.playlistSectionHeader}>EXISTING PLAYLISTS ({playlists.length})</Text>
                <View style={{ gap: 8, marginTop: 6 }}>
                  {playlists.length > 0 ? (
                    playlists.map((pl) => {
                      const isJustAdded = addedPlaylistId === pl.id;
                      const isAlreadyIn = db.isReady ? db.playlists.hasTrack(pl.id, track.id) : false;
                      return (
                        <Pressable
                          key={pl.id}
                          onPress={() => handleSelectPlaylist(pl)}
                          style={[
                            styles.playlistItemRow,
                            isJustAdded && { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
                            isAlreadyIn && !isJustAdded && { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
                          ]}
                        >
                          <View style={styles.playlistIconBadge}>
                            <SleekPlaylistsIcon size={18} color="#D97706" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.playlistItemName}>{pl.name}</Text>
                            <Text style={styles.playlistItemCount}>
                              {pl.trackCount || 0} tracks
                            </Text>
                          </View>
                          {isJustAdded ? (
                            <View style={styles.addedBadge}>
                              <SleekCheckIcon size={14} color="#059669" />
                              <Text style={styles.addedBadgeText}>Added</Text>
                            </View>
                          ) : isAlreadyIn ? (
                            <View style={[styles.addedBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A', borderWidth: 1 }]}>
                              <Text style={[styles.addedBadgeText, { color: '#92400E' }]}>In Playlist</Text>
                            </View>
                          ) : (
                            <SleekPlusIcon size={16} color="#968D7B" />
                          )}
                        </Pressable>
                      );
                    })
                  ) : (
                    <Text style={styles.noPlaylistsText}>
                      No playlists created yet. Create one above!
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* ── 3. EDIT METADATA VIEW ────────────────────────── */}
            {currentView === 'editMetadata' && (
              <View style={styles.subViewContainer}>
                <View style={styles.subViewHeaderRow}>
                  <Pressable
                    onPress={() => setCurrentView('menu')}
                    style={styles.subViewBackBtn}
                  >
                    <Text style={styles.subViewBackText}>← Back</Text>
                  </Pressable>
                  <Text style={styles.subViewTitle}>Edit Metadata</Text>
                  <View style={{ width: 50 }} />
                </View>

                <View style={styles.formCard}>
                  {/* Title */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>TRACK TITLE</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholder="Song title..."
                      placeholderTextColor="#9A91B3"
                    />
                  </View>

                  {/* Artist */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>ARTIST NAME</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={editArtist}
                      onChangeText={setEditArtist}
                      placeholder="Artist name..."
                      placeholderTextColor="#9A91B3"
                    />
                  </View>

                  {/* Album */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>ALBUM TITLE</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={editAlbum}
                      onChangeText={setEditAlbum}
                      placeholder="Album title..."
                      placeholderTextColor="#9A91B3"
                    />
                  </View>

                  {/* Genre & Track # */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[styles.fieldGroup, { flex: 2 }]}>
                      <Text style={styles.fieldLabel}>GENRE</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={editGenre}
                        onChangeText={setEditGenre}
                        placeholder="Pop, Rock, etc."
                        placeholderTextColor="#9A91B3"
                      />
                    </View>

                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>TRACK #</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={editTrackNumber}
                        onChangeText={setEditTrackNumber}
                        placeholder="1"
                        placeholderTextColor="#9A91B3"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {/* Save Button */}
                  <Pressable onPress={handleSaveMetadata} style={styles.saveMetadataBtn}>
                    <SleekCheckIcon size={16} color="#FFFFFF" />
                    <Text style={styles.saveMetadataBtnText}>Save Changes</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 8, 4, 0.58)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handlePill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5DFD3',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFE6',
    gap: 14,
  },
  artworkSquircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFDF5',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#1F180B',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#786C5A',
    marginTop: 2,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  metaBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.4,
  },
  metaDurationText: {
    fontSize: 11.5,
    color: '#968D7B',
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4EFE6',
  },
  quickActionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1F180B',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  menuList: {
    gap: 10,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  menuItemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F180B',
  },
  menuItemDesc: {
    fontSize: 12,
    color: '#786C5A',
    marginTop: 2,
  },
  subViewContainer: {
    gap: 12,
  },
  subViewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subViewBackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  subViewBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  subViewTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#1F180B',
  },
  newPlaylistCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F9A826',
    borderRadius: 16,
    padding: 14,
  },
  newPlaylistHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#968D7B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  newPlaylistInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newPlaylistInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F180B',
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9A826',
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 12,
  },
  newPlaylistBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  playlistSectionHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#968D7B',
    letterSpacing: 0.6,
    marginTop: 8,
  },
  playlistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  playlistIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F180B',
  },
  playlistItemCount: {
    fontSize: 12,
    color: '#786C5A',
    marginTop: 1,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addedBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  noPlaylistsText: {
    fontSize: 13,
    color: '#786C5A',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 14,
  },
  formCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#968D7B',
    letterSpacing: 0.5,
  },
  fieldInput: {
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F180B',
  },
  saveMetadataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    backgroundColor: '#F9A826',
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveMetadataBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

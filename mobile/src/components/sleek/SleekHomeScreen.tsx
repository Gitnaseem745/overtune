/**
 * Overtone iOS — Sleek Home Screen
 *
 * Pixel-to-pixel replica of sleek_theme_main_screen.jpg and the
 * foremost card in sleek_theme_sidebar_screen.jpg.
 *
 * Connected with SQLite database tracks, player store, and dynamic
 * playlist / recently played data with graceful initial fallbacks.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SleekHeader, getDynamicGreeting } from './SleekHeader';
import { SleekPlaylistCard } from './SleekPlaylistCard';
import { SleekTrackRow } from './SleekTrackRow';
import { SleekTrackActionSheet } from './SleekTrackActionSheet';
import {
  SleekImportIcon,
  SleekMusicNoteIcon,
  SleekDesktopSyncIcon,
  SleekPlayIcon,
  SleekPauseIcon,
  SleekSkipBackIcon,
  SleekSkipForwardIcon,
} from './SleekIcons';
import { SleekLiveEqualizer } from './SleekLiveEqualizer';
import { useDatabase } from '../../hooks/useDatabase';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUserStore } from '../../store/useUserStore';
import { useDrawerStore } from '../../store/useDrawerStore';
import { FileImportService, formatDuration } from '../../services/files/FileImportService';
import { SyncService } from '../../services/sync/SyncService';
import { sleekTokens, palette } from '../../design/colors';
import type { MobileTrack, PairedDevice, SyncNowPlayingState } from '../../domain/models';

interface SleekHomeScreenProps {
  userName?: string;
}

interface DisplayPlaylist {
  id: number | string;
  title: string;
  trackCount: number;
  imageSource?: any;
  artworkUri?: string | null;
}

interface DisplayTrack {
  id: number;
  title: string;
  artistSubtitle: string;
  duration?: number;
  imageSource?: any;
  artworkUri?: string | null;
  rawTrack?: MobileTrack;
}

const DEFAULT_PLAYLISTS: DisplayPlaylist[] = [
  {
    id: 'p-1',
    title: 'Favorites',
    trackCount: 0,
    imageSource: null,
    artworkUri: null,
  },
  {
    id: 'p-2',
    title: 'Focus Flow',
    trackCount: 0,
    imageSource: null,
    artworkUri: null,
  },
];

const DEFAULT_TRACKS: DisplayTrack[] = [];

export function SleekHomeScreen({ userName: propUserName }: SleekHomeScreenProps = {}) {
  const router = useRouter();
  const db = useDatabase();
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const currentTrackTitle = usePlayerStore((s) => s.currentTrack?.title);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const loadAndPlay = usePlayerStore((s) => s.loadAndPlay);
  const { userName: storeUserName } = useUserStore();
  const { setActiveTab } = useDrawerStore();
  const userName = propUserName || storeUserName;

  const [playlists, setPlaylists] = useState<DisplayPlaylist[]>(DEFAULT_PLAYLISTS);
  const [recentTracks, setRecentTracks] = useState<DisplayTrack[]>(DEFAULT_TRACKS);
  const [hasRealTracks, setHasRealTracks] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [actionTrack, setActionTrack] = useState<MobileTrack | null>(null);

  // Cross-device desktop sync state
  const [pairedDevice, setPairedDevice] = useState<PairedDevice | null>(null);
  const [desktopNowPlaying, setDesktopNowPlaying] = useState<SyncNowPlayingState | null>(null);
  const [isHandoffLoading, setIsHandoffLoading] = useState(false);

  const loadData = () => {
    if (!db.isReady) return;

    try {
      // 0. Load paired devices
      const devices = db.pairedDevices.getAll();
      setPairedDevice(devices.length > 0 ? devices[0] : null);

      // 1. Load dynamic playlists
      const loadedPlaylists = db.playlists.getAll();
      if (loadedPlaylists && loadedPlaylists.length > 0) {
        const mapped: DisplayPlaylist[] = loadedPlaylists.map((p) => ({
          id: p.id,
          title: p.name,
          trackCount: p.trackCount || 0,
          imageSource: p.artworkUri ? { uri: p.artworkUri } : null,
          artworkUri: p.artworkUri,
        }));
        setPlaylists(mapped);
      }

      // 2. Load dynamic recently played tracks
      const recents = db.tracks.getRecentlyPlayed(8);
      const allTracks = db.tracks.getAll();
      const tracksToUse = recents.length > 0 ? recents : allTracks.slice(0, 8);

      if (tracksToUse.length > 0) {
        setHasRealTracks(true);
        const mappedTracks: DisplayTrack[] = tracksToUse.map((t) => {
          const artistName = t.artistId ? db.artists.getNameById(t.artistId) : 'Unknown Artist';
          const genreText = t.genre ? ` · ${t.genre}` : ' · Local Audio';
          return {
            id: t.id,
            title: t.title,
            artistSubtitle: `${artistName}${genreText}`,
            duration: t.duration,
            artworkUri: t.artworkUri,
            imageSource: t.artworkUri ? { uri: t.artworkUri } : null,
            rawTrack: t,
          };
        });
        setRecentTracks(mappedTracks);
      } else {
        setHasRealTracks(false);
        setRecentTracks([]);
      }
    } catch (err) {
      console.warn('[SleekHomeScreen] Error loading data from DB:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [db.isReady]);

  // Periodic polling for Desktop Now-Playing and shared inbox transfers
  useEffect(() => {
    if (!db.isReady) return;
    const devices = db.pairedDevices.getAll();
    if (devices.length === 0) {
      setPairedDevice(null);
      setDesktopNowPlaying(null);
      return;
    }
    const dev = devices[0];
    setPairedDevice(dev);

    let isMounted = true;
    let pollCount = 0;

    const pollDesktop = async () => {
      try {
        const npRes = await SyncService.fetchNowPlaying(dev);
        if (isMounted) {
          if (npRes.state && npRes.state.track) {
            setDesktopNowPlaying(npRes.state);
          } else {
            setDesktopNowPlaying(null);
          }
        }

        pollCount++;
        // Check inbox every 3rd poll (~9 seconds)
        if (pollCount % 3 === 0) {
          const inboxRes = await SyncService.fetchInbox(dev);
          if (isMounted && inboxRes.items && inboxRes.items.length > 0) {
            for (const item of inboxRes.items) {
              const payload = item.payload || item;
              const tracks = payload.tracks || item.tracks;
              const playlistName = payload.playlistName || item.playlistName;
              const track = payload.track || item.track;
              if (tracks && playlistName) {
                const imp = SyncService.importPlaylistWithTracks(dev, playlistName, tracks, db);
                loadData();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  'Received Playlist from Desktop',
                  `"${playlistName}" (${imp.totalTracks} songs) was imported to your Library!`,
                  [
                    {
                      text: 'View Playlist',
                      onPress: () => router.push({ pathname: '/playlist/[id]', params: { id: imp.playlistId } }),
                    },
                    { text: 'OK' },
                  ]
                );
              } else if (track) {
                SyncService.importSingleTrack(dev, track, db);
                loadData();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  'Received Song from Desktop',
                  `"${track.title}" by ${track.artist || 'Unknown Artist'} was added to your Library!`
                );
              }
            }
          }
        }
      } catch {
        // Desktop may be offline
      }
    };

    pollDesktop();
    const interval = setInterval(pollDesktop, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [db.isReady]);

  // Remote desktop control handlers
  const handleDesktopTogglePlay = async () => {
    if (!pairedDevice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await SyncService.sendRemoteControl(pairedDevice, 'toggle');
    setDesktopNowPlaying((prev) => (prev ? { ...prev, isPlaying: !prev.isPlaying } : null));
  };

  const handleDesktopPrev = async () => {
    if (!pairedDevice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await SyncService.sendRemoteControl(pairedDevice, 'prev');
  };

  const handleDesktopNext = async () => {
    if (!pairedDevice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await SyncService.sendRemoteControl(pairedDevice, 'next');
  };

  const handleDesktopHandoff = async () => {
    if (!pairedDevice || !desktopNowPlaying?.track || isHandoffLoading || !db.isReady) return;
    try {
      setIsHandoffLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Pause playback on desktop
      await SyncService.sendRemoteControl(pairedDevice, 'pause');
      setDesktopNowPlaying((prev) => (prev ? { ...prev, isPlaying: false } : null));

      // Import or locate track in mobile SQLite
      const rawTrack = desktopNowPlaying.track as any;
      const desktopTrackId = rawTrack.desktopTrackId ?? rawTrack.id;
      const desktopTrack = {
        ...rawTrack,
        desktopTrackId,
        fileUri: desktopTrackId
          ? `http://${pairedDevice.ip}:${pairedDevice.port}/api/sync/audio/${desktopTrackId}`
          : `http://${pairedDevice.ip}:${pairedDevice.port}/api/sync/audio/by-title/${encodeURIComponent(rawTrack.title)}`,
        artworkUri: desktopTrackId
          ? `http://${pairedDevice.ip}:${pairedDevice.port}/api/sync/artwork/${desktopTrackId}`
          : `http://${pairedDevice.ip}:${pairedDevice.port}/api/sync/artwork/by-title/${encodeURIComponent(rawTrack.title)}`,
      };

      const trackId = SyncService.importSingleTrack(pairedDevice, desktopTrack, db);
      const localTrack = db.tracks.getById(trackId);

      if (localTrack) {
        if (!localTrack.fileUri || localTrack.fileUri.startsWith('stream://')) {
          localTrack.fileUri = desktopTrack.fileUri;
          localTrack.artworkUri = desktopTrack.artworkUri;
          db.tracks.updateFileUri(localTrack.id, desktopTrack.fileUri, 'stream', undefined, desktopTrack.artworkUri);
        }
        // Start playback on iPhone at the exact timestamp!
        await loadAndPlay(localTrack, [localTrack], 0, desktopNowPlaying.currentTime);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Alert.alert('Handoff Failed', err?.message || 'Could not transfer playback to iPhone');
    } finally {
      setIsHandoffLoading(false);
    }
  };

  const handleSeeMorePlaylists = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab('playlists');
  };

  const handleSeeMoreRecentlyPlayed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab('songs');
  };

  const handlePlayPlaylist = (playlist: DisplayPlaylist) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (typeof playlist.id === 'number') {
      router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } });
    } else {
      setActiveTab('playlists');
    }
  };

  const handlePlayTrack = (track: DisplayTrack) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (track.rawTrack) {
      const queueTracks = recentTracks
        .map((t) => t.rawTrack)
        .filter((t): t is MobileTrack => Boolean(t));
      loadAndPlay(track.rawTrack, queueTracks.length > 0 ? queueTracks : [track.rawTrack]);
    } else {
      // Mock track structure for initial sample playback
      const mockTrack: MobileTrack = {
        id: track.id,
        title: track.title,
        artistId: null,
        albumId: null,
        fileUri: '',
        duration: 214,
        trackNumber: 1,
        genre: 'Pop',
        fileHash: null,
        artworkUri: track.artworkUri || null,
        fileSize: 4200000,
        format: 'mp3',
        sampleRate: 44100,
        bitRate: 320,
        channels: 2,
        importedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
      };
      loadAndPlay(mockTrack);
    }
  };

  const handleQuickImport = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const picked = await FileImportService.pickFiles();
      if (picked.length === 0) return;

      setIsImporting(true);
      const result = await FileImportService.importFilesAndSaveToLibrary(picked, db);
      setIsImporting(false);

      loadData();
      Alert.alert(
        'Import Completed',
        `Imported: ${result.imported} track${result.imported !== 1 ? 's' : ''}` +
          (result.duplicates ? `\nSkipped duplicates: ${result.duplicates}` : '') +
          (result.failed ? `\nFailed: ${result.failed}` : '')
      );
    } catch (err: any) {
      setIsImporting(false);
      Alert.alert('Import Failed', err?.message || 'Could not import audio files');
    }
  };

  const dynamicGreeting = getDynamicGreeting();

  return (
    <View style={styles.container}>
      {/* Top Header - Fixed at top so menu and search icons NEVER hide on scroll */}
      <SleekHeader
        greeting={dynamicGreeting}
        name={userName}
      />

      {/* Lower Curved White Sheet Container */}
      <View style={styles.sheetContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={true}
        >
          {/* Sheet Drag Handle Pill */}
          <View style={styles.handleContainer}>
            <View style={styles.handlePill} />
          </View>

          {/* Quick Import Card if library has no imported tracks */}
          {!hasRealTracks && (
            <View style={styles.importBanner}>
              <View style={styles.importIconSquircle}>
                <SleekImportIcon size={22} color="#D97706" />
              </View>
              <View style={styles.importBannerContent}>
                <Text style={styles.importBannerTitle}>Your Music Collection</Text>
                <Text style={styles.importBannerSubtitle}>
                  Import audio files (.mp3, .m4a, .flac, .wav) directly into Overtone.
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.importButton,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                ]}
                onPress={handleQuickImport}
                disabled={isImporting}
                accessibilityRole="button"
                accessibilityLabel="Import audio files"
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.importButtonText}>+ Import</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Now Playing on Desktop Card */}
          {Boolean(desktopNowPlaying?.track) && (
            <View style={styles.desktopSyncCard}>
              {/* Header row */}
              <View style={styles.desktopCardHeader}>
                <View style={styles.desktopCardHeaderLeft}>
                  <View style={styles.desktopIconSquircle}>
                    <SleekDesktopSyncIcon size={13} color="#D97706" />
                  </View>
                  <Text style={styles.desktopCardDeviceName} numberOfLines={1}>
                    NOW PLAYING ON {pairedDevice?.name.toUpperCase() || 'DESKTOP'}
                  </Text>
                </View>
                <View style={styles.desktopLiveIndicator}>
                  {desktopNowPlaying?.isPlaying ? (
                    <SleekLiveEqualizer isPlaying={true} color="#F9A826" size={13} barWidth={2} gap={1.8} />
                  ) : (
                    <View style={styles.pausedDot} />
                  )}
                  <Text style={styles.desktopLiveStatusText}>
                    {desktopNowPlaying?.isPlaying ? 'Live' : 'Paused'}
                  </Text>
                </View>
              </View>

              {/* Body row: Artwork + Track details + Remote Controls */}
              <View style={styles.desktopCardBody}>
                {pairedDevice && desktopNowPlaying?.track?.id ? (
                  <Image
                    source={{
                      uri: `http://${pairedDevice.ip}:${pairedDevice.port}/api/sync/artwork/${desktopNowPlaying.track.id}`,
                    }}
                    style={styles.desktopArtwork}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View style={[styles.desktopArtwork, styles.desktopArtworkFallback]}>
                    <SleekMusicNoteIcon size={20} color="#D97706" />
                  </View>
                )}

                <View style={styles.desktopTrackDetails}>
                  <Text style={styles.desktopTrackTitle} numberOfLines={1}>
                    {desktopNowPlaying?.track?.title}
                  </Text>
                  <Text style={styles.desktopTrackSubtitle} numberOfLines={1}>
                    {desktopNowPlaying?.track?.artist || 'Unknown Artist'}
                    {desktopNowPlaying?.track?.album ? ` · ${desktopNowPlaying.track.album}` : ''}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.desktopProgressTrack}>
                    <View
                      style={[
                        styles.desktopProgressBar,
                        {
                          width: `${Math.min(
                            100,
                            desktopNowPlaying && desktopNowPlaying.duration > 0
                              ? (desktopNowPlaying.currentTime / desktopNowPlaying.duration) * 100
                              : 0
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.desktopTimeRow}>
                    <Text style={styles.desktopTimeText}>
                      {formatDuration(desktopNowPlaying?.currentTime || 0)}
                    </Text>
                    <Text style={styles.desktopTimeText}>
                      {formatDuration(desktopNowPlaying?.duration || 0)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bottom Controls & Handoff Action */}
              <View style={styles.desktopActionRow}>
                {/* Remote controls */}
                <View style={styles.desktopRemoteBtns}>
                  <Pressable
                    onPress={handleDesktopPrev}
                    style={({ pressed }) => [styles.desktopRemoteBtn, pressed && { opacity: 0.6 }]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Previous track on desktop"
                  >
                    <SleekSkipBackIcon size={14} color="#78350F" />
                  </Pressable>
                  <Pressable
                    onPress={handleDesktopTogglePlay}
                    style={({ pressed }) => [
                      styles.desktopRemotePlayBtn,
                      pressed && { transform: [{ scale: 0.94 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={desktopNowPlaying?.isPlaying ? "Pause desktop" : "Play desktop"}
                  >
                    {desktopNowPlaying?.isPlaying ? (
                      <SleekPauseIcon size={12} color="#FFFFFF" />
                    ) : (
                      <SleekPlayIcon size={12} color="#FFFFFF" />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={handleDesktopNext}
                    style={({ pressed }) => [styles.desktopRemoteBtn, pressed && { opacity: 0.6 }]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Next track on desktop"
                  >
                    <SleekSkipForwardIcon size={14} color="#78350F" />
                  </Pressable>
                </View>

                {/* Play on iPhone button */}
                <Pressable
                  onPress={handleDesktopHandoff}
                  disabled={isHandoffLoading}
                  style={({ pressed }) => [
                    styles.desktopHandoffBtn,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Play currently playing desktop song on iPhone"
                >
                  {isHandoffLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <SleekPlayIcon size={11} color="#FFFFFF" />
                      <Text style={styles.desktopHandoffBtnText}>Play on iPhone</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Playlist Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Playlist</Text>
              <Pressable
                onPress={handleSeeMorePlaylists}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="See more playlists"
              >
                <Text style={styles.seeMoreText}>See more</Text>
              </Pressable>
            </View>

            {/* Horizontal Playlist Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {playlists.map((playlist) => (
                <SleekPlaylistCard
                  key={playlist.id}
                  title={playlist.title}
                  trackCount={playlist.trackCount}
                  imageSource={playlist.imageSource}
                  onPress={() => handlePlayPlaylist(playlist)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Recently Played Section */}
          <View style={[styles.section, { marginTop: 20 }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recently Played</Text>
              <Pressable
                onPress={handleSeeMoreRecentlyPlayed}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="See more recently played tracks"
              >
                <Text style={styles.seeMoreText}>See more</Text>
              </Pressable>
            </View>

            {/* Track Rows matching screenshot */}
            <View style={styles.trackList}>
              {recentTracks.map((track) => {
                const isItemPlaying =
                  (currentTrackId === track.id || currentTrackTitle === track.title) &&
                  isPlaying;
                return (
                  <SleekTrackRow
                    key={track.id}
                    title={track.title}
                    artistSubtitle={track.artistSubtitle}
                    duration={track.duration}
                    imageSource={track.imageSource}
                    artworkUri={track.artworkUri}
                    isPlaying={isItemPlaying}
                    onPress={() => handlePlayTrack(track)}
                    onMorePress={() => setActionTrack(track.rawTrack || null)}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      <SleekTrackActionSheet
        visible={Boolean(actionTrack)}
        track={actionTrack}
        onClose={() => setActionTrack(null)}
        onTrackUpdated={loadData}
        onTrackDeleted={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: sleekTokens.headerGradientStart,
    position: 'relative',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: sleekTokens.sheetBg,
    borderTopLeftRadius: sleekTokens.cardBorderRadius,
    borderTopRightRadius: sleekTokens.cardBorderRadius,
    marginTop: -20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 12,
  },
  handlePill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: sleekTokens.handlePill,
  },
  importBanner: {
    backgroundColor: '#FFFDF5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 18,
    marginVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  importIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBannerContent: {
    flex: 1,
    paddingRight: 10,
  },
  importBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 3,
  },
  importBannerSubtitle: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  importButton: {
    backgroundColor: palette.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  importButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: sleekTokens.textPrimary,
    letterSpacing: 0.2,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: sleekTokens.seeMoreText,
  },
  horizontalScroll: {
    paddingRight: 16,
    paddingBottom: 4,
  },
  trackList: {
    gap: 4,
  },
  desktopSyncCard: {
    backgroundColor: '#FFFDF5',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  desktopCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  desktopCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  desktopIconSquircle: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopCardDeviceName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.8,
  },
  desktopLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  desktopLiveStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  pausedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  desktopCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  desktopArtwork: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  desktopArtworkFallback: {
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopTrackDetails: {
    flex: 1,
  },
  desktopTrackTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F180B',
    marginBottom: 2,
  },
  desktopTrackSubtitle: {
    fontSize: 12,
    color: '#968D7B',
    marginBottom: 6,
  },
  desktopProgressTrack: {
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FDE68A',
    overflow: 'hidden',
    marginBottom: 3,
  },
  desktopProgressBar: {
    height: '100%',
    backgroundColor: '#F9A826',
    borderRadius: 2,
  },
  desktopTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  desktopTimeText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '500',
  },
  desktopActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  desktopRemoteBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  desktopRemoteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopRemotePlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F9A826',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  desktopHandoffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 14,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  desktopHandoffBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

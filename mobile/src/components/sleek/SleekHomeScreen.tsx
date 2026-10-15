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
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { SleekHeader, getDynamicGreeting } from './SleekHeader';
import { SleekPlaylistCard } from './SleekPlaylistCard';
import { SleekTrackRow } from './SleekTrackRow';
import { SleekTrackActionSheet } from './SleekTrackActionSheet';
import { SleekImportIcon, SleekMusicNoteIcon } from './SleekIcons';
import { useDatabase } from '../../hooks/useDatabase';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUserStore } from '../../store/useUserStore';
import { useDrawerStore } from '../../store/useDrawerStore';
import { FileImportService } from '../../services/files/FileImportService';
import { sleekTokens, palette } from '../../design/colors';
import type { MobileTrack } from '../../domain/models';

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
  const { loadAndPlay, currentTrack, isPlaying } = usePlayerStore();
  const { userName: storeUserName } = useUserStore();
  const { setActiveTab } = useDrawerStore();
  const userName = propUserName || storeUserName;

  const [playlists, setPlaylists] = useState<DisplayPlaylist[]>(DEFAULT_PLAYLISTS);
  const [recentTracks, setRecentTracks] = useState<DisplayTrack[]>(DEFAULT_TRACKS);
  const [hasRealTracks, setHasRealTracks] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [actionTrack, setActionTrack] = useState<MobileTrack | null>(null);

  const loadData = () => {
    if (!db.isReady) return;

    try {
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
                  (currentTrack?.id === track.id || currentTrack?.title === track.title) &&
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
});

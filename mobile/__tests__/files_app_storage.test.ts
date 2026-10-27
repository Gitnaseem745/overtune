/**
 * Files App Storage & Sharing Tests
 *
 * Verifies that downloaded tracks are placed in the user-visible Music directory
 * (accessible in iOS Files app under "On My iPhone > Overtone > Music"),
 * names are sanitized and human-readable, and sharing / export works.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { FileImportService, MUSIC_DIR, AUDIO_DIR } from '../src/services/files/FileImportService';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { MobileTrack } from '../src/domain/models';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

describe('Files App Storage & Sharing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: true, size: 5000000 });
    (FileSystem.makeDirectoryAsync as any).mockResolvedValue(undefined);
    (FileSystem.downloadAsync as any).mockResolvedValue({ status: 200 });
    (FileSystem.copyAsync as any).mockResolvedValue(undefined);
  });

  it('stores remote track into Files app Music/ directory with clean human name when saveToFilesApp is true', async () => {
    const res = await FileImportService.downloadRemoteTrack(
      'http://192.168.1.100:4333/api/sync/audio/1',
      42,
      'Bohemian Rhapsody',
      'Queen',
      true
    );

    expect(res).not.toBeNull();
    expect(res?.localUri).toContain(MUSIC_DIR);
    expect(res?.localUri).toContain('Queen - Bohemian Rhapsody.mp3');
    expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
      'http://192.168.1.100:4333/api/sync/audio/1',
      expect.stringContaining(`${MUSIC_DIR}Queen - Bohemian Rhapsody.mp3`)
    );
  });

  it('falls back to internal audio directory when saveToFilesApp is false', async () => {
    const res = await FileImportService.downloadRemoteTrack(
      'http://192.168.1.100:4333/api/sync/audio/2',
      10,
      'Get Lucky',
      'Daft Punk',
      false
    );

    expect(res).not.toBeNull();
    expect(res?.localUri).toContain(AUDIO_DIR);
  });

  it('invokes Sharing.shareAsync with audio/mpeg and public.mp3 UTI for saving to Files or other apps', async () => {
    (Sharing.isAvailableAsync as any).mockResolvedValueOnce(true);
    (Sharing.shareAsync as any).mockResolvedValueOnce(undefined);

    const success = await FileImportService.shareOrExportTrack(
      'file:///test/Queen - Bohemian Rhapsody.mp3',
      'Bohemian Rhapsody'
    );

    expect(success).toBe(true);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///test/Queen - Bohemian Rhapsody.mp3',
      expect.objectContaining({
        mimeType: 'audio/mpeg',
        UTI: 'public.mp3',
      })
    );
  });

  it('syncs existing offline tracks into Files app Music/ folder', async () => {
    const sampleTracks: MobileTrack[] = [
      {
        id: 1,
        title: 'Song in Internal Audio',
        artistId: null,
        albumId: null,
        fileUri: `${AUDIO_DIR}1_Song.mp3`,
        duration: 200,
        trackNumber: null,
        genre: null,
        fileHash: null,
        artworkUri: null,
        fileSize: 4000,
        format: 'mp3',
        sampleRate: 44100,
        bitRate: 320,
        channels: 2,
        importedAt: '2026-10-15T00:00:00.000Z',
        lastPlayedAt: null,
      },
      {
        id: 2,
        title: 'Song Already In Music',
        artistId: null,
        albumId: null,
        fileUri: `${MUSIC_DIR}Song Already In Music.mp3`,
        duration: 180,
        trackNumber: null,
        genre: null,
        fileHash: null,
        artworkUri: null,
        fileSize: 3000,
        format: 'mp3',
        sampleRate: 44100,
        bitRate: 320,
        channels: 2,
        importedAt: '2026-10-15T00:00:00.000Z',
        lastPlayedAt: null,
      },
    ];

    (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: false });

    const moved = await FileImportService.syncAllToFilesApp(sampleTracks);
    expect(moved).toBe(1);
    expect(FileSystem.copyAsync).toHaveBeenCalledWith({
      from: `${AUDIO_DIR}1_Song.mp3`,
      to: `${MUSIC_DIR}Song in Internal Audio.mp3`,
    });
  });

  it('exports full playlist into a dedicated folder with .m3u8 playlist file', async () => {
    (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: false });
    (FileSystem.makeDirectoryAsync as any).mockResolvedValue(undefined);
    (FileSystem.copyAsync as any).mockResolvedValue(undefined);
    (FileSystem.writeAsStringAsync as any).mockResolvedValue(undefined);

    const playlistTracks: MobileTrack[] = [
      {
        id: 1,
        title: 'Song One',
        artistId: null,
        albumId: null,
        fileUri: `${MUSIC_DIR}Song One.mp3`,
        duration: 180,
        trackNumber: 1,
        genre: null,
        fileHash: null,
        artworkUri: null,
        fileSize: 4000,
        format: 'mp3',
        sampleRate: 44100,
        bitRate: 320,
        channels: 2,
        importedAt: '2026-10-15T00:00:00.000Z',
        lastPlayedAt: null,
      },
      {
        id: 2,
        title: 'Song Two',
        artistId: null,
        albumId: null,
        fileUri: `${MUSIC_DIR}Song Two.mp3`,
        duration: 210,
        trackNumber: 2,
        genre: null,
        fileHash: null,
        artworkUri: null,
        fileSize: 5000,
        format: 'mp3',
        sampleRate: 44100,
        bitRate: 320,
        channels: 2,
        importedAt: '2026-10-15T00:00:00.000Z',
        lastPlayedAt: null,
      },
    ];

    const res = await FileImportService.exportPlaylistFolderToFiles('Summer Vibes', playlistTracks);
    expect(res.exportedCount).toBe(2);
    expect(res.folderUri).toContain(`${MUSIC_DIR}Summer Vibes/`);
    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      `${MUSIC_DIR}Summer Vibes/`,
      { intermediates: true }
    );
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      `${MUSIC_DIR}Summer Vibes/Summer Vibes.m3u8`,
      expect.stringContaining('#EXTM3U')
    );
  });

  it('shares all songs in a playlist as a single .zip archive', async () => {
    (Sharing.isAvailableAsync as any).mockResolvedValueOnce(true);
    (Sharing.shareAsync as any).mockResolvedValueOnce(undefined);
    (FileSystem.getInfoAsync as any).mockResolvedValue({ exists: true });
    (FileSystem.readAsStringAsync as any).mockResolvedValue('AAAA');
    (FileSystem.writeAsStringAsync as any).mockResolvedValue(undefined);

    const playlistTracks: MobileTrack[] = [
      {
        id: 10,
        title: 'First Track',
        artistId: null,
        albumId: null,
        fileUri: `${MUSIC_DIR}First Track.mp3`,
        duration: 150,
        trackNumber: 1,
        genre: null,
        fileHash: null,
        artworkUri: null,
        fileSize: 3000,
        format: 'mp3',
        sampleRate: 44100,
        bitRate: 320,
        channels: 2,
        importedAt: '2026-10-15T00:00:00.000Z',
        lastPlayedAt: null,
      },
      {
        id: 11,
        title: 'Second Track',
        artistId: null,
        albumId: null,
        fileUri: `${MUSIC_DIR}Second Track.mp3`,
        duration: 200,
        trackNumber: 2,
        genre: null,
        fileHash: null,
        artworkUri: null,
        fileSize: 4500,
        format: 'mp3',
        sampleRate: 44100,
        bitRate: 320,
        channels: 2,
        importedAt: '2026-10-15T00:00:00.000Z',
        lastPlayedAt: null,
      },
    ];

    const shared = await FileImportService.sharePlaylistArchive('Workout Mix', playlistTracks);
    expect(shared).toBe(true);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      expect.stringContaining('Workout Mix.zip'),
      expect.objectContaining({
        mimeType: 'application/zip',
        UTI: 'public.zip-archive',
      })
    );
  });
});

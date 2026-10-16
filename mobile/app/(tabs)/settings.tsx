/**
 * Overtone iOS — Settings Screen
 *
 * Wi-Fi Sync configuration, paired devices, storage usage,
 * playback preferences, and privacy information.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useDatabase } from '../../src/hooks/useDatabase';
import { useUserStore } from '../../src/store/useUserStore';
import { FileImportService, formatBytes } from '../../src/services/files/FileImportService';
import { SyncService } from '../../src/services/sync/SyncService';
import { spacing, radii, layout, MIN_TOUCH_TARGET } from '../../src/design/spacing';
import { typography } from '../../src/design/typography';
import type { PairedDevice } from '../../src/domain/models';

export default function SettingsScreen() {
  const { colors, scheme, setScheme } = useTheme();
  const router = useRouter();
  const db = useDatabase();

  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  const [storageUsage, setStorageUsage] = useState<{
    audioBytes: number;
    artworkBytes: number;
    totalBytes: number;
  }>({ audioBytes: 0, artworkBytes: 0, totalBytes: 0 });

  const [gapless, setGapless] = useState<boolean>(true);
  const [resumeOnLaunch, setResumeOnLaunch] = useState<boolean>(false);
  const { userName, setUserName, loadUserName } = useUserStore();
  const [editName, setEditName] = useState(userName);
  const [isNameSaved, setIsNameSaved] = useState(false);

  useEffect(() => {
    if (db.isReady) {
      loadUserName(db);
    }
  }, [db.isReady, loadUserName]);

  useEffect(() => {
    setEditName(userName);
  }, [userName]);

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUserName(trimmed, db);
    setIsNameSaved(true);
    setTimeout(() => setIsNameSaved(false), 2000);
  };

  const loadSettingsData = useCallback(async () => {
    if (!db.isReady) return;
    try {
      const devices = db.pairedDevices.getAll();
      setPairedDevices(devices);

      const usage = await FileImportService.getStorageUsage();
      setStorageUsage(usage);

      setGapless(db.settings.get('gapless', 'true') === 'true');
      setResumeOnLaunch(db.settings.get('resumeOnLaunch', 'false') === 'true');
    } catch (e) {
      console.warn('[Settings] Error loading:', e);
    }
  }, [db.isReady]);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

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

  const handleToggleGapless = (val: boolean) => {
    setGapless(val);
    db.settings.set('gapless', val ? 'true' : 'false');
  };

  const handleToggleResume = (val: boolean) => {
    setResumeOnLaunch(val);
    db.settings.set('resumeOnLaunch', val ? 'true' : 'false');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.miniPlayerHeight + layout.tabBarHeight + spacing.xl },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>Settings</Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={[typography.subheadline, styles.sectionHeader, { color: colors.textSecondary }]}>
            USER PROFILE
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                  {(userName || 'O').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>Display Name</Text>
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                  Current: {userName}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <TextInput
                style={{
                  flex: 1,
                  height: 42,
                  backgroundColor: colors.surface,
                  borderRadius: radii.md,
                  paddingHorizontal: 12,
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter custom username..."
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={25}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <Pressable
                onPress={handleSaveName}
                style={{
                  height: 42,
                  paddingHorizontal: 16,
                  borderRadius: radii.md,
                  backgroundColor: isNameSaved ? '#10B981' : colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Save username"
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                  {isNameSaved ? 'Saved ✓' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Wi-Fi Sync Section */}
        <View style={styles.section}>
          <Text style={[typography.subheadline, styles.sectionHeader, { color: colors.textSecondary }]}>
            WI-FI SYNC
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 24 }}>🔄</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  Desktop Playlist Sync
                </Text>
                <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: 2 }]}>
                  Exchange playlists with Overtone on your Mac or PC over your local Wi-Fi network.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/sync/pair')}
              style={[styles.syncButton, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.syncButtonText}>+ Connect to Desktop</Text>
            </Pressable>

            {/* Paired Devices List */}
            {pairedDevices.length > 0 && (
              <View style={styles.deviceList}>
                <Text style={[typography.caption1, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
                  PAIRED DEVICES
                </Text>
                {pairedDevices.map((device) => (
                  <View
                    key={device.id}
                    style={[styles.deviceRow, { borderTopColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '500' }]}>
                        {device.name}
                      </Text>
                      <Text style={[typography.caption1, { color: colors.textSecondary }]}>
                        {device.ip}:{device.port}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleRevokeDevice(device)}
                      hitSlop={8}
                      style={styles.revokeBtn}
                    >
                      <Text style={[typography.caption1, { color: colors.error, fontWeight: '600' }]}>
                        Disconnect
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Text style={[typography.caption2, styles.privacyNote, { color: colors.textTertiary }]}>
              Sync transfers playlist metadata only; it matches songs already imported on this phone and never uploads private audio files.
            </Text>
          </View>
        </View>

        {/* Storage Section */}
        <View style={styles.section}>
          <Text style={[typography.subheadline, styles.sectionHeader, { color: colors.textSecondary }]}>
            STORAGE & LIBRARY
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.settingRow}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>Music Files</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                {formatBytes(storageUsage.audioBytes)}
              </Text>
            </View>
            <View style={[styles.settingRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>Cached Artwork</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                {formatBytes(storageUsage.artworkBytes)}
              </Text>
            </View>
            <View style={[styles.settingRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
                Total App Storage
              </Text>
              <Text style={[typography.body, { color: colors.textPrimary, fontWeight: '600' }]}>
                {formatBytes(storageUsage.totalBytes)}
              </Text>
            </View>
          </View>
        </View>

        {/* Playback Preferences */}
        <View style={styles.section}>
          <Text style={[typography.subheadline, styles.sectionHeader, { color: colors.textSecondary }]}>
            PLAYBACK
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.settingRow}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>Gapless Playback</Text>
              <Switch
                value={gapless}
                onValueChange={handleToggleGapless}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            </View>
            <View style={[styles.settingRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>Resume on Launch</Text>
              <Switch
                value={resumeOnLaunch}
                onValueChange={handleToggleResume}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[typography.subheadline, styles.sectionHeader, { color: colors.textSecondary }]}>
            ABOUT
          </Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.settingRow}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>Version</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>1.0.1 (Build 2)</Text>
            </View>
            <View style={[styles.settingRow, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[typography.body, { color: colors.textPrimary }]}>Architecture</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>Local-First SQLite</Text>
            </View>
          </View>
        </View>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  syncButton: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  syncButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  deviceList: {
    marginBottom: spacing.sm,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  revokeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  privacyNote: {
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
  },
});

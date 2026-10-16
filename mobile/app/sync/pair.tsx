/**
 * Overtone iOS — Wi-Fi Sync Pair Modal
 *
 * Connects to the desktop Overtone server on the local network.
 * Features Ping testing, PIN entry, Keychain token storage,
 * and clear diagnostic error feedback.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useDatabase } from '../../src/hooks/useDatabase';
import { SyncService } from '../../src/services/sync/SyncService';
import { spacing, radii } from '../../src/design/spacing';
import { typography } from '../../src/design/typography';

export default function PairScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const db = useDatabase();

  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('47848');
  const [pin, setPin] = useState('');

  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [isPairing, setIsPairing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePing = async () => {
    const host = ipAddress.trim();
    if (!host) {
      setPingResult({ ok: false, message: 'Please enter a desktop IP address.' });
      return;
    }

    setIsPinging(true);
    setPingResult(null);

    const portNum = parseInt(port, 10) || 47848;
    const res = await SyncService.ping(host, portNum);

    setIsPinging(false);
    if (res.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPingResult({
        ok: true,
        message: `Connected to "${res.deviceName || 'Overtone Desktop'}"`,
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPingResult({
        ok: false,
        message: res.error || 'Server unreachable. Verify IP, port, and Wi-Fi.',
      });
    }
  };

  const handlePair = async () => {
    const host = ipAddress.trim();
    const pinCode = pin.trim();

    if (!host) {
      setErrorMessage('Please enter the desktop IP address.');
      return;
    }
    if (pinCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit PIN displayed on your desktop.');
      return;
    }

    setIsPairing(true);
    setErrorMessage(null);

    const portNum = parseInt(port, 10) || 47848;
    const res = await SyncService.pair(host, pinCode, portNum);

    setIsPairing(false);

    if (res.success && res.deviceId && res.authToken) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Save paired device to local database
      if (db.isReady) {
        db.pairedDevices.save(
          {
            id: res.deviceId,
            name: res.hostDeviceName || 'Desktop',
            ip: host,
            port: portNum,
            pairedAt: new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
          },
          res.authToken
        );
      }

      Alert.alert(
        'Connected!',
        `Successfully paired with ${res.hostDeviceName || 'Desktop'}. You can now exchange playlists.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage(res.error || 'Pairing failed. Please check the PIN and try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Description */}
        <View style={styles.header}>
          <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: spacing.sm }}>💻</Text>
          <Text style={[typography.title2, styles.title, { color: colors.textPrimary }]}>
            Connect to Overtone Desktop
          </Text>
          <Text style={[typography.body, styles.subtitle, { color: colors.textSecondary }]}>
            Ensure both devices are on the same Wi-Fi network. On your computer, open Overtone → Settings → Wi-Fi Sync to see your IP and PIN.
          </Text>
        </View>

        {/* Inputs */}
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[typography.caption1, { color: colors.textSecondary }]}>DESKTOP IP ADDRESS</Text>
          <TextInput
            value={ipAddress}
            onChangeText={(t: string) => {
              setIpAddress(t);
              setPingResult(null);
            }}
            placeholder="e.g. 192.168.1.100"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.border }]}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.caption1, { color: colors.textSecondary }]}>PORT</Text>
              <TextInput
                value={port}
                onChangeText={setPort}
                keyboardType="number-pad"
                style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.border }]}
              />
            </View>

            <Pressable
              onPress={handlePing}
              disabled={isPinging}
              style={[styles.pingBtn, { backgroundColor: colors.surfaceOverlay }]}
            >
              {isPinging ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[typography.subheadline, { color: colors.accent, fontWeight: '600' }]}>
                  Test Ping
                </Text>
              )}
            </Pressable>
          </View>

          {pingResult && (
            <Text
              style={[
                typography.caption1,
                { color: pingResult.ok ? colors.success : colors.error, marginTop: spacing.xs },
              ]}
            >
              {pingResult.ok ? '✓ ' : '✕ '}
              {pingResult.message}
            </Text>
          )}

          <Text style={[typography.caption1, { color: colors.textSecondary, marginTop: spacing.md }]}>
            6-DIGIT PAIRING PIN
          </Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            placeholder="123456"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            maxLength={6}
            style={[styles.pinInput, { color: colors.textPrimary, borderBottomColor: colors.border }]}
          />
        </View>

        {errorMessage && (
          <Text style={[typography.caption1, styles.errorText, { color: colors.error }]}>
            ⚠️ {errorMessage}
          </Text>
        )}

        {/* Pair Action */}
        <Pressable
          onPress={handlePair}
          disabled={isPairing}
          style={[styles.pairBtn, { backgroundColor: colors.accent }]}
        >
          {isPairing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.pairBtnText}>Pair with Desktop</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  input: {
    fontSize: 16,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  pingBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    height: 40,
  },
  pinInput: {
    fontSize: 24,
    letterSpacing: 6,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontWeight: '700',
  },
  errorText: {
    textAlign: 'center',
  },
  pairBtn: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  pairBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

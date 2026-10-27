/**
 * Overtone iOS — Sleek Alert & Popup Component
 *
 * Custom luxury theme alert dialog replacing system Alert.alert across iOS.
 * Features warm amber, gold & obsidian aesthetics, themed icon badges,
 * rich typography, haptics, and smooth animations.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  SleekCheckIcon,
  SleekTrashIcon,
  SleekAlertTriangleIcon,
  SleekInfoIcon,
  SleekMusicNoteIcon,
  SleekDesktopSyncIcon,
} from './SleekIcons';

export interface SleekAlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export type SleekAlertKind = 'info' | 'success' | 'warning' | 'error' | 'delete' | 'sync';

export interface SleekAlertOptions {
  kind?: SleekAlertKind;
  cancelable?: boolean;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: SleekAlertButton[];
  kind: SleekAlertKind;
  cancelable: boolean;
}

type AlertListener = (state: AlertState) => void;

let activeListener: AlertListener | null = null;
let pendingState: AlertState | null = null;

function detectKind(title: string, message?: string, buttons?: SleekAlertButton[]): SleekAlertKind {
  const text = `${title} ${message || ''}`.toLowerCase();
  const hasDestructive = buttons?.some((b) => b.style === 'destructive');

  if (hasDestructive || text.includes('delete') || text.includes('remove') || text.includes('destroy')) {
    return 'delete';
  }
  if (
    text.includes('success') ||
    text.includes('connected') ||
    text.includes('paired') ||
    text.includes('saved') ||
    text.includes('added') ||
    text.includes('downloaded') ||
    text.includes('restored') ||
    text.includes('sent')
  ) {
    return 'success';
  }
  if (
    text.includes('fail') ||
    text.includes('error') ||
    text.includes('invalid') ||
    text.includes('cannot') ||
    text.includes('could not') ||
    text.includes('unreachable')
  ) {
    return 'error';
  }
  if (text.includes('sync') || text.includes('desktop') || text.includes('wifi') || text.includes('wi-fi')) {
    return 'sync';
  }
  if (text.includes('warning') || text.includes('required') || text.includes('missing') || text.includes('already')) {
    return 'warning';
  }
  return 'info';
}

/**
 * Global API to trigger a Sleek Theme Alert Popup anywhere in the app.
 * Compatible with React Native's Alert.alert signature.
 */
export function sleekAlert(
  title: string,
  message?: string,
  buttons?: SleekAlertButton[],
  options?: SleekAlertOptions
) {
  const normalizedButtons: SleekAlertButton[] =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: 'OK', style: 'default' }];

  const kind = options?.kind || detectKind(title, message, normalizedButtons);
  const cancelable = options?.cancelable ?? true;

  // Trigger initial haptic feedback
  if (kind === 'delete' || kind === 'error') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } else if (kind === 'success') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  const newState: AlertState = {
    visible: true,
    title,
    message,
    buttons: normalizedButtons,
    kind,
    cancelable,
  };

  if (activeListener) {
    activeListener(newState);
  } else {
    pendingState = newState;
  }
}

export const SleekAlert = {
  alert: sleekAlert,
};

/**
 * Root Host Component rendered in the root app layout to display Sleek Alerts.
 */
export function SleekAlertHost() {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    kind: 'info',
    cancelable: true,
  });

  const [scaleAnim] = useState(() => new Animated.Value(0.92));
  const [opacityAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    activeListener = (newState: AlertState) => {
      setAlert(newState);
    };

    if (pendingState) {
      activeListener(pendingState);
      pendingState = null;
    }

    return () => {
      activeListener = null;
    };
  }, []);

  useEffect(() => {
    if (alert.visible) {
      scaleAnim.setValue(0.92);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [alert.visible]);

  const handleDismiss = () => {
    if (!alert.cancelable) return;
    Haptics.selectionAsync();
    const cancelBtn = alert.buttons.find((b) => b.style === 'cancel');
    if (cancelBtn?.onPress) {
      cancelBtn.onPress();
    }
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const handleButtonPress = (button: SleekAlertButton) => {
    if (button.style === 'destructive') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setAlert((prev) => ({ ...prev, visible: false }));
    if (button.onPress) {
      // Delay callback slightly so modal dismiss animation is smooth
      setTimeout(() => {
        button.onPress?.();
      }, 50);
    }
  };

  if (!alert.visible) return null;

  const isRowLayout = alert.buttons.length === 2;

  // Icon Badge renderer based on alert kind
  const renderIcon = () => {
    switch (alert.kind) {
      case 'delete':
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
            <SleekTrashIcon size={24} color="#DC2626" />
          </View>
        );
      case 'error':
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <SleekAlertTriangleIcon size={24} color="#D97706" />
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <SleekAlertTriangleIcon size={24} color="#D97706" />
          </View>
        );
      case 'success':
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <SleekCheckIcon size={22} color="#D97706" />
          </View>
        );
      case 'sync':
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <SleekDesktopSyncIcon size={24} color="#D97706" />
          </View>
        );
      default:
        return (
          <View style={[styles.iconCircle, { backgroundColor: '#FFFDF5', borderColor: '#FDE68A' }]}>
            <SleekInfoIcon size={24} color="#D97706" />
          </View>
        );
    }
  };

  return (
    <Modal
      transparent
      animationType="none"
      visible={alert.visible}
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleDismiss} />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Top Icon Badge */}
          <View style={styles.iconContainer}>{renderIcon()}</View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {alert.title}
          </Text>

          {/* Message */}
          {Boolean(alert.message) && (
            <Text style={styles.message}>{alert.message}</Text>
          )}

          {/* Action Buttons */}
          <View style={isRowLayout ? styles.buttonRow : styles.buttonColumn}>
            {alert.buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              let btnStyle: any = styles.defaultBtn;
              let textStyle: any = styles.defaultBtnText;

              if (isCancel) {
                btnStyle = styles.cancelBtn;
                textStyle = styles.cancelBtnText;
              } else if (isDestructive) {
                btnStyle = styles.destructiveBtn;
                textStyle = styles.destructiveBtnText;
              }

              return (
                <Pressable
                  key={index}
                  onPress={() => handleButtonPress(btn)}
                  style={({ pressed }) => [
                    btnStyle,
                    isRowLayout && { flex: 1 },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={btn.text}
                >
                  <Text style={textStyle} numberOfLines={1}>
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = Math.min(width - 48, 330);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 8, 4, 0.62)',
  },
  card: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 168, 38, 0.28)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 25,
  },
  iconContainer: {
    marginBottom: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  title: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#1F180B',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 6,
  },
  message: {
    fontSize: 13.5,
    color: '#786C5A',
    textAlign: 'center',
    lineHeight: 19.5,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: 9,
    width: '100%',
    marginTop: 6,
  },
  defaultBtn: {
    height: 44,
    backgroundColor: '#F9A826',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  defaultBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    height: 44,
    backgroundColor: '#F3E8CE',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#786C5A',
  },
  destructiveBtn: {
    height: 44,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  destructiveBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

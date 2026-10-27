/**
 * Overtone iOS — Sleek Modal & Sheet Component
 *
 * Custom luxury theme bottom sheet / modal replacing default React Native
 * presentationStyle="pageSheet" modals across the app.
 * Styled in warm obsidian amber backdrop, rounded top corners, grabber pill,
 * and elegant headers.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  DimensionValue,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SleekCloseIcon } from './SleekIcons';

export interface SleekModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  showGrabber?: boolean;
  maxHeight?: DimensionValue;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'none';
}

export function SleekModal({
  visible,
  onClose,
  title,
  subtitle,
  headerLeft,
  headerRight,
  showGrabber = true,
  maxHeight = '90%',
  children,
  animationType = 'slide',
}: SleekModalProps) {
  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheetContainer, { maxHeight }]}>
          {/* Top Grabber Handle */}
          {showGrabber && (
            <View style={styles.handleContainer}>
              <View style={styles.handlePill} />
            </View>
          )}

          {/* Optional Header Row */}
          {(Boolean(title) || Boolean(headerLeft) || Boolean(headerRight)) && (
            <View style={styles.headerRow}>
              {headerLeft ? (
                <View style={styles.headerLeftContainer}>{headerLeft}</View>
              ) : null}

              <View style={styles.headerCenterContainer}>
                {Boolean(title) && (
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                  </Text>
                )}
                {Boolean(subtitle) && (
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>

              {headerRight ? (
                <View style={styles.headerRightContainer}>{headerRight}</View>
              ) : (
                <Pressable onPress={handleClose} hitSlop={10} style={styles.closeBtn}>
                  <SleekCloseIcon size={18} color="#968D7B" />
                </Pressable>
              )}
            </View>
          )}

          {/* Body Content */}
          <View style={styles.content}>{children}</View>
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
    backgroundColor: 'rgba(10, 8, 4, 0.60)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(249, 168, 38, 0.18)',
    borderBottomWidth: 0,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handlePill: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#E5DFD3',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(249, 168, 38, 0.20)',
    gap: 12,
  },
  headerLeftContainer: {
    minWidth: 40,
  },
  headerCenterContainer: {
    flex: 1,
  },
  headerRightContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#1F180B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#786C5A',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
});

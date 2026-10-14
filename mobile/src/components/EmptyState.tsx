import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import {
  SleekMusicNoteIcon,
  SleekPlaylistsIcon,
  SleekHeartIcon,
  SleekSearchIcon,
  SleekImportIcon,
} from './sleek/SleekIcons';
import { spacing, radii } from '../design/spacing';
import { typography } from '../design/typography';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

function renderEmptyVectorIcon(icon?: string, color = '#F9A826') {
  if (!icon) return <SleekMusicNoteIcon size={32} color={color} />;

  if (icon.includes('📁') || icon.toLowerCase().includes('playlist') || icon.toLowerCase().includes('folder')) {
    return <SleekPlaylistsIcon size={32} color={color} />;
  }
  if (icon.includes('💛') || icon.includes('❤️') || icon.toLowerCase().includes('heart') || icon.toLowerCase().includes('fav')) {
    return <SleekHeartIcon size={32} color={color} filled />;
  }
  if (icon.includes('🔍') || icon.toLowerCase().includes('search')) {
    return <SleekSearchIcon size={32} color={color} />;
  }
  if (icon.includes('📥') || icon.toLowerCase().includes('import')) {
    return <SleekImportIcon size={32} color={color} />;
  }
  if (icon.includes('⚠️') || icon.toLowerCase().includes('warn') || icon.toLowerCase().includes('error')) {
    return (
      <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3L2 21H22L12 3Z"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M12 9V14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <Path d="M12 17.5V18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </Svg>
    );
  }

  // Fallback to SleekMusicNoteIcon
  return <SleekMusicNoteIcon size={32} color={color} />;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAction?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.badgeWrapper}>
        <View style={styles.badgeGlow} />
        <View style={styles.badgeSquircle}>
          {renderEmptyVectorIcon(icon, colors.accent)}
        </View>
      </View>

      <Text style={[typography.title2, styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[typography.body, styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={handleAction}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={[typography.headline, styles.buttonText]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[typography.body, styles.loadingText, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { colors } = useTheme();

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetry?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.badgeWrapper}>
        <View style={[styles.badgeGlow, { backgroundColor: '#FEE2E2' }]} />
        <View style={[styles.badgeSquircle, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          {renderEmptyVectorIcon('⚠️', '#DC2626')}
        </View>
      </View>

      <Text style={[typography.title3, styles.title, { color: colors.textPrimary }]}>
        Something went wrong
      </Text>
      <Text style={[typography.body, styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={handleRetry}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Try Again"
        >
          <Text style={[typography.headline, styles.buttonText]}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 44,
  },
  badgeWrapper: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  badgeGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    opacity: 0.8,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  badgeSquircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  button: {
    marginTop: 22,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingText: {
    marginTop: spacing.md,
  },
});

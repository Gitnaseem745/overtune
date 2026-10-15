/**
 * Overtone iOS — Sleek Drawer Component
 *
 * Precisely refined sidebar matching target reference Image 2.
 * Contains:
 * 1. Compact squircle avatar with restrained violet glow aura
 * 2. "Hi!" greeting and bold stacked username with refined typography
 * 3. Exactly 5 navigation items: Home, Favorites, Playlists, Search, Settings
 * 4. Active item pill-shaped purple highlight with 100% aligned icon column
 * 5. Clean, professional dark purple gradient with zero clutter
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  SleekHomeIcon,
  SleekMusicNoteIcon,
  SleekHeartIcon,
  SleekPlaylistsIcon,
  SleekSearchIcon,
  SleekSettingsIcon,
} from './SleekIcons';
import { useDrawerStore, type SleekNavTab } from '../../store/useDrawerStore';
import { useUserStore } from '../../store/useUserStore';
import { sleekTokens } from '../../design/colors';

interface SleekDrawerProps {
  userName?: string;
  onSelectTab?: (tab: SleekNavTab) => void;
}

interface NavItemConfig {
  id: SleekNavTab;
  label: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', IconComponent: SleekHomeIcon },
  { id: 'songs', label: 'All Songs', IconComponent: SleekMusicNoteIcon },
  { id: 'favorites', label: 'Favorites', IconComponent: SleekHeartIcon },
  { id: 'playlists', label: 'Playlists', IconComponent: SleekPlaylistsIcon },
  { id: 'search', label: 'Search', IconComponent: SleekSearchIcon },
  { id: 'settings', label: 'Settings', IconComponent: SleekSettingsIcon },
];

export function SleekDrawer({ userName: propUserName, onSelectTab }: SleekDrawerProps) {
  const { height } = useWindowDimensions();
  const { activeTab, setActiveTab, closeDrawer } = useDrawerStore();
  const { userName: storeUserName } = useUserStore();
  const userName = propUserName || storeUserName;

  const handlePressTab = (tab: SleekNavTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    onSelectTab?.(tab);
    closeDrawer();
  };

  return (
    <View style={[styles.container, { minHeight: height }]}>
      {/* Unified Solid Background matching upper details area */}
      <View style={styles.solidBg} />

      {/* Content Vertically Centered */}
      <View style={styles.verticallyCenteredContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Compact Squircle Avatar with Restrained Glow */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarAmbientGlow} />
            <View style={styles.avatarSquircle}>
              <Text style={styles.avatarMonogramText}>
                {(userName || 'O').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Greeting & Dynamic Username */}
          <View style={styles.nameBlock}>
            <Text style={styles.greetingText}>Hi!</Text>
            <Text style={styles.nameText} numberOfLines={2}>
              {userName}
            </Text>
          </View>
        </View>

        {/* Navigation List - Exact 5 items */}
        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <DrawerNavItem
                key={item.id}
                item={item}
                isActive={isActive}
                onPress={() => handlePressTab(item.id)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

interface DrawerNavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  onPress: () => void;
}

function DrawerNavItem({ item, isActive, onPress }: DrawerNavItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 24,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const { IconComponent } = item;
  const iconColor = isActive ? sleekTokens.navTextActive : sleekTokens.navTextInactive;
  const textColor = isActive ? sleekTokens.navTextActive : sleekTokens.navTextInactive;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.navItemRow}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: isActive }}
      >
        <View style={[styles.iconColumn, isActive && styles.iconActiveGlow]}>
          <IconComponent size={20} color={iconColor} />
        </View>

        <Text
          style={[
            styles.navItemText,
            {
              color: textColor,
              fontWeight: isActive ? '700' : '500',
            },
            isActive && styles.textActiveGlow,
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingLeft: 28,
    position: 'relative',
    justifyContent: 'center',
  },
  verticallyCenteredContent: {
    justifyContent: 'center',
    paddingVertical: 20,
    zIndex: 1,
  },
  solidBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: sleekTokens.drawerBgTop,
  },
  profileSection: {
    marginBottom: 34,
  },
  avatarWrapper: {
    width: 66,
    height: 66,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarAmbientGlow: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: sleekTokens.avatarBorderRadius,
    backgroundColor: sleekTokens.avatarGlow,
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarSquircle: {
    width: 66,
    height: 66,
    borderRadius: sleekTokens.avatarBorderRadius,
    backgroundColor: '#1E160A',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 168, 38, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMonogramText: {
    color: '#FBBF24',
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nameBlock: {
    marginTop: 18,
  },
  greetingText: {
    color: sleekTokens.greetingText,
    fontSize: 13.5,
    fontWeight: '400',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  nameText: {
    color: sleekTokens.userNameText,
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  navList: {
    width: 172,
    gap: 8,
  },
  navItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingLeft: 0,
    paddingRight: 14,
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
  iconColumn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActiveGlow: {
    shadowColor: '#F9A826',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
    elevation: 8,
  },
  navItemText: {
    fontSize: 15,
    letterSpacing: 0.2,
    marginLeft: 14,
  },
  textActiveGlow: {
    textShadowColor: 'rgba(249, 168, 38, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});

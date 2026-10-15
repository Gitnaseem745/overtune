/**
 * Overtone iOS — Sleek App Shell
 *
 * Wraps the application in the Sleek 3D Perspective Drawer Shell,
 * managing views based on the active drawer navigation tab:
 * 1. Home
 * 2. Favorites
 * 3. Playlists
 * 4. Search
 * 5. Settings
 *
 * Houses the persistent floating mini music player pinned at the bottom
 * across ALL tabs.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SleekDrawerLayout } from './SleekDrawerLayout';
import { SleekHomeScreen } from './SleekHomeScreen';
import {
  SleekSongsView,
  SleekFavoritesView,
  SleekPlaylistsView,
  SleekSearchView,
  SleekSettingsView,
} from './SleekViews';
import { SleekMiniPlayer } from './SleekMiniPlayer';
import { useDrawerStore, type SleekNavTab } from '../../store/useDrawerStore';
import { useUserStore } from '../../store/useUserStore';
import { useDatabase } from '../../hooks/useDatabase';

interface SleekAppShellProps {
  userName?: string;
}

export function SleekAppShell({ userName: propUserName }: SleekAppShellProps = {}) {
  const db = useDatabase();
  const { activeTab, setActiveTab } = useDrawerStore();
  const { userName: storeUserName, loadUserName } = useUserStore();

  useEffect(() => {
    if (db.isReady) {
      loadUserName(db);
    }
  }, [db.isReady, loadUserName]);

  const activeUserName = propUserName || storeUserName;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <SleekHomeScreen userName={activeUserName} />;
      case 'songs':
        return <SleekSongsView />;
      case 'favorites':
        return <SleekFavoritesView />;
      case 'playlists':
        return <SleekPlaylistsView />;
      case 'search':
        return <SleekSearchView />;
      case 'settings':
        return <SleekSettingsView />;
      default:
        return <SleekHomeScreen userName={activeUserName} />;
    }
  };

  return (
    <SleekDrawerLayout userName={activeUserName} onSelectTab={(tab: SleekNavTab) => setActiveTab(tab)}>
      <View style={styles.shellContainer}>
        {/* Active tab content */}
        {renderActiveView()}

        {/* Persistent Floating Mini Player - visible at bottom across ALL tabs */}
        <View style={styles.floatingPlayerAnchor} pointerEvents="box-none">
          <SleekMiniPlayer />
        </View>
      </View>
    </SleekDrawerLayout>
  );
}

const styles = StyleSheet.create({
  shellContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingPlayerAnchor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
});

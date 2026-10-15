/**
 * Sleek Sidebar & Theme Tests
 *
 * Validates drawer store, theme store, and sleek design tokens.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useDrawerStore } from '../src/store/useDrawerStore';
import { useThemeStore } from '../src/store/useThemeStore';
import { useUserStore } from '../src/store/useUserStore';
import { sleekTokens, colors } from '../src/design/colors';

describe('Sleek Sidebar & Drawer Store', () => {
  beforeEach(() => {
    useDrawerStore.setState({
      isOpen: false,
      activeTab: 'home',
    });
  });

  it('initializes with closed drawer and home tab', () => {
    const state = useDrawerStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.activeTab).toBe('home');
  });

  it('opens and closes the drawer', () => {
    useDrawerStore.getState().openDrawer();
    expect(useDrawerStore.getState().isOpen).toBe(true);

    useDrawerStore.getState().closeDrawer();
    expect(useDrawerStore.getState().isOpen).toBe(false);
  });

  it('toggles drawer state correctly', () => {
    useDrawerStore.getState().toggleDrawer();
    expect(useDrawerStore.getState().isOpen).toBe(true);

    useDrawerStore.getState().toggleDrawer();
    expect(useDrawerStore.getState().isOpen).toBe(false);
  });

  it('updates active navigation tab across all destinations in order', () => {
    useDrawerStore.getState().setActiveTab('songs');
    expect(useDrawerStore.getState().activeTab).toBe('songs');

    useDrawerStore.getState().setActiveTab('favorites');
    expect(useDrawerStore.getState().activeTab).toBe('favorites');

    useDrawerStore.getState().setActiveTab('playlists');
    expect(useDrawerStore.getState().activeTab).toBe('playlists');

    useDrawerStore.getState().setActiveTab('search');
    expect(useDrawerStore.getState().activeTab).toBe('search');

    useDrawerStore.getState().setActiveTab('settings');
    expect(useDrawerStore.getState().activeTab).toBe('settings');

    useDrawerStore.getState().setActiveTab('home');
    expect(useDrawerStore.getState().activeTab).toBe('home');
  });
});

describe('Sleek Theme & Design Tokens', () => {
  it('has sleek theme locked as the only theme with warm amber accent', () => {
    const themeState = useThemeStore.getState();
    expect(themeState.scheme).toBe('sleek');
    expect(themeState.isSleek).toBe(true);
    expect(themeState.colors).toBeDefined();
    expect(themeState.colors.accent).toBe('#F9A826');
  });

  it('contains essential sleek design tokens matching reference', () => {
    // Drawer tokens
    expect(sleekTokens.drawerBgTop).toBe('#000000ff');
    expect(sleekTokens.drawerBgMid).toBe('#140F06');
    expect(sleekTokens.drawerBgBottom).toBe('#0C0A04');
    expect(sleekTokens.avatarBorderRadius).toBe(22);
    expect(sleekTokens.navTextActive).toBe('#F9A826');
    expect(sleekTokens.navTextInactive).toBe('#968D7B');
    expect(sleekTokens.navPillBg).toBeDefined();
    expect(sleekTokens.navPillBorder).toBeDefined();

    // 3D Perspective card layers
    expect(sleekTokens.cardBorderRadius).toBe(36);
    expect(sleekTokens.ambientCanvasBg).toBe('#F3E8CE');
    expect(sleekTokens.cardLayer3Bg).toBeDefined();
    expect(sleekTokens.cardLayer2Bg).toBeDefined();
    expect(sleekTokens.cardLayer1Shadow).toBeDefined();

    // Foremost card & header tokens
    expect(sleekTokens.headerGradientStart).toBe('#E68A00');
    expect(sleekTokens.headerGradientEnd).toBe('#FBBF24');
    expect(sleekTokens.sheetBg).toBe('#FFFFFF');
    expect(sleekTokens.miniPlayerBg).toBe('#1A1408');
    expect(sleekTokens.playPillIcon).toBe('#F9A826');
    expect(sleekTokens.miniPlayerBtnIcon).toBe('#D97706');
    expect(sleekTokens.accent).toBe('#F9A826');
  });

  it('locks sleek theme permanently against changes', () => {
    useThemeStore.getState().setScheme('dark' as any);
    expect(useThemeStore.getState().scheme).toBe('sleek');
    expect(useThemeStore.getState().isSleek).toBe(true);
  });
});

describe('User Profile Store & Custom Username Sync', () => {
  beforeEach(() => {
    useUserStore.setState({
      userName: 'USER',
      isCustom: false,
    });
  });

  it('initializes with default username "USER"', () => {
    expect(useUserStore.getState().userName).toBe('USER');
    expect(useUserStore.getState().isCustom).toBe(false);
  });

  it('updates custom username and sets isCustom flag', () => {
    useUserStore.getState().setUserName('Antigravity');
    expect(useUserStore.getState().userName).toBe('Antigravity');
    expect(useUserStore.getState().isCustom).toBe(true);
  });

  it('persists username to SQLite settings repository when db is ready', () => {
    const mockDb = {
      isReady: true,
      settings: {
        set: jest.fn(),
        get: jest.fn().mockReturnValue('SavedName'),
      },
    };

    useUserStore.getState().setUserName('SoundMaster', mockDb as any);
    expect(mockDb.settings.set).toHaveBeenCalledWith('userName', 'SoundMaster');
    expect(useUserStore.getState().userName).toBe('SoundMaster');

    // Test loadUserName
    useUserStore.getState().loadUserName(mockDb as any);
    expect(mockDb.settings.get).toHaveBeenCalledWith('userName', '');
    expect(useUserStore.getState().userName).toBe('SavedName');
  });

  it('ignores empty or whitespace-only names', () => {
    useUserStore.getState().setUserName('ValidName');
    useUserStore.getState().setUserName('   ');
    expect(useUserStore.getState().userName).toBe('ValidName');
  });
});

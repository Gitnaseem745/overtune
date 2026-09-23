'use client';

import { useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { AccentColor, ShortcutMap } from '../types/music';
import { getAccentColorHex } from '../lib/utils';
import { 
  X, Sun, Moon, LayoutGrid, Columns3, ShieldCheck, Check, 
  History, RotateCcw, Trash2, Keyboard, Bell, Download, 
  Monitor, Sliders, Palette, Archive, Wifi, Info, Upload, 
  FolderSync, RefreshCw, Smartphone
} from 'lucide-react';
import { OvertoneLogo } from './OvertoneLogo';
import { FeedbackLink } from './FeedbackLink';

type SettingsTab = 'appearance' | 'playback' | 'shortcuts' | 'desktop' | 'backup' | 'devicesync' | 'accessibility' | 'diagnostics' | 'about';

export function SettingsModal() {
  const isSettingsOpen = usePlayerStore((s) => s.isSettingsOpen);
  const toggleSettings = usePlayerStore((s) => s.toggleSettings);
  const theme = usePlayerStore((s) => s.theme);
  const setTheme = usePlayerStore((s) => s.setTheme);
  const layout = usePlayerStore((s) => s.layout);
  const setLayout = usePlayerStore((s) => s.setLayout);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const setAccentColor = usePlayerStore((s) => s.setAccentColor);
  const tracks = usePlayerStore((s) => s.tracks);
  const albums = usePlayerStore((s) => s.albums);
  const artists = usePlayerStore((s) => s.artists);

  // Playback & History
  const isPlayHistoryEnabled = usePlayerStore((s) => s.isPlayHistoryEnabled);
  const setPlayHistoryEnabled = usePlayerStore((s) => s.setPlayHistoryEnabled);
  const clearPlayHistory = usePlayerStore((s) => s.clearPlayHistory);
  const resumePreference = usePlayerStore((s) => s.resumePreference);
  const setResumePreference = usePlayerStore((s) => s.setResumePreference);

  // Desktop Polish
  const shortcuts = usePlayerStore((s) => s.shortcuts);
  const setShortcuts = usePlayerStore((s) => s.setShortcuts);
  const resetShortcuts = usePlayerStore((s) => s.resetShortcuts);
  const minimizeToTray = usePlayerStore((s) => s.minimizeToTray);
  const setMinimizeToTray = usePlayerStore((s) => s.setMinimizeToTray);
  const notificationsEnabled = usePlayerStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = usePlayerStore((s) => s.setNotificationsEnabled);
  const focusMode = usePlayerStore((s) => s.focusMode);
  const setFocusMode = usePlayerStore((s) => s.setFocusMode);
  const reducedMotion = usePlayerStore((s) => s.reducedMotion);
  const setReducedMotion = usePlayerStore((s) => s.setReducedMotion);
  const textScale = usePlayerStore((s) => s.textScale);
  const setTextScale = usePlayerStore((s) => s.setTextScale);
  const diagnosticBundle = usePlayerStore((s) => s.diagnosticBundle);
  const loadDiagnosticReport = usePlayerStore((s) => s.loadDiagnosticReport);
  const exportDiagnostics = usePlayerStore((s) => s.exportDiagnostics);

  // ── 0.2.0 Personal Music Hub Selectors ──
  const exportLibraryBackup = usePlayerStore((s) => s.exportLibraryBackup);
  const selectBackupFile = usePlayerStore((s) => s.selectBackupFile);
  const backupPreview = usePlayerStore((s) => s.backupPreview);
  const selectedBackupPath = usePlayerStore((s) => s.selectedBackupPath);
  const executeRestore = usePlayerStore((s) => s.executeRestore);
  const restoreResult = usePlayerStore((s) => s.restoreResult);
  const relocatePaths = usePlayerStore((s) => s.relocatePaths);

  const syncStatus = usePlayerStore((s) => s.syncStatus);
  const loadSyncStatus = usePlayerStore((s) => s.loadSyncStatus);
  const toggleDeviceSync = usePlayerStore((s) => s.toggleDeviceSync);
  const generateSyncPin = usePlayerStore((s) => s.generateSyncPin);
  const pairWithPeerDevice = usePlayerStore((s) => s.pairWithPeerDevice);
  const acceptSharedPlaylist = usePlayerStore((s) => s.acceptSharedPlaylist);
  const declineSharedPlaylist = usePlayerStore((s) => s.declineSharedPlaylist);
  const revokeDevice = usePlayerStore((s) => s.revokeDevice);

  const migrationStatus = usePlayerStore((s) => s.migrationStatus);
  const loadMigrationStatus = usePlayerStore((s) => s.loadMigrationStatus);
  const appInfo = usePlayerStore((s) => s.appInfo);
  const loadAppInfo = usePlayerStore((s) => s.loadAppInfo);

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [editingShortcuts, setEditingShortcuts] = useState<ShortcutMap>(shortcuts);
  const [prevShortcuts, setPrevShortcuts] = useState<ShortcutMap>(shortcuts);
  const [shortcutConflicts, setShortcutConflicts] = useState<string[]>([]);
  const [shortcutSaved, setShortcutSaved] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

  // Backup & Relocation local state
  const [restoreMode, setRestoreMode] = useState<'skip' | 'overwrite' | 'merge'>('skip');
  const [restoreSettings, setRestoreSettings] = useState(true);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupExportMsg, setBackupExportMsg] = useState<string | null>(null);

  const [oldPrefix, setOldPrefix] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [relocateMsg, setRelocateMsg] = useState<string | null>(null);
  const [isRelocating, setIsRelocating] = useState(false);

  // Device sync local state
  const [peerIp, setPeerIp] = useState('');
  const [peerPin, setPeerPin] = useState('');
  const [pairingMsg, setPairingMsg] = useState<string | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  if (shortcuts !== prevShortcuts) {
    setPrevShortcuts(shortcuts);
    setEditingShortcuts(shortcuts);
  }

  useEffect(() => {
    if (activeTab === 'diagnostics') {
      loadDiagnosticReport();
    } else if (activeTab === 'backup') {
      loadMigrationStatus();
    } else if (activeTab === 'devicesync') {
      loadSyncStatus();
    } else if (activeTab === 'about') {
      loadAppInfo();
      loadMigrationStatus();
    }
  }, [activeTab, loadDiagnosticReport, loadMigrationStatus, loadSyncStatus, loadAppInfo]);

  if (!isSettingsOpen) return null;

  const isDark = theme === 'dark';
  const currentAccentHex = getAccentColorHex(accentColor);

  const ACCENTS: { id: AccentColor; name: string; hex: string; desc: string; isDaisy?: boolean }[] = [
    { id: 'orange', name: 'Warm Amber', hex: '#f9a826', desc: 'Signature Overtone style' },
    { id: 'green', name: 'Spotify Green', hex: '#1db954', desc: 'Signature Spotify style' },
    { id: 'purple', name: 'Violet Purple', hex: '#a855f7', desc: 'Vibrant modern violet' },
    { id: 'blue', name: 'Ocean Blue', hex: '#3b82f6', desc: 'Crisp minimal ocean' },
    { id: 'retro', name: 'Retro', hex: '#ef9995', desc: 'Vintage warm coral & sage', isDaisy: true },
    { id: 'valentine', name: 'Valentine', hex: '#e96d7b', desc: 'Soft rose & romance', isDaisy: true },
    { id: 'pastel', name: 'Pastel', hex: '#d1c1d7', desc: 'Soft lavender & mint', isDaisy: true },
    { id: 'halloween', name: 'Halloween', hex: '#f28c18', desc: 'Spooky neon pumpkin', isDaisy: true },
    { id: 'synthwave', name: 'Synthwave', hex: '#e779c1', desc: 'Neon 80s hot cyber pink', isDaisy: true },
    { id: 'cyberpunk', name: 'Cyberpunk', hex: '#ff7598', desc: 'High-voltage electric neon', isDaisy: true },
    { id: 'aqua', name: 'Aqua', hex: '#09ecf3', desc: 'Vibrant tropical cyan', isDaisy: true },
    { id: 'cupcake', name: 'Cupcake', hex: '#65c3c8', desc: 'Sweet pastel teal & berry', isDaisy: true },
    { id: 'coffee', name: 'Coffee', hex: '#db924b', desc: 'Roasted caramel mocha', isDaisy: true },
  ];

  const handleShortcutChange = (key: keyof ShortcutMap, val: string) => {
    const next = { ...editingShortcuts, [key]: val };
    setEditingShortcuts(next);
  };

  const handleSaveShortcuts = async () => {
    const res = await setShortcuts(editingShortcuts);
    if (res.success) {
      setShortcutConflicts([]);
      setShortcutSaved(true);
      setTimeout(() => setShortcutSaved(false), 2500);
    } else if (res.conflicts) {
      setShortcutConflicts(res.conflicts);
    }
  };

  const handleResetShortcuts = async () => {
    await resetShortcuts();
    setShortcutConflicts([]);
  };

  const handleExportDiagnostics = async () => {
    setExportingReport(true);
    await exportDiagnostics();
    setExportingReport(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border flex flex-col max-h-[85vh] transition-all transform scale-100 ${
          isDark 
            ? 'bg-[#181818] border-neutral-800 text-white' 
            : 'bg-white border-gray-100 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <OvertoneLogo size={32} />
            <div>
              <h2 className="font-extrabold text-base tracking-tight">Overtone Preferences</h2>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-gray-400'}`}>
                Customise workspace, desktop reliability, shortcuts & accessibility
              </p>
            </div>
          </div>
          <button 
            onClick={toggleSettings}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-1 px-6 pt-3 pb-2 border-b shrink-0 overflow-x-auto scrollbar-none ${
          isDark ? 'border-neutral-800 bg-neutral-900/40' : 'border-gray-100 bg-gray-50/60'
        }`}>
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'playback', label: 'Playback & History', icon: History },
            { id: 'shortcuts', label: 'Hotkeys', icon: Keyboard },
            { id: 'desktop', label: 'Desktop & Tray', icon: Monitor },
            { id: 'backup', label: 'Backup & Relocate', icon: Archive },
            { id: 'devicesync', label: 'Device Sync', icon: Wifi },
            { id: 'accessibility', label: 'Accessibility', icon: Sliders },
            { id: 'diagnostics', label: 'Diagnostics', icon: ShieldCheck },
            { id: 'about', label: 'About & Feedback', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'bg-white text-gray-900 shadow-xs'
                    : isDark
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
                style={{ color: isActive ? currentAccentHex : undefined }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Color Accent Themes */}
              <div>
                <h3 className="font-bold text-sm mb-1">Accent Color Palette</h3>
                <p className={`text-xs mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Choose from signature styles or DaisyUI curated palettes
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ACCENTS.map((item) => {
                    const isSelected = accentColor === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setAccentColor(item.id)}
                        className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-neutral-800/90 ring-2'
                              : 'bg-gray-50 ring-2'
                            : isDark
                              ? 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        style={{
                          borderColor: isSelected ? item.hex : undefined,
                          boxShadow: isSelected ? `0 0 0 2px ${item.hex}40` : undefined,
                        }}
                      >
                        <div 
                          className="w-7 h-7 rounded-full mb-2 flex items-center justify-center font-bold shadow-xs text-black"
                          style={{ backgroundColor: item.hex }}
                        >
                          {isSelected && <Check size={14} className="text-black" />}
                        </div>
                        <span className="font-bold text-xs truncate w-full">{item.name}</span>
                        <span className={`text-[10px] truncate w-full ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Theme Mode */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-neutral-400">
                  Color Theme Mode
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                      theme === 'light'
                        ? isDark ? 'bg-neutral-800/90 ring-2' : 'bg-white ring-2 shadow-xs'
                        : isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-gray-50/50'
                    }`}
                    style={{
                      borderColor: theme === 'light' ? currentAccentHex : undefined,
                      boxShadow: theme === 'light' ? `0 0 0 2px ${currentAccentHex}40` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#f9a826] flex items-center justify-center shadow-xs">
                        <Sun size={18} />
                      </div>
                      {theme === 'light' && (
                        <span 
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-black"
                          style={{ backgroundColor: currentAccentHex }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm">Light Mode</span>
                    <span className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Crisp clean background with selected accent color.
                    </span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                      theme === 'dark'
                        ? 'bg-neutral-900 ring-2'
                        : isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-gray-50/50'
                    }`}
                    style={{
                      borderColor: theme === 'dark' ? currentAccentHex : undefined,
                      boxShadow: theme === 'dark' ? `0 0 0 2px ${currentAccentHex}40` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center shadow-xs border border-neutral-700/60">
                        <Moon size={18} />
                      </div>
                      {theme === 'dark' && (
                        <span 
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-black"
                          style={{ backgroundColor: currentAccentHex }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm">Dark Mode</span>
                    <span className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Authentic deep black surfaces with selected accent color.
                    </span>
                  </button>
                </div>
              </div>

              {/* Layout Style */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-neutral-400">
                  Application Layout Style
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setLayout('classic')}
                    className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                      layout === 'classic'
                        ? isDark ? 'bg-neutral-900 ring-2' : 'bg-white ring-2 shadow-xs'
                        : isDark ? 'border-neutral-800 bg-neutral-900/60' : 'border-gray-200 bg-gray-50/50'
                    }`}
                    style={{
                      borderColor: layout === 'classic' ? currentAccentHex : undefined,
                      boxShadow: layout === 'classic' ? `0 0 0 2px ${currentAccentHex}40` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <Columns3 size={18} />
                      </div>
                      {layout === 'classic' && (
                        <span 
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-black"
                          style={{ backgroundColor: currentAccentHex }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm">Classic Overtone</span>
                    <span className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Streamlined 2-column sidebar & content layout.
                    </span>
                  </button>

                  <button
                    onClick={() => setLayout('spotify')}
                    className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                      layout === 'spotify'
                        ? isDark ? 'bg-neutral-900 ring-2' : 'bg-white ring-2 shadow-xs'
                        : isDark ? 'border-neutral-800 bg-neutral-900/60' : 'border-gray-200 bg-gray-50/50'
                    }`}
                    style={{
                      borderColor: layout === 'spotify' ? currentAccentHex : undefined,
                      boxShadow: layout === 'spotify' ? `0 0 0 2px ${currentAccentHex}40` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <LayoutGrid size={18} />
                      </div>
                      {layout === 'spotify' && (
                        <span 
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-black"
                          style={{ backgroundColor: currentAccentHex }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm">Spotify Pro (3-Column)</span>
                    <span className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Full 3-column experience with Right Queue & Info Drawer.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAYBACK & HISTORY */}
          {activeTab === 'playback' && (
            <div className="space-y-6">
              {/* Continue Listening */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <RotateCcw size={16} style={{ color: currentAccentHex }} />
                  <h3 className="font-bold text-sm">Continue Listening on Launch</h3>
                </div>
                <p className={`text-xs mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Choose how Overtone restores your previous playback session when opened
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'always', label: 'Always Restore', desc: 'Restore track & queue paused' },
                    { id: 'ask', label: 'Wait for Input', desc: 'Show resume card in Home' },
                    { id: 'off', label: 'Disabled', desc: 'Start with an empty queue' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setResumePreference(opt.id as 'always' | 'ask' | 'off')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        resumePreference === opt.id
                          ? isDark ? 'bg-neutral-800/90 ring-2' : 'bg-gray-50 ring-2'
                          : isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'
                      }`}
                      style={{
                        borderColor: resumePreference === opt.id ? currentAccentHex : undefined,
                        boxShadow: resumePreference === opt.id ? `0 0 0 2px ${currentAccentHex}40` : undefined,
                      }}
                    >
                      <span className="font-bold text-xs block">{opt.label}</span>
                      <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Listening History Privacy */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History size={16} style={{ color: currentAccentHex }} />
                    <div>
                      <h4 className="font-bold text-xs">Local Listening History</h4>
                      <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {isPlayHistoryEnabled ? 'Currently recording played tracks locally' : 'History recording is paused'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlayHistoryEnabled(!isPlayHistoryEnabled)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        isPlayHistoryEnabled
                          ? isDark
                            ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}
                    >
                      {isPlayHistoryEnabled ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Clear all local listening history? (Play counts and timeline will be reset)')) {
                          clearPlayHistory();
                        }
                      }}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Clear listening history"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KEYBOARD SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Global Keyboard Hotkeys</h3>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Control playback even when Overtone is in background or minimized
                  </p>
                </div>
                <button
                  onClick={handleResetShortcuts}
                  className="text-xs text-neutral-400 hover:underline"
                >
                  Reset Defaults
                </button>
              </div>

              {shortcutConflicts.length > 0 && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs space-y-1">
                  <p className="font-bold">Shortcut Conflict Detected:</p>
                  {shortcutConflicts.map((c, i) => (
                    <p key={i}>• {c}</p>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {[
                  { key: 'playPause', label: 'Play / Pause' },
                  { key: 'nextTrack', label: 'Next Track' },
                  { key: 'prevTrack', label: 'Previous Track' },
                  { key: 'volumeUp', label: 'Volume Up (+5%)' },
                  { key: 'volumeDown', label: 'Volume Down (-5%)' },
                  { key: 'toggleLyrics', label: 'Toggle Lyrics Panel' },
                  { key: 'toggleMiniplayer', label: 'Toggle Miniplayer' },
                ].map(({ key, label }) => (
                  <div key={key} className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    isDark ? 'border-neutral-800 bg-neutral-900/60' : 'border-gray-100 bg-gray-50'
                  }`}>
                    <span className="text-xs font-semibold">{label}</span>
                    <input
                      type="text"
                      value={editingShortcuts[key as keyof ShortcutMap] || ''}
                      onChange={(e) => handleShortcutChange(key as keyof ShortcutMap, e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono text-center w-48 outline-hidden border ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                {shortcutSaved ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={14} /> Hotkeys saved & active!
                  </span>
                ) : <span />}
                <button
                  onClick={handleSaveShortcuts}
                  style={{ backgroundColor: currentAccentHex }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black shadow-xs hover:opacity-95"
                >
                  Save Hotkeys
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DESKTOP & TRAY */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">Desktop Experience & Background Mode</h3>

              {/* Minimize to Tray */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <div>
                  <h4 className="font-bold text-xs">Minimize to System Tray</h4>
                  <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Closing or minimizing the window keeps Overtone playing quietly in the system tray
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={minimizeToTray}
                  onChange={(e) => setMinimizeToTray(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Track Change Notifications */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Bell size={16} style={{ color: currentAccentHex }} />
                  <div>
                    <h4 className="font-bold text-xs">Track Change Notifications</h4>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Display subtle OS desktop banner when a new song starts playing
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Focus Mode */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <div>
                  <h4 className="font-bold text-xs">Focus Mode (Do Not Disturb)</h4>
                  <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Suppress all track notifications while studying or working
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={focusMode}
                  onChange={(e) => setFocusMode(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 5: ACCESSIBILITY */}
          {activeTab === 'accessibility' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">Accessibility & Visual Ergonomics</h3>

              {/* Reduced Motion Toggle */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-100'
              }`}>
                <div>
                  <h4 className="font-bold text-xs">Reduced Motion Mode</h4>
                  <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Disable all smooth scrolling, lyrics animations, and transitions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Text Scaling */}
              <div>
                <h4 className="font-bold text-xs mb-1">Text Scaling</h4>
                <p className={`text-[11px] mb-3 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Adjust interface font size for comfortable reading
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'small', label: 'Compact (90%)' },
                    { id: 'normal', label: 'Default (100%)' },
                    { id: 'large', label: 'Large (110%)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setTextScale(s.id as 'small' | 'normal' | 'large')}
                      className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                        textScale === s.id
                          ? isDark ? 'bg-neutral-800 ring-2' : 'bg-gray-100 ring-2'
                          : isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-white'
                      }`}
                      style={{
                        borderColor: textScale === s.id ? currentAccentHex : undefined,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DIAGNOSTICS & SUPPORT */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Diagnostic & Support Bundle</h3>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Privacy-safe report with sanitized paths (zero personal account disclosure)
                  </p>
                </div>
                <button
                  disabled={exportingReport}
                  onClick={handleExportDiagnostics}
                  style={{ backgroundColor: `${currentAccentHex}20`, color: currentAccentHex }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition hover:opacity-90"
                >
                  <Download size={13} />
                  <span>{exportingReport ? 'Exporting...' : 'Export JSON'}</span>
                </button>
              </div>

              {diagnosticBundle ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                      <span className="block font-bold">{diagnosticBundle.app.version}</span>
                      <span className="text-[10px] text-neutral-400">App Version</span>
                    </div>
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                      <span className="block font-bold">{diagnosticBundle.system.platform} ({diagnosticBundle.system.arch})</span>
                      <span className="text-[10px] text-neutral-400">OS Platform</span>
                    </div>
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                      <span className="block font-bold">{diagnosticBundle.library.tracksCount}</span>
                      <span className="text-[10px] text-neutral-400">Tracks</span>
                    </div>
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-gray-100'}`}>
                      <span className="block font-bold">{diagnosticBundle.library.watchedFoldersCount}</span>
                      <span className="text-[10px] text-neutral-400">Watched Folders</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Sanitized Diagnostics Preview
                    </label>
                    <pre className={`p-3 rounded-xl text-[11px] font-mono max-h-48 overflow-y-auto ${
                      isDark ? 'bg-neutral-950 text-neutral-300' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {JSON.stringify(diagnosticBundle, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-400">
                  Loading diagnostics report...
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BACKUP & RELOCATE */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Export Card */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-1.5">
                  <Archive size={16} className="text-amber-500" />
                  <span>Export Full Library Archive</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'} leading-relaxed mb-4`}>
                  Exports all playlists, smart playlists, 5-star ratings, custom tags, play history, lyric offsets, and preferences into a standardized, portable JSON archive. Audio files are never moved or modified.
                </p>

                <button
                  onClick={async () => {
                    setIsExportingBackup(true);
                    setBackupExportMsg(null);
                    try {
                      const res = await exportLibraryBackup();
                      if (res.success && res.filePath) {
                        setBackupExportMsg(`Backup saved successfully to: ${res.filePath}`);
                      }
                    } finally {
                      setIsExportingBackup(false);
                    }
                  }}
                  disabled={isExportingBackup}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isExportingBackup ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Export Backup Archive (JSON)...</span>
                </button>

                {backupExportMsg && (
                  <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2 break-all">
                    <Check size={14} className="shrink-0" />
                    <span>{backupExportMsg}</span>
                  </div>
                )}
              </div>

              {/* Restore Card */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Upload size={16} className="text-amber-500" />
                    <span>Restore Library Archive</span>
                  </h3>
                  <button
                    onClick={async () => {
                      await selectBackupFile();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Upload size={13} />
                    <span>Choose File...</span>
                  </button>
                </div>

                {selectedBackupPath ? (
                  <p className="text-[11px] text-neutral-400 font-mono truncate bg-black/30 p-2 rounded-lg mb-3">
                    {selectedBackupPath}
                  </p>
                ) : (
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'} italic mb-3`}>
                    Select an Overtone backup JSON file to inspect and preview its contents.
                  </p>
                )}

                {backupPreview && backupPreview.valid && (
                  <div className="space-y-4 pt-3 border-t border-neutral-800/40">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block">Playlists</span>
                        <span className="font-bold text-white">{backupPreview.counts.playlists}</span>
                        {backupPreview.counts.existingPlaylists > 0 && (
                          <span className="text-[9px] text-amber-500 block">({backupPreview.counts.existingPlaylists} existing)</span>
                        )}
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block">Smart Playlists</span>
                        <span className="font-bold text-white">{backupPreview.counts.smartPlaylists}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block">Ratings & Tags</span>
                        <span className="font-bold text-white">{backupPreview.counts.ratings + backupPreview.counts.tags}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block">Matched Tracks</span>
                        <span className="font-bold text-green-400">{backupPreview.counts.matchedTracks}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Conflict Policy
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'skip', name: 'Skip Existing', desc: 'Preserves existing playlists untouched (recommended)' },
                          { id: 'merge', name: 'Merge', desc: 'Adds new tracks into playlists without duplicates' },
                          { id: 'overwrite', name: 'Overwrite', desc: 'Replaces matching playlists and ratings' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setRestoreMode(opt.id as 'skip' | 'overwrite' | 'merge')}
                            className={`p-2 rounded-xl text-left border transition-all ${
                              restoreMode === opt.id
                                ? 'border-amber-500 bg-amber-500/10 text-white'
                                : 'border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span className="text-xs font-bold block">{opt.name}</span>
                            <span className="text-[10px] text-neutral-400 leading-tight block">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="modal_restore_settings"
                        checked={restoreSettings}
                        onChange={(e) => setRestoreSettings(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <label htmlFor="modal_restore_settings" className="text-xs text-neutral-300">
                        Restore preferences and theme settings
                      </label>
                    </div>

                    <button
                      onClick={async () => {
                        setIsRestoringBackup(true);
                        try {
                          await executeRestore(restoreMode, restoreSettings);
                        } finally {
                          setIsRestoringBackup(false);
                        }
                      }}
                      disabled={isRestoringBackup}
                      className="w-full py-2.5 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isRestoringBackup ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                      <span>Execute Restore</span>
                    </button>
                  </div>
                )}

                {restoreResult && (
                  <div className={`mt-3 p-3 rounded-xl border text-xs ${
                    restoreResult.success ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {restoreResult.success ? (
                      <div>
                        <p className="font-bold text-white mb-0.5">Restore Complete</p>
                        <p className="text-[11px] text-neutral-400">
                          Restored {restoreResult.imported.playlists} playlists, {restoreResult.imported.ratings} ratings, and {restoreResult.imported.tags} tags.
                        </p>
                      </div>
                    ) : (
                      <p>{restoreResult.error || 'Restore failed'}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Path Relocation Wizard */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-1.5">
                  <FolderSync size={16} className="text-amber-500" />
                  <span>Library Relocation Wizard</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'} leading-relaxed mb-3`}>
                  Relocate track paths after moving music files to another drive or directory.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                      Current / Old Path Prefix
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. D:\Music or /Users/name/Music"
                      value={oldPrefix}
                      onChange={(e) => setOldPrefix(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                      New Path Prefix
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. E:\Music or D:\Desktop\Music"
                      value={newPrefix}
                      onChange={(e) => setNewPrefix(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (!oldPrefix || !newPrefix) return;
                      setIsRelocating(true);
                      setRelocateMsg(null);
                      try {
                        const res = await relocatePaths(oldPrefix, newPrefix);
                        if (res && res.success) {
                          setRelocateMsg(`Relocated ${res.updatedTracks} tracks (${res.verifiedOnDisk} verified on disk). ${res.updatedFolders} watched folders updated.`);
                        } else {
                          setRelocateMsg('No tracks matched the specified path prefix.');
                        }
                      } finally {
                        setIsRelocating(false);
                      }
                    }}
                    disabled={isRelocating || !oldPrefix || !newPrefix}
                    className="w-full py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isRelocating ? <RefreshCw size={13} className="animate-spin" /> : <FolderSync size={13} />}
                    <span>Update Path Prefixes</span>
                  </button>

                  {relocateMsg && (
                    <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                      {relocateMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DEVICE SYNC */}
          {activeTab === 'devicesync' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Wifi size={16} className="text-amber-500" />
                      <span>Local-Network Device Sync</span>
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      Share playlists with other Overtone devices on your local Wi-Fi / LAN. No cloud account or external servers required.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const enabled = !(syncStatus?.enabled);
                      await toggleDeviceSync(enabled);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      syncStatus?.enabled
                        ? 'bg-green-500 text-black shadow-xs'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {syncStatus?.enabled ? 'Active / Listening' : 'Disabled'}
                  </button>
                </div>

                {syncStatus?.enabled && (
                  <div className="mt-4 space-y-4 pt-3 border-t border-neutral-800/40">
                    <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block font-bold">This Device</span>
                        <span className="font-bold text-white">{syncStatus.deviceName}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block font-bold">Local IP</span>
                        <span className="font-mono text-white">{syncStatus.localIp}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block font-bold">Port</span>
                        <span className="font-mono text-white">{syncStatus.port}</span>
                      </div>
                    </div>

                    {/* Pairing PIN */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                    }`}>
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                          Pairing Security PIN
                        </span>
                        {syncStatus.activePairingPin ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xl font-mono font-extrabold tracking-widest text-amber-500">
                              {syncStatus.activePairingPin}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              (expires in {syncStatus.pinExpiresInSeconds}s)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-500 mt-1 block">
                            No active PIN. Generate a code to pair a new device.
                          </span>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await generateSyncPin();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-colors"
                      >
                        Generate 6-Digit PIN
                      </button>
                    </div>

                    {/* Connect to Remote Device */}
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                    }`}>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Smartphone size={14} className="text-amber-500" />
                        <span>Pair With Peer Device</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Peer Device IP (e.g. 192.168.1.15)"
                          value={peerIp}
                          onChange={(e) => setPeerIp(e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                        />
                        <input
                          type="text"
                          placeholder="6-Digit PIN (e.g. 583920)"
                          value={peerPin}
                          onChange={(e) => setPeerPin(e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (!peerIp || !peerPin) return;
                          setIsPairing(true);
                          setPairingMsg(null);
                          try {
                            const res = await pairWithPeerDevice(peerIp, peerPin);
                            if (res.success) {
                              setPairingMsg(`Successfully paired with ${res.hostDeviceName || 'peer'}!`);
                              setPeerIp('');
                              setPeerPin('');
                            } else {
                              setPairingMsg(res.error || 'Pairing failed. Check IP and PIN.');
                            }
                          } finally {
                            setIsPairing(false);
                          }
                        }}
                        disabled={isPairing || !peerIp || !peerPin}
                        className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isPairing ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                        <span>Connect & Verify Pair</span>
                      </button>

                      {pairingMsg && (
                        <p className="text-[11px] text-amber-400 font-semibold">{pairingMsg}</p>
                      )}
                    </div>

                    {/* Incoming Pending Playlists */}
                    {syncStatus.pendingPlaylists && syncStatus.pendingPlaylists.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-white">Incoming Shared Playlists</h4>
                        {syncStatus.pendingPlaylists.map((pending) => (
                          <div
                            key={pending.id}
                            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-bold text-white block">{pending.playlistName}</span>
                              <span className="text-[11px] text-neutral-400">
                                {pending.trackCount} tracks from {pending.fromDeviceName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  await acceptSharedPlaylist(pending.id);
                                }}
                                className="px-3 py-1 rounded-lg bg-green-500 text-black font-bold text-xs hover:bg-green-400 transition-colors"
                              >
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  await declineSharedPlaylist(pending.id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-400 font-bold text-xs hover:text-white transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Paired Devices List */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-white">Authorized Paired Devices</h4>
                      {syncStatus.pairedDevices && syncStatus.pairedDevices.length > 0 ? (
                        syncStatus.pairedDevices.map((dev) => (
                          <div
                            key={dev.id}
                            className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between"
                          >
                            <div>
                              <span className="text-xs font-bold text-white block">{dev.name}</span>
                              <span className="text-[10px] text-neutral-400 font-mono">
                                IP: {dev.ip} • Paired: {new Date(dev.paired_at).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                await revokeDevice(dev.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 text-xs font-semibold transition-colors"
                            >
                              Revoke
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500 italic p-2">
                          No authorized paired devices. Devices you pair with will appear here.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: ABOUT & FEEDBACK */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Product Badge */}
              <div className={`p-5 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-4">
                  <OvertoneLogo size={48} />
                  <div>
                    <h3 className="text-base font-extrabold tracking-tight">Overtone</h3>
                    <p className="text-xs text-amber-500 font-bold">Version 0.2.0 • Personal Music Hub</p>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-gray-500'} mt-0.5`}>
                      Local-first desktop music player with Spotify-grade UI and offline reliability.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                    Milestone 0.2
                  </span>
                </div>
              </div>

              {/* Database & Migration Status */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-green-400" />
                  <span>Database & Schema Health</span>
                </h4>
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-neutral-800/40">
                    <span className="text-[10px] text-neutral-400 block font-bold">Schema Version</span>
                    <span className="font-bold text-amber-500">v{migrationStatus?.currentVersion ?? 5}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-800/40">
                    <span className="text-[10px] text-neutral-400 block font-bold">Applied Migrations</span>
                    <span className="font-bold text-green-400">{migrationStatus?.appliedMigrations?.length ?? 5} / 5</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-800/40">
                    <span className="text-[10px] text-neutral-400 block font-bold">Automatic Rollback</span>
                    <span className="font-bold text-blue-400">Available</span>
                  </div>
                </div>
              </div>

              {/* Environment Specs */}
              {appInfo && (
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Runtime Architecture
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-neutral-800/30">
                      <span className="text-[10px] text-neutral-400 block">Electron</span>
                      <span className="font-mono font-bold text-white">{appInfo.electron}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-800/30">
                      <span className="text-[10px] text-neutral-400 block">Node.js</span>
                      <span className="font-mono font-bold text-white">{appInfo.node}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-800/30">
                      <span className="text-[10px] text-neutral-400 block">Chromium</span>
                      <span className="font-mono font-bold text-white">{appInfo.chrome}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-800/30">
                      <span className="text-[10px] text-neutral-400 block">Platform</span>
                      <span className="font-mono font-bold text-white">{appInfo.platform} ({appInfo.arch})</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback & Community */}
              <FeedbackLink variant="card" />
            </div>
          )}

          {/* Persistent Footer Stats */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} style={{ color: currentAccentHex }} />
              <span className="text-xs font-bold uppercase tracking-wider">Local Library Statistics</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-[#121212]' : 'bg-white shadow-xs'}`}>
                <span className="block text-base font-extrabold">{tracks.length}</span>
                <span className="text-[10px] text-neutral-400">Indexed Tracks</span>
              </div>
              <div className={`p-2 rounded-xl ${isDark ? 'bg-[#121212]' : 'bg-white shadow-xs'}`}>
                <span className="block text-base font-extrabold">{albums.length}</span>
                <span className="text-[10px] text-neutral-400">Scanned Albums</span>
              </div>
              <div className={`p-2 rounded-xl ${isDark ? 'bg-[#121212]' : 'bg-white shadow-xs'}`}>
                <span className="block text-base font-extrabold">{artists.length}</span>
                <span className="text-[10px] text-neutral-400">Total Artists</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`px-7 py-3 border-t flex justify-end shrink-0 ${isDark ? 'border-neutral-800/80 bg-neutral-900/40' : 'border-gray-100 bg-gray-50'}`}>
          <button
            onClick={toggleSettings}
            className="px-6 py-2 rounded-full font-bold text-xs transition-all shadow-md text-black"
            style={{ backgroundColor: currentAccentHex }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

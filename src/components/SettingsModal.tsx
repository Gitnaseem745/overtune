'use client';

import { useState, useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { AccentColor, ShortcutMap } from '../types/music';
import { getAccentColorHex } from '../lib/utils';
import { 
  X, Sun, Moon, LayoutGrid, Columns3, ShieldCheck, Check, 
  History, RotateCcw, Trash2, Keyboard, Bell, Download, 
  Monitor, Sliders, Palette
} from 'lucide-react';
import { OvertoneLogo } from './OvertoneLogo';

type SettingsTab = 'appearance' | 'playback' | 'shortcuts' | 'desktop' | 'accessibility' | 'diagnostics';

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

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [editingShortcuts, setEditingShortcuts] = useState<ShortcutMap>(shortcuts);
  const [prevShortcuts, setPrevShortcuts] = useState<ShortcutMap>(shortcuts);
  const [shortcutConflicts, setShortcutConflicts] = useState<string[]>([]);
  const [shortcutSaved, setShortcutSaved] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

  if (shortcuts !== prevShortcuts) {
    setPrevShortcuts(shortcuts);
    setEditingShortcuts(shortcuts);
  }

  useEffect(() => {
    if (activeTab === 'diagnostics') {
      loadDiagnosticReport();
    }
  }, [activeTab, loadDiagnosticReport]);

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
            { id: 'accessibility', label: 'Accessibility', icon: Sliders },
            { id: 'diagnostics', label: 'Diagnostics', icon: ShieldCheck },
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

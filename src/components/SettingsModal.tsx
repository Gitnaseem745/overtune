'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { AccentColor } from '../types/music';
import { getAccentColorHex } from '../lib/utils';
import { X, Sun, Moon, LayoutGrid, Columns3, ShieldCheck, Palette, Check } from 'lucide-react';
import { OVERTONE_LOGO_SRC } from '../lib/brand';

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

  if (!isSettingsOpen) return null;

  const isDark = theme === 'dark';
  const currentAccentHex = getAccentColorHex(accentColor);

  const ACCENTS: { id: AccentColor; name: string; hex: string; desc: string }[] = [
    { id: 'orange', name: 'Warm Amber (Orange)', hex: '#f9a826', desc: 'Signature Overtone style' },
    { id: 'green', name: 'Spotify Green', hex: '#1db954', desc: 'Signature Spotify style' },
    { id: 'purple', name: 'Violet Purple', hex: '#a855f7', desc: 'Vibrant & modern' },
    { id: 'blue', name: 'Ocean Blue', hex: '#3b82f6', desc: 'Crisp & minimal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border transition-all transform scale-100 ${
          isDark 
            ? 'bg-[#181818] border-neutral-800 text-white' 
            : 'bg-white border-gray-100 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-7 py-5 border-b ${isDark ? 'border-neutral-800/80' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <img 
              src={OVERTONE_LOGO_SRC} 
              alt="Overtone" 
              className="w-9 h-9 rounded-2xl object-cover shadow-md" 
            />
            <div>
              <h3 className="font-bold text-lg leading-tight">Preferences & Appearance</h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Customize your accent color, theme, and layout</p>
            </div>
          </div>
          <button 
            onClick={toggleSettings}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-7 space-y-7 max-h-[75vh] overflow-y-auto">
          
          {/* Section 1: Universal Accent Color */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette size={16} style={{ color: currentAccentHex }} />
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Universal Accent Color
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ACCENTS.map((item) => {
                const isSelected = accentColor === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAccentColor(item.id)}
                    className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center relative ${
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
                      className="w-7 h-7 rounded-full mb-2 flex items-center justify-center text-black font-bold shadow-sm"
                      style={{ backgroundColor: item.hex }}
                    >
                      {isSelected && <Check size={14} className="text-black" />}
                    </div>
                    <span className="font-bold text-xs truncate w-full">{item.name.split(' ')[0]}</span>
                    <span className={`text-[10px] truncate w-full ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Color Theme Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-neutral-400">
              Color Theme Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Light Option */}
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col p-4 rounded-2xl border text-left transition-all relative ${
                  theme === 'light'
                    ? isDark 
                      ? 'bg-neutral-800/90 ring-2' 
                      : 'bg-white ring-2 shadow-sm'
                    : isDark
                      ? 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
                style={{
                  borderColor: theme === 'light' ? currentAccentHex : undefined,
                  boxShadow: theme === 'light' ? `0 0 0 2px ${currentAccentHex}40` : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#f9a826] flex items-center justify-center shadow-sm">
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

              {/* Dark Option */}
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col p-4 rounded-2xl border text-left transition-all relative ${
                  theme === 'dark'
                    ? 'bg-neutral-900 ring-2'
                    : isDark
                      ? 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
                style={{
                  borderColor: theme === 'dark' ? currentAccentHex : undefined,
                  boxShadow: theme === 'dark' ? `0 0 0 2px ${currentAccentHex}40` : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-200 flex items-center justify-center shadow-sm border border-neutral-700/60">
                    <Moon size={18} />
                  </div>
                  {theme === 'dark' && (
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-black font-semibold"
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

          {/* Section 3: Application Layout */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-neutral-400">
              Application Layout Style
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Classic Layout Option */}
              <button
                onClick={() => setLayout('classic')}
                className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                  layout === 'classic'
                    ? isDark 
                      ? 'bg-neutral-900 ring-2' 
                      : 'bg-white ring-2 shadow-sm'
                    : isDark
                      ? 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
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

              {/* Spotify 3-Column Layout Option */}
              <button
                onClick={() => setLayout('spotify')}
                className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                  layout === 'spotify'
                    ? isDark 
                      ? 'bg-neutral-900 ring-2' 
                      : 'bg-white ring-2 shadow-sm'
                    : isDark
                      ? 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
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
                  Full Spotify experience with Right Queue & Info Drawer.
                </span>
              </button>
            </div>
          </div>

          {/* Section 4: Library Status */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} style={{ color: currentAccentHex }} />
              <span className="text-xs font-bold uppercase tracking-wider">Local Library Statistics</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-[#121212]' : 'bg-white shadow-xs'}`}>
                <span className="block text-lg font-extrabold">{tracks.length}</span>
                <span className="text-[11px] text-neutral-400">Indexed Tracks</span>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-[#121212]' : 'bg-white shadow-xs'}`}>
                <span className="block text-lg font-extrabold">{albums.length}</span>
                <span className="text-[11px] text-neutral-400">Scanned Albums</span>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-[#121212]' : 'bg-white shadow-xs'}`}>
                <span className="block text-lg font-extrabold">{artists.length}</span>
                <span className="text-[11px] text-neutral-400">Total Artists</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`px-7 py-4 border-t flex justify-end ${isDark ? 'border-neutral-800/80 bg-neutral-900/40' : 'border-gray-100 bg-gray-50'}`}>
          <button
            onClick={toggleSettings}
            className="px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md text-black"
            style={{ backgroundColor: currentAccentHex }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

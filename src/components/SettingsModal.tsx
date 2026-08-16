'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { X, Sun, Moon, LayoutGrid, Columns3, Music, Sparkles, ShieldCheck } from 'lucide-react';

export function SettingsModal() {
  const isSettingsOpen = usePlayerStore((s) => s.isSettingsOpen);
  const toggleSettings = usePlayerStore((s) => s.toggleSettings);
  const theme = usePlayerStore((s) => s.theme);
  const setTheme = usePlayerStore((s) => s.setTheme);
  const layout = usePlayerStore((s) => s.layout);
  const setLayout = usePlayerStore((s) => s.setLayout);
  const tracks = usePlayerStore((s) => s.tracks);
  const albums = usePlayerStore((s) => s.albums);
  const artists = usePlayerStore((s) => s.artists);

  if (!isSettingsOpen) return null;

  const isDark = theme === 'dark';

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
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              isDark ? 'bg-[#1db954] shadow-emerald-500/20' : 'bg-[#f9a826] shadow-amber-500/20'
            }`}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Preferences & Appearance</h3>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Customize your theme, layout, and playback experience</p>
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
          
          {/* Section 1: Color Theme */}
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
                      ? 'border-[#f9a826] bg-neutral-800/90 ring-2 ring-[#f9a826]/30' 
                      : 'border-[#f9a826] bg-amber-50/50 ring-2 ring-[#f9a826]/30'
                    : isDark
                      ? 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#f9a826] flex items-center justify-center shadow-sm">
                    <Sun size={18} />
                  </div>
                  {theme === 'light' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f9a826] text-white">
                      Active
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm">Overtone Light</span>
                <span className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Clean white background with warm amber accents.
                </span>
              </button>

              {/* Dark Option */}
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col p-4 rounded-2xl border text-left transition-all relative ${
                  theme === 'dark'
                    ? 'border-[#1db954] bg-neutral-900 ring-2 ring-[#1db954]/30'
                    : isDark
                      ? 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 text-[#1db954] flex items-center justify-center shadow-sm border border-emerald-800/40">
                    <Moon size={18} />
                  </div>
                  {theme === 'dark' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#1db954] text-black font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm">Spotify Dark</span>
                <span className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Authentic deep black surfaces with Spotify Green.
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Application Layout */}
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
                      ? 'border-emerald-500 bg-neutral-900 ring-2 ring-emerald-500/20' 
                      : 'border-[#f9a826] bg-amber-50/50 ring-2 ring-[#f9a826]/30'
                    : isDark
                      ? 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <Columns3 size={18} />
                  </div>
                  {layout === 'classic' && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-[#1db954] text-black' : 'bg-[#f9a826] text-white'
                    }`}>
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
                      ? 'border-[#1db954] bg-neutral-900 ring-2 ring-[#1db954]/20' 
                      : 'border-[#f9a826] bg-amber-50/50 ring-2 ring-[#f9a826]/30'
                    : isDark
                      ? 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-neutral-800 text-emerald-400' : 'bg-gray-100 text-amber-600'
                  }`}>
                    <LayoutGrid size={18} />
                  </div>
                  {layout === 'spotify' && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-[#1db954] text-black' : 'bg-[#f9a826] text-white'
                    }`}>
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

          {/* Section 3: Library Status */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className={isDark ? 'text-[#1db954]' : 'text-emerald-600'} />
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
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md ${
              isDark
                ? 'bg-[#1db954] hover:bg-[#1ed760] text-black shadow-emerald-500/20'
                : 'bg-[#f9a826] hover:bg-amber-600 text-white shadow-amber-500/20'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

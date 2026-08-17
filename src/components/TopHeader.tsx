'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { getAccentColorHex } from '../lib/utils';
import { AccentColor } from '../types/music';
import { 
  Search, ChevronLeft, ChevronRight, Sun, Moon, 
  Settings, Columns3, LayoutGrid 
} from 'lucide-react';
import { OVERTONE_LOGO_SRC } from '../lib/brand';

export function TopHeader() {
  const searchQuery = usePlayerStore((s) => s.searchQuery);
  const setSearchQuery = usePlayerStore((s) => s.setSearchQuery);
  const theme = usePlayerStore((s) => s.theme);
  const setTheme = usePlayerStore((s) => s.setTheme);
  const layout = usePlayerStore((s) => s.layout);
  const setLayout = usePlayerStore((s) => s.setLayout);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const setAccentColor = usePlayerStore((s) => s.setAccentColor);
  const toggleSettings = usePlayerStore((s) => s.toggleSettings);
  const navigateBack = usePlayerStore((s) => s.navigateBack);
  const navigateForward = usePlayerStore((s) => s.navigateForward);
  const tabHistoryIndex = usePlayerStore((s) => s.tabHistoryIndex);
  const tabHistory = usePlayerStore((s) => s.tabHistory);

  const isDark = theme === 'dark';
  const canGoBack = tabHistoryIndex > 0;
  const canGoForward = tabHistoryIndex < tabHistory.length - 1;
  const currentAccentHex = getAccentColorHex(accentColor);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const toggleLayout = () => {
    setLayout(layout === 'classic' ? 'spotify' : 'classic');
  };

  const cycleAccentColor = () => {
    const accents: AccentColor[] = ['orange', 'green', 'purple', 'blue'];
    const nextIdx = (accents.indexOf(accentColor) + 1) % accents.length;
    setAccentColor(accents[nextIdx]);
  };

  return (
    <header 
      className={`h-16 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-20 backdrop-blur-md transition-colors duration-200 border-b ${
        isDark 
          ? 'bg-[#121212]/90 border-neutral-800/80 text-white' 
          : 'bg-white/90 border-gray-100 text-gray-900'
      }`}
    >
      {/* Left: History navigation & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={navigateBack}
            disabled={!canGoBack}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isDark
                ? 'bg-neutral-900 text-neutral-300 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-30'
            }`}
            title="Go Back"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={navigateForward}
            disabled={!canGoForward}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isDark
                ? 'bg-neutral-900 text-neutral-300 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-30'
            }`}
            title="Go Forward"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search 
            className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 ${
              isDark ? 'text-neutral-400' : 'text-gray-400'
            }`} 
            size={16} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs, artists, or albums..."
            className={`w-full rounded-full py-2 pl-10 pr-4 text-xs sm:text-sm outline-none transition-all ${
              isDark
                ? 'bg-[#242424] text-white placeholder-neutral-500 border border-transparent focus:bg-[#282828]'
                : 'bg-[#f4f5f8] text-gray-900 placeholder-gray-400 border border-transparent focus:bg-white shadow-xs'
            }`}
            style={{
              borderColor: searchQuery ? currentAccentHex : undefined,
            }}
          />
        </div>
      </div>

      {/* Right: Quick Switchers & User Profile */}
      <div className="flex items-center gap-2.5 pl-4">
        {/* Quick Accent Color Toggle */}
        <button
          onClick={cycleAccentColor}
          className={`p-2 rounded-full transition-all flex items-center justify-center shadow-xs ${
            isDark ? 'bg-neutral-800/80 hover:bg-neutral-700' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          title={`Cycle Accent Color (Current: ${accentColor.toUpperCase()})`}
        >
          <div 
            className="w-4 h-4 rounded-full shadow-inner"
            style={{ backgroundColor: currentAccentHex }}
          />
        </button>

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full transition-all flex items-center gap-1.5 text-xs font-semibold ${
            isDark
              ? 'bg-neutral-800/80 hover:bg-neutral-700 text-amber-400'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Quick Layout Toggle */}
        <button
          onClick={toggleLayout}
          className={`p-2 rounded-full transition-all flex items-center gap-1.5 text-xs font-semibold ${
            isDark
              ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={`Switch to ${layout === 'classic' ? 'Spotify 3-Column' : 'Classic 2-Column'} Layout`}
        >
          {layout === 'classic' ? <LayoutGrid size={16} /> : <Columns3 size={16} />}
        </button>

        {/* Settings Dialog Trigger */}
        <button
          onClick={toggleSettings}
          className={`p-2 rounded-full transition-all ${
            isDark
              ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Open Preferences"
        >
          <Settings size={16} />
        </button>

        {/* User Pill */}
        <div className={`flex items-center gap-2.5 pl-1.5 py-1 pr-3 rounded-full border transition-all ${
          isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200/70 bg-white shadow-xs'
        }`}>
          <img 
            src={OVERTONE_LOGO_SRC} 
            alt="Overtone" 
            className="w-7 h-7 rounded-full object-cover shadow-xs" 
          />
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold leading-none">Overtone</span>
            <span 
              className="text-[10px] leading-tight font-medium"
              style={{ color: currentAccentHex }}
            >
              {layout === 'spotify' ? 'Spotify Pro' : 'Classic'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

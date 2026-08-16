'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl, formatTime } from '../lib/utils';
import { 
  X, Music, ListMusic, Trash2, Play, 
  Disc3, Mic2, FileAudio, Info 
} from 'lucide-react';

export function RightPanel() {
  const isRightPanelOpen = usePlayerStore((s) => s.isRightPanelOpen);
  const toggleRightPanel = usePlayerStore((s) => s.toggleRightPanel);
  const layout = usePlayerStore((s) => s.layout);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  // Only active in Spotify layout mode and when toggled open
  if (layout !== 'spotify' || !isRightPanelOpen) return null;

  const isDark = theme === 'dark';
  const upcomingQueue = queue.slice(queueIndex + 1);

  return (
    <aside 
      className={`w-80 flex flex-col flex-shrink-0 select-none transition-all animate-fadeIn ${
        isDark ? 'text-white' : 'text-gray-900'
      }`}
    >
      <div className={`flex-1 rounded-2xl p-4 flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#181818] border border-neutral-800/80' : 'bg-white shadow-xs border border-gray-200/80'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-4">
          <div className="flex items-center gap-2">
            <ListMusic size={18} style={{ color: accentColor === 'green' ? '#1db954' : '#f9a826' }} />
            <h3 className="font-bold text-sm">Now Playing & Queue</h3>
          </div>
          <button 
            onClick={toggleRightPanel}
            className={`p-1.5 rounded-full transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400'
            }`}
            title="Close Panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* 1. Track Showcase Card */}
          {currentTrack ? (
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg group bg-neutral-800">
                {currentTrack.cover_art ? (
                  <img 
                    src={getLocalUrl(currentTrack.cover_art)} 
                    alt={currentTrack.title}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-neutral-600">
                    <Disc3 size={64} className={isDark ? 'text-neutral-700' : 'text-gray-300'} />
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-extrabold text-base leading-snug line-clamp-1">{currentTrack.title}</h4>
                <p className={`text-xs truncate font-medium mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {currentTrack.artist}
                </p>
                <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-neutral-500' : 'text-gray-400'}`}>
                  Album: {currentTrack.album}
                </p>
              </div>

              {/* Track Metadata Pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-gray-50 border-gray-100'}`}>
                  <span className="block text-neutral-400 text-[10px] uppercase font-bold">Genre</span>
                  <span className="font-semibold truncate">{currentTrack.genre || 'Audio'}</span>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-neutral-900/70 border-neutral-800' : 'bg-gray-50 border-gray-100'}`}>
                  <span className="block text-neutral-400 text-[10px] uppercase font-bold">Duration</span>
                  <span className="font-mono font-semibold">{formatTime(currentTrack.duration)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-2xl border text-center ${
              isDark ? 'bg-neutral-900/40 border-neutral-800 text-neutral-400' : 'bg-gray-50 border-gray-100 text-gray-400'
            }`}>
              <Music size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">No track currently playing</p>
            </div>
          )}

          {/* 2. Interactive Queue List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Next in Queue ({upcomingQueue.length})
              </span>
              {upcomingQueue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                    isDark ? 'text-neutral-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                  }`}
                  title="Clear remaining queue"
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              )}
            </div>

            {upcomingQueue.length > 0 ? (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {upcomingQueue.map((track, i) => {
                  const actualIndex = queueIndex + 1 + i;
                  return (
                    <div 
                      key={`${track.id}-${actualIndex}`}
                      className={`group flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                        isDark ? 'hover:bg-neutral-800/80 bg-neutral-900/40' : 'hover:bg-gray-100 bg-gray-50/50'
                      }`}
                    >
                      <div 
                        onClick={() => playTrack(track, queue)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <span className="text-[10px] font-mono text-neutral-400 w-4 text-center group-hover:hidden">
                          {i + 1}
                        </span>
                        <Play size={12} className="hidden group-hover:block text-emerald-500 w-4" />
                        
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold truncate text-xs">{track.title}</span>
                          <span className="text-[10px] text-neutral-400 truncate">{track.artist}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-neutral-400">
                          {formatTime(track.duration)}
                        </span>
                        <button
                          onClick={() => removeFromQueue(actualIndex)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-400 transition-opacity p-1"
                          title="Remove from queue"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`p-4 rounded-xl text-center text-xs ${
                isDark ? 'text-neutral-500 bg-neutral-900/30' : 'text-gray-400 bg-gray-50'
              }`}>
                Queue is empty. Select songs to queue up next.
              </div>
            )}
          </div>

        </div>
      </div>
    </aside>
  );
}

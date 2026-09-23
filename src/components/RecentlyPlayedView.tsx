'use client';

import React, { useEffect } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { History, Play, Trash2, PauseCircle, PlayCircle, ListPlus, Clock, Sparkles } from 'lucide-react';
import { formatTime, getAccentColorHex } from '../lib/utils';

export function RecentlyPlayedView() {
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const playHistory = usePlayerStore((s) => s.playHistory);
  const isPlayHistoryEnabled = usePlayerStore((s) => s.isPlayHistoryEnabled);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const loadPlayHistory = usePlayerStore((s) => s.loadPlayHistory);
  const clearPlayHistory = usePlayerStore((s) => s.clearPlayHistory);
  const setPlayHistoryEnabled = usePlayerStore((s) => s.setPlayHistoryEnabled);
  const saveQueueAsPlaylist = usePlayerStore((s) => s.saveQueueAsPlaylist);
  const setQueue = usePlayerStore((s) => s.setQueue);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  useEffect(() => {
    loadPlayHistory();
  }, [loadPlayHistory]);

  const handleSaveAsPlaylist = async () => {
    if (playHistory.length === 0) return;
    setQueue(playHistory);
    await saveQueueAsPlaylist(`Recently Played (${new Date().toLocaleDateString()})`);
    alert('Recently played tracks saved to a new playlist!');
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-700/30">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
            style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
          >
            <History size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Recently Played</h1>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Your listening history stored 100% locally on your machine
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlayHistoryEnabled(!isPlayHistoryEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isPlayHistoryEnabled
                ? isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
            title={isPlayHistoryEnabled ? 'Pause tracking listening history' : 'Resume tracking listening history'}
          >
            {isPlayHistoryEnabled ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
            <span>{isPlayHistoryEnabled ? 'Pause History' : 'History Paused'}</span>
          </button>

          {playHistory.length > 0 && (
            <>
              <button
                onClick={handleSaveAsPlaylist}
                style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90"
              >
                <ListPlus size={14} />
                <span>Save as Playlist</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Clear all listening history? (Your library tracks and playlists will not be affected)')) {
                    clearPlayHistory();
                  }
                }}
                className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Clear all listening history"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* History List */}
      {playHistory.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-neutral-900/40 border-neutral-800 text-neutral-400' : 'bg-white border-gray-200 text-gray-500 shadow-xs'
        }`}>
          <History size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-base font-bold">No listening history yet</p>
          <p className="text-xs mt-1">Play some tracks and your listening timeline will appear here.</p>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-neutral-800 text-neutral-400' : 'border-gray-200 text-gray-500'}`}>
                  <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Album</th>
                  <th className="py-3 px-4 font-semibold">Played At</th>
                  <th className="py-3 px-4 font-semibold text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {playHistory.map((item, idx) => (
                  <tr 
                    key={item.history_id || idx}
                    onClick={() => playTrack(item, playHistory)}
                    className="group hover:bg-neutral-500/5 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-neutral-500">
                      <span className="group-hover:hidden">{idx + 1}</span>
                      <Play size={12} className="hidden group-hover:inline mx-auto" style={{ color: accentHex }} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-800 shrink-0 flex items-center justify-center">
                          {item.cover_art ? (
                            <img src={`atom://${item.cover_art}`} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <Sparkles size={16} className="text-neutral-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-xs">{item.title}</p>
                          <p className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                            {item.artist}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400 truncate max-w-xs">{item.album}</td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{new Date(item.played_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-neutral-400">
                      {formatTime(item.duration)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

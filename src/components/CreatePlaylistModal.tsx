'use client';

import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { X, ListMusic, FileUp } from 'lucide-react';
import { getAccentColorHex } from '../lib/utils';

export function CreatePlaylistModal() {
  const isCreatePlaylistOpen = usePlayerStore((s) => s.isCreatePlaylistOpen);
  const setCreatePlaylistOpen = usePlayerStore((s) => s.setCreatePlaylistOpen);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const importPlaylistM3U = usePlayerStore((s) => s.importPlaylistM3U);
  const selectPlaylist = usePlayerStore((s) => s.selectPlaylist);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);

  const [playlistName, setPlaylistName] = useState('');
  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  if (!isCreatePlaylistOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;
    const newPl = await createPlaylist(playlistName.trim());
    setPlaylistName('');
    setCreatePlaylistOpen(false);
    if (newPl) {
      selectPlaylist(newPl);
    }
  };

  const handleImport = async () => {
    setCreatePlaylistOpen(false);
    await importPlaylistM3U();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border transition-all ${
          isDark 
            ? 'bg-[#181818] border-neutral-800 text-white' 
            : 'bg-white border-gray-100 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-black font-bold shadow-md"
              style={{ backgroundColor: accentHex }}
            >
              <ListMusic size={18} />
            </div>
            <h3 className="font-bold text-base">Create New Playlist</h3>
          </div>
          <button 
            onClick={() => setCreatePlaylistOpen(false)}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-neutral-400">
              Playlist Name
            </label>
            <input
              type="text"
              autoFocus
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="My Awesome Playlist #1"
              className={`w-full rounded-2xl py-3 px-4 text-sm outline-none transition-all ${
                isDark
                  ? 'bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              style={{
                borderColor: playlistName ? accentHex : undefined,
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!playlistName.trim()}
              className="flex-1 py-3 rounded-full font-bold text-xs text-black shadow-md transition-all active:scale-95 disabled:opacity-40"
              style={{ 
                backgroundColor: accentHex,
                boxShadow: `0 4px 14px ${accentHex}30` 
              }}
            >
              Create Playlist
            </button>

            <button
              type="button"
              onClick={handleImport}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-full font-bold text-xs border transition-all ${
                isDark
                  ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-200'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              title="Import .m3u or .m3u8 playlist file"
            >
              <FileUp size={14} />
              Import .M3U
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

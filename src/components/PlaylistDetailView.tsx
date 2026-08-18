'use client';

import { useState, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalUrl, getAccentColorHex } from '../lib/utils';
import { TrackRow } from './TrackRow';
import { 
  ListMusic, Play, Shuffle, Download, Trash2, 
  Edit3, ChevronLeft, Check, X, Music 
} from 'lucide-react';

export function PlaylistDetailView() {
  const selectedPlaylist = usePlayerStore((s) => s.selectedPlaylist);
  const playlistTracks = usePlayerStore((s) => s.playlistTracks);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setShuffleOn = usePlayerStore((s) => s.setShuffleOn);
  const navigateBack = usePlayerStore((s) => s.navigateBack);
  const renamePlaylist = usePlayerStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlayerStore((s) => s.deletePlaylist);
  const exportPlaylistM3U = usePlayerStore((s) => s.exportPlaylistM3U);
  const removeTrackFromPlaylist = usePlayerStore((s) => s.removeTrackFromPlaylist);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  const totalDuration = useMemo(() => {
    const sec = playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const mins = Math.floor(sec / 60);
    return `${mins} min`;
  }, [playlistTracks]);

  if (!selectedPlaylist) return null;

  const handlePlayAll = (shuffle: boolean = false) => {
    if (playlistTracks.length === 0) return;
    setShuffleOn(shuffle);
    const startIdx = shuffle ? Math.floor(Math.random() * playlistTracks.length) : 0;
    playTrack(playlistTracks[startIdx], playlistTracks);
  };

  const handleStartEdit = () => {
    setEditedName(selectedPlaylist.name);
    setIsEditing(true);
  };

  const handleSaveRename = async () => {
    if (editedName.trim()) {
      await renamePlaylist(selectedPlaylist.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${selectedPlaylist.name}"?`)) {
      await deletePlaylist(selectedPlaylist.id);
    }
  };

  const handleExport = async () => {
    const success = await exportPlaylistM3U(selectedPlaylist.id);
    if (success) {
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }
  };

  return (
    <div className="pb-36 space-y-6 select-none">
      
      {/* ── Big Hero Banner ── */}
      <div className={`p-8 rounded-b-3xl relative overflow-hidden transition-colors ${
        isDark 
          ? 'bg-gradient-to-b from-neutral-800 to-[#121212] border-b border-neutral-800' 
          : 'bg-gradient-to-b from-gray-100 to-white border-b border-gray-200/60'
      }`}>
        <button
          onClick={navigateBack}
          className={`mb-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-all ${
            isDark ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300' : 'bg-white hover:bg-gray-100 text-gray-700 shadow-xs'
          }`}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Cover Art Mosaic / Icon */}
          <div className={`w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 flex items-center justify-center ${
            isDark ? 'bg-neutral-800' : 'bg-gray-100'
          }`}>
            {selectedPlaylist.cover_art ? (
              <img 
                src={getLocalUrl(selectedPlaylist.cover_art)} 
                alt={selectedPlaylist.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <ListMusic size={64} style={{ color: accentHex }} />
            )}
          </div>

          {/* Info Details */}
          <div className="flex flex-col text-center sm:text-left min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Playlist
            </span>

            {/* Editable Title */}
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  autoFocus
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  className={`text-2xl sm:text-3xl font-black rounded-xl px-3 py-1 outline-none border ${
                    isDark ? 'bg-neutral-800 border-neutral-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <button
                  onClick={handleSaveRename}
                  className="p-2 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 transition"
                  title="Save Name"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-xl bg-neutral-700 text-white hover:bg-neutral-600 transition"
                  title="Cancel"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight line-clamp-2">
                  {selectedPlaylist.name}
                </h1>
                <button
                  onClick={handleStartEdit}
                  className={`p-1.5 rounded-full transition-colors opacity-70 hover:opacity-100 ${
                    isDark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="Rename Playlist"
                >
                  <Edit3 size={18} />
                </button>
              </div>
            )}

            <p className={`text-xs sm:text-sm font-medium mt-2 ${isDark ? 'text-neutral-300' : 'text-gray-600'}`}>
              Created by <span className="font-bold">You</span> • {playlistTracks.length} tracks, {totalDuration}
            </p>
          </div>
        </div>
      </div>

      {/* ── Controls & Actions ── */}
      <div className="px-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {playlistTracks.length > 0 && (
              <>
                <button
                  onClick={() => handlePlayAll(false)}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-black shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ 
                    backgroundColor: accentHex,
                    boxShadow: `0 4px 14px ${accentHex}40`
                  }}
                  title="Play All"
                >
                  <Play fill="currentColor" size={20} className="ml-0.5 text-black" />
                </button>

                <button
                  onClick={() => handlePlayAll(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs border transition-all ${
                    isDark
                      ? 'border-neutral-700 hover:bg-neutral-800 text-white'
                      : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Shuffle size={15} />
                  Shuffle
                </button>
              </>
            )}
          </div>

          {/* Secondary Actions: Export M3U & Delete */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExport}
              disabled={playlistTracks.length === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs border transition-all disabled:opacity-40 ${
                isDark
                  ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-200'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              title="Export as .m3u playlist file"
            >
              <Download size={14} />
              {exportSuccess ? 'Exported!' : 'Export .M3U'}
            </button>

            <button
              onClick={handleDelete}
              className="p-2.5 rounded-full border border-neutral-700/60 hover:border-red-500/80 text-neutral-400 hover:text-red-500 transition-colors"
              title="Delete Playlist"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tracks List */}
        {playlistTracks.length > 0 ? (
          <div className="w-full text-sm">
            <div className={`grid grid-cols-[auto_1fr_1.2fr_90px_60px_70px] gap-4 text-[11px] uppercase font-bold pb-2.5 px-3 border-b ${
              isDark ? 'border-neutral-800 text-neutral-400' : 'border-gray-100 text-gray-400'
            }`}>
              <div className="w-7 text-center">#</div>
              <div>Title / Artist</div>
              <div>Album</div>
              <div>Genre</div>
              <div>Time</div>
              <div className="text-right">Manage</div>
            </div>

            <div className="mt-2 space-y-1">
              {playlistTracks.map((track, idx) => (
                <div key={`${track.id}-${idx}`} className="relative group">
                  <TrackRow
                    track={track}
                    index={idx}
                    contextQueue={playlistTracks}
                  />
                  {/* Remove Track Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrackFromPlaylist(selectedPlaylist.id, track.id);
                    }}
                    className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-neutral-800/80 text-neutral-400 hover:text-red-400 transition"
                    title="Remove from playlist"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`py-20 text-center rounded-2xl border border-dashed ${
            isDark ? 'border-neutral-800 text-neutral-500' : 'border-gray-200 text-gray-400'
          }`}>
            <Music size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">This playlist is currently empty.</p>
            <span className="text-xs text-neutral-400">Add songs from any track list by clicking the plus icon.</span>
          </div>
        )}
      </div>

    </div>
  );
}

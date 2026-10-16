'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getAccentColorHex } from '../lib/utils';
import { 
  X, Music, Disc, User, Calendar, Hash, 
  Tag, Folder, Save, Check, AlertCircle, Loader2 
} from 'lucide-react';

interface EditTrackFormProps {
  track: NonNullable<ReturnType<typeof usePlayerStore.getState>['editingTrack']>;
  onClose: () => void;
}

function EditTrackForm({ track, onClose }: EditTrackFormProps) {
  const saveTrackMetadata = usePlayerStore((s) => s.saveTrackMetadata);
  const albums = usePlayerStore((s) => s.albums);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  const albumObj = albums.find((a) => a.title === track.album);

  const [title, setTitle] = useState(track.title || '');
  const [artist, setArtist] = useState(track.artist || '');
  const [album, setAlbum] = useState(track.album || '');
  const [trackNumber, setTrackNumber] = useState(track.track_number ? String(track.track_number) : '');
  const [year, setYear] = useState(albumObj?.year ? String(albumObj.year) : '');
  const [genre, setGenre] = useState(track.genre || '');
  const [writeToFile, setWriteToFile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    setStatus(null);

    const payload = {
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim(),
      track_number: trackNumber.trim() ? parseInt(trackNumber.trim(), 10) : null,
      year: year.trim() ? parseInt(year.trim(), 10) : null,
      genre: genre.trim() || null,
    };

    try {
      const res = await saveTrackMetadata(track.id, payload, writeToFile);
      setIsSaving(false);

      if (res.success) {
        const msg = res.fileUpdated 
          ? 'Catalog and audio file tags saved successfully!' 
          : 'Song metadata saved to catalog!';
        setStatus({ message: msg, type: 'success' });
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setStatus({ message: res.error || 'Failed to update song metadata', type: 'error' });
      }
    } catch (err: unknown) {
      setIsSaving(false);
      const msg = err instanceof Error ? err.message : 'An error occurred while saving';
      setStatus({ message: msg, type: 'error' });
    }
  };

  const handleRevealInExplorer = async () => {
    const filePath = track.path;
    if (filePath && typeof window !== 'undefined' && window.api?.revealInExplorer) {
      await window.api.revealInExplorer(filePath);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none"
      onClick={handleClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border transition-all ${
          isDark 
            ? 'bg-[#181818] border-neutral-800 text-white' 
            : 'bg-white border-gray-100 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${
          isDark ? 'border-neutral-800' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-black font-bold shadow-md"
              style={{ backgroundColor: accentHex }}
            >
              <Music size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-base tracking-tight truncate">Edit Song Info</h3>
              <p className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                {track.title} — {track.artist}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'
            }`}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* File location info */}
          <div className={`flex items-center justify-between gap-3 p-3 rounded-2xl text-xs ${
            isDark ? 'bg-neutral-900/60 border border-neutral-800 text-neutral-300' : 'bg-gray-50 border border-gray-200 text-gray-600'
          }`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Folder size={14} className="shrink-0 text-neutral-400" />
              <span className="truncate font-mono text-[11px]" title={track.path}>
                {track.path || 'Local File'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRevealInExplorer}
              className={`shrink-0 px-2.5 py-1 rounded-lg font-medium text-[11px] border transition-colors ${
                isDark 
                  ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-200' 
                  : 'border-gray-300 hover:bg-white text-gray-700'
              }`}
              title="Reveal song in File Explorer"
            >
              Show in folder
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-400">
              <Music size={12} />
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song Title"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-hidden transition ${
                isDark 
                  ? 'bg-neutral-900/80 border-neutral-700 focus:border-white text-white' 
                  : 'bg-gray-50 border-gray-200 focus:border-gray-900 text-gray-900'
              }`}
            />
          </div>

          {/* Artist & Album */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-400">
                <User size={12} />
                Artist
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-hidden transition ${
                  isDark 
                    ? 'bg-neutral-900/80 border-neutral-700 focus:border-white text-white' 
                    : 'bg-gray-50 border-gray-200 focus:border-gray-900 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-400">
                <Disc size={12} />
                Album
              </label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Album title"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-hidden transition ${
                  isDark 
                    ? 'bg-neutral-900/80 border-neutral-700 focus:border-white text-white' 
                    : 'bg-gray-50 border-gray-200 focus:border-gray-900 text-gray-900'
                }`}
              />
            </div>
          </div>

          {/* Track Number, Year, Genre */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-400">
                <Hash size={12} />
                Track #
              </label>
              <input
                type="number"
                min="0"
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                placeholder="1"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-hidden transition ${
                  isDark 
                    ? 'bg-neutral-900/80 border-neutral-700 focus:border-white text-white' 
                    : 'bg-gray-50 border-gray-200 focus:border-gray-900 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-400">
                <Calendar size={12} />
                Year
              </label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-hidden transition ${
                  isDark 
                    ? 'bg-neutral-900/80 border-neutral-700 focus:border-white text-white' 
                    : 'bg-gray-50 border-gray-200 focus:border-gray-900 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5 text-neutral-400">
                <Tag size={12} />
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Pop, Rock..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-hidden transition ${
                  isDark 
                    ? 'bg-neutral-900/80 border-neutral-700 focus:border-white text-white' 
                    : 'bg-gray-50 border-gray-200 focus:border-gray-900 text-gray-900'
                }`}
              />
            </div>
          </div>

          {/* Write to file checkbox */}
          <label className={`flex items-start gap-2.5 pt-1 cursor-pointer select-none text-xs ${
            isDark ? 'text-neutral-300' : 'text-gray-700'
          }`}>
            <input
              type="checkbox"
              checked={writeToFile}
              onChange={(e) => setWriteToFile(e.target.checked)}
              className="mt-0.5 rounded border-neutral-600 accent-neutral-800 cursor-pointer"
            />
            <span>
              Save directly into audio file metadata tags (ID3/Vorbis)
              <span className="block text-[11px] text-neutral-400">
                Writes changes to the physical file on disk so other players reflect it too.
              </span>
            </span>
          </label>

          {/* Status Message */}
          {status && (
            <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {status.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              <span>{status.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800/40">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleClose}
              className={`px-5 py-2.5 rounded-full font-bold text-xs border transition-colors disabled:opacity-50 ${
                isDark 
                  ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' 
                  : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs text-black shadow-md transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: accentHex }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin text-black" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} className="text-black" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditTrackModal() {
  const editingTrack = usePlayerStore((s) => s.editingTrack);
  const setEditingTrack = usePlayerStore((s) => s.setEditingTrack);

  if (!editingTrack) return null;

  return (
    <EditTrackForm
      key={editingTrack.id}
      track={editingTrack}
      onClose={() => setEditingTrack(null)}
    />
  );
}

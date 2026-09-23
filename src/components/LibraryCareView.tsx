'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Track } from '../types/music';
import { 
  Folder, RefreshCw, Trash2, AlertTriangle, CheckCircle2, 
  Edit3, Image as ImageIcon, Copy, FileQuestion, Activity, 
  ExternalLink, Link2, Search, Save, ShieldCheck, 
  Disc, FileWarning, ArrowRight, FolderPlus, Check
} from 'lucide-react';
import { formatTime, getAccentColorHex } from '../lib/utils';

export function LibraryCareView() {
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const tracks = usePlayerStore((s) => s.tracks);
  const albums = usePlayerStore((s) => s.albums);
  const libraryCareTab = usePlayerStore((s) => s.libraryCareTab);
  const setLibraryCareTab = usePlayerStore((s) => s.setLibraryCareTab);
  const watchedFolders = usePlayerStore((s) => s.watchedFolders);
  const scanErrors = usePlayerStore((s) => s.scanErrors);
  const duplicateGroups = usePlayerStore((s) => s.duplicateGroups);
  const missingFiles = usePlayerStore((s) => s.missingFiles);
  const healthReport = usePlayerStore((s) => s.healthReport);
  const isLibraryCareLoading = usePlayerStore((s) => s.isLibraryCareLoading);

  const loadLibraryCareData = usePlayerStore((s) => s.loadLibraryCareData);
  const rescanWatchedFolder = usePlayerStore((s) => s.rescanWatchedFolder);
  const removeWatchedFolder = usePlayerStore((s) => s.removeWatchedFolder);
  const clearScanErrors = usePlayerStore((s) => s.clearScanErrors);
  const relinkMissingTrack = usePlayerStore((s) => s.relinkMissingTrack);
  const removeTrackFromLibrary = usePlayerStore((s) => s.removeTrackFromLibrary);
  const ignoreDuplicate = usePlayerStore((s) => s.ignoreDuplicate);
  const saveTrackMetadata = usePlayerStore((s) => s.saveTrackMetadata);
  const replaceAlbumArtwork = usePlayerStore((s) => s.replaceAlbumArtwork);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  // Metadata editor state
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [metadataSearch, setMetadataSearch] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editTrackNumber, setEditTrackNumber] = useState<string>('');
  const [editYear, setEditYear] = useState<string>('');
  const [editGenre, setEditGenre] = useState('');
  const [writeToFile, setWriteToFile] = useState(false);
  const [metadataStatus, setMetadataStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);

  // Artwork manager filter & state
  const [artworkSearch, setArtworkSearch] = useState('');
  const [artworkFilter, setArtworkFilter] = useState<'all' | 'missing' | 'has_art'>('all');
  const [artworkStatus, setArtworkStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Initial load
  useEffect(() => {
    loadLibraryCareData();
  }, [loadLibraryCareData]);

  // When a track is chosen for metadata editing, populate form
  const selectedTrack = useMemo(() => {
    return tracks.find((t) => t.id === selectedTrackId) || null;
  }, [tracks, selectedTrackId]);

  const handleSelectTrack = (t: Track) => {
    setSelectedTrackId(t.id);
    setEditTitle(t.title || '');
    setEditArtist(t.artist || '');
    setEditAlbum(t.album || '');
    setEditTrackNumber(t.track_number ? String(t.track_number) : '');
    const albumObj = albums.find((a) => a.title === t.album);
    setEditYear(albumObj?.year ? String(albumObj.year) : '');
    setEditGenre(t.genre || '');
    setMetadataStatus(null);
  };

  // Filtered tracks for metadata editor selector
  const filteredTracks = useMemo(() => {
    if (!metadataSearch.trim()) return tracks.slice(0, 50);
    const query = metadataSearch.toLowerCase();
    return tracks
      .filter((t) =>
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        t.album.toLowerCase().includes(query) ||
        (t.genre && t.genre.toLowerCase().includes(query))
      )
      .slice(0, 50);
  }, [tracks, metadataSearch]);

  // Filtered albums for artwork manager
  const filteredAlbums = useMemo(() => {
    return albums.filter((alb) => {
      const matchesSearch = !artworkSearch.trim() ||
        alb.title.toLowerCase().includes(artworkSearch.toLowerCase()) ||
        alb.artist.toLowerCase().includes(artworkSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (artworkFilter === 'missing') return !alb.cover_art;
      if (artworkFilter === 'has_art') return !!alb.cover_art;
      return true;
    });
  }, [albums, artworkSearch, artworkFilter]);

  const handleSaveMetadata = async () => {
    if (!selectedTrackId) return;
    setIsSavingMetadata(true);
    setMetadataStatus(null);

    const updatePayload = {
      title: editTitle.trim(),
      artist: editArtist.trim(),
      album: editAlbum.trim(),
      track_number: editTrackNumber.trim() ? parseInt(editTrackNumber.trim(), 10) : null,
      year: editYear.trim() ? parseInt(editYear.trim(), 10) : null,
      genre: editGenre.trim() || null,
    };

    const res = await saveTrackMetadata(selectedTrackId, updatePayload, writeToFile);
    setIsSavingMetadata(false);

    if (res.success) {
      const modeText = res.fileUpdated ? 'Catalog & audio file ID3 tags updated' : 'Catalog updated successfully';
      setMetadataStatus({
        message: res.error ? `${modeText}. Note: ${res.error}` : `${modeText}!`,
        type: res.error ? 'info' : 'success',
      });
      loadLibraryCareData();
    } else {
      setMetadataStatus({
        message: res.error || 'Failed to save metadata',
        type: 'error',
      });
    }
  };

  const handleRevealInExplorer = async (filePath: string) => {
    if (typeof window !== 'undefined' && window.api?.revealInExplorer) {
      await window.api.revealInExplorer(filePath);
    }
  };

  const handleReplaceArtwork = async (albumId: number) => {
    setArtworkStatus(null);
    const res = await replaceAlbumArtwork(albumId, true);
    if (res.success) {
      setArtworkStatus({ message: 'Album artwork updated successfully!', type: 'success' });
      loadLibraryCareData();
    } else if (res.error) {
      setArtworkStatus({ message: res.error, type: 'error' });
    }
  };

  const tabs: Array<{ id: 'scan' | 'metadata' | 'artwork' | 'duplicates' | 'missing' | 'health'; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'scan', label: 'Scan Dashboard', icon: Folder, badge: scanErrors.length },
    { id: 'metadata', label: 'Metadata Editor', icon: Edit3 },
    { id: 'artwork', label: 'Artwork Manager', icon: ImageIcon },
    { id: 'duplicates', label: 'Duplicates', icon: Copy, badge: duplicateGroups.length },
    { id: 'missing', label: 'Missing Files', icon: FileQuestion, badge: missingFiles.length },
    { id: 'health', label: 'Health Report', icon: Activity },
  ];

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-700/30">
        <div>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Library Care & Maintenance</h1>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Safe metadata editor, duplicate review, missing file recovery & scan diagnostics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadLibraryCareData()}
            disabled={isLibraryCareLoading}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isDark 
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <RefreshCw size={14} className={isLibraryCareLoading ? 'animate-spin' : ''} />
            <span>Refresh Diagnostics</span>
          </button>

          <button
            onClick={async () => {
              if (typeof window !== 'undefined' && window.api?.scanFolder) {
                await window.api.scanFolder();
                loadLibraryCareData();
              }
            }}
            style={{ backgroundColor: accentHex }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all"
          >
            <FolderPlus size={14} />
            <span>Scan New Folder</span>
          </button>
        </div>
      </div>

      {/* ── Tab Switcher Pills ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = libraryCareTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setLibraryCareTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? isDark
                    ? 'bg-neutral-800 text-white font-semibold shadow-xs ring-1 ring-neutral-700'
                    : 'bg-gray-900 text-white font-semibold shadow-xs'
                  : isDark
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon size={14} style={{ color: isActive ? accentHex : undefined }} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span 
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    tab.id === 'missing' || tab.id === 'scan'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-neutral-700/60 text-neutral-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 1. SCAN DASHBOARD ── */}
      {libraryCareTab === 'scan' && (
        <div className="space-y-6">
          {/* Watched Folders Card */}
          <div className={`rounded-2xl p-5 border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold">Monitored Audio Folders</h2>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  Folders automatically watched for file additions, changes, and removals
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'}`}>
                {watchedFolders.length} Watched
              </span>
            </div>

            {watchedFolders.length === 0 ? (
              <div className={`p-8 text-center rounded-xl border border-dashed ${isDark ? 'border-neutral-800 text-neutral-400' : 'border-gray-200 text-gray-500'}`}>
                <Folder size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No folders currently monitored</p>
                <p className="text-xs mt-1">Click &quot;Scan New Folder&quot; above to add your music directory.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-neutral-800 text-neutral-400' : 'border-gray-200 text-gray-500'}`}>
                      <th className="pb-2.5 font-semibold">Folder Path</th>
                      <th className="pb-2.5 font-semibold">Tracks</th>
                      <th className="pb-2.5 font-semibold">Last Scanned</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                      <th className="pb-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {watchedFolders.map((f) => (
                      <tr key={f.id} className="group hover:bg-neutral-500/5 transition-colors">
                        <td className="py-3 font-mono text-[11px] truncate max-w-xs">{f.path}</td>
                        <td className="py-3">{f.track_count} tracks</td>
                        <td className="py-3 text-neutral-400">{f.last_scan_at ? new Date(f.last_scan_at).toLocaleString() : 'Never'}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            f.status === 'scanning'
                              ? 'bg-blue-500/10 text-blue-400'
                              : f.status === 'error'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {f.status}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => rescanWatchedFolder(f.path)}
                            title="Rescan this folder"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-gray-100 text-gray-600'
                            }`}
                          >
                            <RefreshCw size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove "${f.path}" from library? Music files on your hard drive will NOT be deleted.`)) {
                                removeWatchedFolder(f.path);
                              }
                            }}
                            title="Remove folder from library"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Scan Errors Log */}
          <div className={`rounded-2xl p-5 border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                <div>
                  <h2 className="text-base font-bold">Recent Scan Errors</h2>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    Files skipped during scans due to unsupported codec, corrupt header, or permissions
                  </p>
                </div>
              </div>

              {scanErrors.length > 0 && (
                <button
                  onClick={() => clearScanErrors()}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Clear Errors
                </button>
              )}
            </div>

            {scanErrors.length === 0 ? (
              <div className={`p-6 text-center rounded-xl ${isDark ? 'bg-neutral-800/30 text-neutral-400' : 'bg-gray-50 text-gray-500'}`}>
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-medium">No scan errors encountered</p>
                <p className="text-xs mt-0.5">All indexed audio files parsed successfully.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {scanErrors.map((err) => (
                  <div 
                    key={err.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 ${
                      isDark ? 'bg-neutral-850 border-neutral-800/80' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] truncate">{err.file_path}</p>
                      <p className="text-red-400 text-[11px] mt-0.5">{err.error_message}</p>
                    </div>
                    <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                      {new Date(err.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 2. METADATA EDITOR ── */}
      {libraryCareTab === 'metadata' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Track Picker Column */}
          <div className={`lg:col-span-5 rounded-2xl p-4 border flex flex-col h-[650px] ${
            isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            <div className="mb-3">
              <h2 className="text-sm font-bold">Select Track to Edit</h2>
              <div className="relative mt-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={metadataSearch}
                  onChange={(e) => setMetadataSearch(e.target.value)}
                  placeholder="Filter tracks by title, artist, album..."
                  className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-hidden transition-all ${
                    isDark 
                      ? 'bg-neutral-800 text-white placeholder-neutral-500 focus:ring-1 focus:ring-neutral-700' 
                      : 'bg-gray-100 text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-gray-300'
                  }`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {filteredTracks.map((t) => {
                const isSelected = selectedTrackId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTrack(t)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? isDark
                          ? 'bg-neutral-800 text-white shadow-xs ring-1 ring-neutral-700'
                          : 'bg-gray-100 text-gray-900 shadow-xs ring-1 ring-gray-300'
                        : isDark
                          ? 'hover:bg-neutral-800/40 text-neutral-300'
                          : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{t.title}</p>
                      <p className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        {t.artist} • {t.album}
                      </p>
                    </div>
                    <span className="text-[11px] text-neutral-500 whitespace-nowrap">
                      {formatTime(t.duration)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Form Column */}
          <div className={`lg:col-span-7 rounded-2xl p-5 border flex flex-col justify-between ${
            isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            {selectedTrack ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-700/20">
                  <div>
                    <h2 className="text-base font-bold">Edit Track Metadata</h2>
                    <p className={`text-xs truncate max-w-md ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                      {selectedTrack.path}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevealInExplorer(selectedTrack.path)}
                    title="Reveal in File Explorer"
                    className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors ${
                      isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <ExternalLink size={13} />
                    <span>Explorer</span>
                  </button>
                </div>

                {metadataStatus && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    metadataStatus.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : metadataStatus.type === 'error'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {metadataStatus.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    <span>{metadataStatus.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-medium mb-1 text-neutral-400">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl outline-hidden ${
                        isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-neutral-400">Artist</label>
                    <input
                      type="text"
                      value={editArtist}
                      onChange={(e) => setEditArtist(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl outline-hidden ${
                        isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-neutral-400">Album</label>
                    <input
                      type="text"
                      value={editAlbum}
                      onChange={(e) => setEditAlbum(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl outline-hidden ${
                        isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-neutral-400">Genre</label>
                    <input
                      type="text"
                      value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      placeholder="Rock, Pop, Classical..."
                      className={`w-full px-3 py-2 rounded-xl outline-hidden ${
                        isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-neutral-400">Track Number</label>
                    <input
                      type="number"
                      value={editTrackNumber}
                      onChange={(e) => setEditTrackNumber(e.target.value)}
                      placeholder="1"
                      className={`w-full px-3 py-2 rounded-xl outline-hidden ${
                        isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-neutral-400">Year</label>
                    <input
                      type="number"
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      placeholder="2024"
                      className={`w-full px-3 py-2 rounded-xl outline-hidden ${
                        isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Write to file vs Catalog-only toggle */}
                <div className={`p-4 rounded-xl border mt-4 ${
                  isDark ? 'bg-neutral-850/80 border-neutral-800' : 'bg-gray-50 border-gray-200'
                }`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={writeToFile}
                      onChange={(e) => setWriteToFile(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-md border-neutral-600 text-orange-500 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold block">
                        Write ID3 tags directly into audio file (MP3)
                      </span>
                      <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                        When checked, ID3v2 tags are written to disk using node-id3. When unchecked, changes are safely stored in Overtune&apos;s catalog database without touching original files.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveMetadata}
                    disabled={isSavingMetadata}
                    style={{ backgroundColor: accentHex }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-2 shadow-sm hover:opacity-95 transition-all"
                  >
                    <Save size={14} />
                    <span>{isSavingMetadata ? 'Saving...' : 'Save Metadata Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`h-full flex flex-col items-center justify-center p-8 text-center ${
                isDark ? 'text-neutral-500' : 'text-gray-400'
              }`}>
                <Edit3 size={40} className="mb-3 opacity-40" />
                <p className="text-sm font-semibold">Select a track from the left panel to begin editing</p>
                <p className="text-xs mt-1">You can safely edit tags in Overtune&apos;s catalog or write them into file tags.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. ARTWORK MANAGER ── */}
      {libraryCareTab === 'artwork' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={artworkSearch}
                  onChange={(e) => setArtworkSearch(e.target.value)}
                  placeholder="Filter albums..."
                  className={`pl-8 pr-3 py-1.5 rounded-xl text-xs outline-hidden ${
                    isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1 text-xs">
                {(['all', 'missing', 'has_art'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setArtworkFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl capitalize font-medium transition-colors ${
                      artworkFilter === filter
                        ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-900 text-white'
                        : isDark ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {filter === 'missing' ? 'Missing Art' : filter === 'has_art' ? 'Has Art' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {artworkStatus && (
              <p className={`text-xs ${artworkStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {artworkStatus.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAlbums.map((alb) => (
              <div 
                key={alb.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                  isDark ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-800 mb-2 relative group flex items-center justify-center">
                    {alb.cover_art ? (
                      <img 
                        src={`atom://${alb.cover_art}`} 
                        alt={alb.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Disc size={36} className="text-neutral-600" />
                    )}

                    <button
                      onClick={() => handleReplaceArtwork(alb.id)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold gap-1"
                    >
                      <ImageIcon size={20} />
                      <span>Replace Art</span>
                    </button>
                  </div>

                  <p className="text-xs font-bold truncate">{alb.title}</p>
                  <p className={`text-[11px] truncate ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                    {alb.artist}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-neutral-700/20 flex items-center justify-between text-[10px] text-neutral-400">
                  <span>{alb.track_count} tracks</span>
                  <button
                    onClick={() => handleReplaceArtwork(alb.id)}
                    className="hover:underline font-medium"
                    style={{ color: accentHex }}
                  >
                    Change
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. DUPLICATE REVIEW ── */}
      {libraryCareTab === 'duplicates' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            <Copy size={20} style={{ color: accentHex }} className="mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold">Duplicate Audio Review & Resolution</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Detected via audio file hashing and matching song metadata (title, duration, album) across different artists. Choose <strong>Remove</strong> to unregister a duplicate or <strong>Stay</strong> to keep both copies if they are different versions.
              </p>
            </div>
          </div>

          {duplicateGroups.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-bold">No duplicate audio files detected!</p>
              <p className="text-xs text-neutral-400 mt-1">Your library is clean and deduplicated.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateGroups.map((group, idx) => (
                <div 
                  key={group.file_hash || idx}
                  className={`rounded-2xl p-4 border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-neutral-700/20">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        group.match_type === 'metadata'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {group.reason || (group.match_type === 'metadata' ? 'Matching Title & Duration' : 'Identical Audio Hash')}
                      </span>
                      <span className="text-xs text-neutral-400">
                        ({group.count} copies)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const trackIds = group.tracks.map((t) => t.id);
                          await ignoreDuplicate(trackIds);
                        }}
                        title="Mark as different tracks and keep all in library"
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                          isDark 
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                        }`}
                      >
                        <Check size={13} className="text-emerald-400" />
                        <span>Stay (Keep Both)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.tracks.map((t) => (
                      <div 
                        key={t.id}
                        className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                          isDark ? 'bg-neutral-850/60 border-neutral-800' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">{t.title}</p>
                          <p className="text-[11px] text-neutral-400 truncate">{t.artist} • {t.album}</p>
                          <p className="font-mono text-[10px] text-neutral-500 truncate mt-0.5">{t.path}</p>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <button
                            onClick={() => handleRevealInExplorer(t.path)}
                            title="Reveal in Explorer"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-neutral-700 text-neutral-300' : 'hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            <ExternalLink size={13} />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Remove "${t.title}" from Overtune library? (File will stay on disk)`)) {
                                removeTrackFromLibrary(t.id);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-500/10 text-[11px] font-medium transition-colors"
                          >
                            Remove from Library
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 5. MISSING FILES ── */}
      {libraryCareTab === 'missing' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            <FileQuestion size={20} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold">Missing Audio Files Recovery</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                These tracks exist in Overtune&apos;s catalog but can no longer be located at their registered disk paths (due to moved folder, renamed file, or unmounted external drive).
              </p>
            </div>
          </div>

          {missingFiles.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-neutral-900/40 border-neutral-800' : 'bg-white border-gray-200'}`}>
              <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-bold">All catalog tracks exist on disk!</p>
              <p className="text-xs text-neutral-400 mt-1">Zero broken file references detected.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {missingFiles.map((m) => (
                <div 
                  key={m.id}
                  className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                    isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate text-red-400 flex items-center gap-1.5">
                      <FileWarning size={14} />
                      <span>{m.title}</span>
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">{m.artist} • {m.album}</p>
                    <p className="font-mono text-[10px] text-neutral-500 truncate mt-0.5">{m.path}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => relinkMissingTrack(m.id)}
                      style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-90"
                    >
                      <Link2 size={13} />
                      <span>Relink File...</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove missing track "${m.title}" from library?`)) {
                          removeTrackFromLibrary(m.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                      title="Remove from library"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 6. HEALTH REPORT ── */}
      {libraryCareTab === 'health' && healthReport && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'}`}>
              <span className="text-xs text-neutral-400 font-medium">Total Tracks</span>
              <p className="text-2xl font-bold mt-1">{healthReport.totalTracks}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'}`}>
              <span className="text-xs text-neutral-400 font-medium">Albums</span>
              <p className="text-2xl font-bold mt-1">{healthReport.totalAlbums}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'}`}>
              <span className="text-xs text-neutral-400 font-medium">Missing Cover Art</span>
              <p className={`text-2xl font-bold mt-1 ${healthReport.albumsMissingArt > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {healthReport.albumsMissingArt}
              </p>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'}`}>
              <span className="text-xs text-neutral-400 font-medium">Identical Duplicates</span>
              <p className={`text-2xl font-bold mt-1 ${healthReport.duplicateCount > 0 ? 'text-blue-400' : 'text-emerald-400'}`}>
                {healthReport.duplicateCount}
              </p>
            </div>
          </div>

          {/* Diagnostic Breakdown */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'}`}>
            <h2 className="text-base font-bold mb-4">Metadata Integrity Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-800/40' : 'bg-gray-50'}`}>
                <span className="text-neutral-400 block mb-1">Untagged Titles</span>
                <span className="text-base font-bold">{healthReport.missingTitle}</span>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-800/40' : 'bg-gray-50'}`}>
                <span className="text-neutral-400 block mb-1">Missing / Unknown Artist</span>
                <span className="text-base font-bold">{healthReport.missingArtist}</span>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-800/40' : 'bg-gray-50'}`}>
                <span className="text-neutral-400 block mb-1">Missing Genre</span>
                <span className="text-base font-bold">{healthReport.missingGenre}</span>
              </div>
            </div>
          </div>

          {/* Actionable recommendations */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-white border-gray-200 shadow-xs'}`}>
            <h2 className="text-base font-bold mb-3">Recommended Actions</h2>
            <div className="space-y-2 text-xs">
              {healthReport.duplicateCount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <span>Review {healthReport.duplicateCount} duplicate audio files to save disk space and clean your library.</span>
                  <button
                    onClick={() => setLibraryCareTab('duplicates')}
                    className="flex items-center gap-1 font-bold underline ml-2"
                  >
                    Review <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {healthReport.albumsMissingArt > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  <span>Add cover artwork to {healthReport.albumsMissingArt} albums.</span>
                  <button
                    onClick={() => {
                      setLibraryCareTab('artwork');
                      setArtworkFilter('missing');
                    }}
                    className="flex items-center gap-1 font-bold underline ml-2"
                  >
                    Add Artwork <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {missingFiles.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20">
                  <span>{missingFiles.length} catalog items are missing their source files on disk.</span>
                  <button
                    onClick={() => setLibraryCareTab('missing')}
                    className="flex items-center gap-1 font-bold underline ml-2"
                  >
                    Relink Now <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {healthReport.duplicateCount === 0 && healthReport.albumsMissingArt === 0 && missingFiles.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <CheckCircle2 size={16} />
                  <span>Your library metadata, artwork, and paths are in prime condition!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

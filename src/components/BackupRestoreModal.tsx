'use client';

import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { 
  Archive, Download, Upload, Check, AlertTriangle, ShieldCheck, 
  RefreshCw, FolderSync, FileText, X
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupRestoreModal({ isOpen, onClose }: BackupRestoreModalProps) {
  const theme = usePlayerStore((s) => s.theme);
  const isDark = theme === 'dark';

  const exportLibraryBackup = usePlayerStore((s) => s.exportLibraryBackup);
  const selectBackupFile = usePlayerStore((s) => s.selectBackupFile);
  const backupPreview = usePlayerStore((s) => s.backupPreview);
  const selectedBackupPath = usePlayerStore((s) => s.selectedBackupPath);
  const executeRestore = usePlayerStore((s) => s.executeRestore);
  const restoreResult = usePlayerStore((s) => s.restoreResult);
  const relocatePaths = usePlayerStore((s) => s.relocatePaths);

  const [activeSubTab, setActiveSubTab] = useState<'export' | 'restore' | 'relocate'>('export');
  const [restoreMode, setRestoreMode] = useState<'skip' | 'overwrite' | 'merge'>('skip');
  const [restoreSettings, setRestoreSettings] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Relocation wizard state
  const [oldPrefix, setOldPrefix] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [relocateStatus, setRelocateStatus] = useState<string | null>(null);
  const [isRelocating, setIsRelocating] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportNotice(null);
    try {
      const res = await exportLibraryBackup();
      if (res.success && res.filePath) {
        setExportNotice(`Backup saved successfully to: ${res.filePath}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectFile = async () => {
    await selectBackupFile();
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupPath) return;
    setIsRestoring(true);
    try {
      await executeRestore(restoreMode, restoreSettings);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRelocate = async () => {
    if (!oldPrefix || !newPrefix) return;
    setIsRelocating(true);
    setRelocateStatus(null);
    try {
      const res = await relocatePaths(oldPrefix, newPrefix);
      if (res && res.success) {
        setRelocateStatus(`Relocated ${res.updatedTracks} tracks (${res.verifiedOnDisk} verified on disk). ${res.updatedFolders} folder paths updated.`);
      } else {
        setRelocateStatus('No tracks matched the specified source path prefix.');
      }
    } finally {
      setIsRelocating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border flex flex-col max-h-[85vh] ${
          isDark ? 'bg-[#181818] border-neutral-800 text-white' : 'bg-white border-gray-100 text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Archive size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">Library Backup & Portability</h2>
              <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                Archive playlists, ratings, tags and relocate music libraries safely
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex px-6 pt-3 border-b border-neutral-800/30 gap-2 shrink-0">
          <button
            onClick={() => setActiveSubTab('export')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeSubTab === 'export'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Create Backup
          </button>
          <button
            onClick={() => setActiveSubTab('restore')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeSubTab === 'restore'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Restore Archive
          </button>
          <button
            onClick={() => setActiveSubTab('relocate')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeSubTab === 'relocate'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Relocate Music Folders
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeSubTab === 'export' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                  <Download size={16} className="text-amber-500" />
                  <span>Portable JSON Library Archive</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'} leading-relaxed mb-4`}>
                  Exports all playlists, smart playlists, 5-star ratings, tags, listening history, lyric offsets, and preferences into a standardized, human-readable JSON archive. Audio files are never moved or modified.
                </p>

                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-800/60' : 'bg-white border'}`}>
                    <span className="text-[10px] text-neutral-400 block uppercase font-bold">Format</span>
                    <span className="text-xs font-mono font-bold text-amber-500">overtone-backup v1.0</span>
                  </div>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-800/60' : 'bg-white border'}`}>
                    <span className="text-[10px] text-neutral-400 block uppercase font-bold">Metadata Safety</span>
                    <span className="text-xs font-bold text-green-500">100% Non-destructive</span>
                  </div>
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-neutral-800/60' : 'bg-white border'}`}>
                    <span className="text-[10px] text-neutral-400 block uppercase font-bold">Portability</span>
                    <span className="text-xs font-bold text-blue-400">Cross-Platform</span>
                  </div>
                </div>

                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                  <span>Export Backup Archive...</span>
                </button>
              </div>

              {exportNotice && (
                <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span className="break-all">{exportNotice}</span>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'restore' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Upload size={16} className="text-amber-500" />
                    <span>Select Backup File to Restore</span>
                  </h3>
                  <button
                    onClick={handleSelectFile}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <FileText size={13} />
                    <span>Choose File...</span>
                  </button>
                </div>

                {selectedBackupPath ? (
                  <p className="text-[11px] text-neutral-400 font-mono truncate bg-black/30 p-2 rounded-lg mb-3">
                    {selectedBackupPath}
                  </p>
                ) : (
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'} italic`}>
                    No backup file selected yet. Choose an overtone-backup JSON file to preview its contents.
                  </p>
                )}

                {backupPreview && backupPreview.valid && (
                  <div className="mt-4 space-y-3 pt-3 border-t border-neutral-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-300">Archive Contents</span>
                      <span className="text-[11px] text-neutral-500">Exported: {new Date(backupPreview.exportedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block">Playlists</span>
                        <span className="font-bold text-white">{backupPreview.counts.playlists}</span>
                        {backupPreview.counts.existingPlaylists > 0 && (
                          <span className="text-[9px] text-amber-500 block">({backupPreview.counts.existingPlaylists} existing)</span>
                        )}
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block">Smart Playlists</span>
                        <span className="font-bold text-white">{backupPreview.counts.smartPlaylists}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block">Ratings & Tags</span>
                        <span className="font-bold text-white">{backupPreview.counts.ratings + backupPreview.counts.tags}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-neutral-800/40">
                        <span className="text-[10px] text-neutral-400 block">Matched Tracks</span>
                        <span className="font-bold text-green-400">{backupPreview.counts.matchedTracks}</span>
                      </div>
                    </div>

                    {/* Conflict Resolution Mode Selection */}
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Conflict Handling Policy
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'skip', name: 'Skip Existing', desc: 'Preserves existing playlists and ratings untouched (recommended)' },
                          { id: 'merge', name: 'Merge', desc: 'Adds new tracks into matching playlists without duplicate tracks' },
                          { id: 'overwrite', name: 'Overwrite', desc: 'Replaces existing playlists and ratings with backup copies' },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setRestoreMode(opt.id as 'skip' | 'overwrite' | 'merge')}
                            className={`p-2.5 rounded-xl text-left border transition-all ${
                              restoreMode === opt.id
                                ? 'border-amber-500 bg-amber-500/10 text-white'
                                : 'border-neutral-800 bg-neutral-900/30 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span className="text-xs font-bold block mb-0.5">{opt.name}</span>
                            <span className="text-[10px] text-neutral-400 leading-tight block">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="restore_settings"
                        checked={restoreSettings}
                        onChange={(e) => setRestoreSettings(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <label htmlFor="restore_settings" className="text-xs text-neutral-300">
                        Restore app settings and appearance preferences
                      </label>
                    </div>

                    <button
                      onClick={handleExecuteRestore}
                      disabled={isRestoring}
                      className="w-full mt-3 py-2.5 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isRestoring ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                      <span>Restore Library Data</span>
                    </button>
                  </div>
                )}

                {backupPreview && !backupPreview.valid && (
                  <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle size={15} />
                    <span>{backupPreview.error || 'Invalid backup archive'}</span>
                  </div>
                )}
              </div>

              {restoreResult && (
                <div className={`p-4 rounded-2xl border text-xs animate-fadeIn ${
                  restoreResult.success
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {restoreResult.success ? (
                    <div>
                      <p className="font-bold flex items-center gap-1.5 mb-1 text-white">
                        <Check size={15} className="text-green-400" />
                        <span>Restore Completed Successfully</span>
                      </p>
                      <p className="text-neutral-400 text-[11px]">
                        Imported {restoreResult.imported.playlists} playlists, {restoreResult.imported.smartPlaylists} smart playlists, {restoreResult.imported.ratings} ratings, {restoreResult.imported.tags} tags, and {restoreResult.imported.offsets} lyric offsets.
                      </p>
                      {restoreResult.backupPath && (
                        <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                          Safety rollback point created: {restoreResult.backupPath}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p>{restoreResult.error || 'Restore failed'}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'relocate' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                  <FolderSync size={16} className="text-amber-500" />
                  <span>Relocate Library File Paths</span>
                </h3>
                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-600'} leading-relaxed mb-4`}>
                  Moved your music files to a new drive or folder? Safely update path prefixes in your library and playlists without losing play counts, ratings, or tags.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                      Old Base Directory Prefix
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. D:\Music or /Users/olduser/Music"
                      value={oldPrefix}
                      onChange={(e) => setOldPrefix(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                      New Base Directory Prefix
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. E:\Music or /Users/newuser/Music"
                      value={newPrefix}
                      onChange={(e) => setNewPrefix(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={handleRelocate}
                    disabled={isRelocating || !oldPrefix || !newPrefix}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isRelocating ? <RefreshCw size={14} className="animate-spin" /> : <FolderSync size={14} />}
                    <span>Relocate Library Tracks</span>
                  </button>
                </div>
              </div>

              {relocateStatus && (
                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <Check size={16} className="text-amber-500 shrink-0" />
                  <span>{relocateStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

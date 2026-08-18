'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { Folder, CheckCircle2 } from 'lucide-react';
import { getAccentColorHex } from '../lib/utils';

export function LocalFilesView() {
  const tracks = usePlayerStore((s) => s.tracks);
  const albums = usePlayerStore((s) => s.albums);
  const artists = usePlayerStore((s) => s.artists);
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const refreshLibrary = usePlayerStore((s) => s.refreshLibrary);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  const handleScanFolder = async () => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.scanFolder();
      setTimeout(refreshLibrary, 800);
    }
  };

  return (
    <div className="px-8 py-12 pb-36 flex flex-col items-center justify-center min-h-[70vh] max-w-2xl mx-auto text-center select-none">
      
      {/* Icon Card */}
      <div 
        className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-sm border transition-transform hover:scale-105 ${
          isDark 
            ? 'bg-neutral-800 border-neutral-700' 
            : 'bg-white border-gray-200/80'
        }`}
        style={{ color: accentHex }}
      >
        <Folder size={44} />
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
        Import Local Music Folder
      </h2>
      
      <p className={`text-xs sm:text-sm mb-8 leading-relaxed max-w-md ${
        isDark ? 'text-neutral-400' : 'text-gray-500'
      }`}>
        Select folders on your local disk. Overtone automatically extracts high-resolution ID3 artwork, tags, and organizes your offline music into albums & artists.
      </p>

      {/* Button */}
      <button
        onClick={handleScanFolder}
        className="px-8 py-3.5 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center gap-2.5 text-black hover:scale-105"
        style={{ 
          backgroundColor: accentHex,
          boxShadow: `0 6px 20px ${accentHex}35` 
        }}
      >
        <Folder size={18} className="text-black" />
        Choose Music Folder
      </button>

      {/* Supported Formats */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
        {['MP3', 'FLAC', 'WAV', 'M4A', 'OGG'].map((fmt) => (
          <span
            key={fmt}
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 text-neutral-400'
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}
          >
            .{fmt}
          </span>
        ))}
      </div>

      {/* Status Pill */}
      {tracks.length > 0 && (
        <div className={`mt-8 px-5 py-2.5 rounded-full border flex items-center gap-2 text-xs font-semibold ${
          isDark
            ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <CheckCircle2 size={16} />
          <span>Currently indexing {tracks.length} tracks, {albums.length} albums, and {artists.length} artists</span>
        </div>
      )}

    </div>
  );
}

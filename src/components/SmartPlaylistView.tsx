'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Track, SmartPlaylist, SmartPlaylistRule } from '../types/music';
import { TrackRow } from './TrackRow';
import { 
  Sparkles, Play, Shuffle, Plus, Trash2, Edit3, 
  Check, Filter 
} from 'lucide-react';
import { formatTime, getAccentColorHex } from '../lib/utils';

export function SmartPlaylistView() {
  const theme = usePlayerStore((s) => s.theme);
  const accentColor = usePlayerStore((s) => s.accentColor);
  const smartPlaylists = usePlayerStore((s) => s.smartPlaylists);
  const selectedSmartPlaylist = usePlayerStore((s) => s.selectedSmartPlaylist);
  const smartPlaylistTracks = usePlayerStore((s) => s.smartPlaylistTracks);
  const loadSmartPlaylists = usePlayerStore((s) => s.loadSmartPlaylists);
  const createSmartPlaylist = usePlayerStore((s) => s.createSmartPlaylist);
  const updateSmartPlaylist = usePlayerStore((s) => s.updateSmartPlaylist);
  const deleteSmartPlaylist = usePlayerStore((s) => s.deleteSmartPlaylist);
  const selectSmartPlaylist = usePlayerStore((s) => s.selectSmartPlaylist);
  const playTrack = usePlayerStore((s) => s.playTrack);

  const isDark = theme === 'dark';
  const accentHex = getAccentColorHex(accentColor);

  // Editor modal/view state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [rules, setRules] = useState<SmartPlaylistRule[]>([
    { field: 'genre', operator: 'contains', value: '' },
  ]);
  const [previewTracks, setPreviewTracks] = useState<Track[]>([]);

  useEffect(() => {
    loadSmartPlaylists();
  }, [loadSmartPlaylists]);

  // Live preview evaluation when rules change in editor
  useEffect(() => {
    if (isEditing && typeof window !== 'undefined' && window.api?.evaluateSmartPlaylist) {
      const timer = setTimeout(async () => {
        try {
          const res = await window.api!.evaluateSmartPlaylist(rules);
          setPreviewTracks(res || []);
        } catch {
          setPreviewTracks([]);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [rules, isEditing]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setPlaylistName('My Smart Mix');
    setRules([{ field: 'min_rating', operator: 'gte', value: 4 }]);
    setIsEditing(true);
  };

  const handleOpenEdit = (spl: SmartPlaylist) => {
    setEditingId(spl.id);
    setPlaylistName(spl.name);
    setRules(spl.rules.length > 0 ? [...spl.rules] : [{ field: 'genre', operator: 'contains', value: '' }]);
    setIsEditing(true);
  };

  const handleAddRule = () => {
    setRules([...rules, { field: 'genre', operator: 'contains', value: '' }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  const handleRuleChange = (index: number, patch: Partial<SmartPlaylistRule>) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], ...patch };
    setRules(updated);
  };

  const handleSavePlaylist = async () => {
    if (!playlistName.trim()) return;

    if (editingId) {
      await updateSmartPlaylist(editingId, playlistName.trim(), rules);
    } else {
      const created = await createSmartPlaylist(playlistName.trim(), rules);
      if (created) {
        selectSmartPlaylist(created);
      }
    }
    setIsEditing(false);
  };

  const totalDuration = useMemo(() => {
    return smartPlaylistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [smartPlaylistTracks]);

  const handlePlayAll = () => {
    if (smartPlaylistTracks.length > 0) {
      playTrack(smartPlaylistTracks[0], smartPlaylistTracks);
    }
  };

  const handleShuffle = () => {
    if (smartPlaylistTracks.length > 0) {
      const shuffled = [...smartPlaylistTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {/* ── Rule Builder Modal / Overlay ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#1e1e1e] border-neutral-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-700/30">
              <div className="flex items-center gap-2">
                <Sparkles size={20} style={{ color: accentHex }} />
                <h2 className="text-base font-bold">
                  {editingId ? 'Edit Smart Playlist Rules' : 'Create Smart Playlist'}
                </h2>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-neutral-400">Playlist Name</label>
              <input
                type="text"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="e.g. 90s Rock Favorites, Highly Rated, Unplayed..."
                className={`w-full px-3 py-2 rounded-xl text-xs outline-hidden ${
                  isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              />
            </div>

            {/* Rules list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">Match Rules</span>
                <button
                  onClick={handleAddRule}
                  style={{ color: accentHex }}
                  className="text-xs font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={13} /> Add Rule
                </button>
              </div>

              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {/* Field */}
                  <select
                    value={rule.field}
                    onChange={(e) => handleRuleChange(idx, { field: e.target.value as SmartPlaylistRule['field'] })}
                    className={`px-2.5 py-2 rounded-xl outline-hidden ${
                      isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <option value="genre">Genre</option>
                    <option value="artist">Artist</option>
                    <option value="album">Album</option>
                    <option value="year">Year</option>
                    <option value="min_rating">Rating (Stars)</option>
                    <option value="min_plays">Minimum Plays</option>
                    <option value="unplayed">Unplayed (0 plays)</option>
                    <option value="tag">Personal Tag</option>
                  </select>

                  {/* Operator */}
                  <select
                    value={rule.operator}
                    onChange={(e) => handleRuleChange(idx, { operator: e.target.value as SmartPlaylistRule['operator'] })}
                    className={`px-2.5 py-2 rounded-xl outline-hidden ${
                      isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <option value="contains">contains</option>
                    <option value="equals">equals</option>
                    <option value="gte">&gt;=</option>
                    <option value="lte">&lt;=</option>
                  </select>

                  {/* Value */}
                  {rule.field !== 'unplayed' && (
                    <input
                      type={rule.field === 'year' || rule.field === 'min_rating' || rule.field === 'min_plays' ? 'number' : 'text'}
                      value={rule.value}
                      onChange={(e) => handleRuleChange(idx, { value: e.target.value })}
                      placeholder="Value..."
                      className={`flex-1 px-3 py-2 rounded-xl outline-hidden ${
                        isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    />
                  )}

                  {rules.length > 1 && (
                    <button
                      onClick={() => handleRemoveRule(idx)}
                      className="p-2 text-neutral-400 hover:text-red-400 transition-colors"
                      title="Remove rule"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Live Preview pill */}
            <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
              isDark ? 'bg-neutral-800/60' : 'bg-gray-100'
            }`}>
              <span className="text-neutral-400">Matching Tracks Preview:</span>
              <span className="font-bold font-mono" style={{ color: accentHex }}>
                {previewTracks.length} tracks matched
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  isDark ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                Cancel
              </button>

              <button
                onClick={handleSavePlaylist}
                disabled={!playlistName.trim()}
                style={{ backgroundColor: accentHex }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all"
              >
                <Check size={14} />
                <span>Save Smart Playlist</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-700/30">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
            style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Smart Playlists</h1>
            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
              Dynamic rules that automatically evaluate against your local catalog
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{ backgroundColor: accentHex }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all self-start md:self-auto"
        >
          <Plus size={14} />
          <span>New Smart Playlist</span>
        </button>
      </div>

      {/* ── Smart Playlists Carousel / List ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {smartPlaylists.map((spl) => {
          const isSelected = selectedSmartPlaylist?.id === spl.id;
          return (
            <button
              key={spl.id}
              onClick={() => selectSmartPlaylist(spl)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-medium flex items-center gap-2 transition-all shrink-0 border ${
                isSelected
                  ? isDark
                    ? 'bg-neutral-800 text-white font-bold border-neutral-700 shadow-xs'
                    : 'bg-gray-900 text-white font-bold border-gray-900 shadow-xs'
                  : isDark
                    ? 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <Sparkles size={13} style={{ color: isSelected ? accentHex : undefined }} />
              <span>{spl.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active Smart Playlist Details ── */}
      {selectedSmartPlaylist ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-end justify-between gap-6 ${
            isDark ? 'bg-gradient-to-br from-neutral-900 to-neutral-950 border-neutral-800' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-xs'
          }`}>
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: `${accentHex}25`, color: accentHex }}
              >
                <Sparkles size={36} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Smart Playlist</span>
                <h2 className="text-2xl font-black tracking-tight">{selectedSmartPlaylist.name}</h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>
                  {smartPlaylistTracks.length} tracks • {formatTime(totalDuration)}
                </p>
                {/* Rules pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedSmartPlaylist.rules.map((r, i) => (
                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {r.field} {r.operator} {String(r.value || '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handlePlayAll}
                disabled={smartPlaylistTracks.length === 0}
                style={{ backgroundColor: accentHex }}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-black flex items-center gap-2 shadow-sm hover:opacity-95 transition-all disabled:opacity-40"
              >
                <Play size={14} fill="currentColor" />
                <span>Play All</span>
              </button>

              <button
                onClick={handleShuffle}
                disabled={smartPlaylistTracks.length === 0}
                className={`p-2.5 rounded-full border transition-colors ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800 text-white' : 'border-gray-300 hover:bg-gray-100 text-gray-800'
                }`}
                title="Shuffle"
              >
                <Shuffle size={15} />
              </button>

              <button
                onClick={() => handleOpenEdit(selectedSmartPlaylist)}
                className={`p-2.5 rounded-full border transition-colors ${
                  isDark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
                title="Edit Rules"
              >
                <Edit3 size={15} />
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete smart playlist "${selectedSmartPlaylist.name}"?`)) {
                    deleteSmartPlaylist(selectedSmartPlaylist.id);
                  }
                }}
                className="p-2.5 rounded-full border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete Smart Playlist"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Track List */}
          {smartPlaylistTracks.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${
              isDark ? 'bg-neutral-900/40 border-neutral-800 text-neutral-400' : 'bg-white border-gray-200 text-gray-500 shadow-xs'
            }`}>
              <Filter size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold">No tracks currently match these rules</p>
              <p className="text-xs mt-1">Click the edit button above to modify the rule criteria.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {smartPlaylistTracks.map((t, idx) => (
                <TrackRow key={t.id} track={t} index={idx} contextQueue={smartPlaylistTracks} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-neutral-900/40 border-neutral-800 text-neutral-400' : 'bg-white border-gray-200 text-gray-500 shadow-xs'
        }`}>
          <Sparkles size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-base font-bold">Select or create a Smart Playlist</p>
          <p className="text-xs mt-1">Smart playlists keep your music automatically organized by rules.</p>
        </div>
      )}
    </div>
  );
}

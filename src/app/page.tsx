'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  Search, Compass, Music, Disc3, Mic2, 
  Heart, Folder, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX
} from 'lucide-react';

// ─── Utility Functions ───────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Encodes a local file path into a local:// URL using base64 in a query param.
 * This avoids ALL URL parsing issues with Windows drive letters and special chars.
 * Example: C:\Music\song.mp3 → local://file?p=QzpcTXVzaWNcc29uZy5tcDM=
 */
function getLocalUrl(filePath: string): string {
  if (!filePath) return '';
  // btoa only works with latin1, so we need to handle unicode
  // For Electron environment, we can use btoa with encodeURIComponent trick
  const base64 = btoa(unescape(encodeURIComponent(filePath)));
  return `local://file?p=${base64}`;
}

// ─── Shared Header Component ────────────────────────────────────────

function TopHeader({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) {
  return (
    <header className="h-20 flex items-center justify-between px-8 flex-shrink-0 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
      <div className="flex-1 max-w-lg relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search songs, artists, or albums..." 
          className="w-full bg-[#f8f9fa] rounded-full py-2.5 pl-11 pr-6 text-sm outline-none placeholder-gray-400 border border-transparent focus:border-[#f9a826] focus:bg-white transition-all shadow-sm"
        />
      </div>
      
      <div className="flex items-center gap-6 pl-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f9a826] to-amber-300 flex items-center justify-center text-white font-bold text-sm shadow-md">
            O
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-none">Overtone User</span>
            <span className="text-xs text-emerald-600 font-medium mt-0.5">Local Library</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Tab Content Components ─────────────────────────────────────────

function DiscoverTab({ 
  tracks, 
  albums, 
  currentTrack, 
  isPlaying, 
  playTrack, 
  toggleFavorite, 
  favorites 
}: any) {
  const topTracks = tracks.slice(0, 8);

  return (
    <div className="px-8 py-6 pb-36 space-y-10">
      {/* Albums Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Scanned Albums</h2>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{albums.length} Total Albums</span>
        </div>

        {albums.length > 0 ? (
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-none snap-x">
            {albums.slice(0, 10).map((album: any) => (
              <div 
                key={album.id} 
                onClick={() => {
                  const albumTracks = tracks.filter((t: any) => t.album === album.title);
                  if (albumTracks.length > 0) {
                    playTrack(albumTracks[0]);
                  }
                }}
                className="w-[180px] flex-shrink-0 group cursor-pointer snap-start"
              >
                <div className="relative mb-3 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                  {album.cover_art ? (
                    <img src={getLocalUrl(album.cover_art)} className="w-full h-full object-cover" alt={album.title} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <Disc3 size={48} className="text-gray-300 group-hover:text-[#f9a826] transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-[#f9a826] rounded-full flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play fill="currentColor" size={20} className="ml-1" />
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 text-sm truncate">{album.title}</h4>
                <p className="text-xs text-gray-500 truncate mt-0.5">{album.artist} • {album.track_count} tracks</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 text-center text-amber-800 text-sm">
            No albums scanned yet. Head over to <strong>Local Files</strong> to select a music folder.
          </div>
        )}
      </section>

      {/* Main Track Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Library Songs</h2>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tracks.length} Songs</span>
        </div>

        {tracks.length > 0 ? (
          <div className="w-full text-sm">
            <div className="grid grid-cols-[auto_1fr_1.2fr_80px_40px] gap-4 text-xs uppercase font-semibold text-gray-400 pb-3 border-b border-gray-100 px-3">
              <div className="w-6 text-center">#</div>
              <div>Title / Artist</div>
              <div>Album</div>
              <div>Duration</div>
              <div className="text-center">Like</div>
            </div>

            <div className="mt-2 space-y-1">
              {topTracks.map((track: any, idx: number) => {
                const isActive = currentTrack?.id === track.id;
                const isFav = favorites.has(track.id);
                return (
                  <div 
                    key={track.id} 
                    onClick={() => playTrack(track)}
                    className={`grid grid-cols-[auto_1fr_1.2fr_80px_40px] items-center gap-4 py-2.5 px-3 cursor-pointer rounded-xl transition-all duration-200 group
                      ${isActive ? 'bg-amber-50/70 border border-amber-200/50 shadow-sm' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-6 flex items-center justify-center font-semibold text-gray-400 group-hover:text-[#f9a826]">
                      {isActive && isPlaying ? (
                        <Pause fill="currentColor" size={16} className="text-[#f9a826]" />
                      ) : (
                        <span className="group-hover:hidden text-xs">{idx + 1}</span>
                      )}
                      {(!isActive || !isPlaying) && <Play fill="currentColor" size={14} className="hidden group-hover:block ml-0.5 text-[#f9a826]" />}
                    </div>
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200/60">
                        {track.cover_art ? (
                          <img src={getLocalUrl(track.cover_art)} className="w-full h-full object-cover" alt="Cover" />
                        ) : (
                          <Music size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`font-semibold text-sm truncate ${isActive ? 'text-[#f9a826]' : 'text-gray-900'}`}>{track.title}</span>
                        <span className="text-xs text-gray-500 truncate">{track.artist}</span>
                      </div>
                    </div>

                    <div className="text-gray-500 text-xs font-medium truncate">
                      {track.album}
                    </div>

                    <div className="text-gray-600 text-xs font-mono">
                      {formatTime(track.duration)}
                    </div>

                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track.id);
                      }} 
                      className="flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Heart fill={isFav ? '#ef4444' : 'none'} className={isFav ? 'text-red-500' : ''} size={16} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
            No audio tracks available in your database.
          </div>
        )}
      </section>
    </div>
  );
}

function SongsTab({ tracks, currentTrack, isPlaying, playTrack, toggleFavorite, favorites }: any) {
  return (
    <div className="px-8 py-6 pb-36">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">All Tracks ({tracks.length})</h2>
      </div>

      <div className="w-full text-sm">
        <div className="grid grid-cols-[auto_1fr_1.2fr_100px_80px_40px] gap-4 text-xs uppercase font-semibold text-gray-400 pb-3 border-b border-gray-100 px-3">
          <div className="w-6 text-center">#</div>
          <div>Title / Artist</div>
          <div>Album</div>
          <div>Genre</div>
          <div>Time</div>
          <div className="text-center">Like</div>
        </div>

        <div className="mt-2 space-y-1">
          {tracks.map((track: any, idx: number) => {
            const isActive = currentTrack?.id === track.id;
            const isFav = favorites.has(track.id);
            return (
              <div 
                key={track.id} 
                onClick={() => playTrack(track)}
                className={`grid grid-cols-[auto_1fr_1.2fr_100px_80px_40px] items-center gap-4 py-2.5 px-3 cursor-pointer rounded-xl transition-all duration-200 group
                  ${isActive ? 'bg-amber-50/70 border border-amber-200/50 shadow-sm' : 'hover:bg-gray-50'}`}
              >
                <div className="w-6 flex items-center justify-center font-semibold text-gray-400 group-hover:text-[#f9a826]">
                  {isActive && isPlaying ? (
                    <Pause fill="currentColor" size={16} className="text-[#f9a826]" />
                  ) : (
                    <span className="group-hover:hidden text-xs">{idx + 1}</span>
                  )}
                  {(!isActive || !isPlaying) && <Play fill="currentColor" size={14} className="hidden group-hover:block ml-0.5 text-[#f9a826]" />}
                </div>
                
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200/60">
                    {track.cover_art ? (
                      <img src={getLocalUrl(track.cover_art)} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                      <Music size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`font-semibold text-sm truncate ${isActive ? 'text-[#f9a826]' : 'text-gray-900'}`}>{track.title}</span>
                    <span className="text-xs text-gray-500 truncate">{track.artist}</span>
                  </div>
                </div>

                <div className="text-gray-500 text-xs font-medium truncate">
                  {track.album}
                </div>

                <div className="text-gray-400 text-xs truncate">
                  {track.genre || 'Music'}
                </div>

                <div className="text-gray-600 text-xs font-mono">
                  {formatTime(track.duration)}
                </div>

                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track.id);
                  }}
                  className="flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Heart fill={isFav ? '#ef4444' : 'none'} className={isFav ? 'text-red-500' : ''} size={16} />
                </div>
              </div>
            );
          })}

          {tracks.length === 0 && (
            <div className="py-16 text-center text-gray-400 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
              No tracks found matching your query or library. Import a folder to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlbumsTab({ albums, tracks, playTrack }: any) {
  return (
    <div className="px-8 py-6 pb-36">
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Albums ({albums.length})</h2>
      
      {albums.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.map((album: any) => (
            <div 
              key={album.id} 
              onClick={() => {
                const albumTracks = tracks.filter((t: any) => t.album === album.title);
                if (albumTracks.length > 0) {
                  playTrack(albumTracks[0]);
                }
              }}
              className="group cursor-pointer bg-white p-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative mb-3 rounded-xl overflow-hidden aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                {album.cover_art ? (
                  <img src={getLocalUrl(album.cover_art)} className="w-full h-full object-cover" alt={album.title} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Disc3 size={48} className="text-gray-300 group-hover:text-[#f9a826] transition-colors" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-[#f9a826] rounded-full flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play fill="currentColor" size={20} className="ml-1" />
                  </div>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 text-sm truncate">{album.title}</h4>
              <p className="text-xs text-gray-500 mt-1 truncate">{album.artist} • {album.track_count} tracks</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-400 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
          No albums available.
        </div>
      )}
    </div>
  );
}

function ArtistsTab({ artists, tracks, playTrack }: any) {
  return (
    <div className="px-8 py-6 pb-36">
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-6">Artists ({artists.length})</h2>
      
      {artists.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 text-center">
          {artists.map((artist: any) => (
            <div 
              key={artist.id} 
              onClick={() => {
                const artistTracks = tracks.filter((t: any) => t.artist === artist.name);
                if (artistTracks.length > 0) {
                  playTrack(artistTracks[0]);
                }
              }}
              className="group cursor-pointer bg-white p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative mb-3 mx-auto w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 shadow-inner flex items-center justify-center">
                <Mic2 size={36} className="text-[#f9a826]" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play fill="currentColor" size={24} className="text-white transform scale-90 group-hover:scale-100 transition-transform ml-1" />
                </div>
              </div>
              <h4 className="font-bold text-gray-900 text-sm truncate">{artist.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{artist.track_count} tracks</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-400 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
          No artists found in database.
        </div>
      )}
    </div>
  );
}

function LocalFilesTab({ handleScan, trackCount }: any) {
  return (
    <div className="px-8 py-12 pb-36 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-24 h-24 bg-gradient-to-tr from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-amber-200/50">
        <Folder size={48} className="text-[#f9a826]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Local Music Directory</h2>
      <p className="text-gray-500 mb-8 max-w-md text-center text-sm leading-relaxed">
        Select a folder on your computer. Overtone will parse MP3, FLAC, WAV, M4A & OGG files, extract metadata, and automatically build your local library.
      </p>
      
      <button 
        onClick={handleScan}
        className="bg-[#f9a826] hover:bg-amber-600 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center gap-2"
      >
        <Folder size={18} />
        Choose Music Folder
      </button>

      {trackCount > 0 && (
        <p className="mt-6 text-xs font-semibold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200/60">
          Currently watching and indexed {trackCount} local tracks
        </p>
      )}
    </div>
  );
}

// ─── Main App Component ─────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState('Discover');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tracks, setTracks] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const [currentTrack, setCurrentTrack] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [audioError, setAudioError] = useState<string | null>(null);

  // ── Persistent audio element ref ──
  // The <audio> element is ALWAYS mounted (never conditionally rendered).
  // We set its src imperatively to avoid React remounting it.
  const audioRef = useRef<HTMLAudioElement>(null);

  // ── Refs for values accessed inside event callbacks ──
  // This avoids stale closure bugs in onEnded, onTimeUpdate, etc.
  const tracksRef = useRef(tracks);
  const currentTrackRef = useRef(currentTrack);
  const shuffleRef = useRef(shuffleOn);
  const repeatModeRef = useRef(repeatMode);
  const isPlayingRef = useRef(isPlaying);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  // Keep refs in sync with state
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { shuffleRef.current = shuffleOn; }, [shuffleOn]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // ── Library loading ──
  const refreshLibrary = useCallback(async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        const [t, al, ar] = await Promise.all([
          window.api.getTracks(),
          window.api.getAlbums(),
          window.api.getArtists(),
        ]);
        setTracks(t || []);
        setAlbums(al || []);
        setArtists(ar || []);
      } catch (err) {
        console.error('Error fetching library:', err);
      }
    }
  }, []);

  useEffect(() => {
    refreshLibrary();

    if (typeof window !== 'undefined' && window.api?.onLibraryUpdated) {
      const cleanup = window.api.onLibraryUpdated(() => {
        refreshLibrary();
      });
      return cleanup;
    }
  }, [refreshLibrary]);

  // Filtered tracks based on search bar
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase();
    return tracks.filter((t) => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.artist && t.artist.toLowerCase().includes(q)) ||
      (t.album && t.album.toLowerCase().includes(q))
    );
  }, [tracks, searchQuery]);

  const handleScan = useCallback(async () => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.scanFolder();
      setTimeout(refreshLibrary, 800);
    }
  }, [refreshLibrary]);

  // ── Core playback: load a track into the audio element ──
  const loadAndPlay = useCallback((track: any) => {
    const audio = audioRef.current;
    if (!audio) return;

    setAudioError(null);
    setCurrentTrack(track);
    setCurrentTime(0);
    // Pre-fill duration from DB metadata so the UI shows it immediately
    setDuration(track.duration || 0);

    // Imperatively set the src and call load() — this is the reliable way
    const url = getLocalUrl(track.path);
    audio.src = url;
    audio.volume = volumeRef.current;
    audio.muted = isMutedRef.current;
    audio.load();

    // Play once the browser has decoded enough audio data
    const onCanPlay = () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.play().catch((err) => {
        console.error('play() rejected:', err);
        setAudioError(`Playback failed: ${err.message}`);
      });
    };
    audio.addEventListener('canplay', onCanPlay);
  }, []);

  // ── Toggle play/pause or start a new track ──
  const playTrack = useCallback((track: any) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrackRef.current?.id === track.id) {
      // Same track: toggle play/pause
      if (isPlayingRef.current) {
        audio.pause();
      } else {
        audio.play().catch((err) => {
          console.error('play() rejected:', err);
          setAudioError(`Playback failed: ${err.message}`);
        });
      }
    } else {
      // Different track: load and play
      loadAndPlay(track);
    }
  }, [loadAndPlay]);

  // ── Next / Previous ──
  const handleNext = useCallback(() => {
    const allTracks = tracksRef.current;
    if (allTracks.length === 0) return;

    if (shuffleRef.current) {
      const randomIndex = Math.floor(Math.random() * allTracks.length);
      loadAndPlay(allTracks[randomIndex]);
      return;
    }

    const currIdx = allTracks.findIndex((t) => t.id === currentTrackRef.current?.id);
    if (currIdx !== -1 && currIdx < allTracks.length - 1) {
      loadAndPlay(allTracks[currIdx + 1]);
    } else if (repeatModeRef.current === 'all') {
      loadAndPlay(allTracks[0]);
    }
  }, [loadAndPlay]);

  const handlePrev = useCallback(() => {
    const allTracks = tracksRef.current;
    if (allTracks.length === 0) return;

    // If more than 3 seconds in, restart the current track
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const currIdx = allTracks.findIndex((t) => t.id === currentTrackRef.current?.id);
    if (currIdx > 0) {
      loadAndPlay(allTracks[currIdx - 1]);
    } else if (repeatModeRef.current === 'all') {
      loadAndPlay(allTracks[allTracks.length - 1]);
    }
  }, [loadAndPlay]);

  // ── Seek ──
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  }, []);

  // ── Volume ──
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMutedRef.current;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
  }, []);

  // ── Repeat mode cycle ──
  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  // ── Favorites ──
  const toggleFavorite = useCallback((trackId: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }, []);

  // ── Audio element event handlers ──
  // These use refs to read current state, avoiding stale closure problems.

  const onTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const onLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio && isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }
  }, []);

  const onDurationChange = useCallback(() => {
    const audio = audioRef.current;
    if (audio && isFinite(audio.duration) && audio.duration > 0) {
      setDuration(audio.duration);
    }
  }, []);

  const onEnded = useCallback(() => {
    if (repeatModeRef.current === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      }
    } else {
      handleNext();
    }
  }, [handleNext]);

  const onPlay = useCallback(() => setIsPlaying(true), []);
  const onPause = useCallback(() => setIsPlaying(false), []);

  const onError = useCallback(() => {
    const audio = audioRef.current;
    if (audio?.error) {
      const msg = audio.error.message || `Media error code ${audio.error.code}`;
      console.error('[Audio Error]', msg, audio.src);
      setAudioError(msg);
      setIsPlaying(false);
    }
  }, []);

  // Effective duration (from audio element or fallback to DB)
  const effectiveDuration = duration > 0 ? duration : (currentTrack?.duration || 0);

  // NavItem component
  const NavItem = ({ name, icon: Icon }: { name: string; icon: any }) => {
    const isActive = activeTab === name;
    return (
      <li className="relative" onClick={() => setActiveTab(name)}>
        {isActive && (
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#f9a826] rounded-r-full"></div>
        )}
        <button className={`w-full flex items-center gap-3.5 px-6 py-2.5 text-sm font-semibold transition-colors ${
          isActive ? 'text-[#f9a826] bg-amber-50/60' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
        }`}>
          <Icon size={18} />
          {name}
        </button>
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden select-none">
      
      {/* Sidebar */}
      <aside className="w-60 bg-[#f8f9fa] border-r border-gray-100 flex flex-col flex-shrink-0 z-10">
        <div className="flex items-center gap-3 p-6 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#f9a826] flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Music size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">Overtone</span>
        </div>

        <div className="flex-1 overflow-y-auto pb-28 space-y-6">
          <div>
            <h3 className="text-[11px] uppercase text-gray-400 font-bold px-6 mb-2 tracking-wider">Browse Library</h3>
            <ul className="space-y-0.5">
              <NavItem name="Discover" icon={Compass} />
              <NavItem name="Songs" icon={Music} />
              <NavItem name="Albums" icon={Disc3} />
              <NavItem name="Artists" icon={Mic2} />
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] uppercase text-gray-400 font-bold px-6 mb-2 tracking-wider">My Storage</h3>
            <ul className="space-y-0.5">
              <NavItem name="Local Files" icon={Folder} />
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <TopHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'Discover' && (
            <DiscoverTab 
              tracks={filteredTracks} 
              albums={albums} 
              currentTrack={currentTrack} 
              isPlaying={isPlaying} 
              playTrack={playTrack}
              toggleFavorite={toggleFavorite}
              favorites={favorites}
            />
          )}
          {activeTab === 'Songs' && (
            <SongsTab 
              tracks={filteredTracks} 
              currentTrack={currentTrack} 
              isPlaying={isPlaying} 
              playTrack={playTrack}
              toggleFavorite={toggleFavorite}
              favorites={favorites}
            />
          )}
          {activeTab === 'Albums' && (
            <AlbumsTab albums={albums} tracks={tracks} playTrack={playTrack} />
          )}
          {activeTab === 'Artists' && (
            <ArtistsTab artists={artists} tracks={tracks} playTrack={playTrack} />
          )}
          {activeTab === 'Local Files' && (
            <LocalFilesTab handleScan={handleScan} trackCount={tracks.length} />
          )}
        </div>
      </main>

      {/* ── Persistent Now Playing Bottom Bar ── */}
      <footer className="fixed bottom-0 left-0 w-full h-24 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-between px-8 z-50 shadow-lg">
        
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200/60 shadow-sm">
            {currentTrack?.cover_art ? (
              <img src={getLocalUrl(currentTrack.cover_art)} className="w-full h-full object-cover" alt="Cover" />
            ) : (
              <Music size={20} className="text-gray-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 text-sm truncate">
              {currentTrack ? currentTrack.title : 'No track selected'}
            </span>
            <span className="text-xs text-gray-500 font-medium truncate mt-0.5">
              {currentTrack ? currentTrack.artist : 'Select a song to play'}
            </span>
            {audioError && (
              <span className="text-xs text-red-500 truncate mt-0.5" title={audioError}>
                ⚠ {audioError}
              </span>
            )}
          </div>
        </div>

        {/* Player Transport Controls & Interactive Seek Slider */}
        <div className="flex-1 max-w-xl flex flex-col items-center">
          <div className="flex items-center gap-6 mb-1.5">
            <button 
              onClick={() => setShuffleOn(!shuffleOn)}
              className={`transition ${shuffleOn ? 'text-[#f9a826]' : 'text-gray-400 hover:text-gray-700'}`}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </button>

            <button 
              onClick={handlePrev} 
              disabled={tracks.length === 0}
              className="text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
              title="Previous"
            >
              <SkipBack fill="currentColor" size={18} />
            </button>

            <button 
              onClick={() => {
                if (!currentTrack && tracks.length > 0) {
                  loadAndPlay(tracks[0]);
                } else if (currentTrack) {
                  playTrack(currentTrack);
                }
              }}
              disabled={tracks.length === 0}
              className="w-10 h-10 bg-[#f9a826] hover:bg-amber-600 text-white rounded-full flex items-center justify-center shadow-md shadow-amber-500/30 transition-transform active:scale-95 disabled:opacity-50"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} className="ml-0.5" />}
            </button>

            <button 
              onClick={handleNext}
              disabled={tracks.length === 0}
              className="text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
              title="Next"
            >
              <SkipForward fill="currentColor" size={18} />
            </button>

            <button 
              onClick={cycleRepeatMode}
              className={`relative transition ${repeatMode !== 'off' ? 'text-[#f9a826]' : 'text-gray-400 hover:text-gray-700'}`}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat size={16} />
              {repeatMode === 'one' && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-[#f9a826] text-white rounded-full w-3 h-3 flex items-center justify-center">1</span>
              )}
            </button>
          </div>
          
          {/* Interactive Seek Bar */}
          <div className="flex items-center w-full gap-3">
            <span className="text-xs text-gray-400 font-mono w-10 text-right">
              {formatTime(currentTime)}
            </span>

            <input 
              type="range"
              min={0}
              max={effectiveDuration > 0 ? effectiveDuration : 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!currentTrack}
              className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#f9a826] hover:accent-amber-600"
            />

            <span className="text-xs text-gray-400 font-mono w-10">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Volume Controls */}
        <div className="w-1/4 flex items-center justify-end gap-3 text-gray-500">
          <button onClick={toggleMute} className="hover:text-gray-900 transition">
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <input 
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#f9a826]"
          />
        </div>
      </footer>

      {/* ── ALWAYS-MOUNTED Audio Element ──
           Never conditionally rendered. src is set imperatively via loadAndPlay().
           This prevents React from unmounting/remounting and losing the ref. */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onDurationChange={onDurationChange}
        onEnded={onEnded}
        onPlay={onPlay}
        onPause={onPause}
        onError={onError}
      />
    </div>
  );
}

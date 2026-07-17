'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Search, Bell, ChevronDown, Compass, Music, Disc3, Mic2, 
  Video, Radio, Heart, Clock, Download, Folder, FileAudio, 
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, MonitorSpeaker
} from 'lucide-react';

// --- Shared Components ---

function TopHeader() {
  return (
    <header className="h-24 flex items-center justify-between px-10 flex-shrink-0">
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search Song, Album or Singer" 
          className="w-full bg-[#f8f9fa] rounded-full py-3 pl-12 pr-6 text-sm outline-none placeholder-gray-400 border border-transparent focus:border-gray-200 transition-all"
        />
      </div>
      
      <div className="flex items-center gap-8 pl-8">
        <div className="relative cursor-pointer">
          <Bell size={24} className="text-gray-400" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
        </div>
        
        <div className="flex items-center gap-3 cursor-pointer pl-8 border-l border-gray-100">
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces" alt="Avatar" className="w-10 h-10 rounded-full" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900">Trevor Cain</span>
            <span className="text-xs text-gray-500">Premium</span>
          </div>
          <ChevronDown size={16} className="text-gray-400 ml-2" />
        </div>
      </div>
    </header>
  );
}

// --- Tab Content Components ---

function DiscoverTab({ tracks, currentTrackIndex, playTrack }: any) {
  return (
    <div className="px-10 pb-32">
      {/* Recommended Albums */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recomended Albums</h2>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 transition-colors">&lt;</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 transition-colors">&gt;</button>
          </div>
        </div>

        <div className="flex gap-8 overflow-x-auto pb-8 -mx-4 px-4 snap-x">
          {/* Albums mock */}
          {['Drip Too Hard', 'Mo Bamba', 'Imagine', 'In My Mind', 'Leave Me Alone'].map((title, i) => (
            <div key={i} className="w-[200px] flex-shrink-0 group cursor-pointer snap-start">
              <div className="relative mb-3 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 transform group-hover:-translate-y-1">
                <img src={`https://images.unsplash.com/photo-${1500000000000 + i * 10000}?w=400&h=400&fit=crop`} className="w-full h-[200px] object-cover" alt="Album" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-end justify-end p-4">
                  <button className="w-12 h-12 bg-[#f9a826] rounded-full items-center justify-center text-white shadow-lg transform scale-0 group-hover:scale-100 transition-transform hidden group-hover:flex">
                    <Play fill="currentColor" size={20} className="ml-1" />
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-gray-900">{title}</h4>
              <p className="text-sm text-gray-500 mt-1">{Math.floor(Math.random() * 15 + 5)} Songs</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Row */}
      <div className="flex gap-12">
        {/* Top Songs */}
        <div className="flex-1">
          <div className="flex items-baseline gap-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Tops Songs</h2>
            <div className="flex gap-6 text-sm font-medium">
              <span className="text-gray-900 border-b-2 border-[#f9a826] pb-1">Today</span>
              <span className="text-gray-400 hover:text-gray-900 cursor-pointer">Week</span>
              <span className="text-gray-400 hover:text-gray-900 cursor-pointer">Month</span>
            </div>
          </div>

          <div className="w-full text-left text-sm">
            <div className="grid grid-cols-[auto_1fr_1.5fr_80px_80px_40px] gap-4 text-gray-400 font-medium pb-4 border-b border-gray-100">
              <div className="w-8 text-center">#</div>
              <div>Track / Artist</div>
              <div>Album</div>
              <div>Time</div>
              <div>Plays</div>
              <div className="text-center">Add</div>
            </div>

            <div className="mt-2 space-y-1">
              {tracks.slice(0, 5).map((track: any, idx: number) => {
                const isActive = currentTrackIndex === idx;
                return (
                  <div 
                    key={track.id} 
                    onClick={() => playTrack(idx)}
                    className={`grid grid-cols-[auto_1fr_1.5fr_80px_80px_40px] items-center gap-4 py-3 cursor-pointer rounded-xl transition-all duration-200 group
                      ${isActive ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] -mx-4 px-4' : 'hover:bg-white hover:shadow-sm -mx-2 px-2'}`}
                  >
                    <div className="w-8 flex items-center justify-center font-bold text-gray-400 group-hover:text-[#f9a826]">
                      {isActive ? (
                        <Pause fill="currentColor" size={16} className="text-[#f9a826]" />
                      ) : (
                        <span className="group-hover:hidden">{String(idx + 1).padStart(2, '0')}</span>
                      )}
                      {!isActive && <Play fill="currentColor" size={16} className="hidden group-hover:block ml-1" />}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                         <Music size={16} className="text-gray-400" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-gray-900 truncate">{track.title}</span>
                        <span className="text-xs text-gray-500 truncate">{track.artist_id || 'Unknown Artist'}</span>
                      </div>
                    </div>

                    <div className="text-gray-500 font-medium truncate">
                      {track.album_id || 'Unknown Album'}
                    </div>

                    <div className="text-gray-900 font-bold text-sm">
                      {track.duration ? `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, '0')}` : '0:00'}
                    </div>

                    <div className="text-gray-900 font-bold text-sm">
                      {Math.floor(Math.random() * 50000 + 10000).toLocaleString()}
                    </div>

                    <div className="flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                      <Heart fill={isActive ? '#ef4444' : 'none'} className={isActive ? 'text-red-500' : ''} size={18} />
                    </div>
                  </div>
                )
              })}

              {tracks.length === 0 && (
                <div className="py-8 text-center text-gray-400">
                  No tracks scanned yet. Click "Local Files" to import.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trending Music Videos */}
        <div className="w-[320px] flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Trending Music Videos</h2>
            <div className="flex gap-2">
              <button className="text-gray-400 hover:text-gray-900">&lt;</button>
              <button className="text-gray-400 hover:text-gray-900">&gt;</button>
            </div>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden h-[360px] shadow-lg group cursor-pointer">
            <img src="https://images.unsplash.com/photo-1619983081563-430f63602796?w=600&h=800&fit=crop" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Video Cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
            <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#f9a826] rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
              <Play fill="currentColor" size={24} className="ml-1" />
            </button>
            <div className="absolute bottom-6 left-0 w-full text-center">
              <h3 className="text-white text-xl font-bold">wake up in the sky</h3>
              <p className="text-white/80 text-sm mt-1">Juice Worlds</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function SongsTab({ tracks, currentTrackIndex, playTrack }: any) {
  return (
    <div className="px-10 pb-32">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">All Songs</h2>
      
      <div className="w-full text-left text-sm">
        <div className="grid grid-cols-[auto_1fr_1.5fr_80px_80px_40px] gap-4 text-gray-400 font-medium pb-4 border-b border-gray-100">
          <div className="w-8 text-center">#</div>
          <div>Track / Artist</div>
          <div>Album</div>
          <div>Time</div>
          <div>Plays</div>
          <div className="text-center">Add</div>
        </div>

        <div className="mt-2 space-y-1">
          {tracks.map((track: any, idx: number) => {
            const isActive = currentTrackIndex === idx;
            return (
              <div 
                key={track.id} 
                onClick={() => playTrack(idx)}
                className={`grid grid-cols-[auto_1fr_1.5fr_80px_80px_40px] items-center gap-4 py-3 cursor-pointer rounded-xl transition-all duration-200 group
                  ${isActive ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] -mx-4 px-4' : 'hover:bg-white hover:shadow-sm -mx-2 px-2'}`}
              >
                <div className="w-8 flex items-center justify-center font-bold text-gray-400 group-hover:text-[#f9a826]">
                  {isActive ? (
                    <Pause fill="currentColor" size={16} className="text-[#f9a826]" />
                  ) : (
                    <span className="group-hover:hidden">{String(idx + 1).padStart(2, '0')}</span>
                  )}
                  {!isActive && <Play fill="currentColor" size={16} className="hidden group-hover:block ml-1" />}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                     <Music size={16} className="text-gray-400" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-gray-900 truncate">{track.title}</span>
                    <span className="text-xs text-gray-500 truncate">{track.artist_id || 'Unknown Artist'}</span>
                  </div>
                </div>

                <div className="text-gray-500 font-medium truncate">
                  {track.album_id || 'Unknown Album'}
                </div>

                <div className="text-gray-900 font-bold text-sm">
                  {track.duration ? `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, '0')}` : '0:00'}
                </div>

                <div className="text-gray-900 font-bold text-sm">
                  {Math.floor(Math.random() * 50000 + 10000).toLocaleString()}
                </div>

                <div className="flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                  <Heart fill={isActive ? '#ef4444' : 'none'} className={isActive ? 'text-red-500' : ''} size={18} />
                </div>
              </div>
            )
          })}
          {tracks.length === 0 && (
            <div className="py-8 text-center text-gray-400">
              No tracks found. Go to Local Files to add some.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlbumsTab({ tracks }: any) {
  // Simple unique albums extraction
  const albums = Array.from(new Set(tracks.map((t: any) => t.album_id))).filter(Boolean);
  
  return (
    <div className="px-10 pb-32">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Albums</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {albums.map((albumName, i) => (
          <div key={i} className="flex-shrink-0 group cursor-pointer">
            <div className="relative mb-3 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 transform group-hover:-translate-y-1">
              <img src={`https://images.unsplash.com/photo-${1510000000000 + i * 10000}?w=400&h=400&fit=crop`} className="w-full aspect-square object-cover" alt="Album" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-end justify-end p-4">
                <button className="w-12 h-12 bg-[#f9a826] rounded-full items-center justify-center text-white shadow-lg transform scale-0 group-hover:scale-100 transition-transform hidden group-hover:flex">
                  <Play fill="currentColor" size={20} className="ml-1" />
                </button>
              </div>
            </div>
            <h4 className="font-bold text-gray-900 truncate">{albumName as string}</h4>
            <p className="text-sm text-gray-500 mt-1">Album</p>
          </div>
        ))}
      </div>
      {albums.length === 0 && (
        <div className="py-8 text-center text-gray-400">No albums found.</div>
      )}
    </div>
  );
}

function ArtistsTab({ tracks }: any) {
  const artists = Array.from(new Set(tracks.map((t: any) => t.artist_id))).filter(Boolean);

  return (
    <div className="px-10 pb-32">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Artists</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 text-center">
        {artists.map((artistName, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="relative mb-4 mx-auto w-40 h-40 rounded-full overflow-hidden shadow-md group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 transform group-hover:scale-105">
              <img src={`https://images.unsplash.com/photo-${1520000000000 + i * 10000}?w=400&h=400&fit=crop&crop=faces`} className="w-full h-full object-cover" alt="Artist" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <Play fill="currentColor" size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-50 group-hover:scale-100" />
              </div>
            </div>
            <h4 className="font-bold text-gray-900 truncate">{artistName as string}</h4>
            <p className="text-sm text-gray-500 mt-1">Artist</p>
          </div>
        ))}
      </div>
      {artists.length === 0 && (
        <div className="py-8 text-center text-gray-400">No artists found.</div>
      )}
    </div>
  );
}

function LocalFilesTab({ handleScan }: any) {
  return (
    <div className="px-10 pb-32 flex flex-col items-center justify-center h-full">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Folder size={48} className="text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Local Music</h2>
      <p className="text-gray-500 mb-8 max-w-md text-center">
        Scan a folder on your computer to automatically import MP3, FLAC, and WAV files. We will read the metadata and organize them for you.
      </p>
      <button 
        onClick={handleScan}
        className="bg-[#f9a826] hover:bg-orange-500 text-white px-8 py-3 rounded-full font-bold shadow-[0_4px_15px_rgba(249,168,38,0.4)] transition-all transform hover:-translate-y-1"
      >
        Select Folder
      </button>
    </div>
  );
}

// --- Main Page Component ---

export default function Home() {
  const [activeTab, setActiveTab] = useState('Discover');
  const [tracks, setTracks] = useState<any[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTracks = async () => {
    if (typeof window !== 'undefined' && window.api) {
      const data = await window.api.getTracks();
      setTracks(data);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleScan = async () => {
    if (typeof window !== 'undefined' && window.api) {
      await window.api.scanFolder();
      setTimeout(fetchTracks, 1000);
    }
  };

  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const handleNext = () => {
    if (currentTrackIndex !== null && currentTrackIndex < tracks.length - 1) {
      playTrack(currentTrackIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentTrackIndex !== null && currentTrackIndex > 0) {
      playTrack(currentTrackIndex - 1);
    }
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  // Render Sidebar Item helper
  const NavItem = ({ name, icon: Icon, action }: { name: string, icon: any, action?: () => void }) => {
    const isActive = activeTab === name;
    
    return (
      <li className={`relative group cursor-pointer ${isActive ? 'active' : ''}`} onClick={() => {
        setActiveTab(name);
        if (action) action();
      }}>
        {isActive && <div className="absolute inset-y-0 left-0 w-11/12 bg-[#f9a826] rounded-r-full shadow-[0_4px_15px_rgba(249,168,38,0.4)]"></div>}
        <a className={`relative flex items-center gap-4 px-8 py-3 font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}>
          <Icon size={20} />
          {name}
        </a>
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-[#ffffff] font-sans text-[#1a202c] overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#f8f9fa] border-r border-gray-100 flex flex-col flex-shrink-0 z-10">
        <div className="flex items-center gap-2 p-8 mb-4">
          <div className="w-6 h-6 rounded-full bg-[#f9a826] flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <span className="text-xl font-bold tracking-tight">asinger</span>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          <div className="mb-8">
            <h3 className="text-xs uppercase text-gray-400 font-semibold px-8 mb-4 tracking-wider">Browse Music</h3>
            <ul className="space-y-1">
              <NavItem name="Discover" icon={Compass} />
              <NavItem name="Songs" icon={Music} />
              <NavItem name="Albums" icon={Disc3} />
              <NavItem name="Artists" icon={Mic2} />
              <NavItem name="Music Videos" icon={Video} />
              <NavItem name="Radio" icon={Radio} />
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="text-xs uppercase text-gray-400 font-semibold px-8 mb-4 tracking-wider">Your Music</h3>
            <ul className="space-y-1">
              <NavItem name="Favourite" icon={Heart} />
              <NavItem name="Play History" icon={Clock} />
              <NavItem name="Download Items" icon={Download} />
              <NavItem name="Local Files" icon={Folder} />
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="text-xs uppercase text-gray-400 font-semibold px-8 mb-4 tracking-wider">Playlist</h3>
            <ul className="space-y-1">
              <NavItem name="Pop Music" icon={FileAudio} />
              <NavItem name="Dangdut Music" icon={FileAudio} />
              <NavItem name="Reggae Music" icon={FileAudio} />
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <TopHeader />

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'Discover' && <DiscoverTab tracks={tracks} currentTrackIndex={currentTrackIndex} playTrack={playTrack} />}
          {activeTab === 'Songs' && <SongsTab tracks={tracks} currentTrackIndex={currentTrackIndex} playTrack={playTrack} />}
          {activeTab === 'Albums' && <AlbumsTab tracks={tracks} />}
          {activeTab === 'Artists' && <ArtistsTab tracks={tracks} />}
          {activeTab === 'Local Files' && <LocalFilesTab handleScan={handleScan} />}
          
          {/* Empty state for unused tabs */}
          {!['Discover', 'Songs', 'Albums', 'Artists', 'Local Files'].includes(activeTab) && (
            <div className="px-10 py-20 text-center text-gray-400">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{activeTab}</h2>
              <p>This tab is currently under construction.</p>
            </div>
          )}
        </div>
      </main>

      {/* Player Bar */}
      <footer className="fixed bottom-0 left-0 w-full h-[90px] bg-white/90 backdrop-blur-md border-t border-gray-100 flex items-center justify-between px-10 z-50">
        
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/4">
          <img src="https://images.unsplash.com/photo-1549834125-82d3c48159a3?w=100&h=100&fit=crop" className="w-12 h-12 rounded-full object-cover shadow-sm" alt="Now Playing" />
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-gray-900 text-sm truncate">{currentTrack ? currentTrack.title : 'Marshmello - Happier'}</span>
            <span className="text-xs text-gray-500 font-medium mt-0.5 truncate">{currentTrack ? currentTrack.artist_id : 'Else'}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 max-w-2xl flex flex-col items-center">
          <div className="flex items-center gap-8 mb-2">
            <button className="text-gray-400 hover:text-gray-900 transition"><Repeat size={18} /></button>
            <button onClick={handlePrev} className="text-gray-400 hover:text-gray-900 transition"><SkipBack fill="currentColor" size={18} /></button>
            <button 
              onClick={() => {
                if (tracks.length > 0 && currentTrackIndex === null) {
                  playTrack(0);
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
              className="w-10 h-10 bg-[#f9a826] rounded-full flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} className="ml-1" />}
            </button>
            <button onClick={handleNext} className="text-gray-400 hover:text-gray-900 transition"><SkipForward fill="currentColor" size={18} /></button>
            <button className="text-gray-400 hover:text-gray-900 transition"><Shuffle size={18} /></button>
          </div>
          
          <div className="flex items-center w-full gap-4">
            <span className="text-xs text-gray-400 font-medium">04.50</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full relative cursor-pointer">
              <div className="absolute top-0 left-0 h-full bg-[#f9a826] rounded-full w-2/3"></div>
              <div className="absolute top-1/2 left-2/3 transform -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-[#f9a826] border-2 border-white rounded-full shadow-sm"></div>
            </div>
            <span className="text-xs text-gray-400 font-medium">06.50</span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className="w-1/4 flex items-center justify-end gap-6 text-gray-400">
          <button className="hover:text-gray-900 transition"><Volume2 size={20} /></button>
          <button className="hover:text-gray-900 transition"><MonitorSpeaker size={20} /></button>
        </div>
      </footer>

      {/* Hidden Audio Element */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={`local://${currentTrack.path}`}
          onEnded={handleNext}
        />
      )}
    </div>
  );
}

'use client';

import { usePlayerStore } from '../store/usePlayerStore';
import { AudioEngine } from '../components/AudioEngine';
import { SettingsModal } from '../components/SettingsModal';
import { CreatePlaylistModal } from '../components/CreatePlaylistModal';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import { RightPanel } from '../components/RightPanel';
import { NowPlayingBar } from '../components/NowPlayingBar';

import { DiscoverView } from '../components/DiscoverView';
import { SongsView } from '../components/SongsView';
import { AlbumsView } from '../components/AlbumsView';
import { ArtistsView } from '../components/ArtistsView';
import { DetailView } from '../components/DetailView';
import { PlaylistDetailView } from '../components/PlaylistDetailView';
import { LikedSongsView } from '../components/LikedSongsView';
import { LocalFilesView } from '../components/LocalFilesView';

export default function Home() {
  const theme = usePlayerStore((s) => s.theme);
  const layout = usePlayerStore((s) => s.layout);
  const activeTab = usePlayerStore((s) => s.activeTab);

  const isDark = theme === 'dark';
  const isSpotifyLayout = layout === 'spotify';

  return (
    <div 
      className={`flex flex-col h-screen w-screen font-sans overflow-hidden select-none transition-colors duration-200 ${
        isDark ? 'bg-black text-white' : 'bg-white text-gray-900'
      }`}
    >
      {/* Headless Audio Engine */}
      <AudioEngine />

      {/* Preferences & Appearance Settings Modal */}
      <SettingsModal />

      {/* Create Playlist Modal */}
      <CreatePlaylistModal />

      {/* ── Main Layout Body ── */}
      <div className={`flex flex-1 min-h-0 ${isSpotifyLayout ? 'p-2 gap-2 bg-black' : ''}`}>
        
        {/* Left Sidebar (Classic 2-col or Spotify 3-col) */}
        <Sidebar />

        {/* Center Main Content Container */}
        <main 
          className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-colors ${
            isSpotifyLayout 
              ? isDark 
                ? 'bg-[#121212] rounded-2xl border border-neutral-800/80 shadow-md' 
                : 'bg-white rounded-2xl border border-gray-100 shadow-sm' 
              : isDark
                ? 'bg-[#121212]'
                : 'bg-white'
          }`}
        >
          {/* Top Sticky Header */}
          <TopHeader />

          {/* Dynamic Scrollable View Container */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'Discover' && <DiscoverView />}
            {activeTab === 'Songs' && <SongsView />}
            {activeTab === 'Albums' && <AlbumsView />}
            {activeTab === 'Artists' && <ArtistsView />}
            {(activeTab === 'AlbumDetail' || activeTab === 'ArtistDetail') && <DetailView />}
            {activeTab === 'PlaylistDetail' && <PlaylistDetailView />}
            {activeTab === 'LikedSongs' && <LikedSongsView />}
            {activeTab === 'Local Files' && <LocalFilesView />}
          </div>
        </main>

        {/* Right Panel (Spotify 3-Column: Now Playing Showcase + Live Queue) */}
        {isSpotifyLayout && <RightPanel />}
      </div>

      {/* ── Bottom Persistent Transport Bar ── */}
      <NowPlayingBar />
    </div>
  );
}


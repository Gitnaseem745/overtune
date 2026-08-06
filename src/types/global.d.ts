export {};

declare global {
  interface Window {
    api?: {
      scanFolder: () => Promise<string[]>;
      getTracks: () => Promise<any[]>;
      getAlbums: () => Promise<any[]>;
      getArtists: () => Promise<any[]>;
      onLibraryUpdated: (callback: () => void) => () => void;
    };
  }
}

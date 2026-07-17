export {};

declare global {
  interface Window {
    api: {
      scanFolder: () => Promise<string[]>;
      getTracks: () => Promise<any[]>;
    };
  }
}

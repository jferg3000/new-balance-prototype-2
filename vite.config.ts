import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// OneDrive-backed workspace: avoid restart storms from mtime flaps + ETIMEDOUT reads.
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces so desktop (localhost) + phone (LAN) both work.
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      // Polling is more reliable on OneDrive / cloud-synced folders than FSEvents.
      usePolling: true,
      interval: 1000,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    },
  },
  optimizeDeps: {
    // false: OneDrive mtime flaps can leave dep crawl pending forever,
    // which makes the first browser request hang for desktop + phone.
    holdUntilCrawlEnd: false,
  },
});

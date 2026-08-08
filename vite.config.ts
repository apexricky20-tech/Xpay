import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In local dev, run `npm run pages:dev` in another terminal (wrangler,
      // port 8788 by default) to serve the /api/* Cloudflare Pages Functions.
      "/api": "http://localhost:8788",
    },
  },
});

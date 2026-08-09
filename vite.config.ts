import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In local dev, run `npm run worker:dev` in another terminal
      // (wrangler, port 8787 by default) to serve the /api/* Worker routes.
      "/api": "http://localhost:8787",
    },
  },
});

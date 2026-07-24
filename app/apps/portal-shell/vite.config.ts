import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/work-center/v1": {
        target: "http://127.0.0.1:8092",
        changeOrigin: false,
      },
    },
  },
  build: {
    sourcemap: true,
    target: "es2022",
    chunkSizeWarningLimit: 1100,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  // Make PUBLIC__ prefixed environment variables available (same as main app)
  envPrefix: 'PUBLIC__',
});

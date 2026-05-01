import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// In production builds, the frontend has no proxy — it calls the API directly
// via CORS. The API host is baked into the bundle here so we don't need a
// Cloudflare Pages env var, .env.production file, or _redirects rule. Override
// at build time with VITE_API_URL=https://other.host/api pnpm build.
const PROD_API_URL = "https://african-youth-observatory.onrender.com/api";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const apiUrl = process.env.VITE_API_URL ?? (isProd ? PROD_API_URL : "/api");

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      // Make the chosen API URL available to client code as
      // `import.meta.env.VITE_API_URL`. Stringify so it appears as a literal.
      "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

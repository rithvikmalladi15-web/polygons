import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import embedRoutes from "./src/data/embed-proxy-routes.json";

function mountKey(to: string): string {
  return to.endsWith("/") ? to.slice(0, -1) : to;
}

const devProxy: Record<string, { target: string; changeOrigin: boolean; rewrite: (path: string) => string }> =
  {};

for (const route of embedRoutes) {
  const key = mountKey(route.to);
  const prefix = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  devProxy[key] = {
    target: route.target,
    changeOrigin: true,
    rewrite: (path) => {
      const rest = path.replace(new RegExp(`^${prefix}`), "");
      return rest || "/";
    },
  };
}

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: devProxy,
  },
});

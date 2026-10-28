import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
    proxy: {
      "/_gd/html5": {
        target: "https://html5.gamedistribution.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_gd\/html5/, ""),
      },
      "/_gd/embed": {
        target: "https://embed.gamedistribution.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_gd\/embed/, "") || "/",
      },
      "/_gd/img": {
        target: "https://img.gamedistribution.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_gd\/img/, ""),
      },
      "/_abc": {
        target: "https://abc.cloudfree.jp",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_abc/, ""),
      },
      "/_ext/slope": {
        target: "https://staticquasar931.github.io/slope",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/slope/, "") || "/",
      },
      "/_ext/crazy-cattle": {
        target: "https://crazy-cattle.github.io/iframe",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/crazy-cattle/, "") || "/",
      },
      "/_ext/1v1lol": {
        target: "https://1v1lol-free.github.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/1v1lol/, "") || "/",
      },
      "/_ext/fnaf": {
        target: "https://irv77.github.io/hd_fnaf",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/fnaf/, "") || "/",
      },
      "/_ext/gecko11": {
        target: "https://playgeckogames.github.io/games/game11",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/gecko11/, "") || "/",
      },
      "/_ext/tube-jumpers": {
        target: "https://htmlxm.github.io/h3/tube-jumpers",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/tube-jumpers/, "") || "/",
      },
      "/_ext/nitrome/badicecream": {
        target: "https://cdn.nitrome.com/html5-games/badicecream",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/nitrome\/badicecream/, "") || "/",
      },
      "/_ext/nitrome/badicecream2": {
        target: "https://cdn.nitrome.com/html5-games/badicecream2",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/nitrome\/badicecream2/, "") || "/",
      },
      "/_ext/geometrydash-lite": {
        target: "https://geometrydash-lite.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/geometrydash-lite/, "") || "/",
      },
      "/_ext/brawl-stars": {
        target: "https://driftboss-free.github.io/g/brawl-stars",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/brawl-stars/, "") || "/",
      },
      "/_ext/pokemon-emerald": {
        target: "https://pokemon-emerald.github.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/pokemon-emerald/, "") || "/",
      },
      "/_ext/scratch-gd": {
        target: "https://scratch.mit.edu/projects/105500895",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/_ext\/scratch-gd/, "") || "/",
      },
    },
  },
});

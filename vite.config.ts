import path from "path"
import { defineConfig } from "vitest/config";
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          const normalizedId = id.replace(/\\/g, "/");
          if (normalizedId.includes("react-router") || normalizedId.includes("react-dom") || normalizedId.includes("/react/")) {
            return "react-vendor";
          }
          if (normalizedId.includes("/convex/")) return "convex-vendor";
          if (normalizedId.includes("/framer-motion/")) return "motion-vendor";
          if (normalizedId.includes("/@radix-ui/")) return "radix-vendor";
          if (normalizedId.includes("/lucide-react/") || normalizedId.includes("/@phosphor-icons/")) {
            return "icon-vendor";
          }
          if (normalizedId.includes("/katex/")) return "math-vendor";
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
    testTimeout: 15000,
  },
})

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conditionally load cartographer only in development
const isDevelopment = process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined;

export default defineConfig({
  plugins: [
    react(),
    // Only include runtimeErrorOverlay in development
    ...(isDevelopment ? [require("@replit/vite-plugin-runtime-error-modal").default()] : []),
    // Conditionally include cartographer
    ...(isDevelopment ? [require("@replit/vite-plugin-cartographer").cartographer()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    // Add build optimizations for production
    minify: "terser",
    sourcemap: false,
  },
  server: {
    fs: {
      strict: isDevelopment, // Only strict in development
      deny: ["**/.*"],
    },
  },
  // Clear define configuration for production
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
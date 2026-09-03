import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// One codebase, one build — deployed once per school, each deployment
// pointed at a different school by its own env (VITE_SCHOOL_SLUG,
// VITE_API_URL) rather than by anything baked into the bundle differently
// per school. `PORT` is read here (not VITE_-prefixed — this is server
// config, not something the client bundle needs) so each local instance
// in this repo's demo can bind its own port, e.g. `PORT=5322 pnpm dev`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.PORT) || 5300,
  },
  preview: {
    port: Number(process.env.PORT) || 5300,
  },
});

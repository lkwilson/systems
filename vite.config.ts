import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev proxy: send /api (HTTP + WebSocket) to a red backend. red is internal-only,
// so the easy path is a port-forward in another terminal:
//   kubectl -n home port-forward svc/app-red-service 8080:80
// systems hits the same red backend as mc-ui, under the /api/systems scope.
// Override the target with RED_TARGET if red lives elsewhere.
const target = process.env.RED_TARGET ?? "http://localhost:8080";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": { target, changeOrigin: true, ws: true },
    },
  },
  plugins: [react(), tailwindcss()],
});

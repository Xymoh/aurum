import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import https from "node:https";

const ENKA_API_HOST = "enka.network";
const ENKA_API_PATH = { gi: "/api/uid", hsr: "/api/hsr/uid", zzz: "/api/zzz/uid" };

/**
 * Vite dev-server plugin that serves /api/proxy during local development, the
 * same job the Cloudflare Worker (workers/enka-proxy.js) does in production.
 * Uses Node's built-in https module (no fetch needed).
 */
function enkaProxyPlugin(): Plugin {
  return {
    name: "enka-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/proxy")) {
          return next();
        }

        const url = new URL(req.url, "http://localhost");
        const uid = url.searchParams.get("uid");
        const gameParam = url.searchParams.get("game");
        const game = gameParam === "hsr" || gameParam === "zzz" ? gameParam : "gi";

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
        res.setHeader("Content-Type", "application/json");

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
          return;
        }

        // Genshin and Star Rail UIDs are 9 digits (Genshin's newest Asia
        // accounts 10); Zenless runs from 8 on CN to 10 on Asia.
        if (!uid || !/^[1-9]\d{7,9}$/.test(uid)) {
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              success: false,
              error: "Invalid UID. Must be 8 to 10 digits starting with 1-9.",
            }),
          );
          return;
        }

        const enkaUrl = `${ENKA_API_PATH[game]}/${uid}`;

        const enkaReq = https.get(
          {
            hostname: ENKA_API_HOST,
            path: enkaUrl,
            headers: {
              "User-Agent": "Aurum/0.1 (+https://github.com/Xymoh/aurum)",
              Accept: "application/json",
            },
            timeout: 8000,
          },
          (enkaRes) => {
            // Collected as bytes and decoded once: decoding each chunk on
            // its own splits multi-byte characters (a CJK nickname) at
            // chunk boundaries.
            const chunks: Buffer[] = [];
            enkaRes.on("data", (chunk: Buffer) => {
              chunks.push(chunk);
            });
            enkaRes.on("end", () => {
              const body = Buffer.concat(chunks).toString("utf8");
              const status = enkaRes.statusCode ?? 502;

              if (status !== 200) {
                if (status === 400) {
                  res.statusCode = 404;
                  res.end(
                    JSON.stringify({
                      success: false,
                      error:
                        "This UID could not be found. The player may not exist or their showcase is not public.",
                    }),
                  );
                  return;
                }

                if (status === 424) {
                  res.statusCode = 503;
                  res.end(
                    JSON.stringify({
                      success: false,
                      error:
                        "Enka.Network is currently undergoing maintenance. Please try again later.",
                    }),
                  );
                  return;
                }

                if (status === 429) {
                  res.statusCode = 429;
                  res.end(
                    JSON.stringify({
                      success: false,
                      error:
                        "Rate limited by Enka.Network. Please wait a moment and try again.",
                    }),
                  );
                  return;
                }

                res.statusCode = 502;
                res.end(
                  JSON.stringify({
                    success: false,
                    error: `Enka.Network returned status ${status}. Please try again later.`,
                  }),
                );
                return;
              }

              try {
                const data = JSON.parse(body);
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, data }));
              } catch {
                res.statusCode = 502;
                res.end(
                  JSON.stringify({
                    success: false,
                    error: "Failed to parse Enka.Network response.",
                  }),
                );
              }
            });
          },
        );

        enkaReq.on("error", (err) => {
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              success: false,
              error: err.message ?? "Unknown error connecting to Enka.Network.",
            }),
          );
        });

        enkaReq.on("timeout", () => {
          enkaReq.destroy();
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              success: false,
              error: "Request to Enka.Network timed out.",
            }),
          );
        });
      });
    },
  };
}

export default defineConfig({
  base: "/aurum/",
  plugins: [react(), enkaProxyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: "ES2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Long-lived libraries in their own chunks, so a deploy that only
        // touches app code leaves the React runtime cached. The function form
        // catches react-dom/client and scheduler, which the package-name list
        // used to miss, leaving 177 KB of React inside the app chunk.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return "vendor";
          if (id.includes("@tanstack")) return "query";
          return undefined;
        },
      },
    },
  },
});

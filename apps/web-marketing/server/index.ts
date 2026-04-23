import express from "express";
import { createServer, request as httpRequest, IncomingMessage } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALB_HOST = process.env.ALB_HOST || "digzio-alb-prod-1867460850.af-south-1.elb.amazonaws.com";
const ALB_PORT = 80;

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ── API reverse proxy ──────────────────────────────────────────────────────
  // Forward all /api/* requests to the ALB using Node's native http module.
  // This runs server-side so the browser never makes a mixed-content HTTP call.
  app.use("/api", (req, res) => {
    const options = {
      hostname: ALB_HOST,
      port: ALB_PORT,
      path: `/api${req.url}`,
      method: req.method,
      headers: {
        ...req.headers,
        host: ALB_HOST,          // override Host so ALB routing rules match
        "x-forwarded-host": req.headers.host || "",
      },
    };

    const proxyReq = httpRequest(options, (proxyRes: IncomingMessage) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err: Error) => {
      console.error("Proxy error:", err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: "API unavailable" });
      }
    });

    req.pipe(proxyReq, { end: true });
  });

  // ── Static files ───────────────────────────────────────────────────────────
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // ── SPA fallback ───────────────────────────────────────────────────────────
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/ — proxying /api → http://${ALB_HOST}`);
  });
}

startServer().catch(console.error);

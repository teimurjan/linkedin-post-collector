// The Post Office server: serves the static web/ prototype and exposes the
// markdown corpus + live pipeline state to it. Bun-native, no framework.

import { resolve } from "node:path";
import { buildAgentsPayload, buildOverviewPayload } from "./agents.ts";
import { dashboardPresence } from "./presence.ts";
import { officeStreamResponse, viewerCount } from "./sse.ts";
import { resetOffice, watchOfficeState } from "./state.ts";

const WEB_DIR = resolve(import.meta.dir, "../web");

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  // Babel-in-browser fetches these via <script type="text/babel" src>; they
  // must arrive as a script type, not application/octet-stream.
  ".jsx": "application/javascript; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

const json = (data: unknown): Response =>
  new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });

async function serveStatic(pathname: string): Promise<Response> {
  const rel = pathname === "/" ? "/index.html" : pathname;
  const path = resolve(WEB_DIR, `.${rel}`);
  // Path-traversal guard: never escape web/.
  if (path !== WEB_DIR && !path.startsWith(`${WEB_DIR}/`)) {
    return new Response("forbidden", { status: 403 });
  }
  const file = Bun.file(path);
  if (!(await file.exists())) return new Response("not found", { status: 404 });
  const ext = path.slice(path.lastIndexOf("."));
  const type = CONTENT_TYPES[ext];
  return new Response(file, type ? { headers: { "content-type": type } } : {});
}

async function handle(req: Request, port: number): Promise<Response> {
  const { pathname } = new URL(req.url);
  try {
    switch (pathname) {
      case "/api/agents":
        return json(await buildAgentsPayload());
      case "/api/overview":
        return json(await buildOverviewPayload());
      case "/api/stream":
        return officeStreamResponse();
      case "/api/viewers":
        // How many browsers hold a live SSE stream right now. `office open` uses
        // this to decide whether the dashboard needs a fresh tab.
        return json({ count: viewerCount() });
      case "/api/presence":
        // How many dashboards are open in cmux, split by window visibility.
        // null when cmux can't be queried — the header then omits the chip.
        return json(await dashboardPresence(port));
      case "/api/reset":
        // The UI's Reset must clear the shared board, not just local state, or
        // the next SSE frame re-pushes the old run. POST-only to keep it a
        // deliberate mutation; the fs.watch broadcasts the reset to every tab.
        if (req.method !== "POST") {
          return new Response("method not allowed", { status: 405 });
        }
        await resetOffice();
        return json({ ok: true });
      default:
        return await serveStatic(pathname);
    }
  } catch (err) {
    return json({ error: String(err) });
  }
}

export function startOfficeServer({ port = 4317 }: { port?: number } = {}) {
  watchOfficeState();
  let server: ReturnType<typeof Bun.serve>;
  try {
    // Bun.serve binds the port synchronously, so a taken port throws here. That
    // means another office already owns it — the single-instance guarantee — so
    // step aside cleanly instead of crashing with EADDRINUSE.
    //
    // idleTimeout: 0 disables Bun's per-connection idle reaper. It defaults to
    // 10s, which silently kills every SSE stream before the 25s keep-alive ping
    // can fire — forcing a perpetual reconnect cycle whose drop windows read as
    // "zero viewers" and make `office open` spawn a duplicate tab every prompt.
    // SSE streams are meant to be long-lived; the ping plus EventSource's own
    // reconnect handle genuinely dead connections.
    server = Bun.serve({
      port,
      idleTimeout: 0,
      fetch: (req) => handle(req, port),
    });
  } catch (err) {
    if (err instanceof Error && /EADDRINUSE|in use/i.test(err.message)) {
      process.stdout.write(
        `The Post Office is already running → http://localhost:${port}\n`,
      );
      return null;
    }
    throw err;
  }
  process.stdout.write(`The Post Office → http://localhost:${server.port}\n`);
  return server;
}

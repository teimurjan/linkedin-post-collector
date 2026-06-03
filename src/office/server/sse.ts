// Server-Sent Events stream of office state. Each connection gets an immediate
// snapshot, then one `state` frame per change, plus periodic pings so proxies
// don't drop the idle connection. Hand-rolled ReadableStream — no dependency.

import {
  type OfficeState,
  readOfficeState,
  subscribeOfficeState,
} from "./state.ts";

// Keep-alive cadence. Stays well under any proxy/Bun idle window so the stream
// never looks idle; the server also disables Bun's idle reaper (idleTimeout: 0)
// so SSE connections survive between pings.
const PING_MS = 15_000;

// Live count of attached browsers. `office open` reads this (via /api/viewers)
// to tell "server up AND a tab is watching" from "server up but unwatched" —
// the latter happens when the detached server outlives its tab, and is exactly
// when a fresh tab must be re-opened.
let viewers = 0;
export const viewerCount = (): number => viewers;

function frame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function officeStreamResponse(): Response {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let ping: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      viewers++;
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(frame(event, data)));
        } catch {
          // Controller closed mid-send (client gone) — cleanup runs in cancel.
        }
      };

      send("state", await readOfficeState());
      unsubscribe = subscribeOfficeState((state: OfficeState) =>
        send("state", state),
      );
      ping = setInterval(() => send("ping", Date.now()), PING_MS);
    },
    cancel() {
      viewers = Math.max(0, viewers - 1);
      unsubscribe?.();
      if (ping) clearInterval(ping);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}

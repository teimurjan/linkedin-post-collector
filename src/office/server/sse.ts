// Server-Sent Events stream of office state. Each connection gets an immediate
// snapshot, then one `state` frame per change, plus periodic pings so proxies
// don't drop the idle connection. Hand-rolled ReadableStream — no dependency.

import {
  type OfficeState,
  readOfficeState,
  subscribeOfficeState,
} from "./state.ts";

const PING_MS = 25_000;

function frame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function officeStreamResponse(): Response {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let ping: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
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

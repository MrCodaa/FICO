import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { ApiError } from "@/lib/errors";

// SSE rute moraju biti dinamičke — bez ovoga Next.js može pokušati statički
// predrenderovati/keširati handler, što bi slomilo long-lived stream.
export const dynamic = "force-dynamic";
// Stream traje ~50 s (STREAM_DURATION_MS); zadano ograničenje funkcije na Vercelu je kraće na nekim
// planovima pa bi se veza prekidala usred toka. 60 s ostavlja rezervu iznad 50 s.
export const maxDuration = 60;

const POLL_INTERVAL_MS = 2000;
const STREAM_DURATION_MS = 50_000;

export const GET = withRoute(
  async ({ req, ctx, params }) => {
    const matchId = params.id!;
    const isMember = await container.chatService.checkMembership(ctx.userId!, matchId);
    if (!isMember) throw new ApiError("NOT_A_MATCH", "Nisi član ovog razgovora.");

    const lastEventIdHeader = req.headers.get("last-event-id");
    let lastId = lastEventIdHeader ? BigInt(lastEventIdHeader) : 0n;

    const encoder = new TextEncoder();
    let intervalHandle: ReturnType<typeof setInterval> | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const stream = new ReadableStream({
      start(controller) {
        const poll = async () => {
          try {
            const messages = await container.chatService.getMessagesSince(matchId, lastId);
            for (const message of messages) {
              const payload = JSON.stringify(message);
              controller.enqueue(encoder.encode(`id: ${message.id}\nevent: message\ndata: ${payload}\n\n`));
              lastId = BigInt(message.id);
            }
          } catch {
            // greška u pollingu ne smije srušiti stream — samo preskoči ovaj ciklus
          }
        };

        intervalHandle = setInterval(poll, POLL_INTERVAL_MS);
        timeoutHandle = setTimeout(() => {
          if (intervalHandle) clearInterval(intervalHandle);
          controller.close();
        }, STREAM_DURATION_MS);

        void poll(); // odmah pošalji sve što je propušteno od Last-Event-ID
      },
      cancel() {
        if (intervalHandle) clearInterval(intervalHandle);
        if (timeoutHandle) clearTimeout(timeoutHandle);
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  },
  { guard: "approved" },
);

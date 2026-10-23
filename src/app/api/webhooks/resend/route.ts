import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { ApiError } from "@/lib/errors";
import { verifySvixSignature } from "@/lib/email/svix";

// Resend webhook (Svix potpis). Sirovo tijelo je potrebno za provjeru potpisa,
// pa ruta ne koristi `body` šemu iz withRoute.
export const POST = withRoute(
  async ({ req }) => {
    const secret = process.env.RESEND_WEBHOOK_SECRET ?? "";
    const rawBody = await req.text();
    const valid = verifySvixSignature(
      secret,
      rawBody,
      {
        id: req.headers.get("svix-id"),
        timestamp: req.headers.get("svix-timestamp"),
        signature: req.headers.get("svix-signature"),
      },
      container.clock.now(),
    );
    if (!valid) throw new ApiError("UNAUTHENTICATED", "Nevažeći potpis.");

    let event: unknown;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Neispravan JSON.");
    }
    const result = await container.emailBlockService.handleResendEvent(event as never);
    return NextResponse.json(result);
  },
  { guard: "public" },
);

import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

// Kontrolna tabla → "Odblokiraj": skida blokadu i šalje novi mejl za potvrdu.
export const POST = withRoute(
  async ({ ctx }) => {
    await container.authService.unblockEmail(ctx.userId!);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "auth" },
);

import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

// Podešavanja → "Resetuj preskočene profile".
export const DELETE = withRoute(
  async ({ ctx }) => NextResponse.json(await container.discoverService.resetNotInterested(ctx.userId!)),
  { guard: "onboarded" },
);

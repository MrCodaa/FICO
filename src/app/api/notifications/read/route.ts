import { NextResponse } from "next/server";
import { z } from "zod";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

const readSchema = z.object({ ids: z.array(z.string()).optional() });

export const POST = withRoute(
  async ({ ctx, body }) => {
    await container.notificationService.markRead(ctx.userId!, body.ids);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "auth", body: readSchema },
);

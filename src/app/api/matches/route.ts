import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const GET = withRoute(
  async ({ ctx }) => {
    const result = await container.chatService.listMatches(ctx.userId!);
    return NextResponse.json(result);
  },
  { guard: "approved" },
);

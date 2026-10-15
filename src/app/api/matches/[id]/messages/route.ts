import { NextResponse } from "next/server";
import { z } from "zod";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { sendMessageSchema } from "@/features/chat/schemas";

const querySchema = z.object({
  before: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const GET = withRoute(
  async ({ ctx, params, query }) => {
    const result = await container.chatService.listMessages(ctx.userId!, params.id!, query.before, query.limit ?? 50);
    return NextResponse.json(result);
  },
  { guard: "approved", query: querySchema },
);

export const POST = withRoute(
  async ({ ctx, params, body }) => {
    const message = await container.chatService.sendMessage(ctx.userId!, params.id!, body.body);
    return NextResponse.json(message, { status: 201 });
  },
  { guard: "approved", body: sendMessageSchema },
);

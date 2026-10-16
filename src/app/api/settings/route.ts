import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { settingsSchema } from "@/features/settings/schemas";

export const GET = withRoute(
  async ({ ctx }) => NextResponse.json(await container.settingsService.getSettings(ctx.userId!)),
  { guard: "auth" },
);

export const PATCH = withRoute(
  async ({ ctx, body }) => NextResponse.json(await container.settingsService.updateSettings(ctx.userId!, body)),
  { guard: "auth", body: settingsSchema },
);

import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { preferenceDraftSchema } from "@/features/profile/schemas";

export const PATCH = withRoute(
  async ({ ctx, body }) => {
    const preference = await container.profileService.updatePreference(ctx.userId!, body);
    return NextResponse.json({ preference });
  },
  { guard: "onboarded", body: preferenceDraftSchema },
);

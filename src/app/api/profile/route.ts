import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { profileDraftSchema } from "@/features/profile/schemas";

export const GET = withRoute(
  async ({ ctx }) => {
    const result = await container.profileService.getProfile(ctx.userId!);
    return NextResponse.json(result);
  },
  { guard: "onboarded" },
);

export const PATCH = withRoute(
  async ({ ctx, body }) => {
    const profile = await container.profileService.updateProfile(ctx.userId!, body);
    return NextResponse.json({ profile });
  },
  { guard: "onboarded", body: profileDraftSchema },
);

import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const POST = withRoute(
  async ({ ctx }) => {
    const status = await container.profileService.submitProfile(ctx.userId!);
    return NextResponse.json({ status });
  },
  { guard: "onboarded" },
);

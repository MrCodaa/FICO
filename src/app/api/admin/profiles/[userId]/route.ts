import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const GET = withRoute(
  async ({ params }) => {
    const profile = await container.profileService.getReviewProfile(params.userId!);
    return NextResponse.json(profile);
  },
  { guard: "admin" },
);

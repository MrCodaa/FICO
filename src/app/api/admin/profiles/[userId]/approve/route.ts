import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const POST = withRoute(
  async ({ params }) => {
    await container.profileService.approveProfile(params.userId!);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "admin" },
);

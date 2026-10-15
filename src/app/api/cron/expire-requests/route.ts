import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { ApiError } from "@/lib/errors";

export const GET = withRoute(
  async ({ req }) => {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      throw new ApiError("UNAUTHENTICATED", "Nevažeći cron secret.");
    }
    const expired = await container.requestService.expireRequests();
    return NextResponse.json({ expired });
  },
  { guard: "public" },
);

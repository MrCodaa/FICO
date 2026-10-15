import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { ApiError } from "@/lib/errors";

export const GET = withRoute(
  async ({ req }) => {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      throw new ApiError("UNAUTHENTICATED", "Nevažeći cron secret.");
    }
    const expired = await container.requestService.expireRequests();
    return NextResponse.json({ expired });
  },
  { guard: "public" },
);

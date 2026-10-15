import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const POST = withRoute(
  async () => {
    const response = new NextResponse(null, { status: 204 });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  },
  { guard: "auth" },
);

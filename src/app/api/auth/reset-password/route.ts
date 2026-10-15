import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { resetPasswordSchema } from "@/features/auth/schemas";

export const POST = withRoute(
  async ({ body }) => {
    await container.authService.resetPassword(body);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "public", body: resetPasswordSchema },
);

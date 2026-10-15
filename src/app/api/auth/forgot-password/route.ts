import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { forgotPasswordSchema } from "@/features/auth/schemas";

export const POST = withRoute(
  async ({ body }) => {
    await container.authService.forgotPassword(body);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "public", body: forgotPasswordSchema },
);

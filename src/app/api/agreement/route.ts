import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { agreementSchema } from "@/features/auth/schemas";

export const POST = withRoute(
  async ({ ctx }) => {
    await container.authService.acceptAgreement(ctx.userId!);
    return new NextResponse(null, { status: 204 });
  },
  { guard: "verified", body: agreementSchema },
);

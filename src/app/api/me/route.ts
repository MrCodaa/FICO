import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { deleteAccountSchema } from "@/features/settings/schemas";

export const GET = withRoute(
  async ({ ctx }) => {
    const me = await container.authService.me(ctx.userId!);
    return NextResponse.json(me, { status: 200 });
  },
  { guard: "auth" },
);

// Podešavanja → "Obriši nalog" (body: { email } kao potvrda). Briše nalog kaskadno i cookie.
export const DELETE = withRoute(
  async ({ ctx, body }) => {
    await container.authService.deleteAccount(ctx.userId!, body.email);
    const response = new NextResponse(null, { status: 204 });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  },
  { guard: "auth", body: deleteAccountSchema },
);

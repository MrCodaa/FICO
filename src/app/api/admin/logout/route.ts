import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { ADMIN_COOKIE_NAME } from "@/lib/auth/session";

// Briše samo admin kolačić; korisnička sesija ostaje netaknuta. Guard je public
// da se istekla admin sesija uvijek može očistiti.
export const POST = withRoute(
  async () => {
    const response = new NextResponse(null, { status: 204 });
    response.cookies.delete(ADMIN_COOKIE_NAME);
    return response;
  },
  { guard: "public" },
);

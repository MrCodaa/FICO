import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

// Javno dostupno samo kroz skrivenu admin adresu (adminApi("/profiles/count")).
export const GET = withRoute(
  async () => NextResponse.json(await container.adminService.countPendingProfiles()),
  { guard: "admin" },
);

import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";

export const GET = withRoute(
  async () => NextResponse.json(await container.safetyService.countOpenReports()),
  { guard: "admin" },
);

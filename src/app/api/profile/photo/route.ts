import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { ApiError } from "@/lib/errors";

export const POST = withRoute(
  async ({ ctx, req }) => {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "Fajl je obavezan.", { file: "Obavezno polje" });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const photoUrl = await container.profileService.uploadPhoto(ctx.userId!, {
      buffer,
      contentType: file.type,
      size: file.size,
    });
    return NextResponse.json({ photoUrl });
  },
  { guard: "onboarded" },
);

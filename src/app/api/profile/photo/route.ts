import { NextResponse } from "next/server";
import { withRoute } from "@/lib/http/withRoute";
import { container } from "@/lib/container";
import { ApiError } from "@/lib/errors";
import { MAX_PHOTO_SIZE } from "@/features/profile/service";
import { sr } from "@/content/sr";

export const POST = withRoute(
  async ({ ctx, req }) => {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "Fajl je obavezan.", { file: "Obavezno polje" });
    }
    // Provjera veličine prije čitanja u memoriju.
    if (file.size > MAX_PHOTO_SIZE) {
      throw new ApiError("VALIDATION_ERROR", sr.profile.errors.photoTooLarge, {
        file: sr.profile.errors.photoTooLarge,
      });
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

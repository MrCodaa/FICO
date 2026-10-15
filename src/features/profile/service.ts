import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import type { EmailProvider } from "@/lib/email";
import type { StorageProvider } from "@/lib/storage";
import type { ProfileStatus } from "@/generated/prisma/client";
import { sr } from "@/content/sr";
import type { ProfileRepository } from "./repository";
import { toProfileDraft, toPreferenceDraft, toProfileView } from "./mappers";
import { profileSubmitSchema } from "./schemas";
import type { ProfileDraftInput, PreferenceDraftInput } from "./schemas";

export interface ProfileServiceDeps {
  repo: ProfileRepository;
  storage: StorageProvider;
  clock: Clock;
  email: EmailProvider;
}

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_SIZE = 4 * 1024 * 1024;

export function createProfileService(deps: ProfileServiceDeps) {
  const { repo, storage, clock, email } = deps;

  // Mail je sporedan efekat poslije commita — provider greška ne smije
  // oboriti odgovor za operaciju koja je već upisana u bazu.
  async function trySendEmail(message: Parameters<EmailProvider["send"]>[0]) {
    try {
      await email.send(message);
    } catch (err) {
      console.error("[profile] slanje maila nije uspjelo:", err);
    }
  }

  return {
    async getProfile(userId: string) {
      const { profile, preference } = await repo.getProfileAndPreference(userId);
      if (!profile) throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      return {
        profile: toProfileDraft(profile),
        preference: preference ? toPreferenceDraft(preference) : null,
      };
    },

    async updateProfile(userId: string, input: ProfileDraftInput) {
      const updated = await repo.updateProfileDraft(userId, input);
      return toProfileDraft(updated);
    },

    async updatePreference(userId: string, input: PreferenceDraftInput) {
      const updated = await repo.updatePreferenceDraft(userId, input);
      return toPreferenceDraft(updated);
    },

    async uploadPhoto(userId: string, file: { buffer: Buffer; contentType: string; size: number }) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.contentType)) {
        throw new ApiError("VALIDATION_ERROR", sr.profile.errors.photoInvalidType, {
          file: sr.profile.errors.photoInvalidType,
        });
      }
      if (file.size > MAX_PHOTO_SIZE) {
        throw new ApiError("VALIDATION_ERROR", sr.profile.errors.photoTooLarge, {
          file: sr.profile.errors.photoTooLarge,
        });
      }
      const ext = file.contentType === "image/png" ? "png" : file.contentType === "image/webp" ? "webp" : "jpg";
      const key = `profiles/${userId}/${crypto.randomUUID()}.${ext}`;
      const { url } = await storage.put({ key, data: file.buffer, contentType: file.contentType });
      const { oldPhotoUrl } = await repo.updateProfilePhoto(userId, url);
      if (oldPhotoUrl) {
        await storage.remove(oldPhotoUrl).catch(() => {});
      }
      return url;
    },

    async submitProfile(userId: string) {
      const { profile } = await repo.getProfileAndPreference(userId);
      if (!profile) throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      // PRIVREMENO isključeno dok Vercel Blob (BLOB_READ_WRITE_TOKEN) nije
      // povezan pa upload slike ne radi lokalno — VRATI prije finalnog testa/deploya.
      // if (!profile.photoUrl) {
      //   throw new ApiError("PROFILE_INCOMPLETE", sr.profile.errors.incomplete, { photoUrl: "Obavezno polje" });
      // }
      const parsed = profileSubmitSchema.safeParse(profile);
      if (!parsed.success) {
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path.join(".") || "_";
          if (!(key in fields)) fields[key] = issue.message;
        }
        throw new ApiError("PROFILE_INCOMPLETE", sr.profile.errors.incomplete, fields);
      }
      const ok = await repo.submitProfile(userId, clock.now());
      if (!ok) throw new ApiError("INVALID_STATUS", "Profil nije u stanju koje dozvoljava slanje.");
      return "PENDING_REVIEW" as const;
    },

    async listPendingProfiles(status: ProfileStatus = "PENDING_REVIEW", cursor?: string, limit = 20) {
      const { items, nextCursor } = await repo.listProfilesByStatus(status, cursor, limit);
      return { items: items.map((p) => toProfileView(p, clock.now())), nextCursor };
    },

    async approveProfile(userId: string) {
      const result = await repo.approveProfile(userId, clock.now());
      if (result === "NOT_FOUND") throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      if (result === "INVALID_STATUS") throw new ApiError("INVALID_STATUS", "Profil nije na pregledu.");
      await trySendEmail({
        to: result.email,
        subject: sr.admin.emails.approved.subject,
        text: sr.admin.emails.approved.body,
      });
    },

    async rejectProfile(userId: string, reason: string) {
      const result = await repo.rejectProfile(userId, reason, clock.now());
      if (result === "NOT_FOUND") throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      if (result === "INVALID_STATUS") throw new ApiError("INVALID_STATUS", "Profil nije na pregledu.");
      await trySendEmail({
        to: result.email,
        subject: sr.admin.emails.rejected.subject,
        text: sr.admin.emails.rejected.body(reason),
      });
    },
  };
}

export type ProfileService = ReturnType<typeof createProfileService>;

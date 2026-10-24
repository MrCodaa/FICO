import type { Clock } from "@/lib/clock";
import { ApiError } from "@/lib/errors";
import type { EmailProvider } from "@/lib/email";
import {
  detectImageType,
  stripImageMetadata,
  type StorageProvider,
} from "@/lib/storage";
import type { ProfileStatus } from "@/generated/prisma/client";
import { sr } from "@/content/sr";
import type { ProfileRepository } from "./repository";
import { toProfileDraft, toPreferenceDraft, toAdminProfileView } from "./mappers";
import { profileSubmitSchema } from "./schemas";
import type { ProfileDraftInput, PreferenceDraftInput } from "./schemas";

export interface ProfileServiceDeps {
  repo: ProfileRepository;
  storage: StorageProvider;
  clock: Clock;
  email: EmailProvider;
}

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PHOTO_SIZE = 4 * 1024 * 1024;
export const PHOTO_UPLOADS_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

const appUrl = () => (process.env.APP_URL ?? "").replace(/[/]$/, "");

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
      // Tip određujemo po magic bytes; Content-Type zaglavlju se ne vjeruje.
      const detected = detectImageType(file.buffer);
      if (!detected || !ALLOWED_PHOTO_TYPES.includes(detected)) {
        throw new ApiError("VALIDATION_ERROR", sr.profile.errors.photoInvalidType, {
          file: sr.profile.errors.photoInvalidType,
        });
      }
      if (Math.max(file.size, file.buffer.length) > MAX_PHOTO_SIZE) {
        throw new ApiError("VALIDATION_ERROR", sr.profile.errors.photoTooLarge, {
          file: sr.profile.errors.photoTooLarge,
        });
      }
      const ext = detected === "image/png" ? "png" : detected === "image/webp" ? "webp" : "jpg";
      const allowed = await repo.consumeUploadSlot(userId, clock.now(), PHOTO_UPLOADS_PER_HOUR, HOUR_MS);
      if (!allowed) {
        throw new ApiError("TOO_MANY_REQUESTS", sr.profile.errors.photoRateLimited);
      }
      // Ime fajla je nasumično (UUID v4) i ne sadrži ni userId ni email.
      const key = `profiles/${crypto.randomUUID()}.${ext}`;
      const data = stripImageMetadata(file.buffer, detected);
      const { url } = await storage.put({ key, data, contentType: detected });
      const { oldPhotoUrl } = await repo.updateProfilePhoto(userId, url);
      if (oldPhotoUrl) {
        await storage.remove(oldPhotoUrl).catch(() => {});
      }
      return url;
    },

    async submitProfile(userId: string) {
      const { profile, preference } = await repo.getProfileAndPreference(userId);
      if (!profile) throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      if (!profile.photoUrl) {
        throw new ApiError("PROFILE_INCOMPLETE", sr.profile.errors.incomplete, { photoUrl: "Obavezno polje" });
      }
      const parsed = profileSubmitSchema.safeParse({ ...profile, lookingFor: preference?.lookingFor ?? null });
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
      return {
        items: items.map((p) => toAdminProfileView(p, clock.now(), { preference: p.preference ?? null, email: p.email })),
        nextCursor,
      };
    },

    async approveProfile(userId: string) {
      const result = await repo.approveProfile(userId, clock.now());
      if (result === "NOT_FOUND") throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      if (result === "INVALID_STATUS") throw new ApiError("INVALID_STATUS", "Profil nije na pregledu.");
      await trySendEmail({
        to: result.email,
        subject: sr.admin.emails.approved.subject,
        text: sr.admin.emails.approved.body(`${appUrl()}/app`),
      });
    },

    async rejectProfile(userId: string, rawReason?: string | null) {
      // Razlog je opcionalan: prazan se čuva kao null.
      const reason = rawReason?.trim() || null;
      if (reason !== null && reason.length > 1000) {
        throw new ApiError("VALIDATION_ERROR", sr.admin.queue.reasonRequired, { reason: sr.admin.queue.reasonRequired });
      }
      const result = await repo.rejectProfile(userId, reason, clock.now());
      if (result === "NOT_FOUND") throw new ApiError("NOT_FOUND", "Profil ne postoji.");
      if (result === "INVALID_STATUS") throw new ApiError("INVALID_STATUS", "Profil nije na pregledu.");
      await trySendEmail({
        to: result.email,
        subject: sr.admin.emails.rejected.subject,
        text: sr.admin.emails.rejected.body(reason, `${appUrl()}/app/profile`),
      });
    },
  };
}

export type ProfileService = ReturnType<typeof createProfileService>;

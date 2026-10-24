import type { ProfileStatus } from "@/generated/prisma/client";
import { isEmailVerified } from "@/lib/auth/emailVerification";

export interface Me {
  id: string;
  email: string;
  emailVerified: boolean;
  agreementAccepted: boolean;
  profileStatus: ProfileStatus;
  isAdmin: boolean;
  // Resend bounce/complaint: adresa je na blacklisti, mailovi joj ne idu (Kontrolna tabla → Odblokiraj).
  emailBlocked: boolean;
}

export function toMe(
  user: {
    id: string;
    email: string;
    emailVerifiedAt: Date | null;
    agreementAcceptedAt: Date | null;
    emailBlockedAt?: Date | null;
    profileStatus: ProfileStatus;
  },
  isAdmin: boolean,
): Me {
  return {
    id: user.id,
    email: user.email,
    emailVerified: isEmailVerified(user.emailVerifiedAt),
    agreementAccepted: user.agreementAcceptedAt !== null,
    profileStatus: user.profileStatus,
    isAdmin,
    emailBlocked: user.emailBlockedAt != null,
  };
}

import type { ProfileStatus } from "@/generated/prisma/client";
import { isEmailVerified } from "@/lib/auth/emailVerification";
import { OPEN_ACCESS } from "@/lib/devAccess";

export interface Me {
  id: string;
  email: string;
  emailVerified: boolean;
  agreementAccepted: boolean;
  profileStatus: ProfileStatus;
  isAdmin: boolean;
}

export function toMe(
  user: {
    id: string;
    email: string;
    emailVerifiedAt: Date | null;
    agreementAcceptedAt: Date | null;
    profileStatus: ProfileStatus;
  },
  isAdmin: boolean,
): Me {
  return {
    id: user.id,
    email: user.email,
    emailVerified: isEmailVerified(user.emailVerifiedAt),
    agreementAccepted: OPEN_ACCESS || user.agreementAcceptedAt !== null,
    profileStatus: user.profileStatus,
    isAdmin,
  };
}

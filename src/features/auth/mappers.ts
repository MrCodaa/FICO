import type { ProfileStatus } from "@/generated/prisma/client";

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
    emailVerified: user.emailVerifiedAt !== null,
    agreementAccepted: user.agreementAcceptedAt !== null,
    profileStatus: user.profileStatus,
    isAdmin,
  };
}

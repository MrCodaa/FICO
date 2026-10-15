import { toProfileCard, type ProfileCard } from "@/features/discover/mappers";
import type { ProfileRecord } from "@/features/profile/repository";
import type { NotificationType } from "@/generated/prisma/client";

export interface NotificationView {
  id: string;
  type: NotificationType;
  actor: ProfileCard | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationRow {
  id: string;
  type: NotificationType;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export function toNotificationView(notification: NotificationRow, actorProfile: ProfileRecord | null, now: Date): NotificationView {
  return {
    id: notification.id,
    type: notification.type,
    actor: actorProfile ? toProfileCard(actorProfile, now) : null,
    entityId: notification.entityId,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

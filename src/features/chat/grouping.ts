export interface GroupableMessage {
  id: string;
  senderId: string;
  createdAt: string;
}

export interface MessageGroup<T extends GroupableMessage> {
  senderId: string;
  messages: T[];
}

export type ChatBlock<T extends GroupableMessage> =
  | { kind: "day"; key: string; date: Date }
  | { kind: "group"; key: string; group: MessageGroup<T> };

/** Poruke istog pošiljaoca u razmaku do ovoliko ms idu u jedan blok. */
export const GROUP_GAP_MS = 5 * 60 * 1000;

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Razdjelnici dana + grupe uzastopnih poruka istog pošiljaoca (isti dan,
 * razmak ≤ GROUP_GAP_MS). Ulaz mora biti sortiran rastuće po vremenu.
 */
export function buildChatBlocks<T extends GroupableMessage>(messages: T[]): ChatBlock<T>[] {
  const blocks: ChatBlock<T>[] = [];
  let currentDay = "";
  let current: MessageGroup<T> | null = null;
  let lastTime = 0;

  for (const message of messages) {
    const date = new Date(message.createdAt);
    const time = date.getTime();
    const key = dayKey(date);

    if (key !== currentDay) {
      currentDay = key;
      current = null;
      blocks.push({ kind: "day", key: `day-${key}`, date });
    }

    if (current && current.senderId === message.senderId && time - lastTime <= GROUP_GAP_MS) {
      current.messages.push(message);
    } else {
      current = { senderId: message.senderId, messages: [message] };
      blocks.push({ kind: "group", key: `group-${message.id}`, group: current });
    }
    lastTime = time;
  }
  return blocks;
}

/** "Danas", "Jučer" ili datum; `labels` dolaze iz content/sr.ts. */
export function dayLabel(
  date: Date,
  now: Date,
  labels: { today: string; yesterday: string },
  locale = "sr-Latn",
): string {
  const key = dayKey(date);
  if (key === dayKey(now)) return labels.today;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key === dayKey(yesterday)) return labels.yesterday;
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

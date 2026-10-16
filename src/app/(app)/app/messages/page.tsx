import { sr } from "@/content/sr";

export default function MessagesPage() {
  return (
    <div className="text-muted-foreground flex h-full items-center justify-center p-10 text-lg">
      {sr.chat.selectConversation}
    </div>
  );
}

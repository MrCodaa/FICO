import { sr } from "@/content/sr";

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{sr.misc.faq.title}</h1>
        <p className="text-muted-foreground text-sm">{sr.misc.faq.placeholder}</p>
      </div>
    </div>
  );
}

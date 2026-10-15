import { sr } from "@/content/sr";

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{sr.misc.help.title}</h1>
        <p className="text-muted-foreground text-sm">{sr.misc.help.placeholder}</p>
      </div>
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

// Kartice kao na YC-u: bijela pozadina, tanak sivi okvir, bez sjenke.

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("bg-card text-card-foreground flex flex-col gap-5 rounded-md border p-6 md:p-8", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 data-slot="card-title" className={cn("text-xl font-semibold tracking-tight", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("flex flex-col gap-4", className)} {...props} />;
}

/** Kartica sa bež zaglavljem (sekcije profila, koraci "Moj profil"). */
function SectionCard({
  title,
  className,
  bodyClassName,
  children,
}: {
  title: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section data-slot="section-card" className={cn("bg-card overflow-hidden rounded-md border", className)}>
      <div className="bg-beige border-beige-border border-b px-6 py-5 md:px-8">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
      </div>
      <div className={cn("flex flex-col gap-7 px-6 py-6 md:px-10 md:py-8", bodyClassName)}>{children}</div>
    </section>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, SectionCard };

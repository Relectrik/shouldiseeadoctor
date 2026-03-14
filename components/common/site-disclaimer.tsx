import { ShieldAlert } from "lucide-react";

export function SiteDisclaimer() {
  return (
    <div className="border-b border-border bg-secondary/70">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2 text-sm text-foreground">
        <ShieldAlert className="h-4 w-4 text-accent" />
        <p className="leading-relaxed">
          This tool provides educational guidance only and does not provide medical diagnoses.
        </p>
      </div>
    </div>
  );
}

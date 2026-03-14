import { ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function DisclaimerBanner() {
  return (
    <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] p-4 text-foreground">
      <div className="mb-2 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-accent" />
        <Badge variant="warning">Educational Guidance Only</Badge>
      </div>
      <p className="text-sm leading-relaxed">
        This tool provides educational guidance only and does not provide medical diagnoses.
      </p>
    </div>
  );
}

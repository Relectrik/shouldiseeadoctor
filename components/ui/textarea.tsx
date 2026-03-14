import * as React from "react";

import { cn } from "@/utils/cn";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[92px] w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm text-foreground shadow-[0_2px_10px_rgba(43,36,31,0.05)] placeholder:text-muted-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1a2540] dark:border-[#2a3a5c] dark:text-[#e8f0fe] dark:placeholder:text-[#8896b3]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };

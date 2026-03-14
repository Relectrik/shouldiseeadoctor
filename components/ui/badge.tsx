import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary/20 text-primary",
        success: "bg-[color-mix(in_srgb,var(--primary)_24%,transparent)] text-[color-mix(in_srgb,var(--primary)_88%,#2B241F)]",
        warning: "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[color-mix(in_srgb,var(--accent)_90%,#2B241F)]",
        danger:
          "bg-[color-mix(in_srgb,var(--destructive)_22%,transparent)] text-[color-mix(in_srgb,var(--destructive)_90%,#2B241F)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

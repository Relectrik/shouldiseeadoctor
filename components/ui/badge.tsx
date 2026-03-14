import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-[#e8f0fe] text-[#1e2d5a]",
        success: "bg-[#d1fae5] text-[#065f46]",
        warning: "bg-[#fef3c7] text-[#92400e]",
        danger: "bg-[#fde8e4] text-[#b03318]",
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

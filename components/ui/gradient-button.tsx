import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const gradientButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default: "gradient-button text-white",
        variant: "gradient-button-variant text-white",
        secondary:
          "border border-[#e2e6f0] bg-[#e8f0fe] text-[#1e2d5a] hover:bg-[#dbe8fd] shadow-none dark:border-[#2a3a5c] dark:bg-[#1e2d5a] dark:text-[#e8f0fe] dark:hover:bg-[#253868]",
        ghost: "text-foreground hover:bg-muted shadow-none",
        success: "gradient-button-success text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
GradientButton.displayName = "GradientButton";

export { GradientButton, gradientButtonVariants };
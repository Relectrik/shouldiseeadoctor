import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";

import { cn } from "@/utils/cn";

const gradientButtonVariants = cva(
  "group relative inline-flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-full border font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default:
          "border-border bg-background text-foreground [&_.interactive-fill]:bg-primary [&_.interactive-hover]:text-primary-foreground",
        variant:
          "border-border bg-background text-foreground [&_.interactive-fill]:bg-primary [&_.interactive-hover]:text-primary-foreground",
        secondary:
          "border-[#e2e6f0] bg-[#e8f0fe] text-[#1e2d5a] dark:border-[#2a3a5c] dark:bg-[#1e2d5a] dark:text-[#e8f0fe] [&_.interactive-fill]:bg-[#1e2d5a] dark:[&_.interactive-fill]:bg-[#e8543a] [&_.interactive-hover]:text-white",
        ghost:
          "border-border bg-transparent text-foreground [&_.interactive-fill]:bg-muted [&_.interactive-hover]:text-foreground",
        success:
          "border-[#065f46]/40 bg-background text-[#065f46] dark:text-[#a7f3d0] [&_.interactive-fill]:bg-[#065f46] [&_.interactive-hover]:text-white",
      },
      size: {
        default: "h-10 min-w-80 px-4 py-2 text-sm",
        sm: "h-9 min-w-[30.5rem] px-3 py-2 text-xs",
        lg: "h-11 min-w-[18.5rem] px-6 py-2 text-base",
        icon: "h-10 w-10 min-w-10 p-2",
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
  text?: string;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node).trim();
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join(" ").trim();
  }
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, text, children, ...props }, ref) => {
    const label = ((text ?? extractText(children)) || "Button").trim();
    return (
      <button
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span className="relative z-20 inline-flex translate-x-1 items-center gap-2 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children ?? label}
        </span>
        <span className="interactive-hover pointer-events-none absolute inset-0 z-20 inline-flex translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100">
          <span>{label}</span>
          <ArrowRight className="h-4 w-4" />
        </span>
        <span className="interactive-fill pointer-events-none absolute left-[20%] top-[40%] z-10 h-2 w-2 scale-[1] rounded-lg transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8]" />
      </button>
    );
  },
);
GradientButton.displayName = "GradientButton";

export { GradientButton, gradientButtonVariants };
"use client";

import Link from "next/link";
import { useAnimate } from "framer-motion";

interface QuickActionLink {
  title: string;
  description: string;
  href: string;
}

const quickActionLinks: QuickActionLink[] = [
  {
    title: "Check Symptoms",
    description: "Run triage and see care recommendations.",
    href: "/symptom-check",
  },
  {
    title: "Upload Medical Bill",
    description: "Analyze potentially inflated charges locally.",
    href: "/bill-analyzer",
  },
  {
    title: "View Insurance Options",
    description: "See plans you may qualify for.",
    href: "/insurance",
  },
  {
    title: "Update Profile",
    description: "Edit eligibility information.",
    href: "/profile",
  },
];

const NO_CLIP = "polygon(0 0, 100% 0, 100% 100%, 0% 100%)";
const BOTTOM_RIGHT_CLIP = "polygon(0 0, 100% 0, 0 0, 0% 100%)";
const TOP_RIGHT_CLIP = "polygon(0 0, 0 100%, 100% 100%, 0% 100%)";
const BOTTOM_LEFT_CLIP = "polygon(100% 100%, 100% 0, 100% 100%, 0 100%)";
const TOP_LEFT_CLIP = "polygon(0 0, 100% 0, 100% 100%, 100% 0)";

const ENTRANCE_KEYFRAMES = {
  left: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  bottom: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  top: [BOTTOM_RIGHT_CLIP, NO_CLIP],
  right: [TOP_LEFT_CLIP, NO_CLIP],
} as const;

const EXIT_KEYFRAMES = {
  left: [NO_CLIP, TOP_RIGHT_CLIP],
  bottom: [NO_CLIP, TOP_RIGHT_CLIP],
  top: [NO_CLIP, TOP_RIGHT_CLIP],
  right: [NO_CLIP, BOTTOM_LEFT_CLIP],
} as const;

type Side = keyof typeof ENTRANCE_KEYFRAMES;

function rowChunks(items: QuickActionLink[], size: number): QuickActionLink[][] {
  const rows: QuickActionLink[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function LinkBox({ title, description, href }: QuickActionLink) {
  const [scope, animate] = useAnimate();

  const getNearestSide = (event: React.MouseEvent<HTMLAnchorElement>): Side => {
    const box = event.currentTarget.getBoundingClientRect();

    const proximityToLeft = {
      proximity: Math.abs(box.left - event.clientX),
      side: "left" as const,
    };
    const proximityToRight = {
      proximity: Math.abs(box.right - event.clientX),
      side: "right" as const,
    };
    const proximityToTop = {
      proximity: Math.abs(box.top - event.clientY),
      side: "top" as const,
    };
    const proximityToBottom = {
      proximity: Math.abs(box.bottom - event.clientY),
      side: "bottom" as const,
    };

    const sortedProximity = [proximityToLeft, proximityToRight, proximityToTop, proximityToBottom].sort(
      (a, b) => a.proximity - b.proximity,
    );

    return sortedProximity[0].side;
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const side = getNearestSide(event);
    animate(
      scope.current,
      {
        clipPath: ENTRANCE_KEYFRAMES[side],
      },
      { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
    );
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const side = getNearestSide(event);
    animate(
      scope.current,
      {
        clipPath: EXIT_KEYFRAMES[side],
      },
      { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
    );
  };

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex min-h-28 w-full flex-col justify-center bg-background p-5 text-foreground sm:min-h-32"
    >
      <p className="text-base font-semibold tracking-tight">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div
        ref={scope}
        style={{ clipPath: BOTTOM_RIGHT_CLIP }}
        className="absolute inset-0 flex flex-col justify-center bg-primary p-5 text-primary-foreground"
      >
        <p className="text-base font-semibold tracking-tight">{title}</p>
        <p className="mt-1 text-sm text-primary-foreground/85">{description}</p>
      </div>
    </Link>
  );
}

export function ClipPathLinks() {
  const rows = rowChunks(quickActionLinks, 2);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
      {rows.map((row, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0"
        >
          {row.map((item) => (
            <LinkBox key={item.href} {...item} />
          ))}
        </div>
      ))}
    </div>
  );
}

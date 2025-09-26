"use client";
import clsx from "clsx";
import { ToolBadge } from "@/app/learning/types";

type BadgeType = ToolBadge["type"];

interface BadgeProps {
  type: BadgeType;
  label?: string;
  className?: string;
  showDot?: boolean;      // If true: dot-only mode (no pill, no text)
  dotClassName?: string;
  title?: string;
}

const BADGE_STYLES: Record<
  BadgeType,
  {
    defaultLabel: string;
    textClass: string;
    bgClass: string;
    dotClass: string;
    borderClass?: string;
  }
> = {
  new: {
    defaultLabel: "New",
    textClass: "text-white",
    bgClass: "bg-tertiary-green-500",
    dotClass: "bg-tertiary-green-500",
  },
  "up next": {
    defaultLabel: "Up Next",
    textClass: "text-tertiary-vivid-blue-500",
    bgClass: "bg-tertiary-vivid-blue-100",
    dotClass: "bg-tertiary-vivid-blue-500",
  },
  "unlock soon": {
    defaultLabel: "Unlock Soon",
    textClass: "text-primary-way-100",
    bgClass: "bg-primary-way-10",
    dotClass: "bg-primary-way-100",
  },
};

export function Badge({
  type,
  label,
  className,
  showDot = false,
  dotClassName,
  title,
}: BadgeProps) {
  const style = BADGE_STYLES[type];
  const finalLabel = label || style.defaultLabel;
  const accessibleTitle = title || finalLabel;

  // Dot-only mode
  if (showDot) {
    return (
      <span
        className={clsx(
          "inline-block align-middle w-2 h-2 ml-1 rounded-full",
          style.dotClass,
          dotClassName
        )}
        aria-label={finalLabel}
        role="status"
        title={accessibleTitle}
      />
    );
  }

  // Pill mode (no dot)
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-3 py-1 text-xs font-medium select-none",
        style.bgClass,
        style.textClass,
        style.borderClass,
        className
      )}
      aria-label={finalLabel}
      title={accessibleTitle}
    >
      {finalLabel}
    </span>
  );
}
import { gradeStyle } from "../../lib/grade";

interface GradeBadgeProps {
  grade: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const SIZE = {
  xs: "px-1 py-px text-[11px] rounded",
  sm: "px-1.5 py-0.5 text-xs rounded-md",
  md: "px-2 py-0.5 text-sm rounded-md",
} as const;

/**
 * A grade as a pill: tinted background, solid text, colour from the shared
 * ramp. The same component on both sides of the site, so an "S" looks the
 * same whether it belongs to a relic or an artifact.
 */
export function GradeBadge({ grade, size = "sm", className = "" }: GradeBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center font-mono font-bold leading-tight tabular-nums ${SIZE[size]} ${className}`}
      style={gradeStyle(grade)}
    >
      {grade}
    </span>
  );
}

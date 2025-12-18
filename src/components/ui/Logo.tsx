import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-12 h-12", className)}
    >
      {/* Base: The Chip / Card */}
      <rect x="15" y="15" width="70" height="70" rx="12" fill="#1A1A1A" />

      {/* The Engram "E" Stack */}
      {/* Top Line: Existing Knowledge */}
      <rect x="30" y="35" width="40" height="6" rx="3" fill="white" />

      {/* Middle Line: The Spark / The Engram (Active Memory) */}
      <rect x="30" y="47" width="28" height="6" rx="3" fill="#EA580C" />

      {/* Bottom Line: Consolidation */}
      <rect x="30" y="59" width="40" height="6" rx="3" fill="white" />
    </svg>
  );
}


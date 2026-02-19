import { cn } from "@/lib/utils";

export function SierraLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
    >
      {/* Abstract Mountain/S shape */}
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M3 16l5-5c.928-.888 2.378-.888 3.308 0l3.387 3.29c.929.89 2.38.89 3.308.003L21 8" />
    </svg>
  );
}

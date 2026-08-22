import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground"
      >
        360
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          ABILITY<span className="text-teal">360</span>
        </span>
      )}
    </span>
  );
}

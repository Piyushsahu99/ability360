import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="flex size-9 rotate-12 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-teal shadow-lg shadow-primary/20"
      >
        <span className="-rotate-12 font-display text-lg font-extrabold text-primary-foreground">
          A
        </span>
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          ABILITY<span className="text-teal">360</span>
        </span>
      )}
    </span>
  );
}

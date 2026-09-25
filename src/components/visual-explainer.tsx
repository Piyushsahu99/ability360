import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ArrowDown, ArrowRight, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { explainVisually, type VisualExplanation } from "@/lib/access-ai.functions";
import { cn } from "@/lib/utils";

/** AI-generated, keyboard-accessible interactive diagram with a text alternative. */
export function VisualExplainer({ concept, context }: { concept: string; context?: string }) {
  const run = useServerFn(explainVisually);
  const [active, setActive] = useState(0);
  const mutation = useMutation({
    mutationFn: () => run({ data: { concept, context: context?.slice(0, 4000) } }),
    onSuccess: () => setActive(0),
  });
  const data = mutation.data as VisualExplanation | undefined;

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4">
        <Button variant="outline" className="min-h-11" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          {mutation.isPending ? "Building a visual…" : "Explain visually"}
        </Button>
        {mutation.isError && (
          <p role="alert" className="mt-2 text-sm text-destructive">{(mutation.error as Error).message}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Creates an interactive diagram of this topic with AI. Always check important facts.</p>
      </div>
    );
  }

  const node = data.nodes[active];
  const Arrow = data.layout === "layers" ? ArrowDown : ArrowRight;

  return (
    <figure className="rounded-xl border border-border bg-card p-4" aria-labelledby="visual-title">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 id="visual-title" className="font-semibold">{data.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{data.summary}</p>
        </div>
        <Button variant="ghost" size="icon" className="size-11 shrink-0" aria-label="Regenerate visual" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          <RefreshCw className={cn("size-4", mutation.isPending && "animate-spin")} aria-hidden="true" />
        </Button>
      </div>
      <div
        role="tablist"
        aria-label={`${data.title} steps`}
        className={cn(
          "mt-4 flex gap-2",
          data.layout === "layers" ? "flex-col" : "flex-col sm:flex-row sm:flex-wrap sm:items-center",
        )}
        onKeyDown={(e) => {
          if (["ArrowRight", "ArrowDown"].includes(e.key)) setActive((i) => (i + 1) % data.nodes.length);
          if (["ArrowLeft", "ArrowUp"].includes(e.key)) setActive((i) => (i - 1 + data.nodes.length) % data.nodes.length);
        }}
      >
        {data.nodes.map((n, i) => (
          <div key={n.label + i} className={cn("flex items-center gap-2", data.layout === "layers" && "w-full")}>
            <button
              role="tab"
              type="button"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "min-h-11 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                data.layout === "layers" && "w-full",
                i === active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-primary/50",
              )}
              style={data.layout === "layers" ? { marginLeft: `${i * 0.75}rem` } : undefined}
            >
              <span className="mr-1.5 text-xs opacity-75">{i + 1}.</span>
              {n.label}
            </button>
            {i < data.nodes.length - 1 && data.layout !== "layers" && (
              <Arrow className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
            )}
          </div>
        ))}
        {data.layout === "cycle" && <p className="text-xs text-muted-foreground">↺ then repeats from step 1</p>}
      </div>
      {node && (
        <div role="tabpanel" aria-live="polite" className="mt-4 rounded-lg bg-surface p-3 text-sm">
          <p className="font-medium">{node.label}</p>
          <p className="mt-1">{node.detail}</p>
        </div>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Text version</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {data.nodes.map((n, i) => (
            <li key={i}><strong>{n.label}:</strong> {n.detail}</li>
          ))}
        </ol>
      </details>
    </figure>
  );
}

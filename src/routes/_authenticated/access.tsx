import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Lock, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  accessDnaQueryOptions,
  barrierLibrary,
  deleteBarrier,
  dnaSections,
  emptyDna,
  matchBarriers,
  saveAccessDna,
  saveBarrier,
  savedBarriersQueryOptions,
  sharingLabels,
  type AccessDna,
  type DnaSection,
  type SharingLevel,
  type SupportState,
} from "@/lib/access";
import { suggestSupports } from "@/lib/access-ai.functions";
import { studentNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/access")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Accessibility DNA — ABILITY360 ACCESS" },
      { name: "description", content: "Tell ABILITY360 how you learn, communicate and work best — privately, with no diagnosis required." },
      { property: "og:title", content: "Accessibility DNA — ABILITY360 ACCESS" },
      { property: "og:description", content: "Make the platform adapt to the student, not the other way round." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccessPage,
});

function AccessPage() {
  return (
    <DashboardShell
      role="student"
      title="Accessibility DNA"
      subtitle="Don't adapt to the platform — let the platform adapt to you."
      nav={studentNav("/access")}
    >
      <div className="rounded-xl border border-border bg-primary-soft p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-primary">
          <Lock className="size-4" aria-hidden="true" /> Everything here is optional and private by default.
        </p>
        <p className="mt-1 text-foreground">
          You never need to share a diagnosis or disability category. Describe how you learn, communicate and work
          best, and choose exactly who can see each section.
        </p>
      </div>
      <DnaEditor />
      <BarrierEngine />
    </DashboardShell>
  );
}

function DnaEditor() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(accessDnaQueryOptions);
  const [dna, setDna] = useState<AccessDna>(emptyDna);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) setDna(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveAccessDna(dna),
    onSuccess: () => {
      toast.success("Accessibility DNA saved");
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["access"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggle(section: DnaSection, key: string, on: boolean) {
    setDna((d) => ({ ...d, [section]: on ? [...d[section], key] : d[section].filter((k) => k !== key) }));
    setDirty(true);
  }

  if (isPending) return <Skeleton className="h-96 w-full" />;

  const effects = dnaSections.flatMap((s) => s.options.filter((o) => dna[s.key].includes(o.key)).map((o) => ({ ...o, section: s.title })));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        {dnaSections.map((section) => (
          <PanelCard key={section.key} title={section.title} description={section.description}>
            <fieldset>
              <legend className="sr-only">{section.title} preferences</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {section.options.map((o) => (
                  <label key={o.key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                    <Checkbox checked={dna[section.key].includes(o.key)} onCheckedChange={(c) => toggle(section.key, o.key, c === true)} />
                    <span className="text-sm">{o.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-3 max-w-sm">
              <Label htmlFor={`share-${section.key}`} className="text-xs">Who can see this section?</Label>
              <Select
                value={dna.sharing[section.key] ?? "private"}
                onValueChange={(v) => {
                  setDna((d) => ({ ...d, sharing: { ...d.sharing, [section.key]: v as SharingLevel } }));
                  setDirty(true);
                }}
              >
                <SelectTrigger id={`share-${section.key}`} className="mt-1 min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(sharingLabels) as SharingLevel[]).map((k) => (
                    <SelectItem key={k} value={k}>{sharingLabels[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PanelCard>
        ))}
        <div className="sticky bottom-20 z-10 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
          <Button className="min-h-11" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : dirty ? "Save preferences" : "Saved"}
          </Button>
          <Button variant="outline" className="min-h-11" onClick={() => { setDna({ ...emptyDna }); setDirty(true); }}>
            Clear all
          </Button>
        </div>
      </div>

      <aside aria-label="Preview of your experience" className="lg:sticky lg:top-4 lg:self-start">
        <PanelCard title="How ABILITY360 adapts" description="A live preview of what changes for you.">
          {effects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Choose any preference to see how the platform will adapt.</p>
          ) : (
            <ul className="space-y-2 text-sm" aria-live="polite">
              {effects.map((e) => (
                <li key={e.section + e.key} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
                  <span><strong className="font-medium">{e.label}:</strong> {e.effect}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 space-y-1 text-xs text-muted-foreground">
            {dnaSections.map((s) => (
              <p key={s.key}>{s.title}: <span className="font-medium text-foreground">{sharingLabels[dna.sharing[s.key] ?? "private"]}</span></p>
            ))}
          </div>
          <Button asChild variant="link" className="mt-2 px-0"><Link to="/opportunities">See AccessMatch on opportunities</Link></Button>
        </PanelCard>
      </aside>
    </div>
  );
}

function BarrierEngine() {
  const queryClient = useQueryClient();
  const suggestFn = useServerFn(suggestSupports);
  const { data: saved, isPending } = useQuery(savedBarriersQueryOptions);
  const [barrier, setBarrier] = useState("");
  const [supports, setSupports] = useState<SupportState[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [custom, setCustom] = useState("");

  function suggestFromRules(text: string) {
    const found = matchBarriers(text);
    const list = Array.from(new Set(found.flatMap((b) => b.supports)));
    setSupports(list.map((label) => ({ label, state: "suggested" })));
    return list.length;
  }

  const ai = useMutation({
    mutationFn: () => suggestFn({ data: { barrier } }),
    onSuccess: (res) => {
      const existing = new Set(supports.map((s) => s.label.toLowerCase()));
      const extra = res.supports.filter((s) => !existing.has(s.toLowerCase())).map((label) => ({ label, state: "suggested" as const }));
      setSupports((s) => [...s, ...extra]);
      if (extra.length === 0) toast.info("No new suggestions — try describing the barrier differently.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: () => saveBarrier(barrier, supports.filter((s) => s.state !== "suggested")),
    onSuccess: () => {
      toast.success("Saved to your supports");
      setBarrier("");
      setSupports([]);
      void queryClient.invalidateQueries({ queryKey: ["access", "barriers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: deleteBarrier,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["access", "barriers"] }),
  });

  const setState = (i: number, state: SupportState["state"]) =>
    setSupports((list) => list.map((s, idx) => (idx === i ? { ...s, state } : s)));

  return (
    <PanelCard
      title="Remove a Barrier"
      description="Describe something that gets in your way. We suggest participation supports — suggestions only, not medical advice."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" aria-label="Common barriers">
          {barrierLibrary.map((b) => (
            <Button key={b.id} type="button" variant="outline" size="sm" className="min-h-11 whitespace-normal text-left" onClick={() => { setBarrier(b.barrier); suggestFromRules(b.barrier); }}>
              {b.barrier}
            </Button>
          ))}
        </div>
        <div>
          <Label htmlFor="barrier-text">Or describe it in your own words</Label>
          <Textarea id="barrier-text" rows={2} maxLength={500} className="mt-1.5" value={barrier} onChange={(e) => setBarrier(e.target.value)} placeholder="e.g. I can't take phone calls easily" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" className="min-h-11" disabled={barrier.trim().length < 3} onClick={() => { if (suggestFromRules(barrier) === 0) ai.mutate(); }}>
              Suggest supports
            </Button>
            <Button type="button" variant="outline" className="min-h-11" disabled={barrier.trim().length < 3 || ai.isPending} onClick={() => ai.mutate()}>
              {ai.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
              More ideas with AI
            </Button>
          </div>
        </div>

        {supports.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Suggested supports</h3>
            <ul className="mt-2 space-y-2">
              {supports.map((s, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
                  {editing === i ? (
                    <Input aria-label="Edit support" className="min-h-11 flex-1" value={s.label} maxLength={160}
                      onChange={(e) => setSupports((l) => l.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                      onBlur={() => setEditing(null)} autoFocus />
                  ) : (
                    <span className={`flex-1 text-sm ${s.state === "rejected" ? "text-muted-foreground line-through" : ""}`}>{s.label}</span>
                  )}
                  {s.state !== "suggested" && <Badge variant="outline">{s.state === "accepted" ? "Accepted" : "Rejected"}</Badge>}
                  <Button size="icon" variant="ghost" className="size-11" aria-label={`Accept ${s.label}`} onClick={() => setState(i, "accepted")}><Check className="size-4" aria-hidden="true" /></Button>
                  <Button size="icon" variant="ghost" className="size-11" aria-label={`Edit ${s.label}`} onClick={() => setEditing(i)}><Pencil className="size-4" aria-hidden="true" /></Button>
                  <Button size="icon" variant="ghost" className="size-11" aria-label={`Reject ${s.label}`} onClick={() => setState(i, "rejected")}><X className="size-4" aria-hidden="true" /></Button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input aria-label="Add your own support" className="min-h-11" value={custom} maxLength={160} onChange={(e) => setCustom(e.target.value)} placeholder="Add your own support" />
              <Button variant="outline" className="min-h-11" disabled={!custom.trim()} onClick={() => { setSupports((l) => [...l, { label: custom.trim(), state: "accepted" }]); setCustom(""); }}>Add</Button>
            </div>
            <Button className="mt-3 min-h-11" disabled={save.isPending || !supports.some((s) => s.state === "accepted")} onClick={() => save.mutate()}>
              Save accepted supports
            </Button>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold">My saved supports</h3>
          {isPending ? <Skeleton className="mt-2 h-16" /> : (saved ?? []).length === 0 ? (
            <div className="mt-2"><EmptyState message="Nothing saved yet. Accepted supports can be used in accommodation requests." /></div>
          ) : (
            <ul className="mt-2 space-y-2">
              {(saved ?? []).map((b) => (
                <li key={b.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{b.barrier}</p>
                    <Button size="icon" variant="ghost" className="size-11 shrink-0" aria-label="Delete saved barrier" onClick={() => remove.mutate(b.id)}><Trash2 className="size-4" aria-hidden="true" /></Button>
                  </div>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {((b.supports ?? []) as SupportState[]).filter((s) => s.state === "accepted").map((s) => (
                      <li key={s.label}><Badge variant="secondary" className="font-normal">{s.label}</Badge></li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PanelCard>
  );
}

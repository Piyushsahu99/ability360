import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, PanelCard } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { employerFeatures, myEmployerAccessQueryOptions, saveEmployerAccess } from "@/lib/access";
import { companyProfileQueryOptions } from "@/lib/employer";
import { employerNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/employer/accessibility")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Employer Accessibility Profile — ABILITY360" },
      { name: "description", content: "Tell candidates exactly which accessibility features and accommodations your company confirms." },
      { property: "og:title", content: "Employer Accessibility Profile — ABILITY360" },
      { property: "og:description", content: "Confirmed accessibility information, clearly shown to candidates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployerAccessibilityPage,
});

function EmployerAccessibilityPage() {
  const queryClient = useQueryClient();
  const { data: company } = useQuery(companyProfileQueryOptions);
  const { data, isPending } = useQuery(myEmployerAccessQueryOptions);
  const [features, setFeatures] = useState<string[]>([]);
  const [contact, setContact] = useState("");
  const [process, setProcess] = useState("");

  useEffect(() => {
    if (!data) return;
    setFeatures(data.features);
    setContact(data.accessibility_contact ?? "");
    setProcess(data.accommodation_process ?? "");
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveEmployerAccess({ features, accessibility_contact: contact, accommodation_process: process }),
    onSuccess: () => {
      toast.success("Accessibility profile saved");
      void queryClient.invalidateQueries({ queryKey: ["access", "employer"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const missing = employerFeatures.filter((f) => !features.includes(f.key));

  return (
    <DashboardShell role="industry" title="Employer Accessibility Profile" subtitle="Confirmed information helps candidates decide with confidence." nav={employerNav("/employer/accessibility")}>
      {!company ? (
        <PanelCard title="Create your company profile first" description="Your accessibility profile is attached to your company.">
          <Button asChild className="min-h-11"><a href="/employer/company">Open company profile</a></Button>
        </PanelCard>
      ) : isPending ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
            <PanelCard title="Confirmed accessibility features" description="Only tick what you can genuinely offer. Unticked items are shown to candidates as “information unavailable”, never as “no”.">
              <fieldset>
                <legend className="sr-only">Accessibility features</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {employerFeatures.map((f) => (
                    <label key={f.key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                      <Checkbox checked={features.includes(f.key)} onCheckedChange={(c) => setFeatures((l) => (c === true ? [...l, f.key] : l.filter((k) => k !== f.key)))} />
                      <span className="text-sm">{f.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </PanelCard>
            <PanelCard title="Accommodation support" description="How candidates can request support.">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="acc-contact">Accessibility contact (team or role)</Label>
                  <Input id="acc-contact" className="mt-1.5 min-h-11" maxLength={160} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. HR Inclusion team — reachable via ABILITY360 messages" />
                  <p className="mt-1 text-xs text-muted-foreground">Please don't enter personal emails or phone numbers — candidates contact you through ABILITY360.</p>
                </div>
                <div>
                  <Label htmlFor="acc-process">Accommodation request process</Label>
                  <Textarea id="acc-process" rows={4} className="mt-1.5" maxLength={1200} value={process} onChange={(e) => setProcess(e.target.value)} placeholder="e.g. Candidates can request support with their application; we reply within 2 working days." />
                </div>
              </div>
            </PanelCard>
            <Button type="submit" className="min-h-11" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save accessibility profile"}</Button>
          </form>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <PanelCard title="What candidates see" description="No score — just facts.">
              <div className="space-y-3 text-sm">
                <div>
                  <h3 className="text-xs font-semibold">Confirmed ({features.length})</h3>
                  <ul className="mt-1 space-y-1">
                    {employerFeatures.filter((f) => features.includes(f.key)).map((f) => (
                      <li key={f.key} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 text-teal" aria-hidden="true" />{f.label}</li>
                    ))}
                  </ul>
                </div>
                <p><span className="text-xs font-semibold">Accommodation support: </span>{process ? "Available" : "Not described yet"}</p>
                <p><span className="text-xs font-semibold">Accessibility contact: </span>{contact || "Not provided"}</p>
              </div>
            </PanelCard>
            <PanelCard title="Improve your accessibility information" description="Missing items candidates may ask about.">
              {missing.length === 0 && contact && process ? (
                <p className="text-sm text-teal">Every item is covered. Thank you.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {missing.map((f) => <li key={f.key} className="flex gap-2"><CircleDashed className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />{f.label}</li>)}
                  {!contact && <li className="flex gap-2"><CircleDashed className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />Accessibility contact</li>}
                  {!process && <li className="flex gap-2"><CircleDashed className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />Accommodation request process</li>}
                </ul>
              )}
            </PanelCard>
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}

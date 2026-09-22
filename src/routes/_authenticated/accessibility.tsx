import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Accessibility,
  BadgeCheck,
  ExternalLink,
  HeartHandshake,
  LifeBuoy,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, PanelCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  accessibilityPrefsQueryOptions,
  defaultPrefs,
  interviewTips,
  prefFields,
  saveAccessibilityPrefs,
  supportResources,
  type AccessibilityPrefs,
} from "@/lib/accessibility";
import { formatDeadline, opportunitiesQueryOptions, opportunityTypeLabels } from "@/lib/opportunities";
import { studentNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/accessibility")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Accessibility & Divyangjan support — ABILITY360" },
      {
        name: "description",
        content:
          "Set your accommodations, find inclusive employers and access Divyangjan scholarships, schemes and rights in one place.",
      },
      { property: "og:title", content: "Accessibility & Divyangjan support — ABILITY360" },
      {
        property: "og:description",
        content: "Accommodations, inclusive hiring and Divyangjan schemes for Indian college students.",
      },
    ],
  }),
  component: AccessibilityHub,
});

function AccessibilityHub() {
  const queryClient = useQueryClient();
  const { data: saved, isPending } = useQuery(accessibilityPrefsQueryOptions);
  const { data: opportunities } = useQuery(opportunitiesQueryOptions);
  const [values, setValues] = useState<AccessibilityPrefs>(defaultPrefs);

  useEffect(() => {
    if (saved) setValues(saved);
  }, [saved]);

  const mutation = useMutation({
    mutationFn: saveAccessibilityPrefs,
    onSuccess: () => {
      toast.success("Accessibility preferences saved");
      queryClient.invalidateQueries({ queryKey: ["accessibility"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const inclusive = (opportunities ?? []).filter((item) => item.is_inclusive_employer);
  const activeCount = prefFields.filter((field) => values[field.key]).length;

  return (
    <DashboardShell
      role="student"
      title="Accessibility & Divyangjan support"
      subtitle="Tell us how the platform should adapt, and find employers who are ready for you."
      nav={studentNav("/accessibility")}
    >
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="flex items-start gap-3 text-sm text-muted-foreground">
          <HeartHandshake className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            We never ask you to disclose a disability or upload a medical record. Share only the
            adjustments you want, and we will use them to shape the app and the opportunities you see.
            You can change or clear them at any time.
          </span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelCard
            title="Your accommodations"
            description={`${activeCount} of ${prefFields.length} selected — private to you.`}
          >
            {isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  mutation.mutate(values);
                }}
              >
                <ul className="grid gap-4 sm:grid-cols-2">
                  {prefFields.map((field) => (
                    <li
                      key={field.key}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div>
                        <Label htmlFor={`pref-${field.key}`} className="text-sm">
                          {field.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{field.hint}</p>
                      </div>
                      <Switch
                        id={`pref-${field.key}`}
                        checked={values[field.key]}
                        onCheckedChange={(checked) =>
                          setValues((prev) => ({ ...prev, [field.key]: checked }))
                        }
                      />
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  <Label htmlFor="other-accommodation">Anything else we should know?</Label>
                  <Textarea
                    id="other-accommodation"
                    className="mt-2"
                    rows={3}
                    maxLength={280}
                    placeholder="For example: I use a screen magnifier, or I need interview questions shared in advance."
                    value={values.other_accommodation ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, other_accommodation: event.target.value }))
                    }
                  />
                </div>

                <Button type="submit" className="mt-4 min-h-11" disabled={mutation.isPending}>
                  <Save className="size-4" aria-hidden="true" />
                  {mutation.isPending ? "Saving…" : "Save preferences"}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Looking for text size, contrast or motion controls? Use the accessibility button in the
                  bottom-right corner — those apply instantly on this device.
                </p>
              </form>
            )}
          </PanelCard>

          <PanelCard
            title="Inclusive employers hiring now"
            description="Roles where accommodations are documented up front."
          >
            {inclusive.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No inclusive roles are listed right now. Check back soon.
              </p>
            ) : (
              <ul className="space-y-3">
                {inclusive.map((item) => (
                  <li key={item.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">
                        {opportunityTypeLabels[item.type]}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <BadgeCheck className="size-3.5" aria-hidden="true" />
                        Inclusive employer
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.organisation} · {item.location} · Apply by {formatDeadline(item.deadline)}
                    </p>
                    {item.accessibility_features.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {item.accessibility_features.map((feature) => (
                          <li key={feature}>
                            <Badge variant="secondary" className="font-normal">
                              {feature}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.accessibility_note && (
                      <p className="mt-2 text-xs text-muted-foreground">{item.accessibility_note}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" className="mt-4 min-h-11">
              <Link to="/opportunities">Browse all opportunities</Link>
            </Button>
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard title="Schemes, rights & scholarships" description="Government support for Divyangjan students in India.">
            <ul className="space-y-4">
              {supportResources.map((resource) => (
                <li key={resource.title}>
                  <p className="text-sm font-medium">{resource.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{resource.body}</p>
                  {resource.href ? (
                    <a
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-4"
                      href={resource.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {resource.action}
                      <ExternalLink className="size-3" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  ) : (
                    <p className="mt-1 text-xs font-medium text-primary">{resource.action}</p>
                  )}
                </li>
              ))}
            </ul>
          </PanelCard>

          <PanelCard title="Interview & accommodation tips" description="Practical, disclosure-free guidance.">
            <ul className="space-y-3">
              {interviewTips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </PanelCard>

          <PanelCard
            title="Learn and practise, your way"
            description="Plain-language lessons and practice tests built for accessibility."
          >
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Learning library</span> — your rights
                under the RPwD Act, asking for exam accommodations, disclosure at work, assistive
                technology, resumes, interviews and more.
              </li>
              <li>
                <span className="font-medium text-foreground">Mock tests</span> — compensatory extra
                time, a pausable timer or no timer at all, and one question at a time.
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild className="min-h-11">
                <Link to="/learn">Open the learning library</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <Link to="/mock-tests">Take a mock test</Link>
              </Button>
            </div>
          </PanelCard>

          <PanelCard title="Need a human?" description="Support from your institution.">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <LifeBuoy className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Every institution on ABILITY360 has an accessibility coordinator. Save your
                accommodations above and mention them when you contact your placement cell.
              </span>
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Accessibility className="size-3.5" aria-hidden="true" />
              National helpline for persons with disabilities: 1800-11-1265
            </p>
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}

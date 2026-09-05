import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DashboardShell, PanelCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/lib/auth";
import {
  companyProfileCompleteness,
  companyProfileQueryOptions,
  companyProfileSchema,
  requestCompanyVerification,
  saveCompanyProfile,
  verificationHints,
  verificationLabels,
  verificationStatusOf,
  type CompanyProfileValues,
} from "@/lib/employer";
import { employerNav } from "@/lib/nav";


export const Route = createFileRoute("/_authenticated/employer/company")({
  head: () => ({
    meta: [
      { title: "Company profile — ABILITY360" },
      {
        name: "description",
        content: "Tell students who you are, what you build and how inclusive your workplace is.",
      },
      { property: "og:title", content: "Company profile — ABILITY360" },
      {
        property: "og:description",
        content: "Manage your employer identity on ABILITY360.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyProfilePage,
});

const emptyValues: CompanyProfileValues = {
  company_name: "",
  website: "",
  industry: "",
  company_size: "",
  headquarters: "",
  about: "",
  hiring_contact_email: "",
  is_inclusive_employer: false,
  accessibility_commitment: "",
};

function CompanyProfilePage() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const { data: profile, isPending } = useQuery(companyProfileQueryOptions);
  const [values, setValues] = useState<CompanyProfileValues>(emptyValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setValues({
        company_name: profile.company_name,
        website: profile.website ?? "",
        industry: profile.industry ?? "",
        company_size: profile.company_size ?? "",
        headquarters: profile.headquarters ?? "",
        about: profile.about ?? "",
        hiring_contact_email: profile.hiring_contact_email ?? "",
        is_inclusive_employer: profile.is_inclusive_employer,
        accessibility_commitment: profile.accessibility_commitment ?? "",
      });
    } else if (me?.fullName) {
      setValues((current) => ({ ...current, company_name: current.company_name }));
    }
  }, [profile, me?.fullName]);

  const mutation = useMutation({
    mutationFn: saveCompanyProfile,
    onSuccess: () => {
      toast.success("Company profile saved");
      void queryClient.invalidateQueries({ queryKey: ["employer", "company-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const verifyMutation = useMutation({
    mutationFn: requestCompanyVerification,
    onSuccess: () => {
      toast.success("Verification requested");
      void queryClient.invalidateQueries({ queryKey: ["employer", "company-profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });



  function set<K extends keyof CompanyProfileValues>(key: K, value: CompanyProfileValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = companyProfileSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  const completeness = companyProfileCompleteness(profile ?? null);
  const verification = verificationStatusOf(profile ?? null);

  return (
    <DashboardShell
      role="industry"
      title="Company profile"
      subtitle="Students see this before they apply. Keep it accurate and welcoming."
      nav={employerNav("/employer/company")}
    >
      <PanelCard
        title="Profile strength"
        description="Complete profiles get more qualified applications."
        action={
          <Badge variant={verification === "verified" ? "default" : "secondary"}>
            {verificationLabels[verification]}
          </Badge>
        }
      >
        <Progress value={completeness} aria-label="Company profile completeness" />
        <p className="mt-2 text-sm text-muted-foreground">{completeness}% complete</p>
        <p className="mt-4 text-sm text-muted-foreground">{verificationHints[verification]}</p>
        {profile && verification !== "verified" && verification !== "pending" && (
          <Button
            className="mt-4"
            variant="outline"
            disabled={verifyMutation.isPending || completeness < 60}
            onClick={() => verifyMutation.mutate()}
          >
            Request verification
          </Button>
        )}
        {profile && completeness < 60 && verification === "unverified" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Fill in at least 60% of your profile to request verification.
          </p>
        )}
      </PanelCard>


      <PanelCard title="Organisation details" description="Basic identity and hiring contact.">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <div className="sm:col-span-2">
            <Label htmlFor="company_name">Company name</Label>
            <Input
              id="company_name"
              value={values.company_name}
              onChange={(event) => set("company_name", event.target.value)}
              className="mt-1.5"
              disabled={isPending}
            />
            {errors["company_name"] && (
              <p className="mt-1 text-xs text-destructive">{errors["company_name"]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://example.com"
              value={values.website}
              onChange={(event) => set("website", event.target.value)}
              className="mt-1.5"
            />
            {errors["website"] && <p className="mt-1 text-xs text-destructive">{errors["website"]}</p>}
          </div>

          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="Software, manufacturing, healthcare…"
              value={values.industry}
              onChange={(event) => set("industry", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="company_size">Company size</Label>
            <Input
              id="company_size"
              placeholder="1-10, 11-50, 200+"
              value={values.company_size}
              onChange={(event) => set("company_size", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="headquarters">Headquarters</Label>
            <Input
              id="headquarters"
              placeholder="Bengaluru, India"
              value={values.headquarters}
              onChange={(event) => set("headquarters", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="hiring_contact_email">Hiring contact email</Label>
            <Input
              id="hiring_contact_email"
              type="email"
              value={values.hiring_contact_email}
              onChange={(event) => set("hiring_contact_email", event.target.value)}
              className="mt-1.5"
            />
            {errors["hiring_contact_email"] && (
              <p className="mt-1 text-xs text-destructive">{errors["hiring_contact_email"]}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="about">About the company</Label>
            <Textarea
              id="about"
              rows={4}
              value={values.about}
              onChange={(event) => set("about", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3 sm:col-span-2">
            <Switch
              id="inclusive"
              checked={values.is_inclusive_employer}
              onCheckedChange={(checked) => set("is_inclusive_employer", checked)}
            />
            <div>
              <Label htmlFor="inclusive">We are an inclusive employer</Label>
              <p className="text-xs text-muted-foreground">
                Shows an inclusive badge to students, including Divyangjan candidates.
              </p>
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="accessibility_commitment">Accessibility commitment</Label>
            <Textarea
              id="accessibility_commitment"
              rows={3}
              placeholder="Accessible offices, assistive tech budget, flexible schedules…"
              value={values.accessibility_commitment}
              onChange={(event) => set("accessibility_commitment", event.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save company profile"}
            </Button>
          </div>
        </form>
      </PanelCard>
    </DashboardShell>
  );
}

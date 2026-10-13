import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, GraduationCap, Loader2, School } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { EmailTakenDialog } from "@/components/email-taken-dialog";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPathByRole, meQueryOptions, signUpSchema, type SignUpValues } from "@/lib/auth";
import { institutionsQueryOptions } from "@/lib/onboarding";


export const Route = createFileRoute("/register")({
  staticData: { sitemap: false },
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const next = typeof search["next"] === "string" ? search["next"] : undefined;
    return next && next.startsWith("/") && !next.startsWith("//") ? { next } : {};
  },
  head: () => ({
    links: [{ rel: "canonical", href: "https://ability360.lovable.app/register" }],
    meta: [
      { property: "og:url", content: "https://ability360.lovable.app/register" },
      { title: "Create your account — ABILITY360" },
      {
        name: "description",
        content: "Register as a student, employer or institution and start your ABILITY360 career journey.",
      },
      { property: "og:title", content: "Create your account — ABILITY360" },
      {
        property: "og:description",
        content: "Register as a student, employer or institution on ABILITY360.",
      },
    ],
  }),
  component: RegisterPage,
});

const roleOptions = [
  { value: "student", label: "Student", hint: "Build your career profile", icon: GraduationCap },
  { value: "industry", label: "Industry", hint: "Hire campus talent", icon: Building2 },
  { value: "institution", label: "Institution", hint: "Track cohort outcomes", icon: School },
] as const;

function RegisterPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [takenEmail, setTakenEmail] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", role: "student", institutionId: "" },
  });
  const selectedRole = form.watch("role");
  const { data: institutions } = useQuery({
    ...institutionsQueryOptions,
    enabled: selectedRole === "institution",
  });

  async function onSubmit(values: SignUpValues) {
    setSubmitting(true);
    const email = values.email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}${next ?? ""}`,
        data: {
          full_name: values.fullName,
          role: values.role,
          ...(values.role === "institution" && values.institutionId
            ? { institution_id: values.institutionId }
            : {}),
        },
      },
    });


    if (error) {
      setSubmitting(false);
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "This email is already registered. Please sign in instead."
          : "We couldn't create your account. Please try again.",
      );
      return;
    }

    if (!data.session) {
      setSubmitting(false);
      setCheckEmail(true);
      return;
    }

    const me = await queryClient.fetchQuery(meQueryOptions);
    setSubmitting(false);
    toast.success("Account created");
    if (next) {
      window.location.assign(next);
      return;
    }
    const role = me?.role ?? values.role;
    navigate({ to: role === "student" ? "/onboarding" : dashboardPathByRole[role] });
  }


  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <EmailTakenDialog
        open={takenEmail !== null}
        email={takenEmail ?? ""}
        onUseDifferentEmail={() => {
          setTakenEmail(null);
          form.setFocus("email");
        }}
      />

      <main className="flex flex-1 items-center justify-center bg-surface px-4 py-14 sm:px-6">
        <div className="grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,1fr)_32rem] lg:items-center">
          <section className="max-w-xl">
            <p className="text-sm font-semibold text-primary">A CAREER JOURNEY THAT ADAPTS TO YOU</p>
            <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">Start with where you are. Build towards where you want to go.</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">Bring your direction, skills, goals, applications, accessibility choices and verified evidence into one connected workspace.</p>
            <ul className="mt-7 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {["Private accessibility choices", "Personal roadmap and goals", "Verified opportunities", "Ability Passport you control"].map((item) => <li key={item} className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" aria-hidden="true" />{item}</li>)}
            </ul>
          </section>
          <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>From first semester to first career — start here.</CardDescription>
          </CardHeader>
          <CardContent>
            {checkEmail ? (
              <div className="space-y-4" role="status">
                <p className="text-sm text-foreground">
                  Almost there. We've sent a confirmation link to{" "}
                  <span className="font-medium">{form.getValues("email")}</span>. Confirm your email, then
                  sign in.
                </p>
                <Button asChild className="min-h-11 w-full">
                  <Link to="/login">Go to sign in</Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" placeholder="Priya Sharma" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" placeholder="you@college.edu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormDescription>At least 8 characters.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I am joining as</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid gap-2 sm:grid-cols-3"
                          >
                            {roleOptions.map((option) => (
                              <FormItem key={option.value}>
                                <FormLabel
                                  htmlFor={`role-${option.value}`}
                                  className="flex h-full cursor-pointer flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-teal has-[[data-state=checked]]:border-teal has-[[data-state=checked]]:bg-accent"
                                >
                                  <span className="flex w-full items-center justify-between">
                                    <option.icon className="size-4 text-teal" aria-hidden="true" />
                                    <FormControl>
                                      <RadioGroupItem id={`role-${option.value}`} value={option.value} />
                                    </FormControl>
                                  </span>
                                  <span className="text-sm font-semibold">{option.label}</span>
                                  <span className="text-xs font-normal text-muted-foreground">
                                    {option.hint}
                                  </span>
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedRole === "institution" && (
                    <FormField
                      control={form.control}
                      name="institutionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your college or university</FormLabel>
                          <Select value={field.value ?? ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="min-h-11">
                                <SelectValue placeholder="Select your institution" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(institutions ?? []).map((institution) => (
                                <SelectItem key={institution.id} value={institution.id}>
                                  {institution.name}
                                  {institution.city ? ` — ${institution.city}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Can't find it? Pick the closest match — we can update it later.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}


                  <Button type="submit" className="min-h-11 w-full" disabled={submitting}>
                    {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                    Create account
                  </Button>
                </form>
                <div className="my-4 flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <GoogleSignInButton label="Sign up with Google" />
              </Form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-teal underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

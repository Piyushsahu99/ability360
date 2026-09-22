import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPathByRole, meQueryOptions, signInSchema, type SignInValues } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — ABILITY360" },
      { name: "description", content: "Sign in to your ABILITY360 student, industry, institution or admin workspace." },
      { property: "og:title", content: "Sign in — ABILITY360" },
      { property: "og:description", content: "Access your personalised ABILITY360 career workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    const me = await queryClient.fetchQuery(meQueryOptions);
    setSubmitting(false);
    toast.success("Welcome back");
    navigate({ to: me ? dashboardPathByRole[me.role] : "/opportunities" });
  }

  return (
    <div className="min-h-screen bg-foreground text-background">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link to="/" aria-label="ABILITY360 home"><Logo className="[&_span]:text-background" /></Link>
      </header>
      <main className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_27rem] lg:py-12">
        <section className="max-w-xl">
          <p className="font-semibold text-amber">From First Semester to First Career.</p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">Continue the journey you are building.</h1>
          <p className="mt-5 max-w-lg text-lg text-background/75">Your goals, roadmap, applications and Ability Passport stay connected in one accessible workspace.</p>
          <ol className="mt-8 space-y-5 border-l border-background/25 pl-6">
            {["Know your next step", "Build evidence that matters", "Move towards the right opportunity"].map((item) => (
              <li key={item} className="relative flex items-center gap-3 text-base"><CheckCircle2 className="absolute -left-[35px] size-5 rounded-full bg-foreground text-amber" aria-hidden="true" />{item}</li>
            ))}
          </ol>
        </section>
        <Card className="w-full border-background/20 bg-background/95 text-foreground shadow-2xl backdrop-blur">
          <div className="h-1.5 bg-primary" aria-hidden="true" />
          <CardHeader className="px-5 pb-4 pt-6 sm:px-7">
            <CardTitle className="text-3xl">Welcome back</CardTitle>
            <CardDescription className="text-base">Sign in to continue your ABILITY360 journey.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-7 sm:px-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input className="min-h-12 bg-background" type="email" autoComplete="email" placeholder="you@college.edu" {...field} />
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
                        <Input className="min-h-12 bg-background" type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="min-h-12 w-full text-base" disabled={submitting}>
                  {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
                  Sign in
                </Button>
              </form>
              <div className="my-4 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <GoogleSignInButton />
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to ABILITY360?{" "}
              <Link to="/register" className="font-medium text-teal underline-offset-4 hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
        <p className="pb-6 text-center text-sm text-background/65 lg:col-span-2">Use the accessibility button to adjust text size, contrast, motion, focus and reading support.</p>
      </main>
    </div>
  );
}

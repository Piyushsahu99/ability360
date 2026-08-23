import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/lib/auth";
import {
  academicStepSchema,
  accessibilityOptions,
  accessibilityStepSchema,
  careerStepSchema,
  industrySuggestions,
  institutionsQueryOptions,
  interestSuggestions,
  onboardingQueryOptions,
  saveAcademicStep,
  saveAccessibilityStep,
  saveCareerStep,
  saveSkillsStep,
  skillCategoryLabels,
  skillLevelLabels,
  skillsCatalogueQueryOptions,
  skillsStepSchema,
  totalSteps,
  type AcademicStepValues,
  type AccessibilityStepValues,
  type CareerStepValues,
  type SkillsStepValues,
} from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — ABILITY360" },
      {
        name: "description",
        content: "Tell ABILITY360 about your studies, skills and career goal to personalise your roadmap.",
      },
    ],
  }),
  component: OnboardingPage,
});

const stepTitles = [
  { title: "Academic profile", description: "Where you study and what you are studying." },
  { title: "Skills & interests", description: "What you can already do, and what excites you." },
  { title: "Career goal", description: "The role you are working towards." },
  { title: "Accessibility preferences", description: "Optional — how we should adapt the experience." },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const userId = me?.id;

  const { data: state, isPending } = useQuery(onboardingQueryOptions(userId));
  const { data: institutions } = useQuery(institutionsQueryOptions);
  const { data: catalogue } = useQuery(skillsCatalogueQueryOptions);

  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const academicForm = useForm<AcademicStepValues>({
    resolver: zodResolver(academicStepSchema),
    defaultValues: {
      fullName: "",
      institutionId: "",
      institutionOther: "",
      department: "",
      degree: "",
      semester: 1,
      academicScoreType: "cgpa",
      academicScore: 0,
    },
  });

  const skillsForm = useForm<SkillsStepValues>({
    resolver: zodResolver(skillsStepSchema),
    defaultValues: { skills: [], interests: [], preferredIndustries: [] },
  });

  const careerForm = useForm<CareerStepValues>({
    resolver: zodResolver(careerStepSchema),
    defaultValues: { careerGoal: "", preferredLocation: "", preferredWorkMode: "hybrid" },
  });

  const accessibilityForm = useForm<AccessibilityStepValues>({
    resolver: zodResolver(accessibilityStepSchema),
    defaultValues: {
      screenReader: false,
      highContrast: false,
      captions: false,
      keyboardNavigation: false,
      reducedMotion: false,
      remoteParticipation: false,
      accessibleVenue: false,
      flexibleSchedule: false,
      otherAccommodation: "",
    },
  });

  useEffect(() => {
    if (!state || hydrated) return;
    academicForm.reset({
      fullName: state.profile.fullName,
      institutionId: state.profile.institutionId ?? (state.student?.institution_other ? "other" : ""),
      institutionOther: state.student?.institution_other ?? "",
      department: state.profile.department ?? "",
      degree: state.student?.degree ?? "",
      semester: state.student?.semester ?? 1,
      academicScoreType: (state.student?.academic_score_type as "cgpa" | "percentage") ?? "cgpa",
      academicScore: state.student?.academic_score ? Number(state.student.academic_score) : 0,
    });
    skillsForm.reset({
      skills: state.skills,
      interests: state.interests,
      preferredIndustries: state.student?.preferred_industries ?? [],
    });
    careerForm.reset({
      careerGoal: state.student?.career_goal ?? "",
      preferredLocation: state.student?.preferred_location ?? "",
      preferredWorkMode: state.student?.preferred_work_mode ?? "hybrid",
    });
    if (state.accessibility) {
      accessibilityForm.reset({
        screenReader: state.accessibility.screen_reader,
        highContrast: state.accessibility.high_contrast,
        captions: state.accessibility.captions,
        keyboardNavigation: state.accessibility.keyboard_navigation,
        reducedMotion: state.accessibility.reduced_motion,
        remoteParticipation: state.accessibility.remote_participation,
        accessibleVenue: state.accessibility.accessible_venue,
        flexibleSchedule: state.accessibility.flexible_schedule,
        otherAccommodation: state.accessibility.other_accommodation ?? "",
      });
    }
    const saved = state.student?.onboarding_step ?? 0;
    setStep(Math.min(saved, totalSteps - 1));
    setHydrated(true);
  }, [state, hydrated, academicForm, skillsForm, careerForm, accessibilityForm]);

  const save = useMutation({
    mutationFn: async (payload: { step: number; skipAccessibility?: boolean }) => {
      if (!userId) throw new Error("Not signed in");
      if (payload.step === 0) await saveAcademicStep(userId, academicForm.getValues());
      if (payload.step === 1) await saveSkillsStep(userId, skillsForm.getValues());
      if (payload.step === 2) await saveCareerStep(userId, careerForm.getValues());
      if (payload.step === 3) {
        await saveAccessibilityStep(userId, payload.skipAccessibility ? null : accessibilityForm.getValues());
      }
    },
    onSuccess: async (_data, payload) => {
      await queryClient.invalidateQueries({ queryKey: ["onboarding", userId] });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      if (payload.step === totalSteps - 1) {
        toast.success("Profile ready — welcome to ABILITY360");
        navigate({ to: "/dashboard/student", replace: true });
        return;
      }
      setStep(payload.step + 1);
    },
    onError: (error: Error) => toast.error(error.message || "Could not save. Please try again."),
  });

  async function handleNext() {
    const valid =
      step === 0
        ? await academicForm.trigger()
        : step === 1
          ? await skillsForm.trigger()
          : step === 2
            ? await careerForm.trigger()
            : await accessibilityForm.trigger();
    if (!valid) return;
    save.mutate({ step });
  }

  const progress = ((step + (save.isPending ? 0.5 : 0)) / totalSteps) * 100;
  const current = stepTitles[step]!;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Logo />
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {totalSteps}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Set up your ABILITY360 profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This personalises your roadmap, skill gaps and matched opportunities. You can change everything later.
        </p>

        <Progress value={progress} className="mt-6" aria-label="Onboarding progress" />

        <p aria-live="polite" className="sr-only">
          Step {step + 1} of {totalSteps}: {current.title}
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{current.title}</CardTitle>
            <CardDescription>{current.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending && !hydrated ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading your profile…</p>
            ) : (
              <>
                {step === 0 && (
                  <AcademicStep form={academicForm} institutions={institutions ?? []} />
                )}
                {step === 1 && <SkillsStep form={skillsForm} catalogue={catalogue ?? []} />}
                {step === 2 && <CareerStep form={careerForm} />}
                {step === 3 && <AccessibilityStep form={accessibilityForm} />}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 sm:w-auto"
                    onClick={() => setStep((value) => Math.max(0, value - 1))}
                    disabled={step === 0 || save.isPending}
                  >
                    <ArrowLeft aria-hidden="true" />
                    Back
                  </Button>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {step === totalSteps - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => save.mutate({ step, skipAccessibility: true })}
                        disabled={save.isPending}
                      >
                        Skip this step
                      </Button>
                    )}
                    <Button type="button" className="min-h-11" onClick={handleNext} disabled={save.isPending}>
                      {save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                      {step === totalSteps - 1 ? "Finish setup" : "Save and continue"}
                      {step === totalSteps - 1 ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <ArrowRight aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

type AcademicFormType = ReturnType<typeof useForm<AcademicStepValues>>;

function AcademicStep({
  form,
  institutions,
}: {
  form: AcademicFormType;
  institutions: { id: string; name: string; city: string | null; state: string | null }[];
}) {
  const institutionId = form.watch("institutionId");

  return (
    <Form {...form}>
      <form className="grid gap-5 md:grid-cols-2" noValidate onSubmit={(event) => event.preventDefault()}>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" className="min-h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="institutionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>College</FormLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder="Select your college" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                      {institution.city ? ` — ${institution.city}` : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">My college isn't listed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {institutionId === "other" && (
          <FormField
            control={form.control}
            name="institutionOther"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College name</FormLabel>
                <FormControl>
                  <Input className="min-h-11" placeholder="Type your college name" {...field} />
                </FormControl>
                <FormDescription>We'll link it once your institution joins ABILITY360.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input className="min-h-11" placeholder="Chemical Engineering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="degree"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Degree</FormLabel>
              <FormControl>
                <Input className="min-h-11" placeholder="B.Tech" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="semester"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current semester</FormLabel>
              <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, index) => (
                    <SelectItem key={index} value={String(index + 1)}>
                      Semester {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="academicScoreType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Academic performance measured in</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4 pt-2">
                  {[
                    { value: "cgpa", label: "CGPA (0–10)" },
                    { value: "percentage", label: "Percentage" },
                  ].map((option) => (
                    <FormItem key={option.value} className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem id={`score-${option.value}`} value={option.value} />
                      </FormControl>
                      <FormLabel htmlFor={`score-${option.value}`} className="font-normal">
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="academicScore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latest score</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  className="min-h-11"
                  {...field}
                  onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

function SkillsStep({
  form,
  catalogue,
}: {
  form: ReturnType<typeof useForm<SkillsStepValues>>;
  catalogue: { id: string; name: string; category: keyof typeof skillCategoryLabels }[];
}) {
  const skills = form.watch("skills");
  const interests = form.watch("interests");
  const industries = form.watch("preferredIndustries");
  const [pendingSkill, setPendingSkill] = useState("");
  const [interestDraft, setInterestDraft] = useState("");

  const available = useMemo(
    () => catalogue.filter((skill) => !skills.some((selected) => selected.skillId === skill.id)),
    [catalogue, skills],
  );

  function addSkill(skillId: string) {
    const skill = catalogue.find((item) => item.id === skillId);
    if (!skill) return;
    form.setValue("skills", [...skills, { skillId: skill.id, name: skill.name, level: 3 }], {
      shouldValidate: true,
    });
    setPendingSkill("");
  }

  function toggleTag(field: "interests" | "preferredIndustries", value: string) {
    const list = form.getValues(field);
    form.setValue(
      field,
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      { shouldValidate: true },
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-8" noValidate onSubmit={(event) => event.preventDefault()}>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Your skills</legend>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={pendingSkill} onValueChange={addSkill}>
              <SelectTrigger className="min-h-11 sm:max-w-sm" aria-label="Add a skill">
                <SelectValue placeholder="Add a skill" />
              </SelectTrigger>
              <SelectContent>
                {available.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name} · {skillCategoryLabels[skill.category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {skills.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No skills added yet. Add at least one to continue.
            </p>
          ) : (
            <ul className="space-y-2">
              {skills.map((skill, index) => (
                <li
                  key={skill.skillId}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-medium">{skill.name}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(skill.level)}
                      onValueChange={(value) =>
                        form.setValue(`skills.${index}.level`, Number(value), { shouldValidate: true })
                      }
                    >
                      <SelectTrigger className="min-h-11 w-40" aria-label={`${skill.name} level`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(skillLevelLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11"
                      aria-label={`Remove ${skill.name}`}
                      onClick={() =>
                        form.setValue(
                          "skills",
                          skills.filter((item) => item.skillId !== skill.skillId),
                          { shouldValidate: true },
                        )
                      }
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {form.formState.errors.skills && (
            <p className="text-sm text-destructive">{form.formState.errors.skills.message}</p>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Interests</legend>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...interestSuggestions, ...interests])].map((interest) => {
              const selected = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleTag("interests", interest)}
                  aria-pressed={selected}
                  className="rounded-full border border-border px-3 py-2 text-sm transition-colors hover:border-teal aria-pressed:border-teal aria-pressed:bg-accent"
                >
                  {interest}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              className="min-h-11 sm:max-w-xs"
              placeholder="Add another interest"
              aria-label="Add another interest"
              value={interestDraft}
              onChange={(event) => setInterestDraft(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                const value = interestDraft.trim();
                if (!value || interests.includes(value)) return;
                form.setValue("interests", [...interests, value], { shouldValidate: true });
                setInterestDraft("");
              }}
            >
              <Plus aria-hidden="true" />
              Add
            </Button>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Preferred industries</legend>
          <div className="flex flex-wrap gap-2">
            {industrySuggestions.map((industry) => {
              const selected = industries.includes(industry);
              return (
                <button
                  key={industry}
                  type="button"
                  onClick={() => toggleTag("preferredIndustries", industry)}
                  aria-pressed={selected}
                  className="rounded-full border border-border px-3 py-2 text-sm transition-colors hover:border-teal aria-pressed:border-teal aria-pressed:bg-accent"
                >
                  {industry}
                </button>
              );
            })}
          </div>
          {industries.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              Selected:{" "}
              {industries.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </fieldset>
      </form>
    </Form>
  );
}

function CareerStep({ form }: { form: ReturnType<typeof useForm<CareerStepValues>> }) {
  return (
    <Form {...form}>
      <form className="grid gap-5 md:grid-cols-2" noValidate onSubmit={(event) => event.preventDefault()}>
        <FormField
          control={form.control}
          name="careerGoal"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Career goal</FormLabel>
              <FormControl>
                <Input className="min-h-11" placeholder="Process Engineer" {...field} />
              </FormControl>
              <FormDescription>The role you want when you graduate.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred location</FormLabel>
              <FormControl>
                <Input className="min-h-11" placeholder="Pune, Maharashtra" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="preferredWorkMode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred work mode</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

function AccessibilityStep({ form }: { form: ReturnType<typeof useForm<AccessibilityStepValues>> }) {
  return (
    <Form {...form}>
      <form className="space-y-6" noValidate onSubmit={(event) => event.preventDefault()}>
        <p className="rounded-lg bg-primary-soft p-4 text-sm text-primary">
          Optional. We never ask you to disclose a disability — tell us only how the platform and opportunities
          should adapt for you. These preferences stay private to your account.
        </p>

        <fieldset className="grid gap-3 md:grid-cols-2">
          <legend className="sr-only">Accessibility preferences</legend>
          {accessibilityOptions.map((option) => (
            <FormField
              key={option.key}
              control={form.control}
              name={option.key}
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 space-y-0 rounded-lg border border-border p-3">
                  <FormControl>
                    <Checkbox
                      id={`a11y-${option.key}`}
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel htmlFor={`a11y-${option.key}`} className="font-medium">
                      {option.label}
                    </FormLabel>
                    <FormDescription>{option.hint}</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </fieldset>

        <FormField
          control={form.control}
          name="otherAccommodation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Any other accommodation</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Tell us anything else that helps." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

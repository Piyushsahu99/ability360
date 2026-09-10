import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Award, Lock, Plus, Sparkles, Target, Trash2, TriangleAlert, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DashboardShell, EmptyState, PanelCard, StatCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  achievementCategories,
  achievementCategoryLabels,
  achievementSchema,
  addAchievement,
  addExperience,
  addProject,
  addSkill,
  deleteRow,
  dnaQueryOptions,
  dnaStrength,
  experienceKindLabels,
  experienceKinds,
  experienceSchema,
  profileCompleteness,
  projectSchema,
  removeSkill,
  skillLevelLabels,
  updateSkillLevel,
  verificationLabels,
  type AchievementValues,
  type DnaData,
  type ExperienceValues,
  type ProjectValues,
} from "@/lib/dna";
import { studentNav } from "@/lib/nav";
import { skillsCatalogueQueryOptions } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated/dna")({
  head: () => ({
    meta: [
      { title: "Student DNA — ABILITY360" },
      {
        name: "description",
        content:
          "Your Student DNA: academics, skills, interests, projects, experience and achievements in one profile.",
      },
      { property: "og:title", content: "Student DNA — ABILITY360" },
      {
        property: "og:description",
        content: "One living profile combining academics, skills, interests, experience and achievements.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentDnaPage,
});

const nav = studentNav("/dna");

function StudentDnaPage() {
  const { data: dna, isPending, isError, refetch } = useQuery(dnaQueryOptions);
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["student", "dna"] });
  }

  const remove = useMutation({
    mutationFn: ({
      table,
      id,
    }: {
      table: "student_projects" | "student_experiences" | "student_achievements";
      id: string;
    }) => deleteRow(table, id),
    onSuccess: () => {
      toast.success("Removed");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <DashboardShell
      role="student"
      title="Student DNA"
      subtitle="Everything that defines your career profile, in one place."
      nav={nav}
    >
      {isPending || !dna ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Profile completeness"
              value={`${profileCompleteness(dna)}%`}
              hint="Add projects and experience to grow it"
              icon={UserRound}
            />
            <StatCard
              label="Skills tracked"
              value={String(dna.skills.length)}
              hint={`${dna.skills.filter((s) => s.verification !== "self_declared").length} verified`}
              icon={Target}
            />
            <StatCard
              label="Evidence items"
              value={String(dna.projects.length + dna.experiences.length + dna.achievements.length)}
              hint="Projects, experience and achievements"
              icon={Award}
            />
            <StatCard
              label="Assessments taken"
              value={String(dna.attempts.length)}
              hint="Deterministic, retakeable"
              icon={Sparkles}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <PanelCard title="Academic profile" description="From your onboarding answers.">
              <dl className="space-y-3 text-sm">
                <Field label="Name" value={dna.profile?.full_name || "—"} />
                <Field label="Institution" value={dna.institutionName || "—"} />
                <Field label="Department" value={dna.profile?.department || "—"} />
                <Field label="Degree" value={dna.student?.degree || "—"} />
                <Field
                  label="Semester"
                  value={dna.student?.semester ? `Semester ${dna.student.semester}` : "—"}
                />
                <Field
                  label="Academic score"
                  value={
                    dna.student?.academic_score != null
                      ? `${dna.student.academic_score} ${dna.student.academic_score_type === "cgpa" ? "CGPA" : "%"}`
                      : "—"
                  }
                />
              </dl>
            </PanelCard>

            <PanelCard title="Career direction" description="Goal, industries and working preferences.">
              <p className="font-display text-xl">{dna.student?.career_goal || "Not set yet"}</p>
              <div className="mt-4 space-y-3 text-sm">
                <Field label="Preferred location" value={dna.student?.preferred_location || "—"} />
                <Field label="Work mode" value={dna.student?.preferred_work_mode || "—"} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(dna.student?.preferred_industries ?? []).map((industry) => (
                  <Badge key={industry} variant="secondary">
                    {industry}
                  </Badge>
                ))}
                {(dna.student?.preferred_industries ?? []).length === 0 && (
                  <span className="text-sm text-muted-foreground">No industries selected.</span>
                )}
              </div>
            </PanelCard>

            <PanelCard title="Interests" description="What you want to work on.">
              <div className="flex flex-wrap gap-2">
                {dna.interests.map((interest) => (
                  <Badge key={interest} variant="outline">
                    {interest}
                  </Badge>
                ))}
                {dna.interests.length === 0 && <EmptyState message="No interests added yet." />}
              </div>
              <div className="mt-6 rounded-lg border border-border bg-surface p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="size-4 text-teal" aria-hidden="true" />
                  Accessibility preferences
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dna.accessibilityCount > 0
                    ? `${dna.accessibilityCount} preference${dna.accessibilityCount === 1 ? "" : "s"} saved. Private to you — never shown on your public profile.`
                    : "None saved. These stay private to you if you add them."}
                </p>
              </div>
            </PanelCard>
          </div>

          <SkillsPanel dna={dna} />

          <div className="grid gap-6 lg:grid-cols-3">
            <PanelCard title="Projects" description="Work that shows what you can build.">
              <AddProjectDialog onDone={invalidate} />
              <ul className="mt-4 space-y-3">
                {dna.projects.map((project) => (
                  <li key={project.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{project.title}</p>
                          {project.verified_at ? (
                            <Badge variant="secondary">Faculty verified</Badge>
                          ) : null}
                        </div>
                        {project.role && <p className="text-xs text-muted-foreground">{project.role}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Remove project ${project.title}`}
                        onClick={() => remove.mutate({ table: "student_projects", id: project.id })}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                    {project.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{project.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              {dna.projects.length === 0 && <EmptyState message="No projects added yet." />}
            </PanelCard>

            <PanelCard title="Experience" description="Internships, jobs and research work.">
              <AddExperienceDialog onDone={invalidate} />
              <ul className="mt-4 space-y-3">
                {dna.experiences.map((experience) => (
                  <li key={experience.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{experience.role}</p>
                        <p className="text-xs text-muted-foreground">
                          {experience.organisation} · {experienceKindLabels[experience.kind] ?? experience.kind}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Remove experience ${experience.role}`}
                        onClick={() => remove.mutate({ table: "student_experiences", id: experience.id })}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                    {experience.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{experience.description}</p>
                    )}
                  </li>
                ))}
              </ul>
              {dna.experiences.length === 0 && <EmptyState message="No experience added yet." />}
            </PanelCard>

            <PanelCard title="Achievements" description="Awards, competitions and certifications.">
              <AddAchievementDialog onDone={invalidate} />
              <ul className="mt-4 space-y-3">
                {dna.achievements.map((achievement) => (
                  <li key={achievement.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.issuer ? `${achievement.issuer} · ` : ""}
                          {achievementCategoryLabels[achievement.category] ?? achievement.category}
                        </p>
                        {achievement.verified_at && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <Badge className="bg-primary-soft text-primary">Verified achievement</Badge>
                            {achievement.certificate_code && (
                              <code className="rounded bg-secondary px-1.5 py-0.5">{achievement.certificate_code}</code>
                            )}
                          </div>

                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Remove achievement ${achievement.title}`}
                        onClick={() => remove.mutate({ table: "student_achievements", id: achievement.id })}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {dna.achievements.length === 0 && <EmptyState message="No achievements added yet." />}
            </PanelCard>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}

function SkillsPanel({ dna }: { dna: DnaData }) {
  const { strengths, developing } = dnaStrength(dna);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PanelCard title="Strengths" description="Skills you rated 4 or above.">
        {strengths.length === 0 ? (
          <EmptyState message="No strengths recorded yet — take an assessment to prove your level." />
        ) : (
          <ul className="space-y-4">
            {strengths.map((skill: { id: string; name: string; level: number; verification: string }) => (
              <li key={skill.id}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>{skill.name}</span>
                  <Badge variant="secondary">{verificationLabels[skill.verification]}</Badge>
                </div>
                <Progress value={skill.level * 20} className="mt-2" aria-label={`${skill.name} level`} />
              </li>
            ))}
          </ul>
        )}
      </PanelCard>

      <PanelCard title="Development areas" description="Where a little effort moves you fastest.">
        {developing.length === 0 ? (
          <EmptyState message="Nothing flagged. Add more skills to get a sharper picture." />
        ) : (
          <ul className="space-y-4">
            {developing.map((skill: { id: string; name: string; level: number }) => (
              <li key={skill.id}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>{skill.name}</span>
                  <span className="text-muted-foreground">Level {skill.level}</span>
                </div>
                <Progress value={skill.level * 20} className="mt-2" aria-label={`${skill.name} level`} />
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="outline" className="mt-4 min-h-11">
          <Link to="/assessment">Take a skill assessment</Link>
        </Button>
      </PanelCard>
    </div>
  );
}

function AddProjectDialog({ onDone }: { onDone: () => void }) {
  const form = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: "", description: "", role: "", technologies: "", link: "" },
  });
  const mutation = useMutation({
    mutationFn: addProject,
    onSuccess: () => {
      toast.success("Project added");
      form.reset();
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 w-full">
          <Plus aria-hidden="true" />
          Add project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a project</DialogTitle>
          <DialogDescription>Describe something you built or contributed to.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FormField label="Title" error={form.formState.errors.title?.message}>
            <Input {...form.register("title")} placeholder="Campus energy dashboard" />
          </FormField>
          <FormField label="Your role" error={form.formState.errors.role?.message}>
            <Input {...form.register("role")} placeholder="Frontend developer" />
          </FormField>
          <FormField label="Technologies (comma separated)" error={undefined}>
            <Input {...form.register("technologies")} placeholder="React, Python, SQL" />
          </FormField>
          <FormField label="Link" error={form.formState.errors.link?.message}>
            <Input {...form.register("link")} placeholder="https://github.com/..." />
          </FormField>
          <FormField label="Description" error={form.formState.errors.description?.message}>
            <Textarea {...form.register("description")} rows={3} />
          </FormField>
          <DialogFooter>
            <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddExperienceDialog({ onDone }: { onDone: () => void }) {
  const form = useForm<ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: { organisation: "", role: "", kind: "internship", description: "" },
  });
  const mutation = useMutation({
    mutationFn: addExperience,
    onSuccess: () => {
      toast.success("Experience added");
      form.reset();
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 w-full">
          <Plus aria-hidden="true" />
          Add experience
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add experience</DialogTitle>
          <DialogDescription>Internships, jobs, research or volunteering.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FormField label="Organisation" error={form.formState.errors.organisation?.message}>
            <Input {...form.register("organisation")} placeholder="Tata Chemicals" />
          </FormField>
          <FormField label="Role" error={form.formState.errors.role?.message}>
            <Input {...form.register("role")} placeholder="Process engineering intern" />
          </FormField>
          <FormField label="Type" error={form.formState.errors.kind?.message}>
            <select
              {...form.register("kind")}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {experienceKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {experienceKindLabels[kind]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Description" error={form.formState.errors.description?.message}>
            <Textarea {...form.register("description")} rows={3} />
          </FormField>
          <DialogFooter>
            <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save experience"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddAchievementDialog({ onDone }: { onDone: () => void }) {
  const form = useForm<AchievementValues>({
    resolver: zodResolver(achievementSchema),
    defaultValues: { title: "", issuer: "", category: "award", description: "" },
  });
  const mutation = useMutation({
    mutationFn: addAchievement,
    onSuccess: () => {
      toast.success("Achievement added");
      form.reset();
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 w-full">
          <Plus aria-hidden="true" />
          Add achievement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add achievement</DialogTitle>
          <DialogDescription>Awards, competitions, certifications or publications.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <FormField label="Title" error={form.formState.errors.title?.message}>
            <Input {...form.register("title")} placeholder="Smart India Hackathon finalist" />
          </FormField>
          <FormField label="Issuer" error={form.formState.errors.issuer?.message}>
            <Input {...form.register("issuer")} placeholder="Ministry of Education" />
          </FormField>
          <FormField label="Category" error={form.formState.errors.category?.message}>
            <select
              {...form.register("category")}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {achievementCategories.map((category) => (
                <option key={category} value={category}>
                  {achievementCategoryLabels[category]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Description" error={form.formState.errors.description?.message}>
            <Textarea {...form.register("description")} rows={3} />
          </FormField>
          <DialogFooter>
            <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save achievement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

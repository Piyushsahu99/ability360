import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  BookOpen,
  MessageCircle,
  MoveUpRight,
  ArrowRight,
  Briefcase,
  Building2,
  ClipboardCheck,
  Compass,
  GraduationCap,
  IdCard,
  Route as RouteIcon,
  School,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import divyangjanImage from "@/assets/divyangjan-inclusion.jpg";
import campusImage from "@/assets/home-campus.jpg";
import programsImage from "@/assets/res-programs.jpg";
import scholarshipsImage from "@/assets/res-scholarships.jpg";
import divyangjanResImage from "@/assets/res-divyangjan.jpg";
import examsImage from "@/assets/res-exams.jpg";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { dashboardPathByRole, useMe } from "@/lib/auth";


export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://ability360.lovable.app/" }],
    meta: [
      { property: "og:url", content: "https://ability360.lovable.app/" },
      { title: "ABILITY360 — From First Semester to First Career" },
      {
        name: "description",
        content:
          "A personalised Academia–Industry Career OS connecting students, colleges, faculty and employers around real opportunities.",
      },
      { property: "og:title", content: "ABILITY360 — From First Semester to First Career" },
      {
        property: "og:description",
        content:
          "A personalised Academia–Industry Career OS connecting students, colleges, faculty and employers around real opportunities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const journey = [
  {
    icon: UserPlus,
    title: "Set up your profile",
    body: "Tell us your college, branch, semester, skills and career goal in a short guided setup.",
    tone: "primary" as const,
  },
  {
    icon: ClipboardCheck,
    title: "Check your skills",
    body: "Take a quick assessment and see where you actually stand today, honestly.",
    tone: "teal" as const,
  },
  {
    icon: Compass,
    title: "Pick a career role",
    body: "Browse real roles by course and branch with responsibilities, skills and Indian pay ranges.",
    tone: "primary" as const,
  },
  {
    icon: RouteIcon,
    title: "Follow your roadmap",
    body: "Get a personal plan for this week, the next 30 days and this semester.",
    tone: "teal" as const,
  },
  {
    icon: Briefcase,
    title: "Apply to opportunities",
    body: "Internships, jobs, projects and competitions — save, check eligibility, apply and track every stage.",
    tone: "primary" as const,
  },
  {
    icon: IdCard,
    title: "Build your Ability Passport",
    body: "Projects, verified skills and certificates in one profile employers can trust.",
    tone: "teal" as const,
  },
];

const pillars = [
  { icon: GraduationCap, title: "Students", note: "Personal roadmap and passport" },
  { icon: School, title: "Colleges", note: "Career readiness analytics" },
  { icon: Users, title: "Faculty & mentors", note: "Guidance and verification" },
  { icon: Building2, title: "Industry", note: "Post roles, review talent" },
  { icon: Sparkles, title: "Opportunities", note: "Internships to competitions" },
];

const resourceHighlights = [
  { title: "Skilling programmes", note: "PMKVY, NATS apprenticeships, NPTEL and more", image: programsImage },
  { title: "Scholarships", note: "National Scholarship Portal, Pragati, INSPIRE", image: scholarshipsImage },
  { title: "Divyangjan support", note: "UDID, RPwD rights, ADIP assistive devices", image: divyangjanResImage },
  { title: "Exams and guidance", note: "GATE, CAT, UPSC and campus placement tips", image: examsImage },
];

function LandingPage() {
  const { data: me } = useMe();
  const signedIn = Boolean(me);
  const dashboardPath = me ? dashboardPathByRole[me.role] : "/login";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main>
        <section className="home-hero relative isolate overflow-hidden border-b border-border">
          <img src={campusImage} alt="Indian college students collaborating on campus, including a student using a wheelchair" width={1536} height={1024} fetchPriority="high" className="home-hero-photo absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="home-hero-shade absolute inset-0 -z-10" aria-hidden="true" />
          <div className="mx-auto w-full max-w-6xl px-5 pb-80 pt-10 sm:px-8 sm:pt-14 lg:pb-20 lg:pt-20">
            <div className="max-w-xl lg:max-w-[31rem]">
              <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-primary"><span className="h-0.5 w-7 bg-primary" aria-hidden="true" /> YOUR NEXT CHAPTER STARTS HERE</p>
              <h1 className="text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">ABILITY360<span className="mt-3 block text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">From first semester<br />to <span className="text-primary">first career.</span></span></h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">Find your direction. Build your skills. Step into opportunities — with a career journey that’s truly yours.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="min-h-12 px-6"><Link to={signedIn ? dashboardPath : "/register"}>{signedIn ? "Open my workspace" : "Start my journey"}<ArrowRight aria-hidden="true" /></Link></Button>
                <Button asChild size="lg" variant="outline" className="min-h-12 border-foreground/20 bg-background/90 px-6"><Link to="/opportunities">Explore opportunities</Link></Button>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />Built for every student. Inclusive by design.</p>
            </div>
          </div>
        </section>

        <section aria-label="Explore your next step" className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-6xl grid-cols-1 px-5 py-3 sm:grid-cols-3 sm:px-8 sm:py-6">
            {[
              { icon: Compass, title: "Find your direction", note: "Career roles & roadmaps", to: "/roles" },
              { icon: Briefcase, title: "Find your opportunity", note: "Internships, jobs & projects", to: "/opportunities" },
              { icon: BookOpen, title: "Find your support", note: "Scholarships & learning", to: "/resources" },
            ].map((item) => <Button key={item.title} asChild variant="ghost" className="h-auto min-h-20 justify-start rounded-none px-3 py-4 sm:px-5"><Link to={item.to}><item.icon className="mr-2 size-6 shrink-0 text-primary" aria-hidden="true" /><span className="flex-1 whitespace-normal text-left"><span className="block text-base font-semibold">{item.title}</span><span className="mt-1 block text-sm font-normal text-muted-foreground">{item.note}</span></span><MoveUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Link></Button>)}
          </div>
        </section>

        <section aria-labelledby="journey-heading" className="px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><p className="text-sm font-semibold text-primary">A LITTLE CLARITY. A LOT OF POSSIBILITY.</p><h2 id="journey-heading" className="mt-3 text-3xl sm:text-4xl">Your ambition, a clear path.</h2><p className="mt-3 max-w-lg text-muted-foreground">You don’t need to figure it all out today. Just take the next step.</p></div>
              <Button asChild variant="outline" className="min-h-11 self-start sm:self-auto"><Link to={signedIn ? dashboardPath : "/register"}>Build my path<ArrowRight aria-hidden="true" /></Link></Button>
            </div>
            <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {journey.map((step, index) => <li key={step.title} className="border-t border-border pt-5"><div className="flex items-center justify-between"><span className="font-display text-3xl font-medium text-primary/60">0{index + 1}</span><step.icon className="size-6 text-primary" aria-hidden="true" /></div><h3 className="mt-4 text-xl">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p></li>)}
            </ol>
          </div>
        </section>

        <section aria-labelledby="inclusion-heading" className="border-y border-border bg-primary-soft px-5 py-14 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-16">
            <img src={divyangjanImage} alt="Inclusive workplace with accessible desks, sign language and a braille display" loading="lazy" width={1280} height={800} className="aspect-[8/5] w-full rounded-lg object-cover" />
            <div><p className="flex items-center gap-2 text-sm font-semibold text-primary"><Accessibility className="size-5" aria-hidden="true" /> ABILITY360 ACCESS</p><h2 id="inclusion-heading" className="mt-4 text-3xl leading-tight sm:text-4xl">Different needs.<br />Equal possibilities.</h2><p className="mt-4 leading-relaxed text-muted-foreground">A career belongs to everyone. Explore inclusive employers, personalised accessibility preferences, sign language learning and Divyangjan support.</p><p className="mt-4 text-sm font-medium">Your choices. Your privacy. Your pace.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild className="min-h-12"><Link to="/accessibility">Explore ACCESS<ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="outline" className="min-h-12 bg-background"><Link to="/resources">Schemes & resources</Link></Button></div></div>
          </div>
        </section>

        <section aria-labelledby="resources-heading" className="px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">MORE WAYS TO MOVE FORWARD</p><h2 id="resources-heading" className="mt-3 text-3xl sm:text-4xl">Good resources. Real possibilities.</h2><p className="mt-3 text-muted-foreground">Indian programmes, scholarships and guidance, all in one place.</p></div><Button asChild variant="ghost" className="min-h-11 self-start px-0 text-primary"><Link to="/resources">All resources<ArrowRight aria-hidden="true" /></Link></Button></div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {resourceHighlights.map((item) => <Link key={item.title} to="/resources" className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary"><div className="overflow-hidden"><img src={item.image} alt="" loading="lazy" width={1024} height={640} className="aspect-[8/5] w-full object-cover transition-transform duration-300 group-hover:scale-105" /></div><div className="p-5"><div className="flex items-start justify-between gap-2"><h3 className="text-lg">{item.title}</h3><MoveUpRight className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" /></div><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.note}</p></div></Link>)}
            </div>
          </div>
        </section>

        <section aria-labelledby="pillars-heading" className="border-y border-border bg-surface px-5 py-14 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-6xl"><div className="text-center"><p className="text-sm font-semibold text-primary">CONNECTED FOR YOUR FUTURE</p><h2 id="pillars-heading" className="mt-3 text-3xl sm:text-4xl">One ecosystem. Shared progress.</h2></div><div className="mt-10 grid grid-cols-2 gap-7 sm:grid-cols-3 lg:grid-cols-5">{pillars.map((pillar) => <div key={pillar.title} className="text-center"><pillar.icon className="mx-auto size-7 text-primary" aria-hidden="true" /><h3 className="mt-4 text-lg">{pillar.title}</h3><p className="mt-2 text-sm text-muted-foreground">{pillar.note}</p></div>)}</div></div>
        </section>

        <section aria-labelledby="cta-heading" className="px-5 py-14 sm:px-8 sm:py-20"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 lg:flex-row lg:items-center"><div><p className="flex items-center gap-2 text-sm font-semibold text-primary"><MessageCircle className="size-5" aria-hidden="true" /> YOU DON’T HAVE TO DO THIS ALONE</p><h2 id="cta-heading" className="mt-3 text-3xl sm:text-4xl">Your next chapter is waiting.</h2><p className="mt-3 max-w-xl text-muted-foreground">Find opportunities, set your goals, or ask Sathi for a little guidance.</p></div><div className="flex flex-wrap gap-3"><Button asChild size="lg" className="min-h-12"><Link to={signedIn ? dashboardPath : "/register"}>{signedIn ? "Go to my workspace" : "Get started"}<ArrowRight aria-hidden="true" /></Link></Button><Button asChild size="lg" variant="outline" className="min-h-12"><Link to="/sathi">Ask Sathi<MessageCircle aria-hidden="true" /></Link></Button></div></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}

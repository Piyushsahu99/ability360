import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Compass,
  ExternalLink,
  Fingerprint,
  GraduationCap,
  MapPin,
  MessageCircle,
  Route as RouteIcon,
  ShieldCheck,
} from "lucide-react";

import campusImage from "@/assets/home-campus.jpg";
import inclusionImage from "@/assets/divyangjan-inclusion.jpg";
import { HomeSathi } from "@/components/home-sathi";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardPathByRole, useMe } from "@/lib/auth";
import { closesSoon, governmentPlatforms, selectPwdHighlights, type HomeHighlight } from "@/lib/home-content";
import { formatDateIN } from "@/lib/india";
import { opportunitiesQueryOptions, opportunityTypeLabels, workModeLabels } from "@/lib/opportunities";
import { formatClosingDate, resourceCategoryLabels, resourcesQueryOptions, type ResourceCategory } from "@/lib/resources";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    links: [{ rel: "canonical", href: "https://ability360.lovable.app/" }],
    meta: [
      { property: "og:url", content: "https://ability360.lovable.app/" },
      { title: "ABILITY360 — Inclusive career guidance and opportunities" },
      {
        name: "description",
        content: "Build a clear career path, find verified opportunities and PWD support, and get private guidance from Sathi on ABILITY360.",
      },
      { property: "og:title", content: "ABILITY360 — From First Semester to First Career" },
      {
        property: "og:description",
        content: "Inclusive career direction, skills, opportunities, accommodations and progress for Indian college students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const pathSteps = [
  { icon: Compass, number: "01", title: "Find your direction", body: "Explore roles that fit your course, strengths and ambition." },
  { icon: GraduationCap, number: "02", title: "Build what matters", body: "Turn skill gaps into weekly goals, learning and evidence." },
  { icon: BriefcaseBusiness, number: "03", title: "Find the right opening", body: "Compare real opportunities, deadlines and accessibility details." },
  { icon: Accessibility, number: "04", title: "Ask for the right support", body: "Draft accommodation requests and share only what you approve." },
  { icon: RouteIcon, number: "05", title: "See your progress", body: "Keep applications, goals, roadmap and Ability Passport connected." },
];

const directoryGroups = [
  "Identity & rights",
  "Education & scholarships",
  "Employment & skilling",
  "Assistive support",
  "Sign language & learning",
] as const;

function HomePage() {
  const { data: me } = useMe();
  const { data: opportunities, isPending: opportunitiesPending, isError: opportunitiesError } = useQuery(opportunitiesQueryOptions);
  const { data: resources, isPending: resourcesPending, isError: resourcesError } = useQuery(resourcesQueryOptions);
  const signedIn = Boolean(me);
  const dashboardPath = me ? dashboardPathByRole[me.role] : "/login";
  const highlights = selectPwdHighlights(opportunities ?? [], resources ?? []);
  const highlightsPending = opportunitiesPending || resourcesPending;
  const highlightsError = opportunitiesError || resourcesError;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main id="main-content">
        <section className="home-hero relative isolate overflow-hidden border-b border-border">
          <img
            src={campusImage}
            alt="Indian college students collaborating on campus, including a student using a wheelchair"
            width={1536}
            height={1024}
            fetchPriority="high"
            className="home-hero-photo absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="home-hero-shade absolute inset-0 -z-10" aria-hidden="true" />
          <div className="mx-auto w-full max-w-6xl px-5 pb-48 pt-10 sm:px-8 sm:pb-56 sm:pt-16 lg:pb-20 lg:pt-24">
            <div className="max-w-2xl lg:max-w-[36rem]">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="h-0.5 w-7 bg-primary" aria-hidden="true" />
                FROM FIRST SEMESTER TO FIRST CAREER
              </p>
              <h1 className="mt-5 text-4xl leading-[1.06] sm:text-5xl lg:text-6xl">
                Your ambition deserves <span className="text-primary">a clear, accessible path.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                ABILITY360 connects career direction, skills, verified opportunities, accessibility support and progress in one journey built around you.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="min-h-12 px-6">
                  <Link to={signedIn ? dashboardPath : "/register"}>
                    {signedIn ? "Continue my journey" : "Build my career path"}<ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-12 border-foreground/20 bg-background/90 px-6">
                  <Link to="/opportunities">Explore opportunities</Link>
                </Button>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground">
                <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden="true" />Your accessibility choices stay private</li>
                <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-primary" aria-hidden="true" />Real data, not invented listings</li>
              </ul>
            </div>
          </div>
        </section>

        <nav aria-label="Explore ABILITY360" className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-6xl sm:grid-cols-3">
            {[
              { icon: Compass, title: "Career roles", note: "Know where you can go", to: "/roles" },
              { icon: BriefcaseBusiness, title: "Open opportunities", note: "Jobs, internships and training", to: "/opportunities" },
              { icon: BookOpen, title: "Scholarships & support", note: "Official programmes and guidance", to: "/resources" },
            ].map((item) => (
              <Button key={item.title} asChild variant="ghost" className="h-auto min-h-24 justify-start rounded-none border-b border-border px-5 py-5 sm:border-b-0 sm:border-r last:border-r-0">
                <Link to={item.to}>
                  <item.icon className="mr-2 size-6 shrink-0 text-primary" aria-hidden="true" />
                  <span className="flex-1 whitespace-normal text-left">
                    <span className="block text-base font-semibold">{item.title}</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">{item.note}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </Button>
            ))}
          </div>
        </nav>

        <section aria-labelledby="path-heading" className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">ONE CONNECTED JOURNEY</p>
              <h2 id="path-heading" className="mt-3 text-3xl sm:text-4xl">Less guessing. A useful next step.</h2>
              <p className="mt-4 text-muted-foreground">Start where you are. ABILITY360 keeps the pieces connected as your direction changes.</p>
            </div>
            <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
              {pathSteps.map((step) => (
                <li key={step.title} className="bg-card p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">{step.number}</span>
                    <step.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="pwd-opportunities-heading" className="border-y border-border bg-foreground px-5 py-16 text-background sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-amber">IMPORTANT FOR PWD STUDENTS</p>
                <h2 id="pwd-opportunities-heading" className="mt-3 text-3xl sm:text-4xl">Open now. Worth checking now.</h2>
                <p className="mt-4 text-background/70">Active inclusive openings and official Divyangjan programmes, ordered by the nearest known closing date.</p>
              </div>
              <Button asChild variant="outline" className="min-h-11 self-start border-background/25 bg-foreground text-background hover:bg-background hover:text-foreground md:self-auto">
                <Link to="/opportunities">See all opportunities <ArrowRight aria-hidden="true" /></Link>
              </Button>
            </div>

            {highlightsPending ? <p className="mt-8 text-sm text-background/70">Checking current listings…</p> : null}
            {highlightsError ? <p className="mt-8 text-sm text-destructive" role="alert">Current highlights could not be loaded. Please use the full Opportunities or Resources page.</p> : null}
            {!highlightsPending && !highlightsError && highlights.length === 0 ? (
              <div className="mt-8 border-t border-background/20 pt-6">
                <p className="font-medium">No verified PWD-focused listing is active right now.</p>
                <p className="mt-2 text-sm text-background/65">We will show one here only when its source and closing period are current.</p>
              </div>
            ) : null}
            <div className="mt-8 grid gap-px overflow-hidden rounded-lg bg-background/20 md:grid-cols-2">
              {highlights.map((highlight) => <HighlightCard key={`${highlight.kind}-${highlight.item.id}`} highlight={highlight} />)}
            </div>
            <p className="mt-5 text-xs text-background/55">Accessibility is shown only when an organisation has published supporting information.</p>
          </div>
        </section>

        <section aria-labelledby="access-heading" className="border-b border-border bg-primary-soft px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="overflow-hidden rounded-lg">
              <img src={inclusionImage} alt="Inclusive workplace with accessible desks, sign language and a braille display" loading="lazy" width={1280} height={800} className="aspect-[8/5] w-full object-cover" />
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Accessibility className="size-5" aria-hidden="true" /> ABILITY360 ACCESS</p>
              <h2 id="access-heading" className="mt-4 text-3xl leading-tight sm:text-4xl">The platform adapts to you. Not the other way around.</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">Choose how you read, learn, communicate and interview. Compare published workplace support, prepare an accommodation request, and decide what your Ability Passport shares.</p>
              <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                {[
                  "Private by default",
                  "Share by category",
                  "No diagnosis required",
                  "Never used to lower a match",
                ].map((item) => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />{item}</li>)}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="min-h-12"><Link to="/accessibility">Explore ACCESS <ArrowRight aria-hidden="true" /></Link></Button>
                <Button asChild variant="outline" className="min-h-12 bg-background"><Link to="/resources">PWD schemes &amp; learning</Link></Button>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="directory-heading" className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">OFFICIAL NATIONAL PLATFORMS</p>
              <h2 id="directory-heading" className="mt-3 text-3xl sm:text-4xl">Government support, easier to reach.</h2>
              <p className="mt-4 text-muted-foreground">A focused directory of central-government and statutory PWD services. This is not a list of every state department or organisation in India.</p>
            </div>
            <div className="mt-10 grid gap-10 lg:grid-cols-2">
              {directoryGroups.map((group) => (
                <section key={group} aria-labelledby={`directory-${group.replaceAll(" ", "-").toLowerCase()}`}>
                  <h3 id={`directory-${group.replaceAll(" ", "-").toLowerCase()}`} className="border-b border-border pb-3 text-lg">{group}</h3>
                  <ul className="divide-y divide-border">
                    {governmentPlatforms.filter((item) => item.category === group).map((item) => (
                      <li key={item.shortName}>
                        <a href={item.href} target="_blank" rel="noreferrer noopener" className="group flex min-h-24 items-start gap-4 py-4 focus-visible:outline-none">
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-soft text-xs font-bold text-primary">{item.shortName}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3 font-semibold group-hover:text-primary">{item.name}<ExternalLink className="mt-1 size-4 shrink-0" aria-hidden="true" /></span>
                            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{item.description}</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="sathi-heading" className="border-y border-border bg-surface px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 max-w-2xl">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary"><MessageCircle className="size-5" aria-hidden="true" /> GUIDANCE WHEN YOU NEED IT</p>
              <h2 id="sathi-heading" className="mt-3 text-3xl sm:text-4xl">Talk it through with Sathi.</h2>
              <p className="mt-4 text-muted-foreground">Ask about real openings, scholarships, career roles, goals and applications. Your saved chat is visible only to your account.</p>
            </div>
            <HomeSathi signedIn={signedIn} />
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-7 border-l-4 border-primary pl-6 lg:flex-row lg:items-center lg:pl-10">
            <div>
              <p className="text-sm font-semibold text-primary"><Fingerprint className="mr-2 inline size-5" aria-hidden="true" />YOUR JOURNEY. YOUR EVIDENCE. YOUR CHOICE.</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Take one useful step today.</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">Choose a direction, save an opportunity, set a goal, or ask for help. ABILITY360 keeps the progress connected.</p>
            </div>
            <Button asChild size="lg" className="min-h-12 self-start lg:self-auto"><Link to={signedIn ? dashboardPath : "/register"}>{signedIn ? "Open my workspace" : "Start my journey"}<ArrowRight aria-hidden="true" /></Link></Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: HomeHighlight }) {
  if (highlight.kind === "opportunity") {
    const item = highlight.item;
    return (
      <article className="bg-foreground p-5 sm:p-6">
        <HighlightBadges label={opportunityTypeLabels[item.type]} date={highlight.date} />
        <h3 className="mt-5 text-xl">{item.title}</h3>
        <p className="mt-1 text-sm font-medium text-background/85">{item.organisation}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-background/65">{item.description}</p>
        <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-background/70">
          <div className="flex items-center gap-2"><CalendarClock className="size-4 text-amber" aria-hidden="true" /><dt className="sr-only">Closing</dt><dd>{formatDateIN(item.deadline)}</dd></div>
          <div className="flex items-center gap-2"><MapPin className="size-4 text-amber" aria-hidden="true" /><dt className="sr-only">Work mode</dt><dd>{workModeLabels[item.mode]} · {item.location}</dd></div>
        </dl>
        <Button asChild variant="link" className="mt-4 h-auto px-0 text-amber"><Link to="/opportunities">Review listing <ArrowRight aria-hidden="true" /></Link></Button>
      </article>
    );
  }

  const item = highlight.item;
  const deadline = formatClosingDate(item.expires_at) ?? (item.deadline_label || "Rolling");
  return (
    <article className="bg-foreground p-5 sm:p-6">
      <HighlightBadges label={resourceCategoryLabels[item.category as ResourceCategory] ?? item.category} date={highlight.date} />
      <h3 className="mt-5 text-xl">{item.title}</h3>
      <p className="mt-1 text-sm font-medium text-background/85">{item.organisation}</p>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-background/65">{item.summary}</p>
      <dl className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-background/70">
        <div className="flex items-center gap-2"><CalendarClock className="size-4 text-amber" aria-hidden="true" /><dt className="sr-only">Closing</dt><dd>{deadline}</dd></div>
      </dl>
      <Button asChild variant="link" className="mt-4 h-auto px-0 text-amber"><Link to="/resources/$slug" params={{ slug: item.slug }}>Review details <ArrowRight aria-hidden="true" /></Link></Button>
    </article>
  );
}

function HighlightBadges({ label, date }: { label: string; date: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className="bg-amber text-amber-foreground hover:bg-amber">{label}</Badge>
      {closesSoon(date) ? <Badge variant="outline" className="border-amber/60 text-amber">Closing soon</Badge> : null}
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
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
import adhyayotsavPressImage from "@/assets/achievement-adhyayotsav-press.jpg";
import yuvaFutureTeamImage from "@/assets/achievement-yuva-future-team.jpg";
import stepDiscoverImage from "@/assets/step-discover.jpg";
import stepDirectionImage from "@/assets/step-direction.jpg";
import stepSkillsImage from "@/assets/step-skills.jpg";
import stepOpeningImage from "@/assets/step-opening.jpg";
import stepGrowImage from "@/assets/step-grow.jpg";
import startSignupImage from "@/assets/start-signup.jpg";
import startProfileImage from "@/assets/start-profile.jpg";
import startNextImage from "@/assets/start-next.jpg";

const journeyVisuals = [
  { image: stepDiscoverImage, alt: "A student noting her strengths and interests" },
  { image: stepDirectionImage, alt: "A student at a campus signpost choosing a career direction" },
  { image: stepSkillsImage, alt: "Students, including a wheelchair user, learning on laptops in a library" },
  { image: stepOpeningImage, alt: "A graduate shaking hands at a job interview" },
  { image: stepGrowImage, alt: "A young professional growing in an inclusive office" },
];
import { HomeStoryCarousel, type StorySlide } from "@/components/home-story-carousel";
import { HomeSathi } from "@/components/home-sathi";
import { HomeOpportunityCarousel } from "@/components/home-opportunity-carousel";
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

const pathSteps: Omit<StorySlide, "image" | "alt">[] = [
  { icon: Fingerprint, title: "Discover yourself", body: "Your strengths, interests and learning preferences.", to: "/dna" },
  { icon: Compass, title: "Choose a direction", body: "Find career roles that fit your ambition.", to: "/roles" },
  { icon: GraduationCap, title: "Build your skills", body: "A personal roadmap, lessons and achievable goals.", to: "/roadmap" },
  { icon: BriefcaseBusiness, title: "Find your opening", body: "Explore opportunities and prepare your application.", to: "/opportunities" },
  { icon: RouteIcon, title: "Grow with every step", body: "Track your journey. Refine your next direction.", to: "/journey" },
];

const homeFeatures: (Omit<StorySlide, "image" | "alt"> & { label: string })[] = [
  { icon: Fingerprint, title: "Student DNA", body: "Bring your skills, projects and achievements into one Ability Passport.", to: "/dna", label: "Build your profile" },
  { icon: RouteIcon, title: "A roadmap that is yours", body: "Set personal goals and turn career skill gaps into your next steps.", to: "/roadmap", label: "Explore your roadmap" },
  { icon: Accessibility, title: "Support without barriers", body: "Choose accessibility preferences and request the support you need.", to: "/accessibility", label: "Explore accessibility" },
  { icon: BookOpen, title: "Learn. Practise. Progress.", body: "Accessible lessons, mock tests and learning progress in one place.", to: "/learn", label: "Start learning" },
  { icon: BriefcaseBusiness, title: "From saved to selected", body: "Prepare documents and follow your applications at every stage.", to: "/applications", label: "Track applications" },
  { icon: MessageCircle, title: "A little help from Sathi", body: "Talk through career questions with private guidance based on platform data.", to: "/sathi", label: "Ask Sathi" },
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
  const currentOpportunities = (opportunities ?? []).filter((item) => item.is_published && (!item.deadline || new Date(`${item.deadline}T23:59:59`).getTime() >= Date.now())).slice(0, 9);

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
          <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:pb-24 lg:pt-28">
            <div className="max-w-2xl lg:max-w-[36rem]">
              <p className="home-enter flex items-center gap-2 text-sm font-semibold text-sidebar-foreground">
                <span className="h-0.5 w-7 bg-amber" aria-hidden="true" />
                YOUR AMBITION. YOUR NEXT CHAPTER.
              </p>
              <h1 className="home-enter mt-5 text-5xl leading-[1.06] text-sidebar-foreground sm:text-6xl lg:text-7xl">
                ABILITY<span className="text-amber">360</span>
              </h1>
              <p className="home-enter mt-4 max-w-lg font-display text-3xl leading-tight text-sidebar-foreground sm:text-4xl">From first semester<br />to first career.</p>
              <p className="home-enter mt-5 max-w-lg text-base leading-relaxed text-sidebar-foreground/85 sm:text-lg">
                Know your strengths. Build your skills. Find your opportunity. An accessible career journey, built around you.
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
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-sidebar-foreground">
                <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-amber" aria-hidden="true" />Private by default</li>
                <li className="flex items-center gap-2"><BadgeCheck className="size-4 text-amber" aria-hidden="true" />Inclusive by design</li>
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

        <section aria-labelledby="path-heading" className="px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">ONE CONNECTED JOURNEY</p>
              <h2 id="path-heading" className="mt-3 text-3xl sm:text-4xl">Your career is a journey.<br />Not a one-time decision.</h2>
              <p className="mt-4 text-muted-foreground">Discover, learn, apply and grow. Each step brings you back with a clearer direction.</p>
            </div>
            <HomeStoryCarousel label="Career journey" slides={pathSteps.map((step, index) => ({ ...step, ...journeyVisuals[index % journeyVisuals.length]! }))} />
          </div>
        </section>

        <section aria-labelledby="openings-heading" className="border-y border-border bg-surface px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-semibold text-primary">MAKE YOUR NEXT MOVE</p><h2 id="openings-heading" className="mt-3 text-3xl sm:text-4xl">An opening for your ambition.</h2></div><Button asChild variant="outline"><Link to="/opportunities">All opportunities <ArrowUpRight aria-hidden="true" /></Link></Button></div>
            {opportunitiesPending ? <p className="mt-8 text-muted-foreground">Loading current opportunities…</p> : opportunitiesError ? <p role="alert" className="mt-8 text-destructive">Opportunities could not be loaded. Please try the full opportunities page.</p> : currentOpportunities.length ? <HomeOpportunityCarousel items={currentOpportunities} /> : <p className="mt-8 text-muted-foreground">No active openings right now. Explore learning and career roles while new opportunities arrive.</p>}
          </div>
        </section>

        <section aria-labelledby="features-heading" className="px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-6xl"><p className="text-sm font-semibold text-primary">EVERY PART OF YOUR PROGRESS</p><h2 id="features-heading" className="mt-3 text-3xl sm:text-4xl">One platform. Your possibilities.</h2>
            <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {homeFeatures.map((feature) => (
                <li key={feature.title} className="group flex flex-col border border-border bg-card p-6 transition-colors hover:border-primary/40">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft">
                    <feature.icon className="size-6 text-primary" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg">{feature.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                  <Button asChild variant="link" className="mt-4 h-auto w-fit whitespace-normal px-0 text-left">
                    <Link to={feature.to}>{feature.label}<ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" /></Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="start-heading" className="border-y border-border bg-primary-soft px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-semibold text-primary">START SMALL. GO FURTHER.</p>
            <h2 id="start-heading" className="mt-3 text-3xl sm:text-4xl">Your first three steps.</h2>
            <HomeStoryCarousel label="Getting started" slides={[
              { icon: GraduationCap, title: "Create your account", body: "Sign up as a student with your email or Google account.", to: signedIn ? dashboardPath : "/register", action: signedIn ? "Open workspace" : "Create account", image: startSignupImage, alt: "A student creating an account on a phone" },
              { icon: Fingerprint, title: "Make it personal", body: "Complete your profile and choose a career direction. Add support preferences if you wish.", to: "/onboarding", action: "Set up your profile", image: startProfileImage, alt: "A student completing her profile on a laptop" },
              { icon: BriefcaseBusiness, title: "Take your next step", body: "Start a lesson, find an opportunity or ask Sathi about your goals.", to: "/opportunities", action: "Find an opportunity", image: startNextImage, alt: "A student walking forward on campus" },
            ]} />
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
                         <a href={item.href} target="_blank" rel="noreferrer noopener" className="group flex min-h-24 items-start gap-4 py-4">
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

        <section aria-labelledby="achievements-heading" className="px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-primary">MOMENTS THAT KEEP US GOING</p>
              <h2 id="achievements-heading" className="mt-3 text-3xl sm:text-4xl">Early recognition on the journey.</h2>
              <p className="mt-4 text-muted-foreground">ABILITY360 started as a student team. These are milestones from that journey, shared here so every student on the platform knows where it began.</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <figure className="group overflow-hidden border-y border-border bg-card">
                <div className="overflow-hidden">
                  <img src={adhyayotsavPressImage} alt="Newspaper clipping about ABILITY360 winning first place at the E-Cell competition Ideautsav 3.0, with the winning team holding certificates" loading="lazy" width={1217} height={1293} className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                </div>
                <figcaption className="flex items-start gap-3 p-5 sm:p-6">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold">First place, Ideautsav 3.0</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">The ABILITY360 team won first place in the E-Cell competition at Dr. AITD, Kanpur, and the win was covered in the regional press.</span>
                  </span>
                </figcaption>
              </figure>
              <figure className="group overflow-hidden border-y border-border bg-card">
                <div className="overflow-hidden">
                  <img src={yuvaFutureTeamImage} alt="The ABILITY360 team with event lanyards at the Accessibility Track of the Yuva Future 6.0 competition, in front of the jury display board" loading="lazy" width={1600} height={900} className="h-full min-h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                </div>
                <figcaption className="flex items-start gap-3 p-5 sm:p-6">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold">Accessibility Track, Yuva Future 6.0</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">The team presented ABILITY360 in front of the jury on the Accessibility Track, taking the work to students and mentors beyond campus.</span>
                  </span>
                </figcaption>
              </figure>
            </div>
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
        <Button asChild variant="link" className="mt-4 h-auto px-0 text-amber"><Link to="/opportunities" hash={`opportunity-${item.id}`}>Review listing <ArrowRight aria-hidden="true" /></Link></Button>
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
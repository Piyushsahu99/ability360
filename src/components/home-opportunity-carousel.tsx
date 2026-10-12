import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, MapPin, Pause, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { formatDateIN } from "@/lib/india";
import { opportunityTypeLabels, workModeLabels, type Opportunity } from "@/lib/opportunities";

export function HomeOpportunityCarousel({ items }: { items: Opportunity[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const region = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches || document.documentElement.classList.contains("a11y-reduce-motion"));
    update();
    media.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const element = region.current;
    const visibility = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.15 });
    if (element) visibility.observe(element);
    return () => { media.removeEventListener("change", update); observer.disconnect(); visibility.disconnect(); };
  }, []);

  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update();
    api.on("select", update);
    return () => { api.off("select", update); };
  }, [api]);

  useEffect(() => {
    if (!api || paused || interacting || reducedMotion || !visible || items.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        if (api.canScrollNext()) api.scrollNext();
        else api.scrollTo(0);
      }
    }, 4500);
    return () => window.clearInterval(timer);
  }, [api, paused, interacting, reducedMotion, visible, items.length]);

  return (
    <div ref={region} onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
      <Carousel setApi={setApi} opts={{ align: "start", slidesToScroll: 1, loop: true }} aria-label="Current career opportunities" className="mt-8">
        <CarouselContent>
          {items.map((item, index) => (
            <CarouselItem key={item.id} className={items.length < 3 ? "basis-[88%] sm:basis-[60%]" : "basis-[88%] sm:basis-1/2 lg:basis-1/3"} aria-label={`${index + 1} of ${items.length}`}>
              <article className="home-listing flex h-full min-h-80 flex-col rounded-lg border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-soft font-display text-xl font-semibold text-primary" aria-hidden="true">{item.organisation.slice(0, 2).toUpperCase()}</span>
                  <Badge variant="secondary">{opportunityTypeLabels[item.type]}</Badge>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">{item.organisation}</p>
                <h3 className="mt-1 line-clamp-2 min-h-14 text-xl">{item.title}</h3>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" />{workModeLabels[item.mode]} · {item.location}</p>
                  <p className="flex items-center gap-2"><CalendarClock className="size-4 shrink-0" aria-hidden="true" />{item.deadline ? `Closes ${formatDateIN(item.deadline)}` : "Rolling applications"}</p>
                </div>
                {item.is_inclusive_employer ? <p className="mt-3 text-xs font-medium text-primary">Listed as an inclusive employer</p> : null}
                <Button asChild variant="link" className="mt-auto justify-between px-0 pt-6"><Link to="/opportunities" hash={`opportunity-${item.id}`} aria-label={`View ${item.title}`}>View opportunity <ArrowRight aria-hidden="true" /></Link></Button>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm tabular-nums text-muted-foreground">{String(current + 1).padStart(2, "0")} <span className="mx-2 text-border">/</span> {String(items.length).padStart(2, "0")}</p>
        <div className="flex gap-2">
          {!reducedMotion ? <Button size="icon" variant="outline" title={paused ? "Resume automatic slides" : "Pause automatic slides"} aria-label={paused ? "Resume automatic slides" : "Pause automatic slides"} onClick={() => setPaused(!paused)}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}</Button> : null}
          <Button size="icon" variant="outline" title="Previous opportunity" aria-label="Previous opportunity" disabled={items.length < 2} onClick={() => api?.scrollPrev()}><ArrowLeft aria-hidden="true" /></Button>
          <Button size="icon" variant="outline" title="Next opportunity" aria-label="Next opportunity" disabled={items.length < 2} onClick={() => api?.scrollNext()}><ArrowRight aria-hidden="true" /></Button>
        </div>
      </div>
    </div>
  );
}
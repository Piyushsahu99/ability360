import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Pause, Play, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

export type StorySlide = {
  icon: LucideIcon;
  title: string;
  body: string;
  to: string;
  action?: string;
  image: string;
  alt: string;
};

export function HomeStoryCarousel({ slides, label }: { slides: StorySlide[]; label: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const region = useRef<HTMLDivElement>(null);
  const interacting = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches || document.documentElement.classList.contains("a11y-reduce-motion"));
    update();
    media.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { media.removeEventListener("change", update); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update();
    api.on("select", update);
    return () => { api.off("select", update); };
  }, [api]);

  useEffect(() => {
    if (!api || paused || reduced) return;
    const timer = window.setInterval(() => {
      const bounds = region.current?.getBoundingClientRect();
      if (bounds && bounds.top < window.innerHeight && bounds.bottom > 0 && !interacting.current && document.visibilityState === "visible") api.scrollNext();
    }, 6000);
    return () => window.clearInterval(timer);
  }, [api, paused, reduced]);

  return (
    <div ref={region} className="mt-7 overflow-x-clip" onPointerEnter={() => { interacting.current = true; }} onPointerLeave={() => { interacting.current = false; }} onFocusCapture={() => { interacting.current = true; }} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) interacting.current = false; }}>
      <Carousel setApi={setApi} opts={{ loop: true, align: "start" }} aria-label={label}>
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={slide.title}>
              <article className="home-story-slide grid overflow-hidden border-y border-border bg-card md:grid-cols-2" aria-label={`${index + 1} of ${slides.length}`}>
                <div className="relative h-44 overflow-hidden sm:h-56 md:h-full">
                  <img src={slide.image} alt={slide.alt} loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute bottom-4 left-5 bg-background px-3 py-1 font-display text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
                </div>
                <div className="flex min-w-0 flex-col items-start justify-center p-6 sm:p-8 md:p-10">
                  <slide.icon className="size-8 shrink-0 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-2xl leading-tight sm:text-3xl">{slide.title}</h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">{slide.body}</p>
                  <Button asChild variant="link" className="mt-4 h-auto whitespace-normal px-0 text-left"><Link to={slide.to}>{slide.action ?? "Explore this step"}<ArrowRight className="shrink-0" aria-hidden="true" /></Link></Button>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1" aria-label={`${label} slide selection`}>
          {slides.map((slide, index) => <Button key={slide.title} size="icon" variant="ghost" className="size-8" aria-label={`Show ${slide.title}`} aria-pressed={current === index} title={slide.title} onClick={() => api?.scrollTo(index)}><span className={`h-1.5 rounded-full transition-all ${current === index ? "w-5 bg-primary" : "w-1.5 bg-border"}`} /></Button>)}
        </div>
        <div className="flex gap-1">
          {!reduced && <Button size="icon" variant="ghost" aria-label={paused ? `Resume ${label}` : `Pause ${label}`} title={paused ? "Resume slideshow" : "Pause slideshow"} onClick={() => setPaused(!paused)}>{paused ? <Play /> : <Pause />}</Button>}
          <Button size="icon" variant="outline" aria-label={`Previous ${label} slide`} title="Previous slide" onClick={() => api?.scrollPrev()}><ArrowLeft /></Button>
          <Button size="icon" variant="outline" aria-label={`Next ${label} slide`} title="Next slide" onClick={() => api?.scrollNext()}><ArrowRight /></Button>
        </div>
      </div>
    </div>
  );
}
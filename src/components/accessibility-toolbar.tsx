import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Accessibility, ChevronLeft, ChevronRight, Loader2, Mic, MicOff, Minus, Plus, RotateCcw, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { simplifyText } from "@/lib/access-ai.functions";
import {
  applyDisplaySettings,
  defaultDisplaySettings,
  readDisplaySettings,
  writeDisplaySettings,
  type DisplaySettings,
} from "@/lib/accessibility";

const scales: DisplaySettings["textScale"][] = ["normal", "large", "xlarge"];
const scaleLabels: Record<DisplaySettings["textScale"], string> = {
  normal: "Normal",
  large: "Large",
  xlarge: "Extra large",
};

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
function makeRecognition(): Rec | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return C ? new C() : null;
}

function mainText() {
  const main = document.querySelector("main") ?? document.body;
  return (main as HTMLElement).innerText.replace(/\s+\n/g, "\n").trim();
}

const voiceRoutes: [RegExp, string][] = [
  [/dashboard|home/, "/dashboard/student"],
  [/opportunit|internship|job/, "/opportunities"],
  [/application/, "/applications"],
  [/practice|interview/, "/practice"],
  [/accessibility dna|access|preference/, "/access"],
  [/roadmap/, "/roadmap"],
  [/passport|dna/, "/dna"],
  [/learn/, "/learn"],
  [/message/, "/messages"],
];

export function AccessibilityToolbar() {
  const [settings, setSettings] = useState<DisplaySettings>(defaultDisplaySettings);
  const [ready, setReady] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [guideIndex, setGuideIndex] = useState<number | null>(null);
  const [guideTargets, setGuideTargets] = useState<HTMLElement[]>([]);
  const [simplified, setSimplified] = useState<{ summary: string; points: string[] } | null>(null);
  const [simplifying, setSimplifying] = useState(false);
  const [support, setSupport] = useState({ speech: false, voice: false });
  const readingGuideRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<Rec | null>(null);
  const navigate = useNavigate();
  const simplifyFn = useServerFn(simplifyText);

  useEffect(() => {
    const stored = readDisplaySettings();
    setSettings(stored);
    applyDisplaySettings(stored);
    setReady(true);
    setSupport({ speech: "speechSynthesis" in window, voice: Boolean(makeRecognition()) });
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<DisplaySettings>).detail;
      if (detail) setSettings(detail);
    };
    window.addEventListener("ability360:a11y-change", onChange);
    return () => {
      window.removeEventListener("ability360:a11y-change", onChange);
      window.speechSynthesis?.cancel();
      recRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!settings.readingGuide) return;
    const moveGuide = (event: PointerEvent) => {
      readingGuideRef.current?.style.setProperty("--reading-guide-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", moveGuide, { passive: true });
    return () => window.removeEventListener("pointermove", moveGuide);
  }, [settings.readingGuide]);

  function update(patch: Partial<DisplaySettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeDisplaySettings(next);
  }

  function step(direction: 1 | -1) {
    const index = scales.indexOf(settings.textScale);
    const next = scales[Math.min(scales.length - 1, Math.max(0, index + direction))] ?? "normal";
    update({ textScale: next });
  }

  function speak(text: string) {
    window.speechSynthesis.cancel();
    const chunks = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text];
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = "en-IN";
      if (i === chunks.length - 1) u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    });
    setSpeaking(true);
  }

  function toggleRead() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    speak(mainText().slice(0, 20000));
  }

  async function simplify() {
    const text = mainText().slice(0, 6000);
    if (text.length < 20) { toast.info("There isn't enough text on this page to simplify."); return; }
    setSimplifying(true);
    try {
      setSimplified(await simplifyFn({ data: { text } }));
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(/unauthori/i.test(msg) ? "Sign in to use Simplify this page." : msg);
    } finally {
      setSimplifying(false);
    }
  }

  function startGuide() {
    const main = document.querySelector("main") ?? document.body;
    const targets = Array.from(main.querySelectorAll<HTMLElement>("h1, h2, h3")).filter((el) => el.offsetParent !== null);
    if (targets.length === 0) { toast.info("No sections found on this page."); return; }
    setGuideTargets(targets);
    goGuide(0, targets);
  }

  function goGuide(i: number, targets = guideTargets) {
    const el = targets[i];
    if (!el) return;
    document.querySelectorAll(".a11y-guide-target").forEach((n) => n.classList.remove("a11y-guide-target"));
    el.classList.add("a11y-guide-target");
    el.tabIndex = -1;
    el.scrollIntoView({ block: "center", behavior: settings.reduceMotion ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
    setGuideIndex(i);
  }

  function endGuide() {
    document.querySelectorAll(".a11y-guide-target").forEach((n) => n.classList.remove("a11y-guide-target"));
    setGuideIndex(null);
  }

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = makeRecognition();
    if (!rec) return;
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = e.results[e.results.length - 1]?.[0].transcript.toLowerCase().trim() ?? "";
      if (!said) return;
      if (/^(stop|quiet|silence)/.test(said)) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
      if (/read/.test(said)) { speak(mainText().slice(0, 20000)); return; }
      if (/scroll down|down/.test(said)) { window.scrollBy({ top: window.innerHeight * 0.7 }); return; }
      if (/scroll up|up/.test(said)) { window.scrollBy({ top: -window.innerHeight * 0.7 }); return; }
      if (/bigger|larger|increase/.test(said)) { step(1); return; }
      if (/smaller|decrease/.test(said)) { step(-1); return; }
      if (/contrast/.test(said)) { update({ highContrast: !settings.highContrast }); return; }
      const route = voiceRoutes.find(([re]) => re.test(said));
      if (route && /go|open|show|take/.test(said)) {
        void navigate({ to: route[1] });
        toast.success(`Opening ${route[1]}`);
        return;
      }
      toast.info(`Heard “${said}”. Try “go to opportunities”, “read page” or “scroll down”.`);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
    toast.success("Voice commands on. Say “go to opportunities”, “read page”, “scroll down” or “stop”.");
  }

  if (!ready) return null;

  const toggles: { key: keyof DisplaySettings; label: string; hint: string }[] = [
    { key: "highContrast", label: "High contrast", hint: "Stronger colours and borders" },
    { key: "keyboardNav", label: "Keyboard navigation", hint: "Highly visible focus for Tab navigation" },
    { key: "reduceMotion", label: "Reduce motion", hint: "Stops animation and transitions" },
    { key: "captions", label: "Captions & transcripts", hint: "Turns on captions on videos where available" },
    { key: "dyslexicFont", label: "Readable font", hint: "Wider letter and word spacing" },
    { key: "underlineLinks", label: "Underline links", hint: "Links never rely on colour alone" },
    { key: "textSpacing", label: "Extra text spacing", hint: "Adds space between letters and words" },
    { key: "comfortableReading", label: "Comfortable reading", hint: "Increases line height for longer text" },
    { key: "largeCursor", label: "Larger cursor", hint: "Makes the pointer easier to locate" },
    { key: "strongFocus", label: "Strong keyboard focus", hint: "Makes the selected control more visible" },
    { key: "hideDecorativeImages", label: "Hide decorative images", hint: "Removes non-essential visual decoration" },
    { key: "readingGuide", label: "Reading guide", hint: "Highlights the line under your pointer" },
  ];

  return (
    <>
      {settings.readingGuide ? (
        <div ref={readingGuideRef} className="a11y-reading-guide-bar" aria-hidden="true" />
      ) : null}

      {guideIndex !== null && (
        <div role="region" aria-label="Guided navigation" className="fixed inset-x-0 bottom-20 z-50 mx-auto flex w-[min(28rem,calc(100vw-2rem))] items-center gap-2 rounded-full border border-border bg-card p-2 shadow-lg">
          <Button size="icon" variant="ghost" className="size-11" aria-label="Previous section" disabled={guideIndex === 0} onClick={() => goGuide(guideIndex - 1)}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <p className="flex-1 truncate text-center text-sm" aria-live="polite">
            {guideIndex + 1} / {guideTargets.length}: {guideTargets[guideIndex]?.innerText}
          </p>
          <Button size="icon" variant="ghost" className="size-11" aria-label="Next section" disabled={guideIndex >= guideTargets.length - 1} onClick={() => goGuide(guideIndex + 1)}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          <Button size="icon" variant="ghost" className="size-11" aria-label="End guided navigation" onClick={endGuide}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}

      <Sheet open={simplified !== null} onOpenChange={(o) => !o && setSimplified(null)}>
        <SheetContent side="right" className="w-[min(28rem,100vw)] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>This page in simple words</SheetTitle>
            <SheetDescription>Written by AI from the text on this page. Check important details on the page itself.</SheetDescription>
          </SheetHeader>
          {simplified && (
            <div className="mt-4 space-y-3 px-4 text-base">
              <p>{simplified.summary}</p>
              <ul className="list-disc space-y-1.5 pl-5">
                {simplified.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              {support.speech && (
                <Button variant="outline" className="min-h-11" onClick={() => speak(`${simplified.summary} ${simplified.points.join(" ")}`)}>
                  <Volume2 className="size-4" aria-hidden="true" /> Read this aloud
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            className="fixed bottom-4 right-4 z-50 size-12 rounded-full shadow-lg"
            aria-label="Open Access Mode"
          >
            <Accessibility className="size-6" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="max-h-[min(40rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto">
          <h2 className="text-sm font-semibold">Access Mode</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Saved on this device and to your account when signed in.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="min-h-11 justify-start" onClick={toggleRead} disabled={!support.speech} aria-pressed={speaking}>
              {speaking ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
              {speaking ? "Stop reading" : "Read page aloud"}
            </Button>
            <Button type="button" variant="outline" className="min-h-11 justify-start" onClick={simplify} disabled={simplifying}>
              {simplifying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
              Simplify page
            </Button>
            <Button type="button" variant="outline" className="min-h-11 justify-start" onClick={startGuide}>
              <ChevronRight className="size-4" aria-hidden="true" />
              Guided navigation
            </Button>
            <Button type="button" variant="outline" className="min-h-11 justify-start" onClick={toggleVoice} disabled={!support.voice} aria-pressed={listening}>
              {listening ? <MicOff className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
              {listening ? "Stop voice" : "Voice commands"}
            </Button>
          </div>
          {(!support.speech || !support.voice) && (
            <p className="mt-2 text-xs text-muted-foreground">Some voice features aren't supported by this browser.</p>
          )}

          <div className="mt-4">
            <Label className="text-xs font-medium">Text size</Label>
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" className="size-11" onClick={() => step(-1)} disabled={settings.textScale === "normal"} aria-label="Decrease text size">
                <Minus className="size-4" aria-hidden="true" />
              </Button>
              <span className="flex-1 text-center text-sm" aria-live="polite">{scaleLabels[settings.textScale]}</span>
              <Button type="button" variant="outline" size="icon" className="size-11" onClick={() => step(1)} disabled={settings.textScale === "xlarge"} aria-label="Increase text size">
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {toggles.map((toggle) => (
              <li key={toggle.key} className="flex items-start justify-between gap-3">
                <div>
                  <Label htmlFor={`a11y-${toggle.key}`} className="text-sm">{toggle.label}</Label>
                  <p className="text-xs text-muted-foreground">{toggle.hint}</p>
                </div>
                <Switch
                  id={`a11y-${toggle.key}`}
                  checked={Boolean(settings[toggle.key])}
                  onCheckedChange={(checked) => update({ [toggle.key]: checked } as Partial<DisplaySettings>)}
                />
              </li>
            ))}
          </ul>

          <Button type="button" variant="ghost" className="mt-4 min-h-11 w-full" onClick={() => update(defaultDisplaySettings)}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Reset to defaults
          </Button>
          <a href="/experience" className="mt-1 block text-center text-xs text-primary underline-offset-2 hover:underline">
            Explore how ABILITY360 adapts
          </a>
        </PopoverContent>
      </Popover>
    </>
  );
}

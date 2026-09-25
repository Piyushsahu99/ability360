import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Circle, Loader2, Mic, MicOff, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DashboardShell, PanelCard } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { practiceFeedback, type PracticeFeedback } from "@/lib/access-ai.functions";
import { studentNav } from "@/lib/nav";

export const Route = createFileRoute("/_authenticated/practice")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Communication Practice — ABILITY360" },
      { name: "description", content: "Practise interview answers by text or voice and get fair feedback on structure, relevance and content." },
      { property: "og:title", content: "Communication Practice — ABILITY360" },
      { property: "og:description", content: "Interview practice that never judges accent, voice or speech differences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PracticePage,
});

const questionBank: Record<string, string[]> = {
  "Behavioural (STAR)": [
    "Tell me about a time you solved a difficult problem in a team.",
    "Describe a situation where you had to learn something new quickly.",
    "Tell me about a time you handled a disagreement professionally.",
  ],
  Technical: [
    "Explain a project you built and the main technical decisions you made.",
    "How would you explain an API to someone non-technical?",
    "Describe how you debug a problem you have never seen before.",
  ],
  "About you": [
    "Tell me about yourself and why this role interests you.",
    "What are you most proud of from your studies so far?",
    "How do you prefer to work, and what helps you do your best?",
  ],
};

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognition(): SpeechRec | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function PracticePage() {
  const run = useServerFn(practiceFeedback);
  const [category, setCategory] = useState("Behavioural (STAR)");
  const [question, setQuestion] = useState(questionBank["Behavioural (STAR)"]![0]!);
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => setVoiceSupported(Boolean(getRecognition())), []);

  const mutation = useMutation({ mutationFn: () => run({ data: { question, answer } }) });
  const fb = mutation.data as PracticeFeedback | undefined;

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i]!.isFinal) text += e.results[i]![0].transcript;
      if (text) setAnswer((a) => (a ? `${a} ${text.trim()}` : text.trim()));
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  const star = fb?.star;

  return (
    <DashboardShell role="student" title="Communication Practice" subtitle="Prepare at your own pace, by text or voice." nav={studentNav("/practice")}>
      <div className="flex gap-2 rounded-xl border border-border bg-primary-soft p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          Feedback covers only <strong>structure, relevance, completeness, technical content and organisation</strong>. It never scores
          accent, speech differences, voice, personality, facial expressions or eye contact. There is no timer.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelCard title="Your question" description="Pick a question type, then answer however suits you.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="q-cat">Question type</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v); setQuestion(questionBank[v]![0]!); mutation.reset(); }}>
                <SelectTrigger id="q-cat" className="mt-1.5 min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(questionBank).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="q-pick">Question</Label>
              <Select value={question} onValueChange={(v) => { setQuestion(v); mutation.reset(); }}>
                <SelectTrigger id="q-pick" className="mt-1.5 min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{questionBank[category]!.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-4 rounded-md bg-surface p-3 font-medium">{question}</p>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">STAR guidance</summary>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Situation</strong> — the context, briefly.</li>
              <li><strong className="text-foreground">Task</strong> — what you needed to achieve.</li>
              <li><strong className="text-foreground">Action</strong> — what <em>you</em> did, step by step.</li>
              <li><strong className="text-foreground">Result</strong> — the outcome and what you learned.</li>
            </ul>
          </details>
          <div className="mt-4">
            <Label htmlFor="answer">Your answer</Label>
            <Textarea id="answer" rows={8} maxLength={4000} className="mt-1.5" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type, or use voice if your browser supports it." />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button className="min-h-11" disabled={answer.trim().length < 10 || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Get feedback
            </Button>
            {voiceSupported ? (
              <Button variant="outline" className="min-h-11" onClick={toggleVoice} aria-pressed={listening}>
                {listening ? <MicOff className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
                {listening ? "Stop dictation" : "Answer by voice"}
              </Button>
            ) : (
              <p className="self-center text-xs text-muted-foreground">Voice answers aren't supported in this browser — typing works everywhere.</p>
            )}
          </div>
          {listening && <p role="status" className="mt-2 text-sm text-primary">Listening… your words appear in the box.</p>}
        </PanelCard>

        <PanelCard title="Feedback" description="Specific and fair — focused on what you said, not how.">
          {mutation.isError && <p role="alert" className="text-sm text-destructive">{(mutation.error as Error).message}</p>}
          {!fb && !mutation.isError && <p className="text-sm text-muted-foreground">{mutation.isPending ? "Reading your answer…" : "Your feedback will appear here."}</p>}
          {fb && (
            <div className="space-y-4 text-sm" aria-live="polite">
              <div>
                <h3 className="text-xs font-semibold">STAR coverage</h3>
                <ul className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["situation", "task", "action", "result"] as const).map((k) => (
                    <li key={k} className="flex items-center gap-1.5 capitalize">
                      {star?.[k] ? <CheckCircle2 className="size-4 text-teal" aria-hidden="true" /> : <Circle className="size-4 text-muted-foreground" aria-hidden="true" />}
                      {k}<span className="sr-only">{star?.[k] ? " covered" : " missing"}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {([
                ["Structure", fb.structure],
                ["Relevance", fb.relevance],
                ["Completeness", fb.completeness],
                ["Technical content", fb.technical],
                ["Organisation", fb.organisation],
              ] as const).map(([label, text]) => (
                <div key={label}>
                  <h3 className="text-xs font-semibold">{label}</h3>
                  <p className="mt-0.5">{text}</p>
                </div>
              ))}
              <div className="rounded-md border-l-4 border-primary bg-surface p-3">
                <h3 className="text-xs font-semibold">Try next</h3>
                <p className="mt-0.5">{fb.next_step}</p>
              </div>
            </div>
          )}
        </PanelCard>
      </div>
    </DashboardShell>
  );
}

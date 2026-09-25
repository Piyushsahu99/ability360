import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Accessibility, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PanelCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  accessDnaQueryOptions,
  accommodationStatusLabels,
  accommodationSupports,
  draftAccommodationRequest,
  myAccommodationsQueryOptions,
  sendAccommodation,
  suggestedSupportsFromDna,
  withdrawAccommodation,
  type AccommodationStatus,
} from "@/lib/access";

export function AccommodationRequestPanel({
  applicationId,
  opportunityTitle,
}: {
  applicationId: string;
  opportunityTitle: string;
}) {
  const queryClient = useQueryClient();
  const { data: dna } = useQuery(accessDnaQueryOptions);
  const { data: mine, isPending } = useQuery(myAccommodationsQueryOptions);
  const existing = (mine ?? []).find((a) => a.application_id === applicationId);

  const [wants, setWants] = useState(false);
  const [supports, setSupports] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!wants || supports.length > 0) return;
    const suggested = suggestedSupportsFromDna(dna);
    setSupports(suggested);
    setText(draftAccommodationRequest(opportunityTitle, suggested));
  }, [wants, dna, opportunityTitle, supports.length]);

  function toggle(key: string, checked: boolean) {
    const next = checked ? [...supports, key] : supports.filter((s) => s !== key);
    setSupports(next);
    setText(draftAccommodationRequest(opportunityTitle, next));
    setApproved(false);
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["access", "accommodations"] });

  const send = useMutation({
    mutationFn: () => sendAccommodation({ applicationId, supports, text }),
    onSuccess: () => {
      toast.success("Accommodation request sent to this employer only");
      setWants(false);
      setApproved(false);
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const withdraw = useMutation({
    mutationFn: () => withdrawAccommodation(existing!.id),
    onSuccess: () => {
      toast.success("Request withdrawn");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending) return null;

  return (
    <PanelCard
      title="Need an accessibility accommodation?"
      description="Optional. Only the text you approve is shared, and only with this employer."
    >
      {existing && existing.status !== "withdrawn" && !wants ? (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {accommodationStatusLabels[existing.status as AccommodationStatus]}
            </Badge>
          </div>
          <blockquote className="rounded-md border-l-4 border-primary bg-surface p-3">{existing.request_text}</blockquote>
          {existing.employer_response && (
            <div>
              <p className="text-xs font-semibold">Employer response</p>
              <p className="mt-1 whitespace-pre-wrap">{existing.employer_response}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="min-h-11" onClick={() => {
              setSupports(existing.supports);
              setText(existing.request_text);
              setWants(true);
            }}>
              Edit & resend
            </Button>
            <Button variant="ghost" className="min-h-11" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
              Withdraw request
            </Button>
          </div>
        </div>
      ) : !wants ? (
        <Button variant="outline" className="min-h-11" onClick={() => setWants(true)}>
          <Accessibility className="size-4" aria-hidden="true" />
          Yes, request an accommodation
        </Button>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!approved) {
              toast.error("Please review and approve the message first.");
              return;
            }
            send.mutate();
          }}
        >
          <fieldset>
            <legend className="text-sm font-medium">Supports that would help</legend>
            <p className="text-xs text-muted-foreground">Pre-selected from your Accessibility DNA. Change anything.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {accommodationSupports.map((s) => (
                <label key={s.key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border px-3">
                  <Checkbox checked={supports.includes(s.key)} onCheckedChange={(c) => toggle(s.key, c === true)} />
                  <span className="text-sm">{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <Label htmlFor={`acc-text-${applicationId}`}>Your message (edit freely)</Label>
            <Textarea
              id={`acc-text-${applicationId}`}
              rows={5}
              className="mt-1.5"
              value={text}
              maxLength={1500}
              onChange={(e) => {
                setText(e.target.value);
                setApproved(false);
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Never include diagnosis or medical details unless you choose to. Describe only what would help.
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={approved} onCheckedChange={(c) => setApproved(c === true)} className="mt-0.5" />
            I have reviewed this message and approve sending it to this employer for this application only.
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="min-h-11" disabled={send.isPending || !approved || text.trim().length < 10}>
              {send.isPending ? "Sending…" : "Send request"}
            </Button>
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => setWants(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </PanelCard>
  );
}

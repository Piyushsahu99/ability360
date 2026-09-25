import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PanelCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  accommodationStatusLabels,
  accommodationSupports,
  employerAccommodationQueryOptions,
  inclusiveSetup,
  respondToAccommodation,
  type AccommodationStatus,
} from "@/lib/access";

const actions: { status: AccommodationStatus; label: string; needsText?: boolean }[] = [
  { status: "accepted", label: "Accept" },
  { status: "clarification", label: "Request clarification", needsText: true },
  { status: "alternative", label: "Offer alternative", needsText: true },
  { status: "arranged", label: "Mark as arranged" },
];

export function EmployerAccommodationPanel({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(employerAccommodationQueryOptions(applicationId));
  const [response, setResponse] = useState("");

  const mutation = useMutation({
    mutationFn: (status: AccommodationStatus) => respondToAccommodation(data!.id, status, response || data!.employer_response || ""),
    onSuccess: () => {
      toast.success("Accommodation status recorded");
      void queryClient.invalidateQueries({ queryKey: ["access", "accommodations", "application", applicationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isPending || !data || data.status === "withdrawn") return null;
  const setup = inclusiveSetup(data.supports);
  const history = (data.history ?? []) as { to: string; at: string }[];

  return (
    <PanelCard
      title="Candidate Accessibility Request"
      description="Shared by the candidate for this application only. Use it only to arrange support."
    >
      <div className="space-y-4 text-sm">
        <Badge variant="outline">{accommodationStatusLabels[data.status as AccommodationStatus]}</Badge>
        <blockquote className="rounded-md border-l-4 border-primary bg-surface p-3">{data.request_text}</blockquote>
        {data.supports.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Requested supports">
            {data.supports.map((s) => (
              <li key={s}>
                <Badge variant="secondary" className="font-normal">
                  {accommodationSupports.find((x) => x.key === s)?.label ?? s}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        {setup.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold">Suggested inclusive interview setup</h4>
            <ul className="mt-1 space-y-1">
              {setup.map((line) => (
                <li key={line} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <Label htmlFor={`acc-resp-${applicationId}`}>Your response to the candidate</Label>
          <Textarea
            id={`acc-resp-${applicationId}`}
            rows={3}
            className="mt-1.5"
            maxLength={1500}
            placeholder={data.employer_response ?? "e.g. We'll hold the interview on video with captions on."}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button
              key={a.status}
              size="sm"
              className="min-h-11"
              variant={data.status === a.status ? "default" : "outline"}
              disabled={mutation.isPending || (a.needsText && !response.trim() && !data.employer_response)}
              onClick={() => mutation.mutate(a.status)}
            >
              {a.label}
            </Button>
          ))}
        </div>
        {history.length > 0 && (
          <p className="text-xs text-muted-foreground">
            History: {history.map((h) => `${accommodationStatusLabels[h.to as AccommodationStatus] ?? h.to} (${new Date(h.at).toLocaleDateString("en-IN")})`).join(" → ")}
          </p>
        )}
      </div>
    </PanelCard>
  );
}

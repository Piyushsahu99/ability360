import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState, PanelCard } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { decidePwd, pwdDocumentUrl, pwdQueueQueryOptions } from "@/lib/verification";

export function PwdReviewQueue() {
  const qc = useQueryClient();
  const { data } = useQuery(pwdQueueQueryOptions);
  const decide = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      decidePwd(id, approve, approve ? undefined : window.prompt("Reason shown to the student (optional)") ?? undefined),
    onSuccess: (_d, v) => {
      toast.success(v.approve ? "PWD badge granted" : "Request rejected");
      void qc.invalidateQueries({ queryKey: ["admin", "pwd-queue"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function view(path: string) {
    try {
      window.open(await pwdDocumentUrl(path), "_blank", "noopener");
    } catch {
      toast.error("Couldn't open the card.");
    }
  }

  return (
    <PanelCard title="PWD card reviews" description="Check the UDID card against the number, then grant the Verified PWD badge.">
      {data && data.length > 0 ? (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.student_id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{r.profiles?.full_name || "Student"}</p>
              <p className="break-all text-xs text-muted-foreground">UDID: {r.udid_number}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="min-h-11" onClick={() => void view(r.storage_path)}>View card</Button>
                <Button size="sm" className="min-h-11" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.student_id, approve: true })}>Verify</Button>
                <Button size="sm" variant="outline" className="min-h-11" disabled={decide.isPending} onClick={() => decide.mutate({ id: r.student_id, approve: false })}>Reject</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message="No PWD cards waiting for review." />
      )}
    </PanelCard>
  );
}

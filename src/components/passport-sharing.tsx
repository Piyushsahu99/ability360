import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PanelCard } from "@/components/dashboard-shell";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  passportCategories,
  passportSharingQueryOptions,
  savePassportSharing,
  type PassportCategory,
} from "@/lib/access";

export function PassportSharingPanel() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(passportSharingQueryOptions());
  const mutation = useMutation({
    mutationFn: (next: Record<PassportCategory, boolean>) => savePassportSharing(next),
    onSuccess: () => {
      toast.success("Passport sharing updated");
      void queryClient.invalidateQueries({ queryKey: ["access", "passport-sharing"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PanelCard
      title="Ability Passport privacy"
      description="Choose what employers you apply to can see. Nothing is ever public."
    >
      {isPending || !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {passportCategories.map((c) => (
            <li key={c.key} className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
              <Label htmlFor={`share-${c.key}`} className="text-sm">
                {c.label}
                {c.key === "accommodations" && (
                  <span className="block text-xs font-normal text-muted-foreground">Off unless you turn it on</span>
                )}
              </Label>
              <Switch
                id={`share-${c.key}`}
                checked={data[c.key]}
                disabled={mutation.isPending}
                onCheckedChange={(checked) => mutation.mutate({ ...data, [c.key]: checked })}
              />
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

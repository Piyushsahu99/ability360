import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  contactMessageSchema,
  sendCompanyMessage,
  type ContactMessageValues,
} from "@/lib/company-contact";

const empty: ContactMessageValues = { subject: "", body: "", reply_email: "" };

export function ContactEmployerDialog({
  companyId,
  organisation,
  opportunityId,
  opportunityTitle,
}: {
  companyId: string;
  organisation: string;
  opportunityId?: string | null;
  opportunityTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ContactMessageValues>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      sendCompanyMessage({ companyId, opportunityId: opportunityId ?? null, values }),
    onSuccess: () => {
      toast.success("Message sent to the employer");
      setValues(empty);
      setErrors({});
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function set<K extends keyof ContactMessageValues>(key: K, value: ContactMessageValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = contactMessageSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Mail className="size-4" aria-hidden="true" />
          Contact employer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact {organisation}</DialogTitle>
          <DialogDescription>
            {opportunityTitle
              ? `Your question goes straight to the team hiring for ${opportunityTitle}.`
              : "Your question goes straight to this employer on ABILITY360."}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={submit}>
          <div>
            <Label htmlFor="contact-subject">Subject</Label>
            <Input
              id="contact-subject"
              value={values.subject}
              maxLength={120}
              onChange={(event) => set("subject", event.target.value)}
              className="mt-1.5"
            />
            {errors["subject"] && (
              <p className="mt-1 text-xs text-destructive">{errors["subject"]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contact-body">Your message</Label>
            <Textarea
              id="contact-body"
              rows={5}
              maxLength={2000}
              value={values.body}
              onChange={(event) => set("body", event.target.value)}
              className="mt-1.5"
            />
            {errors["body"] && <p className="mt-1 text-xs text-destructive">{errors["body"]}</p>}
          </div>

          <div>
            <Label htmlFor="contact-reply">Reply-to email (optional)</Label>
            <Input
              id="contact-reply"
              type="email"
              maxLength={255}
              value={values.reply_email}
              onChange={(event) => set("reply_email", event.target.value)}
              className="mt-1.5"
            />
            {errors["reply_email"] && (
              <p className="mt-1 text-xs text-destructive">{errors["reply_email"]}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
              {mutation.isPending ? "Sending…" : "Send message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

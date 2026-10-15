import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock, Mail, Phone, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PanelCard } from "@/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmPhoneCode,
  resendEmailVerification,
  startPhoneVerification,
  submitPwdVerification,
  verificationStatusQueryOptions,
} from "@/lib/verification";

export function PwdVerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success ${className}`}
      title="PWD status verified from a government-issued UDID card"
    >
      <BadgeCheck className="size-4" aria-hidden="true" />
      Verified PWD
    </span>
  );
}

export function VerificationPanel() {
  const qc = useQueryClient();
  const { data } = useQuery(verificationStatusQueryOptions);
  const [udid, setUdid] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["verification", "me"] });

  const pwd = useMutation({
    mutationFn: () => {
      if (!data || !file) throw new Error("Choose a photo or PDF of your UDID card.");
      return submitPwdVerification(data.userId, udid, file);
    },
    onSuccess: () => {
      toast.success("Card sent for review. We'll add your badge once it's checked.");
      setFile(null);
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const email = useMutation({
    mutationFn: () => resendEmailVerification(data!.email),
    onSuccess: () => toast.success("Verification link sent. Check your inbox."),
    onError: (e: Error) => toast.error(e.message),
  });
  const sendCode = useMutation({
    mutationFn: () => startPhoneVerification(data!.userId, phone || data!.phone),
    onSuccess: (p) => {
      setPendingPhone(p);
      toast.success("We sent a 6-digit code by SMS.");
    },
    onError: (e: Error) => {
      toast.error(e.message);
      void refresh();
    },
  });
  const verifyCode = useMutation({
    mutationFn: () => confirmPhoneCode(pendingPhone!, code),
    onSuccess: () => {
      toast.success("Mobile number verified");
      setPendingPhone(null);
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data) return null;
  const status = data.pwd?.status;

  return (
    <PanelCard title="Verification" description="Verified details build trust with employers. Your card is never shown to anyone except our review team.">
      <div className="space-y-5 text-sm">
        <section aria-labelledby="v-email" className="space-y-2">
          <h3 id="v-email" className="flex items-center gap-2 font-semibold"><Mail className="size-4" aria-hidden="true" />Email</h3>
          <p className="break-all text-muted-foreground">{data.email}</p>
          {data.emailVerified ? (
            <Badge className="gap-1"><BadgeCheck className="size-3.5" aria-hidden="true" />Verified</Badge>
          ) : (
            <Button size="sm" variant="outline" className="min-h-11" disabled={email.isPending} onClick={() => email.mutate()}>Send verification link</Button>
          )}
        </section>

        <section aria-labelledby="v-phone" className="space-y-2 border-t border-border pt-4">
          <h3 id="v-phone" className="flex items-center gap-2 font-semibold"><Phone className="size-4" aria-hidden="true" />Mobile number</h3>
          {data.phoneVerified ? (
            <p className="flex items-center gap-2">{data.phone}<Badge className="gap-1"><BadgeCheck className="size-3.5" aria-hidden="true" />Verified</Badge></p>
          ) : pendingPhone ? (
            <div className="space-y-2">
              <Label htmlFor="otp">Code sent to {pendingPhone}</Label>
              <Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              <Button size="sm" className="min-h-11" disabled={code.length !== 6 || verifyCode.isPending} onClick={() => verifyCode.mutate()}>Verify code</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="phone">Your mobile number</Label>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" defaultValue={data.phone} onChange={(e) => setPhone(e.target.value.replace(/\s/g, ""))} />
              <Button size="sm" variant="outline" className="min-h-11" disabled={sendCode.isPending} onClick={() => sendCode.mutate()}>Send code</Button>
            </div>
          )}
        </section>

        <section aria-labelledby="v-pwd" className="space-y-2 border-t border-border pt-4">
          <h3 id="v-pwd" className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4" aria-hidden="true" />PWD verification (optional)</h3>
          {status === "verified" ? (
            <PwdVerifiedBadge />
          ) : status === "pending" ? (
            <p className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" aria-hidden="true" />Your UDID card is being reviewed.</p>
          ) : (
            <>
              {status === "rejected" && (
                <p className="flex items-start gap-2 text-destructive"><XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Not approved{data.pwd?.review_note ? `: ${data.pwd.review_note}` : ""}. You can upload again.</p>
              )}
              <p className="text-muted-foreground">Upload your government UDID card to get a green "Verified PWD" tick. This is your choice and never lowers your matches.</p>
              <Label htmlFor="udid">UDID number</Label>
              <Input id="udid" value={udid} onChange={(e) => setUdid(e.target.value)} placeholder="As printed on your card" />
              <Label htmlFor="udid-file">Photo or PDF of the card (max 5 MB)</Label>
              <Input id="udid-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <Button size="sm" className="min-h-11" disabled={pwd.isPending || !udid || !file} onClick={() => pwd.mutate()}>{pwd.isPending ? "Uploading…" : "Submit for verification"}</Button>
            </>
          )}
        </section>
      </div>
    </PanelCard>
  );
}

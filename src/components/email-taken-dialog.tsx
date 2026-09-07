import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  email: string;
  onUseDifferentEmail: () => void;
};

export function EmailTakenDialog({ open, email, onUseDifferentEmail }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onUseDifferentEmail())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>This email is already registered</DialogTitle>
          <DialogDescription>
            {email ? `${email} already has an ABILITY360 account. ` : ""}
            Please sign in instead. We have not sent a new confirmation email.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={onUseDifferentEmail}
          >
            Use a different email
          </Button>
          <Button asChild className="min-h-11 w-full sm:w-auto">
            <Link to="/login">Sign in</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

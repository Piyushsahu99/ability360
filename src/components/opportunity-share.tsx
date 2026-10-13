import { Link } from "@tanstack/react-router";
import { ExternalLink, Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth";
import type { Opportunity } from "@/lib/opportunities";

export function shareUrl(id: string) {
  const origin = typeof window === "undefined" ? "https://ability360.lovable.app" : window.location.origin;
  return `${origin}/o/${id}`;
}

export function OfficialSiteButton({ opportunity }: { opportunity: Opportunity }) {
  const { data: session } = useSession();
  if (!opportunity.apply_url) return null;
  if (!session) {
    return (
      <Button asChild size="sm">
        <Link to="/register" search={{ next: `/o/${opportunity.id}` }}>
          Sign up to open official website
        </Link>
      </Button>
    );
  }
  return (
    <Button asChild size="sm">
      <a href={opportunity.apply_url} target="_blank" rel="noopener noreferrer">
        Official website <ExternalLink aria-hidden="true" />
      </a>
    </Button>
  );
}

export function ShareButton({ opportunity }: { opportunity: Opportunity }) {
  const url = shareUrl(opportunity.id);
  const text = `${opportunity.title} at ${opportunity.organisation} — found on ABILITY360`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied — send it to your friends");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }
  async function nativeShare() {
    if (navigator.share) {
      try { await navigator.share({ title: opportunity.title, text, url }); } catch { /* cancelled */ }
    } else copy();
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" aria-label={`Share ${opportunity.title}`}>
          <Share2 aria-hidden="true" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={nativeShare}><Share2 aria-hidden="true" /> Share…</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden="true" /> WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={copy}><Link2 aria-hidden="true" /> Copy link</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OpportunityShareActions({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="flex flex-wrap gap-2">
      <OfficialSiteButton opportunity={opportunity} />
      <ShareButton opportunity={opportunity} />
    </div>
  );
}

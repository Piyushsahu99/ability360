import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_opportunities",
  title: "Search opportunities",
  description:
    "Search published internships, jobs, training and research opportunities on ABILITY360 by keyword, type or work mode.",
  inputSchema: {
    query: z.string().max(100).optional().describe("Keyword matched against title, organisation or location"),
    type: z
      .enum(["internship", "job", "project", "training", "apprenticeship", "challenge", "mentorship"])
      .optional(),
    mode: z.enum(["onsite", "remote", "hybrid"]).optional(),
    inclusive_only: z.boolean().optional().describe("Only employers that publish accommodations"),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (args, ctx) => {
    const db = supabaseForUser(ctx);
    let q = db
      .from("opportunities")
      .select("id, title, organisation, location, type, mode, stipend, deadline, is_inclusive_employer, tags")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(args.limit ?? 20);
    if (args.type) q = q.eq("type", args.type);
    if (args.mode) q = q.eq("mode", args.mode);
    if (args.inclusive_only) q = q.eq("is_inclusive_employer", true);
    if (args.query) {
      const t = args.query.replace(/[%,()]/g, " ").trim();
      if (t) q = q.or(`title.ilike.%${t}%,organisation.ilike.%${t}%,location.ilike.%${t}%`);
    }
    const { data, error } = await q;
    if (error) return { isError: true, content: [{ type: "text", text: error.message }] };
    const items = (data ?? []).map((o) => ({
      id: o.id,
      title: o.title,
      organisation: o.organisation,
      location: o.location,
      type: String(o.type),
      mode: String(o.mode),
      stipend: o.stipend == null ? null : String(o.stipend),
      deadline: o.deadline ?? null,
      inclusive_employer: Boolean(o.is_inclusive_employer),
      tags: [...(o.tags ?? [])],
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { items },
    };
  },
});

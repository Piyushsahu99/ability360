import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_career_roles",
  title: "List career roles",
  description:
    "List career roles on ABILITY360 with salary ranges in LPA (Indian rupees), key skills and demand. Optionally filter by course or keyword.",
  inputSchema: {
    query: z.string().max(100).optional(),
    course: z.string().max(60).optional().describe("e.g. B.Tech, BCA, MBA"),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (args, ctx) => {
    const db = supabaseForUser(ctx);
    let q = db
      .from("career_roles")
      .select("slug, title, course, branch, demand, fresher_min_lpa, fresher_max_lpa, experienced_min_lpa, experienced_max_lpa, skills")
      .eq("is_active", true)
      .order("experienced_max_lpa", { ascending: false })
      .limit(args.limit ?? 20);
    if (args.course) q = q.ilike("course", `%${args.course.replace(/[%,]/g, "")}%`);
    if (args.query) q = q.ilike("title", `%${args.query.replace(/[%,]/g, "")}%`);
    const { data, error } = await q;
    if (error) return { isError: true, content: [{ type: "text", text: error.message }] };
    const items = (data ?? []).map((r) => ({
      slug: r.slug,
      title: r.title,
      course: r.course,
      branch: r.branch,
      demand: r.demand,
      fresher_lpa: `${r.fresher_min_lpa}-${r.fresher_max_lpa}`,
      experienced_lpa: `${r.experienced_min_lpa}-${r.experienced_max_lpa}`,
      skills: [...(r.skills ?? [])],
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { items },
    };
  },
});

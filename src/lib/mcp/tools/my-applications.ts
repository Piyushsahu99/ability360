import { defineTool } from "@lovable.dev/mcp-js";

import { supabaseForUser, userIdFrom } from "../supabase";

export default defineTool({
  name: "list_my_applications",
  title: "List my applications",
  description: "List the signed-in student's saved and submitted applications with their current status.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const db = supabaseForUser(ctx);
    const { data, error } = await db
      .from("opportunity_applications")
      .select("id, status, updated_at, opportunities(title, organisation, deadline)")
      .eq("student_id", userIdFrom(ctx))
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) return { isError: true, content: [{ type: "text", text: error.message }] };
    const items = (data ?? []).map((a) => {
      const o = a.opportunities as { title?: string; organisation?: string; deadline?: string | null } | null;
      return {
        id: a.id,
        status: String(a.status),
        updated_at: a.updated_at,
        title: o?.title ?? null,
        organisation: o?.organisation ?? null,
        deadline: o?.deadline ?? null,
      };
    });
    return {
      content: [{ type: "text", text: items.length ? JSON.stringify(items, null, 2) : "No applications yet." }],
      structuredContent: { items },
    };
  },
});

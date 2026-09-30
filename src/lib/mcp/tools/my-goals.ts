import { defineTool } from "@lovable.dev/mcp-js";

import { supabaseForUser, userIdFrom } from "../supabase";

export default defineTool({
  name: "list_my_goals",
  title: "List my goals",
  description: "List the signed-in student's personal career goals, with status, priority and target dates.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const db = supabaseForUser(ctx);
    const { data, error } = await db
      .from("student_goals")
      .select("id, title, category, status, priority, target_date")
      .eq("student_id", userIdFrom(ctx))
      .order("priority", { ascending: true })
      .limit(100);
    if (error) return { isError: true, content: [{ type: "text", text: error.message }] };
    const items = (data ?? []).map((g) => ({
      id: g.id,
      title: g.title,
      category: String(g.category),
      status: String(g.status),
      priority: g.priority,
      target_date: g.target_date ?? null,
    }));
    return {
      content: [{ type: "text", text: items.length ? JSON.stringify(items, null, 2) : "No goals yet." }],
      structuredContent: { items },
    };
  },
});

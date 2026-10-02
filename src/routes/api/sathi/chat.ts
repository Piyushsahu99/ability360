import { createFileRoute } from "@tanstack/react-router";

import { handleSathiChat } from "@/lib/sathi/chat.server";

export const Route = createFileRoute("/api/sathi/chat")({
  server: { handlers: { POST: ({ request }) => handleSathiChat(request) } },
});

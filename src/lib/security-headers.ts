const SUPABASE_ORIGIN = (process.env["SUPABASE_URL"] ?? "https://*.supabase.co").replace(/\/$/, "");
const SUPABASE_WS = SUPABASE_ORIGIN.replace(/^https:/, "wss:");

/* The framework injects its own inline hydration script and style tags, and no
   nonce can be threaded through them without forking it — hence 'unsafe-inline'
   for scripts/styles. Every other directive stays tight. */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self' https://lovable.dev https://*.lovable.dev https://*.lovable.app",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.gpteng.co https://lovable.dev",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https: ${SUPABASE_ORIGIN}`,
  `connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_WS} https://lovable.dev https://*.lovable.app wss:`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function withSecurityHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);

  headers.set("Content-Security-Policy", CSP);
  // frame-ancestors above is the clickjacking control; X-Frame-Options cannot
  // express the editor-preview allow-list and browsers prefer CSP when both exist.
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  );
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");

  if (new URL(request.url).protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

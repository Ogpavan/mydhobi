import { queryClient } from "./query-client";
/** Shared transport for feature actions. Keeps cached screens fresh after writes. */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, { credentials: "same-origin", ...init });
  const path = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
    window.location.origin,
  ).pathname;
  if (response.status === 401 && !path.startsWith("/api/auth/login"))
    window.dispatchEvent(new Event("mydhobi:session-expired"));
  const method = (
    init?.method ?? (input instanceof Request ? input.method : "GET")
  ).toUpperCase();
  if (response.ok && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (/^\/api\/auth\/(login|logout|register)$/.test(path)) {
      localStorage.removeItem('mydhobi_ordering');
      queryClient.clear();
    }
    else {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["customer"] });
      if (/profile|role-permissions|\/team|developer\/sidebar/.test(path))
        void queryClient.invalidateQueries({ queryKey: ["session"] });
    }
  }
  return response;
}

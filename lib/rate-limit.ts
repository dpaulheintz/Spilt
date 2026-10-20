import "server-only";

/**
 * Best-effort sliding-window rate limit, keyed per bucket + client IP.
 * In-memory, so it's per server instance — enough to blunt a script
 * hammering a form, not a guarantee. TODO(supabase): shared store.
 */
const hits = new Map<string, number[]>();

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function rateLimited(
  bucket: string,
  request: Request,
  { max, windowMs }: { max: number; windowMs: number }
): boolean {
  const key = `${bucket}:${clientIp(request)}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // bound memory on a long-lived instance
  return recent.length > max;
}

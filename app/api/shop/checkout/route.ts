import { NextResponse } from "next/server";
import { createCheckout } from "@/lib/square";

/**
 * POST { variationId } → { url } to redirect the buyer to Square's
 * hosted checkout. Demo mode and every failure return a calm,
 * machine-readable reason; the shop section turns that into a toast.
 */
export async function POST(request: Request) {
  let variationId = "";
  try {
    const body = (await request.json()) as { variationId?: unknown };
    if (typeof body.variationId === "string") variationId = body.variationId;
  } catch {
    /* fall through to validation */
  }
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(variationId)) {
    return NextResponse.json({ ok: false, reason: "not-found" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const result = await createCheckout(variationId, `${origin}/?purchased=1#shop`);
  // 200 either way: a declined checkout is an expected outcome, not an error
  return NextResponse.json(result);
}

import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";

/** Sponsor logo tiles from public/assets/passport/sponsors, A→Z.
 *  TODO(supabase): order + active flags come from a sponsors table. */
export async function loadSponsorLogos(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public/assets/passport/sponsors");
    return (await readdir(dir))
      .filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f))
      .sort();
  } catch {
    return [];
  }
}

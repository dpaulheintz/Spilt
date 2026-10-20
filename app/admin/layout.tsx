import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";

/*
 * /admin is OPEN for now — it's a view-only showroom: nothing in it
 * saves, sends, syncs, or changes the live site.
 *
 * TODO(supabase-auth): before any admin action is wired to real writes,
 * gate this layout behind Supabase Auth with a single team login:
 *   - middleware.ts: refresh the session; redirect /admin/* to
 *     /admin/login when there is no session
 *   - here: const { data: { user } } = await supabase.auth.getUser();
 *     if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/admin/login")
 *   - writes go through lib/content-store.ts with the service role, so
 *     RLS keeps the anon key read-only
 */

export const metadata: Metadata = {
  title: "Admin — Spilt Social",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

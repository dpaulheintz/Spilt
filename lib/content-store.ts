import "server-only";
import defaults from "@/content/defaults.json";

/**
 * Content store — the ONLY way site copy and media are read.
 *
 * Today every read resolves to content/defaults.json (the seed, in
 * page order, with plain-English labels for the admin). Writes are
 * stubbed: the /admin preview never persists anything.
 *
 * TODO(supabase): when the database exists, add a Supabase adapter:
 *   - table `site_content` (section_key, field_key, value, updated_at,
 *     updated_by), RLS: public read, admin-role write
 *   - getContent(): read all rows, overlay them onto `defaults` so new
 *     fields added to defaults.json appear even before they're edited
 *   - saveField()/saveSection(): upsert rows, then revalidatePath("/")
 *     and revalidatePath("/partner") so ISR picks up the change
 *   - media fields: upload to Supabase Storage, store the public URL
 * Nothing outside this file should need to change for that swap.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "image"
  | "video"
  | "toggle";

export type ContentField = {
  key: string;
  label: string;
  type: FieldType;
  value: string;
};

export type ContentSection = {
  key: string;
  page: "home" | "partner";
  label: string;
  fields: ContentField[];
};

export type SiteContent = {
  version: number;
  sections: ContentSection[];
};

/** Flattened lookup the public site renders from: copy.hero.headline */
export type Copy = Record<string, Record<string, string>>;

const SEED = defaults as SiteContent;

/** Full structured content (sections in page order, with labels). */
export async function getContent(): Promise<SiteContent> {
  // TODO(supabase): overlay persisted rows onto SEED here.
  return structuredClone(SEED);
}

/** Flattened copy for rendering. Missing keys resolve to "". */
export async function getCopy(): Promise<Copy> {
  return toCopy(await getContent());
}

export function toCopy(content: SiteContent): Copy {
  const copy: Copy = {};
  for (const section of content.sections) {
    const fields: Record<string, string> = {};
    for (const f of section.fields) fields[f.key] = f.value;
    copy[section.key] = fields;
  }
  return copy;
}

export type WriteResult = { ok: false; reason: "preview" };

/** Persist one field. Preview build: does nothing. */
export async function saveField(
  _sectionKey: string,
  _fieldKey: string,
  _value: string
): Promise<WriteResult> {
  // TODO(supabase): upsert into site_content, then revalidate pages.
  return { ok: false, reason: "preview" };
}

/** Persist a whole section. Preview build: does nothing. */
export async function saveSection(
  _section: ContentSection
): Promise<WriteResult> {
  // TODO(supabase): batch upsert the section's fields, then revalidate.
  return { ok: false, reason: "preview" };
}

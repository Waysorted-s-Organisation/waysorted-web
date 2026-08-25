import "./load-env";
import mongoose from "mongoose";
import BlogPost from "../models/blogPost";

/**
 * Corrects "Palletable" to "Palettable" in published posts.
 *
 * The tool is called Palettable everywhere else - products.json, the tool rows,
 * the docs route, the other contrast post. One post spells it wrong throughout,
 * including in the excerpt Google renders as the meta description and in four of
 * its H2s. That breaks brand-name search for the tool and splits the entity signal
 * between two spellings.
 *
 * Word-boundary matched and case-preserving, so it cannot touch anything else.
 *
 *   npm run fix:brand-spelling            dry run
 *   npm run fix:brand-spelling -- --apply
 */
const APPLY = process.argv.includes("--apply");

// Case-insensitive, because the tag is lowercase "palletable" while the prose is
// capitalised - and case-preserving, so each occurrence keeps the form it had.
const WRONG = /\bPalletable\b/gi;
const fix = (s: string) =>
  s.replace(WRONG, (m) => (m[0] === m[0].toUpperCase() ? "Palettable" : "palettable"));
const count = (s: string) => (s.match(WRONG) || []).length;

/** Deep-fix every string in a plain object, whatever shape the block has. */
function fixDeep(value: unknown): unknown {
  if (typeof value === "string") return fix(value);
  if (Array.isArray(value)) return value.map(fixDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, fixDeep(v)]));
  }
  return value;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI_TOOLS || process.env.MONGODB_URI!);
  // .lean() so blocks are plain objects. Spreading a Mongoose subdocument copies
  // its internals rather than its data, which is why an earlier version of this
  // script silently left contentBlocks untouched.
  const posts = await BlogPost.find({ isDeleted: false }).lean();
  let touched = 0, total = 0;

  for (const post of posts as Array<Record<string, unknown>>) {
    /*
     * Every field except the identifiers. Naming a subset is how the first pass
     * missed coverImageAlt, which feeds both og:image:alt and the article image's
     * alt text - so the misspelling survived in two places the fix reported clean.
     * slug is excluded deliberately: rewriting it would change a live URL.
     */
    const SKIP = new Set(["_id", "slug", "__v", "createdAt", "updatedAt", "publishedAt", "isDeleted", "status"]);
    const fields = Object.fromEntries(
      Object.entries(post).filter(([k]) => !SKIP.has(k)),
    );
    const n = count(JSON.stringify(fields));
    if (!n) continue;
    touched += 1; total += n;
    console.log(`  ${post.slug}  ${n} occurrence(s)`);
    if (!APPLY) continue;

    const next = fixDeep(fields) as Record<string, unknown>;
    const res = await BlogPost.updateOne({ _id: post._id }, { $set: next });
    console.log(`    modified: ${res.modifiedCount}`);
  }

  console.log(`\n${touched} post(s), ${total} occurrence(s)${APPLY ? " - corrected." : ". Dry run; re-run with --apply."}`);
  await mongoose.disconnect();
}

main().catch(async (e) => { console.error(e); await mongoose.disconnect(); process.exit(1); });

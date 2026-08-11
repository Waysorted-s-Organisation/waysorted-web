import { permanentRedirect } from "next/navigation";

export default function DocumentsIndex() {
  // Permanent (308) so crawlers consolidate /document-hub into the first doc
  // page rather than re-crawling a temporary redirect indefinitely.
  permanentRedirect("/document-hub/what-is-waysorted");
}

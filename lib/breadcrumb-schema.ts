const SITE_URL = "https://www.waysorted.com";

export type Crumb = { name: string; path: string };

/**
 * Builds a per-page BreadcrumbList.
 *
 * The root layout previously emitted a single global BreadcrumbList containing
 * only "Home", on every page, all sharing the id `${SITE_URL}/#breadcrumb`.
 * A one-item breadcrumb produces no breadcrumb rich result, and reusing the
 * homepage's id on every URL collides the entities. Breadcrumbs replace the raw
 * URL in Google results, so this is a visible SERP change, not just markup.
 *
 * `path` is the page's own path, used to scope the @id so each page gets a
 * distinct node.
 */
export function buildBreadcrumbSchema(path: string, crumbs: Crumb[]) {
  const trail: Crumb[] = [{ name: "Home", path: "/" }, ...crumbs];

  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}${path === "/" ? "" : path}#breadcrumb`,
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path === "/" ? "" : crumb.path}`,
    })),
  };
}

/** Wraps a breadcrumb (or any nodes) in the @graph envelope the site uses. */
export function breadcrumbJsonLd(path: string, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [buildBreadcrumbSchema(path, crumbs)],
  };
}

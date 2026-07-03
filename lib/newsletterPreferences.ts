export const NEWSLETTER_PREFERENCE_CATEGORIES = [
  {
    key: "product_updates",
    label: "Product updates",
    description: "Release notes, product changes, and important improvements.",
  },
  {
    key: "feature_discovery",
    label: "Feature discovery",
    description: "Tool tips, special offers, and recommended workflows.",
  },
  {
    key: "onboarding_help",
    label: "Onboarding help",
    description: "Getting-started guidance and activation nudges.",
  },
  {
    key: "billing_credits",
    label: "Billing and credits",
    description: "Credit reminders, purchase updates, and account notices.",
  },
  {
    key: "community_content",
    label: "Community and content",
    description: "Community newsletters, blog digests, and learning content.",
  },
] as const;

export type NewsletterPreferenceKey =
  (typeof NEWSLETTER_PREFERENCE_CATEGORIES)[number]["key"];

export type NewsletterPreferenceStatus = "subscribed" | "unsubscribed";

export type NewsletterPreferences = Record<
  NewsletterPreferenceKey,
  NewsletterPreferenceStatus
>;

export const DEFAULT_NEWSLETTER_PREFERENCES =
  NEWSLETTER_PREFERENCE_CATEGORIES.reduce((acc, category) => {
    acc[category.key] = "subscribed";
    return acc;
  }, {} as NewsletterPreferences);

export function normalizeNewsletterPreferences(
  value: unknown,
  fallback: NewsletterPreferences = DEFAULT_NEWSLETTER_PREFERENCES
): NewsletterPreferences {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return NEWSLETTER_PREFERENCE_CATEGORIES.reduce((acc, category) => {
    const rawStatus = source[category.key];
    acc[category.key] =
      rawStatus === "unsubscribed" || rawStatus === "subscribed"
        ? rawStatus
        : fallback[category.key];
    return acc;
  }, {} as NewsletterPreferences);
}

export function areAllNewsletterPreferencesUnsubscribed(
  preferences: NewsletterPreferences
) {
  return NEWSLETTER_PREFERENCE_CATEGORIES.every(
    (category) => preferences[category.key] === "unsubscribed"
  );
}

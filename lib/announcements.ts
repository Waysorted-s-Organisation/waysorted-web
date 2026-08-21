/**
 * What the sticky top banner rotates through.
 *
 * The copy used to be a single literal in `components/Header`, which is why it
 * never changed. It lives here so it can be edited without touching the header,
 * and so the discount lines can be BUILT from live coupon data rather than typed.
 *
 * Two rules govern anything added here:
 *
 * 1. It has to be true for the person reading it. The banner renders on public
 *    marketing pages, so most readers are signed out and have no credit balance.
 *    A line that assumes an account, a balance, or a live discount does not
 *    belong in the static list.
 *
 * 2. It has to fit on one line at 375px. Every consumer of `useBanner` hardcodes
 *    the page offset as `pt-24` when the banner is open (11 call sites), so copy
 *    that wraps to two lines pushes content under the header on all of them.
 */

export type Announcement = {
  id: string;
  text: string;
  ctaLabel: string;
  href: string;
};

/** One active coupon, as the public ladder endpoint reports it. */
export type PublicOffer = {
  code: string;
  percent: number;
  /** Largest balance you may hold and still redeem. null means no ceiling. */
  maxCredits: number | null;
};

/** True regardless of who is reading or what is active. */
const EVERGREEN: Announcement[] = [
  {
    id: "palettable",
    text: "Try Palettable for quick Color schemes and Contrast check...",
    ctaLabel: "Click here",
    href: "/learning/palettable",
  },
  {
    id: "topup",
    text: "Top up credits anytime — no subscription, no monthly reset.",
    ctaLabel: "See pricing",
    href: "/pricing",
  },
];

/**
 * Phrase one coupon as a banner line.
 *
 * `maxCredits` is a CEILING on the balance you may still be holding, not a spend
 * target — you qualify when your balance has fallen TO it. Wording it as "spend N
 * credits to unlock" inverts the mechanic and describes a discount nobody can
 * claim, which is why that phrasing was removed from checkout in the first place.
 */
export function describeOffer(offer: PublicOffer): Announcement | null {
  if (!Number.isFinite(offer.percent) || offer.percent <= 0) return null;

  // No ceiling: it is an open welcome offer, not a low-balance one.
  if (offer.maxCredits === null) {
    return {
      id: `offer-${offer.code}`,
      text: `New here? ${offer.code} takes ${offer.percent}% off your first month.`,
      ctaLabel: "See plans",
      href: "/pricing",
    };
  }

  if (offer.maxCredits === 0) {
    return {
      id: `offer-${offer.code}`,
      text: `Out of credits? ${offer.code} takes ${offer.percent}% off.`,
      ctaLabel: "See plans",
      href: "/pricing",
    };
  }

  return {
    id: `offer-${offer.code}`,
    text: `Down to ${offer.maxCredits} credits? ${offer.code} takes ${offer.percent}% off.`,
    ctaLabel: "See plans",
    href: "/pricing",
  };
}

/**
 * The rotation, evergreen lines first so the banner has something to show before
 * (or without) any coupon being live.
 *
 * An empty ladder is the normal case, not an error: every seeded coupon ships
 * `active: false` and is switched on deliberately by an operator.
 */
export function buildAnnouncements(offers: PublicOffer[] = []): Announcement[] {
  const fromOffers = offers
    .slice()
    // Deepest discount first, so the most useful line comes round soonest.
    .sort((a, b) => b.percent - a.percent)
    .map(describeOffer)
    .filter((entry): entry is Announcement => entry !== null);

  return [...EVERGREEN, ...fromOffers];
}

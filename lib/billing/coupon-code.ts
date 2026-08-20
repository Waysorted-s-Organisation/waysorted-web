/**
 * The shape of a discount code, in one place.
 *
 * Three separate entry points now accept a code from an untrusted caller - a
 * /claim link, the plugin's checkout bridge, and the field on the checkout page.
 * Each had (or would have grown) its own idea of what a code looks like, and
 * three copies of a rule is three chances for one of them to accept something
 * the others reject.
 *
 * This is a SHAPE check, not a validity check. Whether a code exists, is live,
 * and applies to this customer and this plan is decided server-side against the
 * database, with the signed-in user and their balance in hand. Nothing here
 * should ever be treated as authorisation to discount a charge.
 */

/**
 * Upper-case alphanumeric, may contain `-` and `_` after the first character.
 * Bounded at 32 so a code cannot be used to stuff an unbounded string into a
 * redirect, a database field, or a log line.
 */
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;

/**
 * Normalises a caller-supplied code, or returns null if it cannot be one.
 *
 * Accepts unknown so it can take a parsed-JSON body field directly: a number, an
 * object or an array arriving where a string was expected must be refused, not
 * coerced into the string "[object Object]".
 *
 * Case is folded up, because the codes are published in upper case but get typed
 * and pasted in every case - rejecting `boost20` would fail a customer who
 * copied the code correctly.
 */
export function normalizeCouponCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const normalized = input.trim().toUpperCase();
  return CODE_PATTERN.test(normalized) ? normalized : null;
}

/** True when the input is a plausibly-shaped code. Convenience for guards. */
export function isCouponCodeShape(input: unknown): boolean {
  return normalizeCouponCode(input) !== null;
}

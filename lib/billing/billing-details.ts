/**
 * Validation for the billing details a customer enters before checkout.
 *
 * The form carried `pattern` attributes that only constrained the CHARACTER
 * CLASS — city allowed letters, zip allowed letters and digits — so "hskdh" and
 * "jshdh" both passed, because they are made of allowed characters. And the
 * server checked presence only, so anything non-empty was stored regardless of
 * what the browser did. A `pattern` attribute is a hint to a cooperating
 * browser, never a control: one curl bypasses it entirely.
 *
 * These details end up on invoices and in tax records, so wrong data is not
 * cosmetic. The rules below are deliberately the ones that can be checked
 * honestly — see `validateCity` for what deliberately is NOT claimed.
 */

export interface BillingDetailsInput {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  address?: unknown;
  country?: unknown;
  city?: unknown;
  zipCode?: unknown;
}

export type BillingDetailsField =
  | "firstName"
  | "lastName"
  | "email"
  | "address"
  | "country"
  | "city"
  | "zipCode";

export interface BillingDetailsError {
  field: BillingDetailsField;
  message: string;
}

/**
 * Postal-code shapes by country.
 *
 * This is where real validation is possible: a postal code has a defined format,
 * unlike a city name. India is six digits not starting with zero, so "jshdh" is
 * refusable with certainty rather than by guesswork.
 *
 * Keyed by lowercased country name AND ISO code, because the form is a free-text
 * country field — a customer types "india", "India" or "IN" and all three must
 * reach the same rule.
 */
const POSTAL_RULES: Record<string, { pattern: RegExp; hint: string }> = {
  india: { pattern: /^[1-9][0-9]{5}$/, hint: "a 6-digit PIN code" },
  in: { pattern: /^[1-9][0-9]{5}$/, hint: "a 6-digit PIN code" },
  "united states": { pattern: /^[0-9]{5}(-[0-9]{4})?$/, hint: "a 5-digit ZIP, optionally ZIP+4" },
  usa: { pattern: /^[0-9]{5}(-[0-9]{4})?$/, hint: "a 5-digit ZIP, optionally ZIP+4" },
  us: { pattern: /^[0-9]{5}(-[0-9]{4})?$/, hint: "a 5-digit ZIP, optionally ZIP+4" },
  "united kingdom": {
    pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
    hint: "a UK postcode such as SW1A 1AA",
  },
  uk: {
    pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
    hint: "a UK postcode such as SW1A 1AA",
  },
  gb: {
    pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
    hint: "a UK postcode such as SW1A 1AA",
  },
  canada: { pattern: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i, hint: "a postal code such as K1A 0B1" },
  ca: { pattern: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i, hint: "a postal code such as K1A 0B1" },
  australia: { pattern: /^[0-9]{4}$/, hint: "a 4-digit postcode" },
  au: { pattern: /^[0-9]{4}$/, hint: "a 4-digit postcode" },
  germany: { pattern: /^[0-9]{5}$/, hint: "a 5-digit postcode" },
  de: { pattern: /^[0-9]{5}$/, hint: "a 5-digit postcode" },
  singapore: { pattern: /^[0-9]{6}$/, hint: "a 6-digit postal code" },
  sg: { pattern: /^[0-9]{6}$/, hint: "a 6-digit postal code" },
};

/** Countries whose postal codes we do not model. Kept deliberately permissive. */
const GENERIC_POSTAL = /^[A-Z0-9][A-Z0-9\s-]{1,10}$/i;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function postalRuleFor(country: string) {
  return POSTAL_RULES[country.trim().toLowerCase()] || null;
}

export function validatePostalCode(zipCode: string, country: string): string | null {
  const value = zipCode.trim();
  if (!value) return "Zip code is required.";

  const rule = postalRuleFor(country);
  if (rule) {
    if (!rule.pattern.test(value)) return `Enter ${rule.hint}.`;
    return null;
  }

  // No rule for this country: accept anything postal-code-shaped rather than
  // inventing a format and rejecting a legitimate customer.
  if (!GENERIC_POSTAL.test(value)) return "Enter a valid postal code.";
  return null;
}

/**
 * A city name cannot be verified without a gazetteer, and this does not pretend
 * otherwise. "hskdh" is indistinguishable from a small town's real name by
 * shape alone, so the only honest checks are: it is long enough to be a name,
 * it contains letters, and it is not a single repeated character. A stricter
 * rule invented here would reject real people.
 *
 * The postal code is where a wrong entry is actually catchable, and it is
 * checked properly above.
 */
export function validateCity(city: string): string | null {
  const value = city.trim();
  if (!value) return "City is required.";
  if (value.length < 2) return "Enter a full city name.";
  if (!/[A-Za-z]/.test(value)) return "Enter a valid city name.";
  if (/^(.)\1+$/.test(value.replace(/\s/g, ""))) return "Enter a valid city name.";
  return null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/**
 * Validates every field, returning ALL failures rather than the first.
 *
 * One error at a time turns a seven-field form into seven round trips.
 */
export function validateBillingDetails(input: BillingDetailsInput): BillingDetailsError[] {
  const errors: BillingDetailsError[] = [];
  const firstName = text(input.firstName);
  const lastName = text(input.lastName);
  const email = text(input.email);
  const address = text(input.address);
  const country = text(input.country);
  const city = text(input.city);
  const zipCode = text(input.zipCode);

  if (firstName.length < 2) errors.push({ field: "firstName", message: "Enter a first name." });
  if (lastName.length < 1) errors.push({ field: "lastName", message: "Enter a last name." });
  if (!EMAIL.test(email)) errors.push({ field: "email", message: "Enter a valid email address." });

  // An address that is only an email address is the specific mistake seen in
  // the wild — the field sits directly below Email and gets the same paste.
  if (address.length < 5) {
    errors.push({ field: "address", message: "Enter a street address." });
  } else if (EMAIL.test(address)) {
    errors.push({ field: "address", message: "Enter a street address, not an email address." });
  }

  if (country.length < 2) errors.push({ field: "country", message: "Enter a country." });

  const cityError = validateCity(city);
  if (cityError) errors.push({ field: "city", message: cityError });

  const zipError = validatePostalCode(zipCode, country);
  if (zipError) errors.push({ field: "zipCode", message: zipError });

  return errors;
}

/**
 * The "N% OFF" badge on the yearly plan.
 *
 * This is a public claim about price, so it is computed from the two prices
 * actually on offer rather than written into the design. A hardcoded badge goes
 * stale the first time a price moves, and then the page advertises a discount
 * the checkout does not give - which is the kind of mismatch a customer is
 * entitled to complain about.
 */
export interface PlanPrice {
  amountSubunits: number;
  currency: string;
}

/**
 * Percentage saved by paying yearly instead of twelve monthly cycles.
 *
 * Returns null when no honest claim can be made:
 *  - the currencies differ, so the two numbers are not comparable
 *  - the yearly price is not actually cheaper
 *  - either price is missing or not a usable number
 *
 * Rounded DOWN, so the badge never overstates the saving.
 */
export function yearlySavingPercent(monthly: PlanPrice | null, yearly: PlanPrice | null): number | null {
  if (!monthly || !yearly) return null;
  if (monthly.currency.toUpperCase() !== yearly.currency.toUpperCase()) return null;
  if (!Number.isFinite(monthly.amountSubunits) || !Number.isFinite(yearly.amountSubunits)) return null;
  if (monthly.amountSubunits <= 0 || yearly.amountSubunits < 0) return null;

  const twelveMonths = monthly.amountSubunits * 12;
  if (yearly.amountSubunits >= twelveMonths) return null;

  const percent = Math.floor(((twelveMonths - yearly.amountSubunits) / twelveMonths) * 100);
  return percent > 0 ? percent : null;
}

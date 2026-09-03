/**
 * The hand-off from the Figma plugin's credit modal to the web checkout.
 *
 * The modal shows a discount code; the bridge is the only wire that can carry it
 * to a page able to price it. Every defect on this path is silent by
 * construction - the customer is shown a percentage, reaches Razorpay, and is
 * charged the full amount with nothing on screen to say why.
 *
 * These are source assertions rather than request tests because the routes need
 * a database and a signed grant. They pin the invariants that were actually
 * broken, so a rewrite cannot quietly drop one.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { COUPON_MAX_CREDITS } from "@/lib/billing/coupon";
import { normalizeCouponCode } from "@/lib/billing/coupon-code";
import { yearlySavingPercent } from "@/lib/billing/plan-savings";
import {
  getMonthlyCounterpartCode,
  getOneTimeProductDisplay,
  getPlanUi,
} from "@/app/pricing/pricing-presentation";

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");

const bridgeRoute = read("app/api/billing/checkout/bridge/route.ts");
const exchangeRoute = read("app/api/billing/checkout/bridge/exchange/route.ts");
const grantModel = read("models/billingBridgeGrant.ts");
const billingClient = read("app/billing/billing-client.tsx");
const detailsRoute = read("app/api/billing/details/route.ts");

test("the grant has somewhere to put the code", () => {
  // Mongoose strict mode silently drops unknown keys, so a route that passes
  // couponCode without this field writes nothing and fails invisibly.
  assert.match(grantModel, /couponCode:\s*\{\s*type:\s*String/);
});

test("the bridge shape-checks the code instead of trusting the plugin", () => {
  assert.match(bridgeRoute, /normalizeCouponCode/);
  assert.match(bridgeRoute, /couponCode/);
});

test("a non-string body field cannot 500 the bridge", () => {
  // `body.x?.trim()` throws on a number or an object - optional chaining only
  // guards null and undefined. A 500 here reads to the plugin as "bridge down",
  // and it falls back to the full-price pricing page.
  assert.doesNotMatch(
    bridgeRoute,
    /body\.(productCode|returnPath|source)\?\.trim\(\)/,
    "coerce to string before trimming a body field",
  );
});

test("the exchange forwards the code, and not only alongside a product", () => {
  assert.match(exchangeRoute, /searchParams\.set\("coupon", grant\.couponCode\)/);

  // The coupon must not be forwarded only inside the productCode block: a modal
  // can offer a code without naming a plan, and that is the main case.
  //
  // Anchored on `target.` specifically, because the expired-grant path also sets
  // a coupon (on its own `expired` URL) and appears earlier in the file.
  const couponAt = exchangeRoute.indexOf('target.searchParams.set("coupon"');
  const productBlock = exchangeRoute.indexOf("if (grant.productCode)");
  const productBlockEnd = exchangeRoute.indexOf("}", productBlock);
  assert.ok(couponAt > 0, "the coupon must be forwarded onto the redirect target");
  assert.ok(
    couponAt > productBlockEnd,
    "the coupon must be forwarded outside the productCode branch",
  );
});

test("the plugin hand-off never auto-opens the payment sheet", () => {
  // Nothing on this path shows a price first. The modal advertises a percentage,
  // and no quote is carried, so the drift guard has nothing to compare against
  // and is inert. Auto-opening would put a payment sheet in front of a customer
  // at an amount they have never been shown.
  assert.doesNotMatch(
    exchangeRoute,
    /searchParams\.set\("autostart"/,
    "the bridge must not arm autostart",
  );
});

test("an expired grant keeps the code it was carrying", () => {
  // Otherwise a link that took 90 seconds to open costs the customer their
  // discount as well. Read without consuming and without issuing a session: a
  // code is not authorisation, and checkout re-resolves it server-side.
  assert.match(exchangeRoute, /expired\.searchParams\.set\("coupon"/);
});

test("an expired grant lands on checkout, not on raw JSON", () => {
  // This URL is opened as a top-level browser navigation, so a JSON body renders
  // as text in a tab. The grant lives 90 seconds; a customer who takes longer to
  // switch to their browser had nowhere to go.
  assert.doesNotMatch(exchangeRoute, /status:\s*410/);
  assert.match(exchangeRoute, /bridge.*expired|expired.*bridge/i);
});

test("autostart is only ever honoured for the product the link named", () => {
  // A link naming a product the account cannot buy had a different product
  // substituted, and autostart stayed armed - so Razorpay opened for something
  // the customer never chose. quoteDrift cannot catch it, because drift compares
  // against ?qa/?qc which only the /pricing hand-off carries.
  assert.match(
    billingClient,
    /!initialProductCode \|\| selectedProduct\.code !== initialProductCode/,
  );
});

test("checkout does not gate on billing details", () => {
  // It did briefly, mirroring /pricing. But nothing functional consumes them:
  // Razorpay owns the invoice, and the only reader in the whole repo feeds
  // `declaredBillingCountry` into an ADVISORY risk flag that no code path
  // blocks, reprices or refuses on. Settings calls them "details for future
  // invoices" and treats them as optional.
  //
  // So the gate was pure friction on the path the plugin's discount links use -
  // and it briefly broke that path outright, because /api/billing/details was
  // the one billing route that did not accept the plugin's bridge session.
  assert.doesNotMatch(billingClient, /requireBillingDetails/);
  assert.doesNotMatch(billingClient, /BillingDetailsModal/);
});

test("the details route accepts the plugin's bridge session", () => {
  // Checkout no longer asks for these, but the customer can still add them from
  // settings while holding only the bridge cookie - and this was the one billing
  // route that refused it, answering 401 after seven fields were filled in.
  assert.match(detailsRoute, /getBridgeAuthenticatedUser\("billing:checkout"\)/);
  assert.match(
    detailsRoute,
    /getAuthenticatedUser\(request\)\)\s*\|\|/,
    "session auth must still be tried first",
  );
});

test("Continue is never a silent no-op", () => {
  // A returning customer who had spent their allowance arrived with the code
  // prefilled from the URL and every press of Continue did visibly nothing.
  const continueBody = billingClient.slice(
    billingClient.indexOf("async function handleContinue"),
    billingClient.indexOf("async function handleCancelSubscription"),
  );
  assert.ok(continueBody.length > 0, "handleContinue must exist");
  assert.doesNotMatch(
    continueBody,
    /if \(!quote\) return;/,
    "a failed quote must explain itself before returning",
  );
  assert.match(continueBody, /setStatus\(/);
});

test("a code refused for a top-up is still shown to the customer", () => {
  // The rejection used to be rendered only inside the subscription-only banner,
  // so a coupon aimed at a top-up vanished without trace.
  assert.match(billingClient, /couponError && !isSubscription/);
});

test("the balance ceilings the plugin mirrors are exactly these", () => {
  // The plugin's credit-threshold ladder in
  // ui-scripts/dashboard/01-state-ui.js carries a `maxCredits` per variant that
  // MUST equal these. They disagreed: the plugin offered TOPUP25 below 50 and
  // BOOST20 below 75, while the server allows them only at 25 and 50, so every
  // customer between 26-49 and 51-74 credits was shown a discount and then
  // refused at checkout.
  //
  // If this test fails because a ceiling moved, move the plugin's table too.
  assert.equal(COUPON_MAX_CREDITS.UNLOCK30, 0);
  assert.equal(COUPON_MAX_CREDITS.TOPUP25, 25);
  assert.equal(COUPON_MAX_CREDITS.BOOST20, 50);
  assert.equal(COUPON_MAX_CREDITS.WELCOME15, Number.POSITIVE_INFINITY);
});

test("every code the plugin ships is a valid shape", () => {
  for (const code of Object.keys(COUPON_MAX_CREDITS)) {
    assert.equal(normalizeCouponCode(code), code, `${code} must survive normalisation`);
  }
});

test("checkout names a plan the same way /pricing does", () => {
  // The catalogue's own `name` is an internal label - "Monthly 2" - and using it
  // here meant the plan someone chose on the pricing page was called something
  // else the moment they reached checkout.
  assert.match(billingClient, /getPlanUi\(selectedProduct\.code\)\?\.planName/);
  assert.match(billingClient, /getPlanUi\(product\.code\)\?\.planName \|\| product\.name/);
  assert.equal(getPlanUi("sub_month_2")?.planName, "Core");
  assert.equal(getPlanUi("sub_year_3499")?.planName, "Core");

  // A one-time product is named by what it grants. The catalogue label
  // "Standard Top-up 100" describes a 75-credit product costing 100 rupees, so
  // showing it put three different numbers on one row.
  assert.match(billingClient, /getOneTimeProductDisplay\(product\)\.creditsLabel/);
  const topup = getOneTimeProductDisplay({ code: "topup_std_100", creditsGranted: 75, bonusCredits: 0 });
  assert.equal(topup.creditsLabel, "75 credits");
  assert.equal(topup.kindLabel, "Credit top-up");
  const starter = getOneTimeProductDisplay({ code: "starter_149", creditsGranted: 200, bonusCredits: 25 });
  assert.equal(starter.creditsLabel, "225 credits", "a bonus counts toward what the customer receives");
  assert.equal(starter.kindLabel, "Starter pack");
});

test("the yearly saving is paired by tier, not by catalogue order", () => {
  // Comparing every yearly plan against whichever monthly came first meant only
  // the Discover row ever showed a saving; Core and Pro are discounted by the
  // same amount and silently showed none.
  assert.equal(getMonthlyCounterpartCode("sub_year_1599"), "sub_month_1");
  assert.equal(getMonthlyCounterpartCode("sub_year_3499"), "sub_month_2");
  assert.equal(getMonthlyCounterpartCode("sub_year_7499"), "sub_month_3");
  assert.equal(getMonthlyCounterpartCode("sub_month_1"), null, "a monthly plan has no counterpart");
  assert.match(billingClient, /getMonthlyCounterpartCode\(product\.code\)/);
});

test("every tier's real prices produce the same saving the pricing page claims", () => {
  // /pricing advertises "Save at least N% yearly" from the same pairs. If the
  // two ever disagree, one page is lying about a price.
  const inr = (amountSubunits: number) => ({ amountSubunits, currency: "INR" });
  assert.equal(yearlySavingPercent(inr(14900), inr(149900)), 16, "Discover");
  assert.equal(yearlySavingPercent(inr(34900), inr(349900)), 16, "Core");
  assert.equal(yearlySavingPercent(inr(74900), inr(749900)), 16, "Pro");
});

test("the offer banner is resolved server-side, not written into the client", () => {
  // The banner used to read "Spend 30 credits and a discount code unlocks
  // automatically" - a fixed string that matched neither the real balance
  // thresholds (0/25/50) nor whether any code was switched on at all. Only the
  // server knows which codes are active, which this customer has already spent,
  // and whether their balance clears each ceiling.
  assert.match(billingClient, /bestOffer/);
  // Comments stripped first: the explanation of what the old copy was is
  // allowed to mention it, the rendered output is not.
  const withoutComments = billingClient
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert.doesNotMatch(
    withoutComments,
    /Spend 30 credits/,
    "the fixed offer copy must not come back",
  );
});

test("the plan chooser is a dropdown, so the offer stays on screen", () => {
  // Six plans as stacked rows pushed the discount banner and the status line off
  // the first screen - the offer was there and nobody could see it. The menu
  // overlays rather than expands, so opening it never moves what is underneath.
  assert.match(billingClient, /aria-haspopup="listbox"/);
  assert.match(billingClient, /role="listbox"/);
  assert.match(billingClient, /absolute left-0 right-0/, "the menu must overlay, not push");
});

test("neither purchase page asks for billing details", () => {
  // Both /pricing and /billing used to open a seven-field form before checkout.
  // Nothing functional consumes those details - Razorpay owns the invoice, and
  // the only reader in the repo feeds `declaredBillingCountry` into an advisory
  // risk flag that no path blocks, reprices or refuses on. It was a form
  // standing between a customer and paying us, for information not needed to
  // take the payment.
  //
  // They are still addable from /settings, which is the one place that should
  // still mount the modal.
  const pricing = read("app/pricing/pricing-client.tsx");
  for (const [name, source] of [["pricing", pricing], ["billing", billingClient]] as const) {
    assert.doesNotMatch(source, /BillingDetailsModal/, `${name} must not mount the form`);
    assert.doesNotMatch(source, /requireBillingDetails/, `${name} must not gate on it`);
  }
  assert.match(
    read("app/settings/components/tabs/SubscriptionTab.tsx"),
    /BillingDetailsModal/,
    "settings must remain the place to add them",
  );
});

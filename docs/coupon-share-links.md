# Discount links

Short links that carry a discount code to checkout. Verified live in production.

```
https://www.waysorted.com/claim/WELCOME15
https://www.waysorted.com/claim/BOOST20
https://www.waysorted.com/claim/TOPUP25
https://www.waysorted.com/claim/UNLOCK30
```

Each 307-redirects to `/billing?coupon=<CODE>`, where the code is priced against the signed-in
customer and applied automatically. A signed-out visitor is sent to log in first and the code
survives the round trip.

---

## Read this before sharing them publicly

**Three of the four are balance-gated.** They are meant to be "exclusively for you" offers surfaced
by the in-plugin credit modals, and the server enforces that at redemption — so a public post of
`BOOST20` will be refused for most people who click it.

| Code | Discount | Works for a customer holding | Refused above |
|---|---|---|---|
| `WELCOME15` | 15% | **any balance** | — |
| `BOOST20` | 20% | 50 credits or fewer | 51+ |
| `TOPUP25` | 25% | 25 credits or fewer | 26+ |
| `UNLOCK30` | 30% | 0 credits | 1+ |

Verified against a real 300-credit account: `WELCOME15` resolved to ₹296.65 on the ₹349 Core plan;
the other three returned `coupon_not_applicable`.

**For a public or broad audience, share `WELCOME15`.** It is the only one without a balance
requirement. The other three are best left to the plugin, which already picks the right one for the
customer's balance and hands it over automatically.

The gate counts available **plus held** credits — credits reserved by an action still running —
because the alternative is defeatable for free: start work that reserves your balance, watch
available drop to zero, take `UNLOCK30`, then cancel and get the credits back.

## Other limits

- **Monthly plans only** (`sub_month_1`, `sub_month_2`, `sub_month_3`). A yearly plan resolves no
  offer, and the checkout page says so rather than failing silently. If you want the codes to apply
  to yearly, that is a deliberate decision — 30% off ₹7,499 is ₹2,250, not ₹225.
- **One promotional code per customer, ever** — across all four, not one each. Enforced by a partial
  unique index, not by application logic, so it holds under concurrency.
- **Discount applies to the first cycle only.** The customer pays the discounted amount on day 0 and
  the full price from the next cycle. Both numbers are stated on the checkout page and again on
  Razorpay's own sheet.

## Adding a plan to the link

```
https://www.waysorted.com/claim/WELCOME15?product=sub_month_2
```

Lands on checkout with that plan already selected. Product codes: `sub_month_1` (Discover, ₹149),
`sub_month_2` (Core, ₹349), `sub_month_3` (Pro, ₹749).

Lowercase works — `/claim/welcome15` normalises. Anything that is not a valid code shape is dropped
rather than reflected into the redirect, and only `product`, `autostart`, `qa`, `qc` and `qv` are
carried through; nothing else, so a crafted link cannot set the price fields the checkout guard
compares against.

## Turning one off

```bash
npm run coupon:activate -- BOOST20 --off --apply
```

Dry run without `--apply`. It prints the before and after state and the number of existing
redemptions, and refuses a code that does not exist.

# Regional pricing: geo detection setup

## The problem this solves

`waysorted.com` is proxied by Cloudflare:

```
NS      camilo.ns.cloudflare.com / jessica.ns.cloudflare.com
A       104.21.36.103, 172.67.192.83   (Cloudflare)
server  cloudflare
cf-ray  …-SIN                          (Singapore colo)
```

Vercel therefore terminates the connection with **Cloudflare's** address, not the visitor's, so
`x-vercel-ip-country` reports the country of the Cloudflare PoP. Indian traffic routes through
Cloudflare's Singapore colo, so every Indian visitor was detected as `SG` and quoted **tier_1 in
SGD** instead of **tier_3 in INR** — roughly 3.3× too much, in a currency the INR Razorpay account
may not settle.

This is documented Vercel behaviour: the geo headers do not work behind a proxy, and the
Trusted Proxy override is Enterprise-only.

## The fix

Use Cloudflare's own `CF-IPCountry`, which carries the real visitor country — but only trust it on
requests that provably came through Cloudflare. The origin (`*.vercel.app`) stays publicly
reachable, so without that check anyone could bypass the proxy, send `cf-ipcountry: IN`, and select
the cheapest tier for themselves.

### 1. Cloudflare: confirm IP geolocation is on

Dashboard → your domain → **Network** → **IP Geolocation** → enabled. This is what adds the
`CF-IPCountry` header to origin requests.

### 2. Cloudflare: inject an edge proof

Dashboard → **Rules** → **Transform Rules** → **Modify Request Header** → Create rule.

- Rule name: `waysorted edge proof`
- If: `all incoming requests`
- Then: **Set static** → header `x-waysorted-edge-proof` → value: a long random string

Generate one with:

```bash
openssl rand -hex 32
```

Cloudflare sets this header at its edge on every proxied request. A caller hitting the Vercel origin
directly cannot produce it.

### 3. Vercel: set the environment variables

Project → Settings → Environment Variables (Production, and Preview if you want it there too):

| Variable | Value |
|---|---|
| `BILLING_TRUSTED_GEO_HEADER` | `cf-ipcountry` |
| `BILLING_EDGE_ATTESTATION_SECRET` | the same random string from step 2 |
| `BILLING_EDGE_ATTESTATION_HEADER` | `x-waysorted-edge-proof` (optional — this is the default) |

Redeploy so the variables take effect.

### 4. Verify

```bash
curl -s https://www.waysorted.com/api/billing/public-catalog | head -c 300
```

From India this must now report `"country":"IN"`, `"tier":"tier_3"`, `"currency":"INR"` with
`"source":"request"`.

Confirm the bypass is closed — hitting the origin directly with a forged header must **not** yield
`IN` from a non-Indian network:

```bash
curl -s -H 'cf-ipcountry: IN' https://<deployment>.vercel.app/api/billing/public-catalog | head -c 200
```

Expect `"source":"default"`, proving the header was ignored.

## Failure behaviour

If the attestation is missing or wrong, the request is treated as having **no geo signal** and falls
back to `BILLING_DEFAULT_PRICING_COUNTRY` (default `IN` → tier_3 → INR). That is deliberate: an
unverifiable request must never be able to *choose* a tier, and for an INR-first Razorpay account the
home currency is the safe default.

Consequence worth knowing: if you set `BILLING_TRUSTED_GEO_HEADER=cf-ipcountry` but forget the
Cloudflare Transform Rule, **every** visitor is served INR tier_3 pricing. Complete step 2 before
step 3, and run the verification in step 4.

## Alternatives considered

| Option | Trade-off |
|---|---|
| **Cloudflare `CF-IPCountry` + edge proof** (implemented) | Correct visitor country, no plan change. Requires one Transform Rule. |
| Stop proxying through Cloudflare (DNS-only / grey cloud) | `x-vercel-ip-country` starts working natively; loses Cloudflare WAF/caching. Vercel already provides a CDN, so double-proxying buys little. |
| Vercel Trusted Proxy | Native support behind a proxy — Enterprise plan only. |

## Existing customers

Customers who were detected as `SG`/`US` before this fix may carry a persisted pricing lock, and the
tier ratchet only moves upward, so it will not correct itself:

```bash
npm run migrate:reset-default-pricing-locks -- --dry-run --include-upgrades
```

Review the listed accounts, then re-run without `--dry-run`. Clearing is safe: the next request
re-derives the lock from a real observation.

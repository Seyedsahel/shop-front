# SSR, proxy, and store audit

Date: 2026-10-18

## Scope and method

Reviewed the shared frontend transport, backend transport, session handling,
Nitro response cache policy, resource stores, public collection/detail loaders,
shopping/order/checkout flows, and media proxy. Compared live public backend
responses with localhost responses. Tested races with deliberately delayed
responses and isolated HTTP fixtures. No live cart, account, order, payment, or
comment mutations were made.

This is a code and HTTP audit. No interactive browser automation or desktop
control is available in this session. Empty live categories, brands, stories,
and blogs do not establish their populated response contracts; those paths are
checked against the existing fixtures and types.

## Confirmed findings fixed

| Finding | Trigger and effect | Fix |
| --- | --- | --- |
| Product attribute loss (original report) | Backend supplies `purchase_variants[].attribute_values`; mapper reads `options` and erases selectors. `stock` and `price_from` also become zero under the old names. | Accept current fields while retaining legacy fallbacks. Product SSR reload test verifies rendered selectors and fresh backend reads. |
| Purchase eligibility lost | A product with stock and `is_purchasable: false` loses that field in both proxy mappings; buying controls use stock alone. | Preserve `isPurchasable` in shared contracts and mappings. Product cards, detail purchase panel, and quick-add block additions/increases and explain unavailability. Existing cart reductions/removals remain possible. |
| List price fallback uses the old contract | A response supplies `price_from` without nested `price`; product list displays zero. | Include `price_from` in original/final/base price fallbacks. |
| Shipping-location callers do not share completion | Profile/checkout starts a locations request; a second caller sees `loading` and returns immediately with empty locations. | Return the same pending promise to every caller; failed reads remain retryable. |
| Notification preview discarded by inbox paging | A preview request is in flight when the inbox page changes; both share `listRevision`, so the preview is discarded despite belonging to a separate view. | Give the preview its own revision. Session changes and read mutations still invalidate both views. |
| Previous account's pending comment reappears | A user submits an unapproved comment, switches accounts, then the old POST completes. It repopulates pending state and reads the new account's author name. | Capture the submission's author and session generation, synchronously clear pending state on account changes, and ignore stale completions/errors. Guard duplicate submissions. |
| Shipping failures receive public cache lifetimes | Locations/methods set a one-hour/five-minute public cache header before the backend call; an upstream failure inherits that header. | Default to `no-store`; enable public caching only after a successful, validated response. |
| Public list navigation never refreshes | `callOnce(..., { mode: 'navigation' })` runs again, but the blog/story store immediately returns its first successful cache. A revisit still shows the original snapshot. | Request fresh blog/story lists on collection-page and homepage entry. Child consumers can continue to reuse the resulting snapshot. Hydration still skips duplicate requests. |

## Existing protections verified

- Each Pinia store owns its pending requests and mutable state inside its setup
  function; no shared process-wide visitor cache was found in these paths.
- SSR forwards the request's cookies through the shared API boundary and relays
  response cookies. Raw bearer credentials are not serialized to client state.
- Authenticated reads use `no-store`; cookie-dependent HTML uses
  `private, no-store` and varies by `Cookie`.
- Main catalog/filter requests use request generations and cancellation to
  prevent obsolete responses replacing a newer browsing context.
- Product detail loads are not served from list items. Full document reloads
  fetch detail on the server, then hydrate the client from the Nuxt payload.
- Cart/wishlist/session changes invalidate account-specific state. Checkout
  and payment writes are not automatically retried by the transports.
- Media proxy tests cover range responses, validation requests, upstream
  errors, and removal of storefront credentials from media requests.

## Remaining limits and follow-up decisions

- The full SSR suite currently stops at an existing footer assertion:
  `tests/ssr.test.mjs` expects `/api/images/shops/enamad.png`, but
  `app/components/nav/Footer.vue` renders a hardcoded external trust badge.
  The actual footer and test need an agreed source of truth. Neither was
  changed as part of this audit.
- Shop metadata, category/brand definitions, banners, payment/shipping methods,
  and some preview/comment caches still have resource-specific lifetimes.
  Successful store snapshots generally last for the tab lifetime unless
  explicitly refreshed. This is distinct from Nitro/browser HTTP caching.
  Live administrative updates therefore need a reload or a dedicated
  revalidation policy; this audit does not introduce a global polling timer.
- Story availability has an unused `isAvailableStory` helper. Backend list
  filtering and expired/inactive story behavior should be verified with
  populated responses before enforcing a different visibility policy.
- Authenticated live response contracts and actual Firefox hydration,
  Back/Forward navigation, and multi-tab interactions were not manually
  exercised. Existing fixture tests cover these boundaries but cannot prove
  every populated production response matches its declared type.

## Regression checks

- `tests/data-flow-audit.test.mjs`: delayed-response races, mapping, shipping
  failure cache headers, and public list revisits. The first five tests were
  observed failing before the fixes and passing afterward.
- `tests/product-variants.test.mjs`: variant selection and both buying flows,
  including non-purchasable products with stock.
- `tests/product-detail-ssr.test.mjs`: rendered attributes and one fresh detail
  request per full document reload.
- Full-suite baseline before this audit's fixes: 184 passed, one failed
  (the footer assertion described above).
- Final verification after rebuilding: 191 passed, one failed out of 192;
  the only failure is the same pre-existing footer assertion. Production build,
  Nuxt typecheck, and `git diff --check` pass. The running localhost detail
  response also preserves purchase eligibility and both variant attributes.

# Catalog failures and transport deadlines

Read this with [product browsing](product-browsing.md), [session/resource freshness](session-resource-freshness.md), the [SSR migration plan](ssr-migration-plan.md) and the [payment contract](payment-flow.md).

## Proxy input contracts

- `/api/products/list` and `/api/discounts/products` accept an object with optional facets/pagination. `{}` is a valid default collection request; an absent/empty HTTP body, JSON null, arrays, primitives and malformed JSON return 400 before contacting the backend.
- `/api/products/filters` additionally requires `collection: { kind: 'catalog' | 'discounted' }`. Its categories, opaque campaign ID and limit are checked by the same boundary helper. The proxy derives discounted metadata semantics from the collection; it does not accept a client-controlled replacement backend route.
- IDs are non-empty strings, category/brand arrays contain strings, page/limit are positive safe integers, prices are finite nonnegative numbers with min ≤ max, sort direction is asc/desc, and dynamic attribute values are string arrays. IDs remain opaque: validation does not invent UUID rules or backend sorting support.
- Backend product-list item shape and pagination are checked. Invalid response structure/page/limit/total produces 502, which the list presents as a failure rather than accepting broken pagination.

## Transport policy

- `useApi` defaults to a 30-second deadline for every request. `backendFetch` defaults to 20 seconds per upstream call. Configure `NUXT_PUBLIC_API_REQUEST_TIMEOUT_MS` and `NUXT_BACKEND_REQUEST_TIMEOUT_MS` as positive integer milliseconds. Invalid/zero values fall back to defaults; individual GET/POST callers may supply a positive `timeout` alongside headers/signal where needed.
- The shared `createRequestDeadline` composes caller cancellation with its own AbortController/timer, disposes listeners/timers, and also bounds promise settlement for non-abortable in-process SSR fetches. The installed ofetch timeout alone does not run when a caller supplies a signal, so relying on `timeout` alone would break catalog cancellation.
- Intentional caller cancellation becomes `ApiError.kind === 'cancelled'`. It does not expire authentication or present a catalog failure. Deadline expiry becomes `kind === 'timeout'`; an upstream deadline returns HTTP 504 with `UPSTREAM_TIMEOUT`. Upstream connection failures return 502. Existing 400/401/403/409/422/503 statuses and validation text remain normalized at the same boundary.
- Shared transports set automatic retry to zero, including GET. Catalog Retry is an explicit read of its captured request. No transport failure automatically replays a mutation, resets a form draft or creates another financial attempt.
- A timeout bounds waiting and attempts cancellation; it does not prove the backend did no work. Preserve checkout's stored identical body/idempotency key and existing order/payment recovery. Never use a timeout to clear cart state, create another order, change payment methods, or replay a charge. Normal payment confirmation still comes from an authenticated backend order lookup.
- Deadlines apply per request/hop, not to the combined duration of a multi-step workflow. Aborting a browser proxy request does not guarantee immediate cancellation of the upstream handler; upstream deadlines bound that work and generation checks reject obsolete resource updates. Late SSR responses after cancellation/timeout must not relay cookies to the already-failed caller.

## UI and request ownership

- Main replacement failures clear previous products and show a persistent alert/Retry instead of false empty results. Successful empty results, loading skeletons, initial failure and append failure are distinct.
- Failed append retains only pages from the current applied context and pauses automatic reads. Retry preserves the failed page and original collection/category/brand/search/prices/attributes/sort snapshot. Unapplied filter edits remain drafts; Retry neither applies them nor rewrites the URL.
- Filter failures retain a typed transport message for the page alert. Category/brand/bootstrap failures still use the current controller retry. Canonical collections keep their existing cache/deduplication policy.
- Stores abort obsolete main-list/filter requests and retain logical generation guards. Neither old successes, failures nor finalizers may replace a newer result, error or loading state. Retry intent clears on invalidation/new navigation.
- Navbar search, home previews and discounted-tab availability are independent caches/consumers. Their UI/cache freshness policies are not a reason to reuse or overwrite main-list state; revisit those policies alongside their SSR migration.

## Verification and future changes

- `npm run test:catalog-failure`: actual H3 input rejection/valid defaults, scoped filters, malformed pagination, real ofetch timeout/cancellation, non-abortable fetch settlement, HTTP/validation classification, no automatic retries, snapshot retries, append failure and obsolete failure suppression.
- `npm run test:product-browse`: existing category/collection/query/navigation/pagination contracts. Relevant session/cart/wishlist/checkout/payment tests, Nuxt type-check and production build were also checked after transport changes.
- Production HTTP checks against a controlled local upstream cover malformed bodies returning 400, preserved 400/401/403/422/503, and actual upstream stalls returning 504. Short test deadlines are environment overrides, not production defaults.
- Chrome against that production server verified the rendered Retry button, preserved unapplied price/attribute drafts, replacement errors without old results or false empty states, successful empty results, paused/retried infinite scrolling, obsolete failures, upstream and client deadlines, offline recovery and discounted collection failures. No uncaught browser runtime exceptions were observed.
- Read-only live catalog, discounted-list and filter proxy requests returned 200 with the new boundaries/deadlines. No live cart mutation, order or payment was required for this change.
- Sorting backend support and SSR content loading remain deferred. Do not sort only loaded pages or start financial/session-creation mutations merely to render SSR content. Preserve the explicit failure result when migrating loaders to awaited setup.

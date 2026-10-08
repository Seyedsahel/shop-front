# Fix Report Version 2

Consolidated project contracts and fix record, updated 2026-10-08. Version 2 retains the earlier integration and SSR records and adds the production-readiness fixes below. This replaces `product-browsing.md`, `session-resource-freshness.md`, `payment-flow.md`, `catalog-failure-handling.md`, and `ssr-migration-plan.md`. Earlier verification is identified in its original section; it is not a claim that every live backend flow was exercised again during SSR migration.

## Production-readiness fixes added in version 2

### Authentication response contract

- Updated the token-validation response contract to match the real backend response: `{ valid: true, id, role }`. User identity now comes from `id` rather than the obsolete `user_id` field.
- Invalid successful validation responses without an ID produce a controlled 502 instead of creating an incomplete authenticated session. Backend failures do not incorrectly erase an existing credential. Account scope remains stable across token rotation.
- Updated session and SSR fixtures and added regression coverage for the real response and malformed responses.

### Product and variant quantity limits

- Preserved variant `max_per_order` as `maxPerOrder` in product-detail mapping and shared types.
- Purchase panels, quick-add controls and cart edits consider stock, the variant limit, the product-wide limit and quantities already in the cart, including other variants of the same product. Adding another unit and editing an existing cart line use their respective remaining capacities.
- Cart lines retain their effective line limit; product details supply the separate product-wide limit. Controls wait for the necessary limits, react to cart changes and prevent excessive additions. Decreasing an existing quantity remains possible when that quantity already exceeds a limit.
- Added mapper, quantity-helper, component, cart-store and cart-page regression coverage.

### OTP and comment input validation

- Added shared parsers and normalizers for authentication and comment input instead of assuming request bodies have valid shapes.
- OTP handlers and comment submission reject malformed objects, wrong types, empty required values and invalid fields with controlled 400 responses before sending backend requests. Existing JSON/content-type and credential behavior is preserved.
- Phone and comment forms show validation feedback and block invalid or duplicate submissions. Comment text and IDs are trimmed; failed comment submissions preserve the draft and reply selection.

### Phone formats, localized digits and resend timing

- Accept canonical mobile numbers, `09…`, `+98…` and `0098…` formats, including common separators. Persian and Arabic digits normalize to the backend's existing format; OTP typing and paste retain leading zeroes.
- Renamed the resend deadline to `otpResendAvailableAt`. The countdown describes when another SMS can be requested, rather than claiming to show OTP validity.
- Countdown completion does not mark the code as expired or block verification. The backend determines actual OTP expiry; resend and verification actions retain pending-state guards.

### Backend error logging

- Replaced complete backend payload/message/path logging with the structured `backend_request_failed` event and allowlisted HTTP method, numeric status and failure kind (`http`, `network` or `timeout`). Customer data, credentials, request paths, query parameters and raw error messages are excluded.
- Removed the duplicate raw product-list error logger. HTTP validation responses, session-expiry handling, cancellation and timeout behavior remain intact.
- Added regression coverage for private-data exclusion and preserved HTTP/network/timeout responses.

### Test repairs

- Address proxy tests now expect backend-relative `/addresses` paths; the shared transport supplies the `/tbt` prefix.
- The product-variant mapper fixture includes required product fields and verifies variant limits. Its harness supplies `createError`, and malformed product responses have a controlled-error regression test.
- Updated affected session/freshness harnesses for the corrected contracts and checkout cleanup integration. The previously deferred mapper-fixture failure recorded in the historical verification section is resolved.

### Footer navigation

- Corrected the footer's Products link from `/blog` to `/products`; the Blog link continues to open `/blog`.

### Checkout recovery storage retention

- Defined the policy in [Checkout storage retention](checkout-storage-retention.md).
- Remove a recovery record only when authenticated backend order data for the current account confirms the same `orderId` as `paid`, `processing`, `shipped`, `delivered` or `cancelled`. Cleanup runs for confirmed checkout responses and order detail/list reads, including payment-return and profile flows, and works after reload without restoring the attempt into memory first.
- Keep the displayed order in memory. Preserve unresolved attempts, lost responses without an order ID, pending/review/unknown states and unrelated order/account records. URL hints never authorize deletion; unresolved attempts have no automatic age-based expiry that could permit duplicate orders.
- Storage read/parse/removal failures do not turn successful order reads into failures. Existing account isolation and explicit new-checkout safeguards remain in place.
- Added coverage for confirmed cleanup, reload recovery, unresolved outcomes, account/order isolation, malformed storage and denied removal.

### Generic error-page presentation

- The large background number and visible error badge now show the actual HTTP status, defaulting to 500 when absent, instead of displaying a hardcoded 404.
- Added distinct titles and descriptions: 404 for a missing page/resource, 500 for an internal server error, 502 for an upstream/backend problem and 503 for an unavailable service. Other statuses retain their actual code and a generic message.
- All text owned by `app/error.vue` is in Persian, including descriptions, search placeholder, navigation and help links; the error section uses `lang="fa"` and right-to-left direction. The [production bug report](production-bug-report.md) remains in English.

### Verification and remaining work

- After the production-readiness code fixes, all 154 local tests and the production SSR regression passed (155 tests total). Typecheck and production build passed. The subsequent error-page status mapping and English-text changes passed typecheck; whitespace checks also passed.
- These results use local fixtures and do not establish that real provider callbacks or live authenticated payment scenarios work in staging. Earlier browser/live-read observations below belong to the historical SSR work and were not repeated for each fix.
- Open items are tracked in [Production bug report](production-bug-report.md): comment author mapping, real staging-payment verification, the hardcoded homepage category and production SEO configuration/sitemap/structured data/social images. They were recorded rather than implemented. Consultation remains deferred.

## SSR migration implemented

- Initial home sections, product collections/details, blog list/details, and story collection/details are awaited through the existing Pinia stores and keyed `callOnce` navigation loaders. Hydration reuses serialized state rather than refetching those sections. Independent homepage sections run concurrently and retain section errors/retries. `/stories` now renders a collection.
- Catalog query/bootstrap errors survive hydration. Invalid input returns 400; list/filter service status is preserved. Genuine missing product/article/story/order details produce HTTP 404; upstream outages remain recoverable service errors. Related products and comments have separate errors/retries.
- Checkout recovery errors and story/detail responses are guarded against abandoned routes and account changes. Store API clients are captured before asynchronous work. Errors and successful-empty/cache flags are serializable. Pending requests/controllers remain per store instance. Main list/filter/detail controllers have ownership tokens: disposal of an older Suspense page cannot clear a newer page's state. Responses never write URLs.
- Cart/wishlist now have a read-only SSR path using the session already checked by `auth-init`. Anonymous rendering produces successful empty state without issuing a guest session. Existing user/guest cookies are forwarded through the shared boundary; mutations retain the client session lock and scope guards. Profile, orders and payment-return pages await their reads.
- Checkout awaits only cart, addresses, locations, delivery methods and payment methods. It renders a stable recovery boundary until browser-only attempt restoration completes. SSR never previews/submits checkout, creates a payment or clears a cart. Account changes clear local checkout drafts and restart scoped recovery. Enabled method reads deduplicate and serialize empty/error state.
- Navbar cart/wishlist badges render after mount, preventing a page SSR load from changing an earlier-rendered layout during hydration. Already-loaded resources are reused without a duplicate read. Browser timers, story seen storage/playback, scroll observers and mutation handlers stay browser-only. Countdown markup starts consistently; rendered dates use `Asia/Tehran`. Filter accordion panel IDs are supplied deterministically and differ between desktop/mobile, preserving accessibility relationships through hydration.
- Public catalog reads explicitly omit backend authorization. All page HTML and page payload responses are `private, no-store` with `Vary: Cookie`, because the global authentication UI varies by visitor even on public routes. Existing explicitly public API metadata caching remains separate. Do not enable public page caching without removing all session dependence from the complete rendered response.
- Reactive titles/descriptions use awaited records/context. Configure `NUXT_PUBLIC_SITE_URL` to the deployed storefront origin for absolute canonical/Open Graph URLs; missing configuration omits absolute URLs instead of inventing localhost. Product collection canonicals retain supported query facets and exclude tracking; faceted/paginated destinations use `noindex, follow`. Private pages use `noindex, nofollow` and no canonical.

## Current boundaries and future revisions

- Backend sorting and consultation integration remain deferred. Sorting state synchronization is implemented, but lifecycle tests do not prove backend ordering. Existing production cookie/HTTPS TODOs and unrelated lint/test tooling are outside this migration.
- The URL `page` remains the entry page; infinite-scroll append does not rewrite it. Refresh/history reload the entry page, not an implicit accumulated-page cache.
- Canonical category/brand collections and public previews/methods cache successful results (including empty results) during a visit. Define explicit freshness/force policies if these collections become mutable. Navbar resource badges and navigation metadata may load in the browser where the current page has not already loaded them; those additional reads are not duplicate page loaders.
- Financial uncertainty still requires the identical persisted checkout body/idempotency key and authenticated order truth. A timeout, success route name or reference hint never proves payment or authorizes a new order/charge/cart deletion.
- SSR private pages were verified with isolated fixture users/guests. Live authenticated OTP/account/order/payment verification still requires a dedicated test account. No live financial mutation is authorized or was performed.

## Earlier SSR verification (version 1)

- `npm run typecheck` and `npm run build` pass. Build output retains Nuxt/Rolldown plugin timing notices; they are not hydration or runtime failures.
- Six existing scripted suites pass: product browsing (17, including new overlapping-controller disposal), catalog failures (9), sessions (11), freshness (11), cart (21), wishlist (6). The new production SSR regression also passes.
- `test:ssr` checks actual HTML body content, successful empty lists, entry-page 2, supported canonical URLs, 400/404/422/503 responses, private caching/robots, anonymous rendering without guest creation, existing guest reads, concurrent user isolation, credentials absent from hydration payloads, and no financial/shopping mutations during rendering. HTML requests include browser `Accept: text/html`; JSON error negotiation is a different response contract.
- Payment tests (18), checkout address/selection tests (9), and checkout proxy tests (6) also pass. Their affected component harnesses now support awaited setup; unrelated tooling was not changed. The variant suite passes 6/7: its pre-existing mapper fixture omits required `name`/`slug` and does not stub `createError`. At the time of version 1, the mapper and fixture were unchanged from HEAD and fixture/tooling repair was deferred; version 2 resolves this failure.
- Fresh Chrome checks against the matching production build pass for home, collections, product/article detail, stories, cart, wishlist, profile, order detail, checkout and both payment-return routes: no hydration mismatches or uncaught exceptions, no repeated initial page reads, collection switching, product A → B → A, query Back/Forward and refresh at entry page 2, and late failures after navigating to `/blog`. Additional navbar metadata/badge reads remain intentional where the page has not loaded those resources.
- A persisted checkout attempt was restored after hydration and recovered its existing pending order; no preview, checkout creation or payment request ran. Success query hints did not authorize payment confirmation.
- Read-only live backend/page checks returned 200 for home, catalog, discounted collection, blog, stories, anonymous cart/wishlist and a real product. Live missing product/article pages returned 404. Initial HTML had 30 catalog product links; the homepage had 32 product links. Observed response times were 0.02–1.08 seconds and HTML sizes 33–147 KB on this run; these are measurements, not production guarantees. None issued cookies or modified resources.
- Live OTP/login/account/address/order/provider callbacks remain unverified without a dedicated account. Cookie rotation, visibility, mutation queuing and old-scope suppression retain their existing regression coverage. Backend sorting and consultation remain deferred.

The permanent `npm run test:ssr` check requires `npm run build` first and starts its own isolated upstream/production server; it uses no live credentials. Browser checks additionally exercise hydration reuse, console mismatches and client navigation.


## Product browsing

Read this before changing the product list, filters, sorting, navigation, or SSR loading. These are the current behavior and integration decisions, rather than a backlog of unrelated production findings.

### Ownership and routes

- `app/components/product/ProductListPage.vue` orchestrates route state and user actions. It writes an explicit browsing path with `router.push` when filters/sort are applied; responses never write URLs. Applying facets resets the URL entry page to 1 by removing `page`.
- `app/stores/productList.store.ts` owns products, response pagination, and a copied applied request. It has no router dependency. Navbar search and home previews use separate state and request lifecycles.
- `app/stores/filter.store.ts` owns filter definitions and editable selections. Edits remain drafts until Apply. Infinite scrolling uses the applied snapshot, including brand/attribute array copies, rather than these drafts.
- `/products` is the catalog. Category, brand, search, prices, attributes, sorting, pagination, and an opaque specific `discount` ID remain combinable query facets.
- `/discounts/products` is a distinct global discounted collection, passed through `ProductCollectionContext`. Preserve this route identity instead of folding it into a boolean catalog facet.

### Query identity

`app/utils/productBrowse.ts` parses supported query state and provides `getProductBrowseQueryKey`. The identity contains category/brand selections, trimmed search, specific discount ID, sort, positive entry page, numeric prices, and dynamic attributes.

Equivalent category/brand ordering, repeated/CSV selections, numeric price spellings, JSON attribute-key ordering, multiselect ordering/duplicates, and empty attribute selections have the same identity. Query spelling is preserved until an explicit user action; responses do not canonicalize URLs. Unknown tracking parameters and hash changes do not reload products or discard draft selections/accumulated pages. Supported invalid query changes still reach the error UI.

The controller watches the normalized identity, route path, and collection kind. Keep every new backend facet in parsing, identity, request capture, URL writing, and regression tests together. Otherwise a URL can change without changing the rendered list.

### Navigation and stale responses

Nuxt's `useRoute()` can commit later than Vue Router's confirmed navigation, especially when another page is still loading. A successful `router.afterEach` invalidates product/filter generations immediately when the meaningful query or path changes. Failed or duplicated navigation must not clear the current results.

The subsequent Nuxt route watcher loads the committed snapshot. A next-tick fallback handles a return to the original route before Nuxt has committed the intervening page; the normalized route key might never have changed in that case. Keep its active-load/disposal guards so it neither duplicates normal loads nor restarts a disposed controller.

Requests capture their inputs before asynchronous work. Controller generations protect category/brand/bootstrap orchestration; filter and list generations protect response writes, errors, and loading flags independently. Unmount removes the navigation hook and invalidates remaining work. A stale request cannot repopulate products or add product parameters to `/blog`.

Main-list and filter requests now abort through `useApi` on replacement, confirmed meaningful navigation, and disposal. Generation checks still guard response writes, errors and loading flags; abort alone does not establish ownership. Intentional cancellation is distinct from timeout/network/HTTP failure and does not create a user-facing catalog error.

### Failure and retry policy

The main list owns `loaded` and a persistent `error`. A new replacement clears old products and pagination immediately; failed new filters/search must never display the old collection or a successful-empty message. Successful empty responses have `loaded: true` and no error.

An append failure retains successful pages for the same applied scope, keeps the last successful page, and pauses automatic infinite scrolling. Explicit Retry reads that same failed page. Replacement Retry reads its original entry page. Both use the captured collection/facets/search/sort snapshot, not current filter drafts; retries do not change the URL. New navigation discards previous retry intent. Bootstrap/filter errors also have a persistent page alert and retry the current committed route.

`fetchList`/`retryList` resolve a success boolean while preserving error state. The awaited SSR loader inspects that result and `loaded/error`, rather than treating any resolved promise as successful data. See [catalog failure handling](#catalog-failures-and-transport-deadlines) for proxy validation, timeouts and verification.

### Infinite-scroll and refresh policy

The URL's `page` is the **entry page**, not the most recently appended page:

- `/products?...` or `page=1` loads page 1, then appends 2, 3, etc.
- A direct `page=2` URL starts with page 2 and may append 3, 4, etc.; it does not reconstruct page 1.
- Appending never changes the URL or adds/replaces a history entry.
- Refresh or meaningful Back/Forward navigation discards accumulated results and fetches the entry page specified by that history entry. With no `page`, it restarts at 1.
- Semantically unchanged URLs (for example a tracking/hash change) retain the current accumulation.
- Applying filters or sort starts a new history entry at page 1. Reapplying an identical full URL explicitly reloads its entry page.

`hasMore` uses the latest response's `page * limit < total` and requires a non-empty last response. It cannot use accumulated item count: direct later-page visits lack earlier items. An unexpectedly empty append stops further paging even when the backend total claims more results. Existing IDs are deduplicated during append.

This assumes the backend returns conventional positive page/limit metadata and a total for the applied collection. Do not infer page position from deduplicated item count. If exact accumulated-page/scroll restoration becomes a requirement, implement and test a deliberate cache or reconstruction policy; native history scroll restoration alone cannot restore products that are no longer loaded. Review canonical/indexing behavior alongside that change.

### Verified backend semantics

Live verification during the category-flow fix established:

- Resolve category and brand slugs against the complete `/categories` and `/brands` collections, not filter-option lists. Filter metadata omitted parent categories.
- Backend category matching is exact: a parent ID does not automatically include descendants. Expand the selected subtree for both product and filter requests, including the parent for products attached directly to it, while retaining only the selected canonical facet in the URL/UI. Deduplicate IDs and guard malformed hierarchy cycles.
- The catalog list uses `/products/list`; the discounted list uses `/discounts/products`.
- Global discounted filter metadata uses `/products/filters` with upstream `discounted_only: true`. There is no `/discounts/products/filters` endpoint (verified 404). The server proxy derives the flag from the typed collection context.
- List and filter requests share the same captured expanded categories, collection, and optional `discount_id`. Filter metadata currently scopes category/discount, not all brand/search/price/attribute combinations; do not present it as a complete count of the final intersected result set.

Observed examples were 243 medicine products, 49 pain-relief products, 24 discounted medicine products, and five discounted pain-relief products. Pain-relief price metadata narrowed from 2–20 to 3–7 with the discount flag, with narrower attribute options. These are test observations, not constants or guarantees about changing inventory.

### Sorting is deferred

URL/store synchronization for sort is implemented and tested. Actual backend ordering is still deferred at the user's request. Existing `sortOptions.ts` mappings (`created_at` and `base_price`, with ascending/descending direction) remain unchanged; treat them as mappings to verify, not proof that results are correctly ordered.

When backend sorting is ready, check every option on catalog and discounted collections, combined facets, equal-value ties, and multiple pages. Verify stable ordering so pagination does not lose or repeat products, and update these notes and the tests with the confirmed contract. Do not implement client sorting of only loaded pages as a substitute for collection-wide backend sorting.

### Further revisions

- SSR initial loading now uses awaited setup. Preserve normalized keys, hydration deduplication, serialized applied request/last-page state, navigation disposal, and entry-page semantics.
- List/filter controllers now claim per-store ownership tokens before awaited setup loading. An old controller's unmount invalidates only its own requests. Continue testing overlapping old/new controllers under Nuxt Suspense when revising navigation.
- Main catalog list/filter failures now use persistent errors and explicit retry. Navbar search, home preview caches and discounted-tab availability retain their separate error/cache policies; revisit them when migrating those consumers rather than sharing main-list state.
- Canonical category/brand stores cache and deduplicate requests. Define a freshness policy if these collections become mutable during a visit.
- Do not record tokens or visitor-specific data in future cache keys or this document.

### Verification

Run `npm run test:product-browse`, `npm run typecheck`, and `npm run build` after relevant changes. The browse suite covers canonical facets, shared collection scopes, normalization, sort/page-only changes, confirmed and failed navigation, return-before-commit, stale successes/errors, applied pagination snapshots, later-page termination, and refresh accumulation policy.

For browser verification, use controlled delayed responses as well as live API checks: direct loads, Apply controls, query-only changes, Back/Forward, refresh after append, direct final-page visits, rapid query replacement, and navigation to `/blog` while a request is pending. Check that no obsolete response changes the route, data, loading state, or error UI. Do not claim backend sort correctness from these lifecycle tests.


## Session and resource freshness

Read this before changing authentication, cart/wishlist loading, private resources, checkout, or their SSR loaders. This supersedes the historical cross-tab synchronization notes in `cart-integration.md`; product-list navigation contracts remain in [product-browsing.md](#product-browsing).

### Current contracts

- HttpOnly cookies remain the credential source. `auth-init` validates `/auth/me` on visibility return and before processing another tab's invalidation. The ten-minute visible-tab timer also validates cookies before considering refresh. `auth.refreshSession()` validates again under the existing session lock before rotating a token; cached `isAuthenticated` never authorizes refresh by itself.
- `identity` can change on token rotation. `sessionScope` represents resource ownership and stays stable for the same authenticated account. Ownership changes clear private canonical state and profile address drafts immediately. Old-scope successes and errors cannot populate the next scope.
- Visibility return revalidates loaded cart/wishlist, previously requested address/order lists, and resources needed by the current private route. Visible order details are refreshed using the current route ID, including `order_id` on `/pay/success` and `/pay/failure`. Profile identity comes from `/auth/me`; there is currently no separate profile resource endpoint.
- Ordinary concurrent reads deduplicate. `useResourceRefresh` queues a freshness signal behind an active read, performs one trailing read for coalesced signals, and waits behind active mutations. Cart/wishlist mutations still perform their own canonical GET; a queued external freshness signal can require another GET. Failed writes are never replayed by synchronization.
- Cart and wishlist use the existing shopping-session lock for validation, writes and reconciliation. Address writes reject concurrent mutations; address refresh waits for them. Visibility-triggered cart/order reads wait for checkout creation, and order reads also wait for payment initiation. Successful checkout/payment invalidates already requested orders and cart in the same tab.
- Cart/wishlist/address writes, checkout/payment success, guest creation, login, logout and token rotation publish invalidation hints. BroadcastChannel `shop-session-v1` carries only `{ version: 1, resource }`. Where unavailable, the storage-event fallback uses `shop:session-invalidation:v1` with an additional random nonce. No tokens, account IDs, cart contents, addresses, order IDs or profile data are sent.
- Hidden tabs retain invalidation intent until visible. Receiving/refetching does not publish another message, preventing echoes. Offline session validation preserves cached state and retries on the next signal. Resource failures retain their existing error/retry behavior. An open profile/checkout route redirects to authentication after validation establishes logout.

### Future revisions

- Preserve per-Pinia-instance queues during [SSR migration](#ssr-migration-acceptance-criteria); do not move them to module-level state. Browser listeners/channels remain client-only. Initial server reads and hydration reuse need their own loading policy; cart/wishlist SSR now uses the read-only path described above; client mutation/session locks remain intact.
- Keep `session:invalidate` typed in `app/types/session-sync.d.ts`. Stores emit through `useSessionSync`, which captures the Nuxt app during setup; do not call context-dependent composables after an awaited mutation.
- New private resources must declare whether they were requested, clear state on ownership changes, guard late writes/errors, and join freshness synchronization. Only reload the current visible detail, rather than arbitrary cached IDs from another account.
- Web Locks serialize normal shopping/session operations across supported tabs. Without Web Locks, locking remains local to the app; broadcasts provide eventual freshness, not atomic server-side concurrency. Backend authorization and idempotency remain authoritative.
- External tools and backend changes do not emit browser hints. Visibility return and the existing timer provide revalidation; there is no continuous real-time subscription.
- Queued reads wait for the active request to settle. Shared transports now have [bounded deadlines](#catalog-failures-and-transport-deadlines); preserve scope guards if extending cancellation to private resources so old errors cannot dirty a new account.
- Checkout preview/address selections and persisted payment recovery have their own guards. Reinspect them when adding new mutations or backend collection semantics; an invalidation is not permission to replay checkout or payment.
- Preserve the user-supplied [payment flow contract](#payment-flow-contract). Checkout does not clear the cart. Paid-state verification comes from the backend order, never return query hints; this synchronization performs no cart deletion or automatic payment retries.
- The old cart integration document also contains obsolete address/checkout implementation notes. Use current stores/routes when planning those revisions rather than treating that historical document as a complete API inventory.

### Verification

- `npm run test:session-freshness`: same-scope visibility truth for cart/wishlist/profile/addresses/orders, cookie validation before rotation, hidden-tab deferral, storage fallback, payload privacy, read deduplication/trailing reads, mutation queues, old-scope errors, logout/loading cleanup, visible order detail, checkout freshness, both payment-return routes, and re-requesting the same detail ID after account changes.
- Existing session, cart, wishlist and payment tests, Nuxt type-check, and production build were checked.
- Two Chrome tabs against the production build, with controlled API responses: quantity 1 → 2 on return, actual BroadcastChannel mutation propagation, visibility during a write, rotation, logout and different-account login. Both payment-return pages kept pending orders unconfirmed despite success query hints, then showed confirmation after visibility revalidation returned a paid order; no mutation was triggered. No uncaught browser runtime exceptions were observed.
- Live proxy/backend checks used a fresh isolated guest cookie jar: guest restoration, stable scope, cart add/PATCH/GET quantity 1 → 2, wishlist add/GET, and cleanup. Test cart/wishlist items were removed and the guest cookie cleared.
- Authenticated backend truth, actual OTP login/merge, and live profile/address/order/payment behavior require a dedicated test account and OTP. These transitions were verified with controlled responses, not claimed as live backend verification. No order or payment was created against the live backend.


## Payment flow contract

Reference supplied by the user in `message.txt` on 2026-10-06. Keep these backend rules in mind when revising session freshness, checkout, order recovery and payment return pages. This records the contract; it does not authorize creating live orders/payments for tests.

- Checkout, addresses, orders and payment creation require an authenticated user credential. Guest credentials support shopping resources only. Browser code never handles bearer tokens; the Nuxt proxy supplies authorization from HttpOnly cookies.
- Load cart, saved addresses, shipping methods and enabled payment methods. Preview relevant selection changes using `/checkout/preview`. Preview amounts, discounts and currency are backend-authoritative and advisory; order creation still validates stock/coupons/shipping. Amounts are integer IRR; display conversion must not alter charged amounts.
- `POST /checkout` uses a random UUID `Idempotency-Key`. Persist the key, identical request body and returned order ID across refresh/network uncertainty. Reuse the same key/body for an uncertain attempt. A failed payment must not create another order. New selections cannot silently replace an ambiguous attempt.
- A created order starts as `pending_payment`. An unpaid order normally allows roughly twenty minutes to start payment, but the customer API does not expose a deadline. Handle backend expiry rather than inventing a client deadline. Zero-total orders cannot use this payment flow.
- Start payment using `POST /orders/{id}/payments` with only `{ method_id }`. Save the order ID, then navigate the top-level browser to the returned `redirect_url`. Do not construct gateway URLs, submit prices/secrets, or use the legacy fake-provider path.
- While payment creation is pending, disable repeated actions. A ready attempt for the same method may reuse its original link. A 409 means stop automatic retries; switching methods or creating another attempt is not a recovery strategy. For uncertain network outcomes, recover the existing order first.
- Gateway callbacks belong to the backend: ZarinPal GET `/payments/zarinpal/callback`, Parsian form POST `/payments/parsian/callback`. The backend verifies and redirects to configured frontend success/failure URLs. Coordinate method URLs, public backend callbacks and deployment `SHOP_BASE_URL`/`FRONTEND_BASE_URL`; localhost fallback must not become a production destination.
- `/pay/success` and `/pay/failure` read `order_id`, fetch `/orders/{id}` with the current customer session, and render actual order state. `authority`, `status`, `ref_id` and `error` are untrusted display hints. `status=OK` or a reference ID is not proof of payment. Normal browser checkout never calls the public provider verification endpoint.
- Paid or later fulfillment states confirm payment. Pending orders remain unconfirmed; offer order recovery without automatically charging again. Cancelled orders cannot start another payment. Missing credentials/lookup failure should direct the customer to sign in and check their orders. Failure redirects and absent browser returns do not establish backend payment failure.
- `/orders` is paged (`items`, `total`, `page`, `limit`); order history/detail supports recovery after closing the gateway tab. Treat 401 as re-authentication, 400 as actionable validation, and payment 409 as an ambiguous/conflicting attempt requiring review.
- **Checkout does not automatically clear the cart.** If cart cleanup is added later, perform `DELETE /cart` only after a confirmed paid order and after proving the current cart is still the cart used for that order, including whether its contents changed. Never clear a subsequently edited cart merely because its cart ID matches. The current freshness work only performs reads/invalidation, never payment-driven cart deletion.

The [session/resource freshness rules](#session-and-resource-freshness) revalidate visible payment-return order details after tab return or order invalidation. Revalidation waits behind active checkout/payment initiation, preserves account-scope guards, and never replays a financial mutation.


## Catalog failures and transport deadlines

Read this with [product browsing](#product-browsing), [session/resource freshness](#session-and-resource-freshness), the [SSR migration plan](#ssr-migration-acceptance-criteria) and the [payment contract](#payment-flow-contract).

### Proxy input contracts

- `/api/products/list` and `/api/discounts/products` accept an object with optional facets/pagination. `{}` is a valid default collection request; an absent/empty HTTP body, JSON null, arrays, primitives and malformed JSON return 400 before contacting the backend.
- `/api/products/filters` additionally requires `collection: { kind: 'catalog' | 'discounted' }`. Its categories, opaque campaign ID and limit are checked by the same boundary helper. The proxy derives discounted metadata semantics from the collection; it does not accept a client-controlled replacement backend route.
- IDs are non-empty strings, category/brand arrays contain strings, page/limit are positive safe integers, prices are finite nonnegative numbers with min ≤ max, sort direction is asc/desc, and dynamic attribute values are string arrays. IDs remain opaque: validation does not invent UUID rules or backend sorting support.
- Backend product-list item shape and pagination are checked. Invalid response structure/page/limit/total produces 502, which the list presents as a failure rather than accepting broken pagination.

### Transport policy

- `useApi` defaults to a 30-second deadline for every request. `backendFetch` defaults to 20 seconds per upstream call. Configure `NUXT_PUBLIC_API_REQUEST_TIMEOUT_MS` and `NUXT_BACKEND_REQUEST_TIMEOUT_MS` as positive integer milliseconds. Invalid/zero values fall back to defaults; individual GET/POST callers may supply a positive `timeout` alongside headers/signal where needed.
- The shared `createRequestDeadline` composes caller cancellation with its own AbortController/timer, disposes listeners/timers, and also bounds promise settlement for non-abortable in-process SSR fetches. The installed ofetch timeout alone does not run when a caller supplies a signal, so relying on `timeout` alone would break catalog cancellation.
- Intentional caller cancellation becomes `ApiError.kind === 'cancelled'`. It does not expire authentication or present a catalog failure. Deadline expiry becomes `kind === 'timeout'`; an upstream deadline returns HTTP 504 with `UPSTREAM_TIMEOUT`. Upstream connection failures return 502. Existing 400/401/403/409/422/503 statuses and validation text remain normalized at the same boundary.
- Shared transports set automatic retry to zero, including GET. Catalog Retry is an explicit read of its captured request. No transport failure automatically replays a mutation, resets a form draft or creates another financial attempt.
- A timeout bounds waiting and attempts cancellation; it does not prove the backend did no work. Preserve checkout's stored identical body/idempotency key and existing order/payment recovery. Never use a timeout to clear cart state, create another order, change payment methods, or replay a charge. Normal payment confirmation still comes from an authenticated backend order lookup.
- Deadlines apply per request/hop, not to the combined duration of a multi-step workflow. Aborting a browser proxy request does not guarantee immediate cancellation of the upstream handler; upstream deadlines bound that work and generation checks reject obsolete resource updates. Late SSR responses after cancellation/timeout must not relay cookies to the already-failed caller.

### UI and request ownership

- Main replacement failures clear previous products and show a persistent alert/Retry instead of false empty results. Successful empty results, loading skeletons, initial failure and append failure are distinct.
- Failed append retains only pages from the current applied context and pauses automatic reads. Retry preserves the failed page and original collection/category/brand/search/prices/attributes/sort snapshot. Unapplied filter edits remain drafts; Retry neither applies them nor rewrites the URL.
- Filter failures retain a typed transport message for the page alert. Category/brand/bootstrap failures still use the current controller retry. Canonical collections keep their existing cache/deduplication policy.
- Stores abort obsolete main-list/filter requests and retain logical generation guards. Neither old successes, failures nor finalizers may replace a newer result, error or loading state. Retry intent clears on invalidation/new navigation.
- Navbar search, home previews and discounted-tab availability are independent caches/consumers. Their UI/cache freshness policies are not a reason to reuse or overwrite main-list state; revisit those policies alongside their SSR migration.

### Verification and future changes

- `npm run test:catalog-failure`: actual H3 input rejection/valid defaults, scoped filters, malformed pagination, real ofetch timeout/cancellation, non-abortable fetch settlement, HTTP/validation classification, no automatic retries, snapshot retries, append failure and obsolete failure suppression.
- `npm run test:product-browse`: existing category/collection/query/navigation/pagination contracts. Relevant session/cart/wishlist/checkout/payment tests, Nuxt type-check and production build were also checked after transport changes.
- Production HTTP checks against a controlled local upstream cover malformed bodies returning 400, preserved 400/401/403/422/503, and actual upstream stalls returning 504. Short test deadlines are environment overrides, not production defaults.
- Chrome against that production server verified the rendered Retry button, preserved unapplied price/attribute drafts, replacement errors without old results or false empty states, successful empty results, paused/retried infinite scrolling, obsolete failures, upstream and client deadlines, offline recovery and discounted collection failures. No uncaught browser runtime exceptions were observed.
- Read-only live catalog, discounted-list and filter proxy requests returned 200 with the new boundaries/deadlines. No live cart mutation, order or payment was required for this change.
- Sorting backend support remains deferred; SSR content loading is now implemented above. Do not sort only loaded pages or start financial/session-creation mutations merely to render SSR content. Preserve the explicit failure result when migrating loaders to awaited setup.


## SSR migration acceptance criteria

The following is the original migration specification, retained as acceptance criteria and a regression checklist. The implementation status above supersedes its descriptions of the old code. The migration excludes changes to dependency versions, backend consultation integration, payment providers, backend sorting, or test/lint tooling. Preserve existing user changes and follow AGENTS.md and the Nuxt architecture skills.

### Outcome

Public pages should return useful content in the first HTML response. Existing visitors with a valid session should receive the appropriate private page content without a browser-only loading waterfall. Hydration should reuse the server result. Client navigation, refresh, retry, and account switching should still fetch the correct data.

The server must not create a guest session, submit a form, mark a story seen, create an order, or initiate payment merely to render a page.

### 1. Record the baseline

1. Reinspect page loaders and store actions; the repository may have changed since the production review.
2. Run the existing build and type-check. Record the pre-existing test failures separately; fixing that tooling is deferred.
3. Start the production server and capture HTML, HTTP status, browser console, and API request counts for representative routes.
4. Use a dedicated authenticated test account and an isolated guest session for private-page verification. Do not use a real customer's credentials or orders.
5. Capture direct loads, refresh, and client navigation. They exercise different Nuxt lifecycle paths.

Baseline examples: `/`, `/products`, a category/search/discount query, `/discounts/products`, a real and missing product, `/blog`, a real and missing article, a real and missing story, `/cart`, `/wishlist`, `/profile`, an order detail, `/checkout`, and both payment-return pages.

Before migrating the product list, read [the current product browsing contracts](#product-browsing), particularly confirmed-navigation invalidation and infinite-scroll refresh behavior.

Before migrating private resource loaders, read [session/resource freshness contracts](#session-and-resource-freshness). Preserve scope guards, mutation-aware refresh queues, current-cookie validation, and client-only cross-tab synchronization.

Catalog reads now expose persistent failure/success state and shared transports have [bounded deadlines](#catalog-failures-and-transport-deadlines). Preserve explicit read outcomes, cancellation ownership, and late-response guards when converting loaders to awaited setup.

### 2. Keep one owner for resource data

Keep canonical resource state in the existing Pinia stores and all HTTP in `useApi` and the server proxy. Pages should await store actions during setup; components should primarily render store-backed props and emit interactions.

For store actions, use Nuxt's `callOnce` to await initial work and avoid repeating it during hydration. [Pinia's Nuxt guide](https://pinia.vuejs.org/ssr/nuxt.html) documents this pattern and its navigation mode.

```ts
const blog = useBlogStore()
await callOnce('blog:list', () => blog.fetchPosts(), { mode: 'navigation' })
```

This requires the action to resolve after its state is populated. Add an explicit policy for errors before migrating callers; an action that catches every error and resolves normally makes a failed load look successful.

Use explicit keys containing the resource and relevant request identity: product slug, article slug, normalized collection/facets/page, or account scope plus order ID. Keys must not contain raw tokens, phone numbers, or address contents.

`callOnce` is not a reactive query watcher. For a reused route component, handle slug/query changes with an explicit watcher that snapshots the request and awaits the action. Skip the duplicate initial watcher call after the awaited setup load. Do not rely on an immediate async watcher to make SSR wait: Vue can render before its promise completes.

Navigation mode alone does not supply a cache policy. Returning to product A after visiting product B must restore/refetch A, even if A's initial key ran earlier. Review store cache restoration and freshness together with Nuxt deduplication.

Do not use `useAsyncData` as a second canonical cache of the same products/orders already held in Pinia. If a genuinely page-local fetch uses it, its handler must return a defined value, be free of unrelated side effects, and use a key describing its inputs.

### 3. Prepare the store and transport contracts

Before moving each loader to setup:

- Capture Nuxt-dependent helpers (`useApi`, route/controller inputs) in a valid setup/store context before asynchronous work.
- Remove navigation and server-side toast side effects from read actions. Expose loading/error state and let pages choose full-page errors or section retries.
- Ensure actions return an explicit success result or throw a normalized error. Distinguish a successful empty response from failed loading.
- Replace non-serializable error objects in public store state with a serializable representation where needed; preserve status/code for route decisions.
- Keep pending promises, abort controllers, and request counters inside each store instance, outside serialized state. Do not share them across visitors through module globals.
- Guard replacement writes by request generation and account scope. Add equivalent protection to blog/detail loaders that currently lack it.
- Add bounded upstream timeouts and distinguish timeout, abort, HTTP failure, and genuine 404. Do not add automatic mutation retries.
- Preserve incoming cookie forwarding and outgoing Set-Cookie relay in `useApi`. Never serialize bearer tokens into the Nuxt payload.
- Make public backend calls explicitly unauthenticated where their contract allows it. If responses vary by session, their HTML must not be publicly cached.

### 4. Migrate public routes

| Area | Initial work to await | Work that stays in the browser |
| --- | --- | --- |
| Home (`pages/index.vue`) | Banners, stories, categories, discount availability, offer, featured category products, brands, blog previews | Slider timers, scroll measurements, story seen state |
| `/products` and `/discounts/products` | Category/brand identity resolution, scoped filter definitions, first requested product page | Filter interactions, infinite-scroll observer, later page appends |
| Product detail | Product detail; related-product preview if it remains part of initial page content | Quick-add modal, quantity changes, wishlist/cart mutations |
| Blog list/detail | List or current article, with the current route slug captured | Comment submission and interactive media playback |
| Story detail | List/detail needed to resolve the requested story | Marking seen, playback progress, keyboard listeners, visibility listeners |
| Consultation | Only real supported read data when backend integration is ready | Draft editing and explicit submission; leave existing backend deferral intact |

#### Home

Move initial orchestration into the page and await independent reads together. Treat a failed optional section as that section's error, rather than failing the whole homepage. The offer still has a real dependency: fetch its campaign before requesting campaign products.

Remove redundant `onMounted` fetches from `HeroSection`, banner components, `StoriesBar`, `CategoryGrid`, `BrandSlider`, `SpecialOfferSlider`, `BlogGrid`, and the homepage's product slider. Preserve mounted hooks used for browser measurements and timers.

Shared components used elsewhere may retain an explicit standalone loading mode, but must not silently refetch every time an already-loaded SSR section mounts. Inspect current call sites before changing their API.

#### Product collections

Complete the category/context and URL ownership work described in the separate browsing plan first. SSR cannot fix a loader that silently discards a valid parent category.

Resolve query slugs against canonical category/brand data, fetch filter definitions for the captured collection/category context, normalize facet values, then fetch the requested product page. Do not rewrite the route during SSR as a side effect of receiving products. If a canonical redirect is necessary, make it an explicit page-level decision before loading.

Keep `/discounts/products` as its own collection. Pass a typed collection context to list and filter actions. Preserve the deferred sorting contract.

Define reload behavior for infinite scrolling: either render the query's requested page with explicit previous-page navigation, or restore the accumulated pages deliberately. Do not display page N in the URL while silently treating it as page 1.

#### Product/article details

Await the required detail before rendering. Verify backend status contracts with actual requests. A genuine missing entity should produce a Nuxt 404; a failed backend should produce an appropriate service error or recoverable error view, never a misleading not-found result.

Avoid rendering a previous route's record while the new record loads. Keep the displayed record tied to its slug/ID. Related products and comments need their own error policy; their failure should not turn an existing product/article into a 404.

#### Stories

Replace the unawaited immediate async route watcher with awaited initial loading plus a watcher for subsequent IDs. Keep seen-state reads/writes and playback in mounted/client code. Make storage access tolerate unavailable localStorage.

Decide what `/stories` represents: a rendered collection or an explicit redirect. Its current empty template is not a useful SSR destination. Preserve close/back behavior separately from invalid direct-link handling.

### 5. Add safe SSR reads for private resources

Before migration, `cart.fetchCart()` and `wishlist.fetchWishlist()` called `auth.withShoppingSession`, which rejects server execution. Do not remove that protection from shopping mutations.

Add a read-only server path inside the existing stores:

1. Reuse the session already checked by `auth-init`.
2. For an anonymous visitor without credentials, set a successful empty state without issuing a guest token or a backend cart/wishlist request.
3. For a visitor with a validated guest/user session, fetch the resource through the existing cookie-forwarding API boundary.
4. Scope returned data and request generations to that visitor's identity. Clear it on an identity transition.
5. Preserve the existing client session lock for explicit shopping actions and subsequent refreshes.

Await private reads at the page boundary, and decide whether navbar badges also need SSR. Loading badges globally adds private data to otherwise public page payloads; either keep those badges client-loaded or ensure those responses are private and cannot be shared by a CDN.

Never put authenticated pages or session-specific payloads behind public page caching. Public catalog caching is safe only when the full rendered response is independent of visitor cookies.

| Route | Server rendering behavior |
| --- | --- |
| `/cart`, `/wishlist` | Empty for anonymous visitors; validated resource contents for existing sessions |
| `/profile` | Auth gate, then awaited address/order/location reads; independent section errors |
| `/profile/orders/:id` | Await authenticated order detail before rendering; preserve genuine 404/access errors |
| `/checkout` | Auth gate, then read-only cart, addresses, shipping locations/methods, payment methods |
| `/pay/success`, `/pay/failure` | Await authenticated order truth when available; never infer success from route name/query hints |

Checkout localStorage attempt restoration stays client-only. Render a stable recovery/loading boundary until the browser restores an attempt so that a recovered order does not flash a fresh-checkout form. Do not compute or submit an order/payment from server rendering. Address confirmation, coupon preview, and payment initiation remain explicit client interactions.

Account expiry/change during any private read must invalidate that response. Review profile/order/payment-page watchers as well as the existing checkout authentication watcher.

### 6. Add metadata and correct HTTP behavior

- Set product/article titles and descriptions from the awaited record through reactive `useSeoMeta`/`useHead`.
- Set collection titles from the resolved context and selected facets.
- Configure a deployment site origin before producing absolute canonical or Open Graph URLs; do not hardcode localhost or the backend origin.
- Define a deliberate canonical/indexing policy for combinable facets and infinite-scroll pagination; do not blindly canonicalize all useful collection destinations to the homepage.
- Exclude profile/cart/wishlist/checkout/payment pages from indexing and keep private responses non-cacheable.
- Verify 404 responses at the HTTP layer, including refresh/direct navigation. A client error message inside HTTP 200 does not meet the requirement.
- Preserve redirect targets for protected routes and authenticate before fetching private resources.

### 7. Hydration and lifecycle verification

For each migrated route, verify:

1. **HTML without JavaScript:** Product/article names and expected initial content exist in the response.
2. **Hydration reuse:** The browser does not immediately repeat the same initial resource request.
3. **Navigation:** A → B → A, changed slug/query, browser Back/Forward, and refresh show the correct record/facets/page.
4. **Concurrent responses:** Slow A cannot replace fast B or modify another route's URL.
5. **Session isolation:** Two parallel visitors cannot see each other's cart, profile, addresses, orders, or Nuxt payload data.
6. **Expiry and account switching:** Old private requests cannot repopulate cleared stores after logout/login.
7. **Failures:** Empty responses, 404, 401/403, 422, 503, timeout, and offline navigation have distinct useful states and retry behavior.
8. **Browser-only behavior:** No server access to document/window/localStorage, no guest issuance during SSR, and no mutations triggered by rendering.
9. **Stable markup:** Dates, countdowns, IDs, responsive UI, and localStorage-derived seen/recovery state do not cause mismatches.
10. **Performance:** Measure backend request count, response time, payload size, and browser waterfall. Await independent reads concurrently and avoid duplicate bootstrap work.

Use targeted lifecycle/browser tests for these guarantees. Run type-check and a production build after each coherent migration batch, then the relevant existing tests. Keep the deferred test/lint repair outside this scope.

### Suggested implementation order

1. Normalize store read/error/serialization contracts and transport timeouts.
2. Fix product category/context and route ownership.
3. Migrate product and article details, HTTP statuses, and metadata.
4. Migrate product collections and blog list.
5. Migrate homepage sections and story routes.
6. Add safe cart/wishlist SSR reads and migrate private pages.
7. Verify hydration, concurrent visitors, session transitions, request counts, and caching.

Completion means initial HTML is useful, status codes are truthful, hydration does not duplicate loading, and private/mutation behavior stays correctly scoped. Do not disable SSR globally or wrap complete public pages in ClientOnly to hide lifecycle errors.


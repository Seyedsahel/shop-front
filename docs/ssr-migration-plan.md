# SSR and hydration migration plan

This is a plan for a separate implementation session. It does not authorize changes to dependency versions, backend consultation integration, payment providers, backend sorting, or test/lint tooling. Preserve existing user changes and follow AGENTS.md and the Nuxt architecture skills.

## Outcome

Public pages should return useful content in the first HTML response. Existing visitors with a valid session should receive the appropriate private page content without a browser-only loading waterfall. Hydration should reuse the server result. Client navigation, refresh, retry, and account switching should still fetch the correct data.

The server must not create a guest session, submit a form, mark a story seen, create an order, or initiate payment merely to render a page.

## 1. Record the baseline

1. Reinspect page loaders and store actions; the repository may have changed since the production review.
2. Run the existing build and type-check. Record the pre-existing test failures separately; fixing that tooling is deferred.
3. Start the production server and capture HTML, HTTP status, browser console, and API request counts for representative routes.
4. Use a dedicated authenticated test account and an isolated guest session for private-page verification. Do not use a real customer's credentials or orders.
5. Capture direct loads, refresh, and client navigation. They exercise different Nuxt lifecycle paths.

Baseline examples: `/`, `/products`, a category/search/discount query, `/discounts/products`, a real and missing product, `/blog`, a real and missing article, a real and missing story, `/cart`, `/wishlist`, `/profile`, an order detail, `/checkout`, and both payment-return pages.

Before migrating the product list, read [the current product browsing contracts](product-browsing.md), particularly confirmed-navigation invalidation and infinite-scroll refresh behavior.

## 2. Keep one owner for resource data

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

## 3. Prepare the store and transport contracts

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

## 4. Migrate public routes

| Area | Initial work to await | Work that stays in the browser |
| --- | --- | --- |
| Home (`pages/index.vue`) | Banners, stories, categories, discount availability, offer, featured category products, brands, blog previews | Slider timers, scroll measurements, story seen state |
| `/products` and `/discounts/products` | Category/brand identity resolution, scoped filter definitions, first requested product page | Filter interactions, infinite-scroll observer, later page appends |
| Product detail | Product detail; related-product preview if it remains part of initial page content | Quick-add modal, quantity changes, wishlist/cart mutations |
| Blog list/detail | List or current article, with the current route slug captured | Comment submission and interactive media playback |
| Story detail | List/detail needed to resolve the requested story | Marking seen, playback progress, keyboard listeners, visibility listeners |
| Consultation | Only real supported read data when backend integration is ready | Draft editing and explicit submission; leave existing backend deferral intact |

### Home

Move initial orchestration into the page and await independent reads together. Treat a failed optional section as that section's error, rather than failing the whole homepage. The offer still has a real dependency: fetch its campaign before requesting campaign products.

Remove redundant `onMounted` fetches from `HeroSection`, banner components, `StoriesBar`, `CategoryGrid`, `BrandSlider`, `SpecialOfferSlider`, `BlogGrid`, and the homepage's product slider. Preserve mounted hooks used for browser measurements and timers.

Shared components used elsewhere may retain an explicit standalone loading mode, but must not silently refetch every time an already-loaded SSR section mounts. Inspect current call sites before changing their API.

### Product collections

Complete the category/context and URL ownership work described in the separate browsing plan first. SSR cannot fix a loader that silently discards a valid parent category.

Resolve query slugs against canonical category/brand data, fetch filter definitions for the captured collection/category context, normalize facet values, then fetch the requested product page. Do not rewrite the route during SSR as a side effect of receiving products. If a canonical redirect is necessary, make it an explicit page-level decision before loading.

Keep `/discounts/products` as its own collection. Pass a typed collection context to list and filter actions. Preserve the deferred sorting contract.

Define reload behavior for infinite scrolling: either render the query's requested page with explicit previous-page navigation, or restore the accumulated pages deliberately. Do not display page N in the URL while silently treating it as page 1.

### Product/article details

Await the required detail before rendering. Verify backend status contracts with actual requests. A genuine missing entity should produce a Nuxt 404; a failed backend should produce an appropriate service error or recoverable error view, never a misleading not-found result.

Avoid rendering a previous route's record while the new record loads. Keep the displayed record tied to its slug/ID. Related products and comments need their own error policy; their failure should not turn an existing product/article into a 404.

### Stories

Replace the unawaited immediate async route watcher with awaited initial loading plus a watcher for subsequent IDs. Keep seen-state reads/writes and playback in mounted/client code. Make storage access tolerate unavailable localStorage.

Decide what `/stories` represents: a rendered collection or an explicit redirect. Its current empty template is not a useful SSR destination. Preserve close/back behavior separately from invalid direct-link handling.

## 5. Add safe SSR reads for private resources

`cart.fetchCart()` and `wishlist.fetchWishlist()` currently call `auth.withShoppingSession`, which rejects server execution. Do not remove that protection from shopping mutations.

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

## 6. Add metadata and correct HTTP behavior

- Set product/article titles and descriptions from the awaited record through reactive `useSeoMeta`/`useHead`.
- Set collection titles from the resolved context and selected facets.
- Configure a deployment site origin before producing absolute canonical or Open Graph URLs; do not hardcode localhost or the backend origin.
- Define a deliberate canonical/indexing policy for combinable facets and infinite-scroll pagination; do not blindly canonicalize all useful collection destinations to the homepage.
- Exclude profile/cart/wishlist/checkout/payment pages from indexing and keep private responses non-cacheable.
- Verify 404 responses at the HTTP layer, including refresh/direct navigation. A client error message inside HTTP 200 does not meet the requirement.
- Preserve redirect targets for protected routes and authenticate before fetching private resources.

## 7. Hydration and lifecycle verification

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

## Suggested implementation order

1. Normalize store read/error/serialization contracts and transport timeouts.
2. Fix product category/context and route ownership.
3. Migrate product and article details, HTTP statuses, and metadata.
4. Migrate product collections and blog list.
5. Migrate homepage sections and story routes.
6. Add safe cart/wishlist SSR reads and migrate private pages.
7. Verify hydration, concurrent visitors, session transitions, request counts, and caching.

Completion means initial HTML is useful, status codes are truthful, hydration does not duplicate loading, and private/mutation behavior stays correctly scoped. Do not disable SSR globally or wrap complete public pages in ClientOnly to hide lifecycle errors.

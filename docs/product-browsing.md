# Product browsing: URL, requests, and pagination

Read this before changing the product list, filters, sorting, navigation, or SSR loading. These are the current behavior and integration decisions, rather than a backlog of unrelated production findings.

## Ownership and routes

- `app/components/product/ProductListPage.vue` orchestrates route state and user actions. It writes an explicit browsing path with `router.push` when filters/sort are applied; responses never write URLs. Applying facets resets the URL entry page to 1 by removing `page`.
- `app/stores/productList.store.ts` owns products, response pagination, and a copied applied request. It has no router dependency. Navbar search and home previews use separate state and request lifecycles.
- `app/stores/filter.store.ts` owns filter definitions and editable selections. Edits remain drafts until Apply. Infinite scrolling uses the applied snapshot, including brand/attribute array copies, rather than these drafts.
- `/products` is the catalog. Category, brand, search, prices, attributes, sorting, pagination, and an opaque specific `discount` ID remain combinable query facets.
- `/discounts/products` is a distinct global discounted collection, passed through `ProductCollectionContext`. Preserve this route identity instead of folding it into a boolean catalog facet.

## Query identity

`app/utils/productBrowse.ts` parses supported query state and provides `getProductBrowseQueryKey`. The identity contains category/brand selections, trimmed search, specific discount ID, sort, positive entry page, numeric prices, and dynamic attributes.

Equivalent category/brand ordering, repeated/CSV selections, numeric price spellings, JSON attribute-key ordering, multiselect ordering/duplicates, and empty attribute selections have the same identity. Query spelling is preserved until an explicit user action; responses do not canonicalize URLs. Unknown tracking parameters and hash changes do not reload products or discard draft selections/accumulated pages. Supported invalid query changes still reach the error UI.

The controller watches the normalized identity, route path, and collection kind. Keep every new backend facet in parsing, identity, request capture, URL writing, and regression tests together. Otherwise a URL can change without changing the rendered list.

## Navigation and stale responses

Nuxt's `useRoute()` can commit later than Vue Router's confirmed navigation, especially when another page is still loading. A successful `router.afterEach` invalidates product/filter generations immediately when the meaningful query or path changes. Failed or duplicated navigation must not clear the current results.

The subsequent Nuxt route watcher loads the committed snapshot. A next-tick fallback handles a return to the original route before Nuxt has committed the intervening page; the normalized route key might never have changed in that case. Keep its active-load/disposal guards so it neither duplicates normal loads nor restarts a disposed controller.

Requests capture their inputs before asynchronous work. Controller generations protect category/brand/bootstrap orchestration; filter and list generations protect response writes, errors, and loading flags independently. Unmount removes the navigation hook and invalidates remaining work. A stale request cannot repopulate products or add product parameters to `/blog`.

Main-list and filter requests now abort through `useApi` on replacement, confirmed meaningful navigation, and disposal. Generation checks still guard response writes, errors and loading flags; abort alone does not establish ownership. Intentional cancellation is distinct from timeout/network/HTTP failure and does not create a user-facing catalog error.

## Failure and retry policy

The main list owns `loaded` and a persistent `error`. A new replacement clears old products and pagination immediately; failed new filters/search must never display the old collection or a successful-empty message. Successful empty responses have `loaded: true` and no error.

An append failure retains successful pages for the same applied scope, keeps the last successful page, and pauses automatic infinite scrolling. Explicit Retry reads that same failed page. Replacement Retry reads its original entry page. Both use the captured collection/facets/search/sort snapshot, not current filter drafts; retries do not change the URL. New navigation discards previous retry intent. Bootstrap/filter errors also have a persistent page alert and retry the current committed route.

`fetchList`/`retryList` resolve a success boolean while preserving error state. A future awaited SSR loader must inspect that result and `loaded/error`, rather than treating any resolved promise as successful data. See [catalog failure handling](catalog-failure-handling.md) for proxy validation, timeouts and verification.

## Infinite-scroll and refresh policy

The URL's `page` is the **entry page**, not the most recently appended page:

- `/products?...` or `page=1` loads page 1, then appends 2, 3, etc.
- A direct `page=2` URL starts with page 2 and may append 3, 4, etc.; it does not reconstruct page 1.
- Appending never changes the URL or adds/replaces a history entry.
- Refresh or meaningful Back/Forward navigation discards accumulated results and fetches the entry page specified by that history entry. With no `page`, it restarts at 1.
- Semantically unchanged URLs (for example a tracking/hash change) retain the current accumulation.
- Applying filters or sort starts a new history entry at page 1. Reapplying an identical full URL explicitly reloads its entry page.

`hasMore` uses the latest response's `page * limit < total` and requires a non-empty last response. It cannot use accumulated item count: direct later-page visits lack earlier items. An unexpectedly empty append stops further paging even when the backend total claims more results. Existing IDs are deduplicated during append.

This assumes the backend returns conventional positive page/limit metadata and a total for the applied collection. Do not infer page position from deduplicated item count. If exact accumulated-page/scroll restoration becomes a requirement, implement and test a deliberate cache or reconstruction policy; native history scroll restoration alone cannot restore products that are no longer loaded. Review canonical/indexing behavior alongside that change.

## Verified backend semantics

Live verification during the category-flow fix established:

- Resolve category and brand slugs against the complete `/categories` and `/brands` collections, not filter-option lists. Filter metadata omitted parent categories.
- Backend category matching is exact: a parent ID does not automatically include descendants. Expand the selected subtree for both product and filter requests, including the parent for products attached directly to it, while retaining only the selected canonical facet in the URL/UI. Deduplicate IDs and guard malformed hierarchy cycles.
- The catalog list uses `/products/list`; the discounted list uses `/discounts/products`.
- Global discounted filter metadata uses `/products/filters` with upstream `discounted_only: true`. There is no `/discounts/products/filters` endpoint (verified 404). The server proxy derives the flag from the typed collection context.
- List and filter requests share the same captured expanded categories, collection, and optional `discount_id`. Filter metadata currently scopes category/discount, not all brand/search/price/attribute combinations; do not present it as a complete count of the final intersected result set.

Observed examples were 243 medicine products, 49 pain-relief products, 24 discounted medicine products, and five discounted pain-relief products. Pain-relief price metadata narrowed from 2–20 to 3–7 with the discount flag, with narrower attribute options. These are test observations, not constants or guarantees about changing inventory.

## Sorting is deferred

URL/store synchronization for sort is implemented and tested. Actual backend ordering is still deferred at the user's request. Existing `sortOptions.ts` mappings (`created_at` and `base_price`, with ascending/descending direction) remain unchanged; treat them as mappings to verify, not proof that results are correctly ordered.

When backend sorting is ready, check every option on catalog and discounted collections, combined facets, equal-value ties, and multiple pages. Verify stable ordering so pagination does not lose or repeat products, and update these notes and the tests with the confirmed contract. Do not implement client sorting of only loaded pages as a substitute for collection-wide backend sorting.

## Further revisions

- SSR loading still uses `onMounted`; follow [the separate SSR migration plan](ssr-migration-plan.md). Preserve normalized keys, initial-load deduplication, serialized applied request/last-page state, navigation disposal, and entry-page semantics when migrating.
- When moving list loading into awaited setup, test overlapping old/new controllers under Nuxt Suspense. An old controller's unmount must not invalidate a new controller's already-started store request; introduce explicit request ownership if setup loads overlap. The current initial load runs on mount.
- Main catalog list/filter failures now use persistent errors and explicit retry. Navbar search, home preview caches and discounted-tab availability retain their separate error/cache policies; revisit them when migrating those consumers rather than sharing main-list state.
- Canonical category/brand stores cache and deduplicate requests. Define a freshness policy if these collections become mutable during a visit.
- Do not record tokens or visitor-specific data in future cache keys or this document.

## Verification

Run `npm run test:product-browse`, `npm run typecheck`, and `npm run build` after relevant changes. The browse suite covers canonical facets, shared collection scopes, normalization, sort/page-only changes, confirmed and failed navigation, return-before-commit, stale successes/errors, applied pagination snapshots, later-page termination, and refresh accumulation policy.

For browser verification, use controlled delayed responses as well as live API checks: direct loads, Apply controls, query-only changes, Back/Forward, refresh after append, direct final-page visits, rapid query replacement, and navigation to `/blog` while a request is pending. Check that no obsolete response changes the route, data, loading state, or error UI. Do not claim backend sort correctness from these lifecycle tests.

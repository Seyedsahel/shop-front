# Shopping cart integration

The existing Cart UI now uses the backend through one canonical Cart store.

## Request and session flow

`UI → Cart store → useApi → Nuxt cart routes → backendFetch → backend`

- JWTs stay in HttpOnly cookies. Only `backendFetch` builds Authorization: auth > guest > none. Cart proxies pass their event with session authorization; components and the Cart store never handle tokens.
- Navbar, Cart, and checkout call `fetchCart()`. This validates existing session metadata, fetches a cart only when an identity exists, and otherwise shows empty without issuing a guest.
- Add calls `auth.withShoppingSession(true, action)`, the same centralized session boundary used by `ensureShoppingSession()`. It validates/reuses an identity or issues a guest. Other operations use `withShoppingSession(false, action)`.
- The session lock covers identity resolution, the cart operation, and its refresh; login/logout cannot interleave through the normal app flow. Web Locks coordinate tabs when supported; otherwise locking is per app instance.
- Guest cookies last 30 days. Expired guest identity loses access to the old cart. No failed mutation is replayed. After resolving a stale cart, a subsequent Add can establish a new guest.
- OTP verification forwards the existing guest credential as `Authorization: Bearer <guest token>`, allowing the backend to merge that cart before the proxy stores the authenticated token and clears the guest cookie. Logout clears both cookies. Cart observes a stable, non-authorizing token digest in session metadata to reset old state and reject stale responses. Routine validation of the same identity does not reset Cart.
- Auth/session initialization remains SSR-aware. Cart reads and mutations are client-triggered; SSR renders a neutral loading state. No JWT is exposed in SSR payloads.

## Cart contracts and synchronization

- Proxies: GET/DELETE `/api/cart`, POST `/api/cart/items`, PATCH/DELETE `/api/cart/items/{itemId}`.
- `products` is retained as an object keyed by item ID. The store derives an array for rendering and counts cart entries for the badge (quantity does not increase the entry count).
- Add/PATCH payloads contain `product_id`, positive integer `quantity`, and `variant_id` (null for products without variants; missing/blank IDs are normalized to null). Updates/removals use backend cart-item IDs.
- Mutations never update totals optimistically. After successful POST/PATCH/DELETE, GET replaces canonical cart state. Mutation response bodies are not assumed.
- A mutation plus its refresh holds the pending state; duplicate mutations are rejected. Concurrent fetches share a promise.
- If refresh fails after a successful mutation, the UI explains that the change was recorded, marks the cart stale, and offers a GET-only retry. Other failures also require refreshing before further mutations.
- An empty response uses `products: {}` and zero pricing, as confirmed by the backend contract. Empty is distinct from loading and errors.
- The implementation assumes a GET after a completed successful mutation returns current backend state; eventual-consistency behavior would require a further backend contract.

## Product presentation

The GET proxy enriches each distinct cart product:

1. GET `/api/products/{product_id}` for its slug and optional thumbnail.
2. GET `/api/products/{slug}/detail` for name, images, description, and variant labels/stock.

The existing detail mapper is shared. Enrichment is bounded to six concurrent products, deduplicated within a response, and never substitutes catalog prices for cart prices. Missing images render an icon; missing product/variant details display an unavailable message and retain removal controls. Failed enrichment can be retried by fetching Cart. Authorization errors remain session errors.

Product Details adds the selected variant and quantity. Product-list Add buttons open an accessible in-place quick-add dialog, fetching details through the existing product-detail store for variant selection and quantity. They do not navigate away from the list.

## Money

Canonical prices and payloads remain in backend **rials**. `app/utils/money.ts` exposes:

- `convertRials(value, 'toman')`: divide by 10.
- `convertRials(value, 'rial')`: unchanged.
- `formatMoney(value, unit?)`: localized amount and currency label.

The hardcoded default is `displayMoneyUnit = 'toman'`. Cart, checkout summaries, product cards/details, and search results use this formatter. Summary displays `subtotal_original`, `discount`, and backend `total`; item totals use `pricing.total` without recalculation. Existing placeholder delivery estimates are represented in rials to preserve their displayed toman amounts.

## Deferred APIs and improvements

- Address drafts, delivery estimates, and payment remain placeholders; no Address/Checkout API is implemented. Checkout waits for cart loading before empty-cart redirects.
- Wishlist transfer simulation was removed. Favorites and coupon actions remain unavailable until their contracts exist.
- Registered-user checkout requirements remain a future Checkout decision; no new login gate was invented.
- Logout still uses the only issued credential in the backend's `refresh_token` field pending a dedicated refresh-token contract.
- No optimistic mutations, quantity debouncing, polling, or cross-tab cart broadcasting; correctness is based on locked operations and authoritative refetching.

## Verification

- `npm run test:session`: token precedence, persistence, restoration, login/logout, 401 handling, concurrency, SSR cookies.
- `npm run test:cart`: cart flows, proxy contracts, enrichment, duplicates, stale state, ownership changes, and money conversion.
- `npm run typecheck`: Nuxt/Vue/TypeScript checking. Unrelated legacy product/category mocks currently have type errors.

Tests mock backend responses and do not validate a live backend's merge or consistency behavior.

## Login merge

The OTP verification proxy uses the shared `session` authorization mode, which forwards the HttpOnly guest cookie as a bearer token. Once the backend returns the authenticated token, the proxy writes `auth_token` and clears `guest_token`; the backend, rather than the frontend, owns the merge. The Cart store observes the identity transition, resets guest state, and fetches the authenticated cart. It does not replay or delete guest items.

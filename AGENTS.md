# Frontend instructions

This repository follows the `nuxt-frontend-architecture` skill.

Use specialized skills when relevant:

- `nuxt-resource-crud` for server-backed resource/list/detail/create/edit/delete work.
- `nuxt-form-pattern` for form drafts, validation, dirty state, submit/reset, and field behavior.
- `nuxt-ui-component` for reusable domain-free components in `components/ui`.
- `nuxt-api-integration` for shared HTTP/API/auth/error/query/upload behavior.

Preserve the dependency direction:

`pages -> domain components -> base UI`, and `pages/stores -> composables/API -> backend`.

Before creating a new store, API wrapper, UI primitive, helper, or type, search for the existing project equivalent. Keep repository exploration narrow and run the smallest meaningful checks after changes.

## Product browsing routes

Use a semantic hybrid routing model for product browsing:

- Keep composable product facets on `/products` query state: `category`, `brand`, `search`, price, dynamic attributes, sort, pagination, and an opaque specific `discount` ID.
- Keep `/discounts/products` as the first-class global discounted-products collection. It has its own backend collection semantics and may carry collection-specific navigation, metadata, analytics, or campaign content.
- Do not create dedicated category, brand, or search routes merely because `ProductListPage` is reusable. Create a route wrapper only when a scope has an independent identity beyond filtering: a stable navigation destination, dedicated backend collection, metadata/SEO, breadcrumb, layout, campaign content, or lifecycle.
- If named category or brand landing pages are later justified, prefer canonical entity routes such as `/categories/:slug` or `/brands/:slug`; retain query parameters for combinable facets.
- When adding another first-class collection, use a thin route wrapper and pass a typed browsing-context configuration into the reusable product-list controller. Do not accumulate route-specific boolean props, and ensure list and filter requests receive the same collection context.

## RTK

Use RTK for shell operations whenever it has an equivalent command
to reduce context/token usage.

Prefer:

- `rtk git status` instead of `git status`
- `rtk git diff` instead of `git diff`
- `rtk grep` instead of `rg`/`grep`
- `rtk find` instead of `find`
- `rtk read` instead of `cat` for inspecting files
- RTK-supported test/lint/typecheck wrappers where applicable

Do not bypass RTK for supported shell commands unless raw output
is specifically required.

## mock
Once you’ve set up the backend API connections and no longer need the mock data, delete the mock data file; there’s no need to edit it.
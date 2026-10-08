# Production Bug Report

All items below are **open**. They have been recorded but have not been implemented or verified as part of these fixes.

- **Correct comment author mapping.**
  - Location: `server/api/comments.get.ts`, author mapping.
  - Swagger returns the name in `user_data.name`; the current mapper reads `author_name` or `user_name`. Real author names can therefore be replaced with the generic fallback author label.
  - Action: support `user_data.name`, retain the fallback for missing or empty names, and verify the real backend response.
  - Acceptance criteria: comments and replies display the correct author name, and missing names do not cause errors.

- **Verify real payments in staging.**
  - Exercise successful and cancelled payments, delayed callbacks, and repeated callbacks with the real payment provider.
  - Test lost checkout responses, payment retries, and session expiration. Ensure orders and charges are not duplicated and unresolved orders remain recoverable.
  - Confirm callback and storefront return URLs in backend settings.
  - Acceptance criteria: record results and evidence for every scenario; displayed payment status must come from authenticated backend order data. Local tests do not replace this verification.

- **Remove the hardcoded featured category ID.**
  - Location: `app/pages/index.vue`, homepage featured-products collection.
  - The fixed category ID may not exist in another environment's catalog, leaving the section empty.
  - Action: configure the collection per environment and define behavior for missing or invalid configuration.
  - Acceptance criteria: the collection can be selected in each environment without changing application code, and unavailable collections are handled correctly.

- **Configure production SEO.**
  - `siteUrl` defaults to empty, so canonical URLs are omitted without deployment configuration.
  - Action: configure the production storefront origin in `siteUrl`; add a sitemap, product/article structured data, and social preview images.
  - Acceptance criteria: public pages have correct canonical URLs; the sitemap includes only public, indexable pages; structured data matches actual product/article content; social preview images use publicly accessible URLs.

# Torob storefront attribution

The client plugin captures `torob_clid` on arrival before auth initialization and
registers global route middleware to capture SPA arrivals before page auth gates.
The storefront saves a host-only cookie for seven days with `Path=/`,
`SameSite=Lax`, and `Secure` over HTTPS. Empty clicks and clicks longer than 200
characters are ignored. Retaining the parameter while browsing does not renew the
cookie; arriving with a new click replaces it. Login, payment, and order completion
leave the cookie alone.

The checkout store reads attribution when creating a new attempt and saves it with
the request body and idempotency key. Retries replay that snapshot, including after
reload, cookie expiry, or a later click. An uncertain order must be resolved before
changing checkout details. A corrected request after a definite rejection gets a
new key and current attribution. Preview and cart requests need no Torob fields.

The existing public product detail, variant/cart/guest-login flow, backend checkout
preview, payment initiation, and backend order-status reads remain the purchase
flow. Backend monetary values remain in rials and the UI displays converted tomans.
There are no browser purchase-reporting calls to Torob or Torob credentials.

Storage follows the provided specification's save-on-arrival behavior, as confirmed
by the site owner. No consent gate is required for this integration.

## Verification

```sh
rtk node --test tests/torob-attribution.test.mjs tests/payment.test.mjs tests/checkout-request.test.mjs tests/checkout-address.test.mjs tests/product-variants.test.mjs tests/cart.test.mjs
rtk npm run typecheck
rtk npm run build
rtk node --test tests/product-detail-ssr.test.mjs
```

The SSR test uses an isolated backend and checks public direct visits and refreshes
at `/products/testtest/?torob_clid=test-123`. Cookie tests cover replacement,
expiry, malformed values, storage restrictions, and SPA navigation. Checkout tests
cover persisted attribution and identical retry bodies/keys.

Before launch, the backend team must verify the caveat in the supplied `torob.md`:
pending-payment orders may currently be reported to Torob as completed. This
repository cannot fix backend order reporting. A real gateway/Torob acceptance
test is still required in the deployment environment.

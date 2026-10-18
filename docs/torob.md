
 Complete storefront flow

 ```text
   Buyer clicks a product in Torob
       ↓
   Storefront opens /products/<slug>/?torob_clid=CLICK_ID
       ↓
   Save CLICK_ID in a first-party cookie for 7 days
       ↓
   Buyer browses → selects variant → adds to cart → logs in
       ↓
   Preview checkout using backend prices
       ↓
   Create order with torob_clid included
       ↓
   Start payment → gateway → backend verification
       ↓
   Show order status from backend

   Torob retrieves attribution/order information from the backend—not the browser.
 ```

 ### 1. Capture the Torob click on arrival

 Run this in the storefront’s shared client-side initialization, before redirects or URL cleanup—not only on the product page.

 ```js
   export function captureTorobClick() {
     const id = new URLSearchParams(window.location.search)
       .get("torob_clid")
       ?.trim();

     if (!id || id.length > 200) return;

     document.cookie =
       `torob_clid=${encodeURIComponent(id)}; ` +
       `Max-Age=604800; Path=/; SameSite=Lax` +
       (location.protocol === "https:" ? "; Secure" : "");
   }

   export function getTorobClick() {
     const cookie = document.cookie
       .split("; ")
       .find(value => value.startsWith("torob_clid="));

     if (!cookie) return "";

     try {
       return decodeURIComponent(cookie.slice("torob_clid=".length));
     } catch {
       return "";
     }
   }
 ```

 Behavior:
 - A new nonempty Torob click replaces the previous saved click.
 - Visits without torob_clid leave the saved click unchanged.
 - Ordinary browsing does not refresh the seven-day expiry.
 - Login, cart changes, and payment redirects must not clear it.
 - Do not clear it after purchase; let it expire.
 - For an SPA, also capture it when navigation introduces a new query string.
 - If privacy/consent rules require consent, gate this storage accordingly.

 The cookie stays on the storefront host. A separate API domain does not need to read it—the storefront sends the value explicitly during checkout.

 ### 2. Render the product landing page

 The current backend generates:

 ```text
   https://your-storefront.com/products/<slug>/
 ```

 The storefront must:

 - Support direct visits and refreshes at that URL.
 - Preserve torob_clid through redirects until captured.
 - Load product details using:
   ```http
     GET /products/<slug>/detail
   ```
 - Show real product images, variant options, price, and availability.
 - Disable purchasing unavailable variants.
 - Keep the displayed currency clear and consistent with Torob’s Toman prices.
 - Allow public product browsing without requiring login.

 Variant detail: the feed currently gives different variants the same product-page URL. Do not assume the URL identifies a selected variant. Let the buyer select it clearly; exact variant deep-linking would require coordinated backend/feed changes.

 ### 3. Use the normal cart and login flow

 Add the selected product variant:

 ```http
   POST /cart/items
   Authorization: Bearer <guest-or-user-token>
   Content-Type: application/json
 ```

 ```json
   {
     "product_id": "<product-id>",
     "variant_id": "<variant-id>",
     "quantity": 1
   }
 ```

 For guests, obtain a token through POST /auth/guest.

 When logging in, pass the guest token through the existing authentication flow so the backend can merge the guest cart.

 No Torob-specific cart fields are needed. Keep attribution in the cookie until checkout.

 ### 4. Preview checkout

 Use the normal authenticated preview:

 ```http
   POST /checkout/preview
   Authorization: Bearer <user-token>
   Content-Type: application/json
 ```

 ```json
   {
     "cart_id": "<cart-id>",
     "address_id": "<saved-address-id>",
     "shipping_method_id": "<shipping-method-id>",
     "coupon_code": ""
   }
 ```

 Display the backend’s calculated prices, discounts, shipping, currency, and total. Do not calculate the authoritative payable amount in the browser.

 An inline address can replace address_id; do not send both.

 ### 5. Attach attribution when creating the order

 Read the cookie and include it in POST /checkout:

 ```js
   const checkoutBody = {
     cart_id: cartId,
     address_id: addressId,
     shipping_method_id: shippingMethodId,
     coupon_code: couponCode || "",
     torob_clid: getTorobClick(),
   };
 ```

 ```http
   POST /checkout
   Authorization: Bearer <user-token>
   Idempotency-Key: <stable-key-for-this-checkout-attempt>
   Content-Type: application/json
 ```

 Example:

 ```json
   {
     "cart_id": "<cart-id>",
     "address_id": "<saved-address-id>",
     "shipping_method_id": "<shipping-method-id>",
     "coupon_code": "",
     "torob_clid": "CLICK_ID"
   }
 ```

 Important:
 - No saved click → send "" or omit the field.
 - Disable duplicate submission while creating the order.
 - On a network retry, reuse the same idempotency key and exact request body, including the captured click ID.
 - If the checkout request changes, use a new key.
 - Keep the returned order ID for payment and the result page.

 The backend saves torob_clid on the order. It does not automatically read the storefront cookie.

 ### 6. Complete payment normally

 1. Start payment:
    ```http
      POST /orders/<order-id>/payments
    ```
    Use the existing payment-method request.
 2. Redirect the buyer to the returned redirect_url.
 3. The gateway returns to the backend callback for server-side verification.
 4. On the storefront result page, fetch:
    ```http
      GET /orders/<order-id>
    ```
 5. Display the actual backend order status.

 Never show “paid” solely because the browser returned from the gateway or a URL says success. Pending verification should show a pending state.

 Payment retries use the existing order; attribution is already attached. No additional Torob browser request is needed.

 ### 7. What the storefront must not do

 - Do not call /torob_api/v3/products or /torob/v1/orders.
 - Do not send browser requests directly to Torob to report purchases.
 - Do not expose TOROB_WEBHOOK_TOKEN or other server credentials.
 - Do not duplicate backend feed, webhook, or order-reporting logic.

 ### Acceptance checklist

 ┌──────────────────────────────────────────┬─────────────────────────────────────────────┐
 │ Test                                     │ Expected result                             │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Open a product with ?torob_clid=test-123 │ Cookie saved                                │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Browse, refresh, log in                  │ Click remains available                     │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Visit without a click parameter          │ Existing click remains unchanged            │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Arrive through another Torob click       │ New click replaces the previous one         │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Checkout                                 │ Request includes the saved torob_clid       │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Retry a timed-out checkout               │ Same key and body; no duplicate order       │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Checkout without attribution             │ Empty/omitted click field                   │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Complete or fail payment                 │ UI follows backend status                   │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Visit after cookie expiry                │ Attribution is absent                       │
 ├──────────────────────────────────────────┼─────────────────────────────────────────────┤
 │ Open the product URL directly            │ Product page works without prior navigation │
 └──────────────────────────────────────────┴─────────────────────────────────────────────┘

 Backend caveat: the current order-reporting code appears to label pending-payment orders as completed. That needs a backend check/fix before going live; the storefront cannot correct it.
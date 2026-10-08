# Checkout Recovery Storage Retention

- Checkout attempts are saved in `localStorage` under an account-specific key. Stored data includes the idempotency key, the original request (which may contain a name, phone number and delivery address), and order/payment recovery information.
- Once the current account's API confirms an order as `paid`, `processing`, `shipped`, `delivered` or `cancelled`, recovery information for that order is no longer needed. Only a record whose `orderId` exactly matches the confirmed order is removed; the order remains in memory for display.
- Cleanup runs for confirmed checkout responses and order detail/list reads, including payment-return pages, the profile page and checkout recovery. URL parameters and initial payment-provider responses do not authorize cleanup.
- Attempts without an `orderId` (including lost responses), orders awaiting payment or review, unknown statuses, and records unrelated to the current account or order are preserved. These records have no automatic expiry; deleting them solely because of their age could remove protection against duplicate orders.
- Logging out or switching accounts clears recovery information from memory but does not delete the previous account's stored record. Recovery remains scoped to the same account.
- Starting a new checkout through the existing permitted flow explicitly removes the previous record. Storage failures or restrictions during automatic cleanup do not cause an otherwise successful order read to fail; the record remains available for later review.
- Recovery data may remain in the same browser until the outcome is confirmed. `localStorage` is not confidential storage, and clearing site data also removes recovery information.

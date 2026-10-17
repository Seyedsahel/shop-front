# Restore consultation access

Consultation entry points are temporarily removed until the backend consultation flow is ready. Direct navigation to `/consultation` returns 404 through inline route middleware in `app/pages/consultation/index.vue`, before the form mounts or fetches data.

The page template, consultation components, store, shared types, and `/api/booking/consultation-*` handlers remain in place for future integration. The API handlers are still callable; the route guard disables the frontend page, not the backend endpoints.

## Backend readiness

Verify the actual backend contract against `shared/types/consultation.types.ts` and the handlers in `server/api/booking/`:

| Backend endpoint | Current frontend expectation |
| --- | --- |
| `GET /booking/consultation-notice` | `{ items: string[] }` |
| `GET /booking/consultation-questions` | `{ items: { id: string, label: string, required: boolean }[] }` |
| `POST /booking/consultation-request` | Body: `{ answers: { questionId: string, value: string }[], description: string }`; response: `{ success: boolean }` |

The two GET handlers currently use `authorization: 'none'`. Confirm the backend's authentication requirements. Submission uses the existing authenticated transport; the store sends signed-out users through `requireAuth('/consultation')`. Confirm login return navigation, server validation, failure feedback, and successful persistence with the real backend. The form currently redirects to `/profile` after success; confirm that this is the intended destination. The store currently treats a successful HTTP response as success, so reconcile any `success: false` response semantics before release.

Keep HTTP in the existing API boundary and resource state in `app/stores/consultation.store.ts`. Do not restore mock data.

## Restore the page and entry points

Remove the temporary `definePageMeta` middleware and its restoration comment from `app/pages/consultation/index.vue` after the flow works. The existing page template can then render normally.

Restore the following UI locations as needed:

| File | Restoration |
| --- | --- |
| `app/layouts/default.vue` | Add `<ConsultationFab />` after `<NavFooter />`. |
| `app/layouts/payment.vue` | Add `<ConsultationFab />` after `<NavFooter class="mt-0" />`. |
| `app/components/nav/Navbar.vue` | Add `{ label: 'مشاوره', href: '/consultation' }` to `navLinks` after products. This restores both desktop navigation and the mobile `NavLinksDropdown`; the dropdown itself needs no change. |
| `app/components/nav/Footer.vue` | Add `{ label: 'مشاوره', to: '/consultation' }` to `navLinks` after home. |
| `app/components/home/HeroSection.vue` | Add the secondary consultation link beside the products link (example below). |
| `app/pages/index.vue` | Add `<HomeConsultationSection :background-image-url="bannerStore.homeHero[0]?.imageUrl" />` between the brand slider and blog section. Fix its link first as described below. |
| `app/error.vue` | Restore the help paragraph linking to `/consultation` (example below). |
| `app/components/home/BenefitsSection.vue` | Restore the consultation benefit only when its service claims are accurate; change the desktop grid from `lg:grid-cols-3` to `lg:grid-cols-4`. |
| `app/components/product/ProductPurchasePanel.vue` | Restore the guidance card (example below) beside the delivery card and change their grid to `grid gap-3 sm:grid-cols-2`. |

The retained `app/components/home/ConsultationSection.vue` currently links to `/`. Change its CTA to `to="/consultation"` before mounting it again. The retained `app/components/consultation/ConsultationFab.vue` already targets `/consultation` and hides itself on that route.

Hero link:

```vue
<NuxtLink
  to="/consultation"
  class="min-w-28 lg:w-50 px-3.5 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-hover"
>
  دریافت مشاوره
</NuxtLink>
```

Error-page help paragraph:

```vue
<p class="mt-10 text-sm text-text-muted">
  به راهنمایی نیاز دارید؟
  <NuxtLink to="/consultation" class="font-bold text-primary transition-colors hover:text-primary-hover">با ما در تماس باشید</NuxtLink>
</p>
```

Previous benefit data (confirm availability and pricing before restoring):

```ts
{ label: 'مشاوره تخصصی رایگان', des: 'هفت روز هفته تا ساعت 24', icon: 'solar:hand-heart-line-duotone' },
```

Product guidance card:

```vue
<div class="flex gap-3 rounded-xl border border-info-border bg-info-subtle p-3">
  <UIcon name="solar:chat-round-line-outline" class="size-6 shrink-0 text-info" />
  <div>
    <h2 class="text-sm font-semibold text-text-primary">نیاز به راهنمایی دارید؟</h2>
    <p class="mt-1 text-xs leading-5 text-text-secondary">برای انتخاب محصول مناسب، از مشاوره فروشگاه کمک بگیرید.</p>
  </div>
</div>
```

## Verification before release

- Run `rtk npm run typecheck`.
- Check desktop and mobile navigation, both layouts, hero, homepage section, footer, product page, and error page. Confirm every restored action reaches `/consultation`.
- Open `/consultation` directly and through client navigation. Confirm notice and questions load, required answers and description are validated, and failed requests can be retried without a false success message.
- Test signed-out submission, login return navigation, authenticated submission, backend validation errors, and the success destination using the real backend.
- Confirm consultation records are actually created and repeated submissions behave as the backend contract specifies.

While disabled, verify those UI surfaces contain no consultation prompts and direct navigation to `/consultation` returns 404 without mounting the form.

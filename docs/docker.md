# Docker deployment

Requires Docker with the Compose plugin. Like `shop-admin`, the image builds with Node 22 and runs only Nuxt's production output as a non-root user. No host Node installation is required.

## Build and run

```sh
cp .env.example .env
# Edit .env with your backend, image and public storefront URLs.
docker compose up -d --build
```

Open <http://localhost:3001/>. The storefront defaults to port 3001 so the admin can keep port 3000. Set `FRONT_PORT` to change it.

Compose reads `.env` for interpolation; exported shell variables override it. Local `.env` files are excluded from the image. Runtime configuration changes need `docker compose up -d` to recreate the container, not a rebuild. Source changes need `docker compose up -d --build`.

```sh
docker compose logs -f front
docker compose down
```

## Runtime configuration

- `NUXT_BACKEND_URL`: backend API base URL reachable **from the container**, for example `https://api.hamidaroo.ir`. No `/tbt` prefix is added to API requests. `localhost` means the container itself, not the host. For a backend in another container, join a shared Docker network and use its service name.
- `NUXT_PUBLIC_IMAGE_BASE_URL`: catalog image base, including `/images`. Nuxt proxies catalog images through `/api/images/`; uploads use `NUXT_BACKEND_URL` with `/tbt/`.
- `NUXT_PUBLIC_SITE_URL`: public HTTPS storefront origin for canonical/Open Graph URLs, not a Docker service name.
- Compose sets `NUXT_USE_MOCK_DATA=false` so consultation endpoints use the backend rather than returning mock success. Standalone Docker runs must set this explicitly too.

The browser calls this storefront's `/api` routes; Nuxt forwards them to the backend. Unlike the admin, this does not require browser-to-backend CORS configuration. `NUXT_PUBLIC_*` values are visible to browsers and must not contain secrets.

## Without Compose

```sh
docker build -t shop-front:latest .
docker run -d --name shop-front --restart unless-stopped \
  -p 127.0.0.1:3001:3000 \
  -e NUXT_BACKEND_URL=https://api.example.com \
  -e NUXT_PUBLIC_IMAGE_BASE_URL=https://api.example.com/images \
  -e NUXT_PUBLIC_SITE_URL=https://shop.example.com \
  -e NUXT_USE_MOCK_DATA=false \
  shop-front:latest
```

## Production routing

- Terminate HTTPS at your reverse proxy and forward **all** paths (including `/api/`) to port 3000 in the container. The storefront uses `/`, not the admin's `/shop-admin/` prefix.
- The host port binds to loopback by default. For direct access from other machines, change the mapping to `"${FRONT_PORT:-3001}:3000"` and configure your firewall.
- For a containerized reverse proxy, join a shared Docker network and target `front:3000` instead of host loopback.
- Use HTTPS for remote backend connections because they carry bearer tokens.
- **Existing production caveat:** `server/utils/session.ts` currently sets session cookies with `secure: false`. Enable Secure cookies before public HTTPS deployment; Docker does not change this application behavior.

## Smoke check

```sh
curl --fail http://localhost:3001/ >/dev/null
curl --fail http://localhost:3001/products >/dev/null
```

These pages require a working backend. Then verify browsing, images and login in a browser; HTTP checks alone do not validate the complete shopping flow.

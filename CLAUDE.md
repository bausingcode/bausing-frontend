# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured.

## Environment Variables

```
NEXT_PUBLIC_BACKEND_URL   # Backend URL used client-side (rewrite target) and server-side fallback
BACKEND_URL               # Server-only override (preferred over NEXT_PUBLIC_BACKEND_URL server-side)
CONSTRUCTION_MODE         # "true"/"1"/"yes" to enable under-construction mode
CONSTRUCTION_PASSKEY      # Passkey to unlock construction mode via cookie
```

`localhost` is automatically normalized to `127.0.0.1` in `lib/backendOrigin.ts` to avoid IPv6 resolution issues with Flask on `0.0.0.0:5050`.

## Architecture

**Stack:** Next.js (App Router) + React 19 + TypeScript + Tailwind CSS 4
**Font:** DM Sans (loaded via `next/font/google`, variable `--font-dm-sans`)

This is a full-stack e-commerce platform ("Bausing") with a customer-facing storefront and a comprehensive admin dashboard.

### API Layer

All API calls go through `/lib/api.ts` (~5500 lines). It conditionally routes requests:
- **Client-side:** Uses `/api/*` rewrite → `${NEXT_PUBLIC_BACKEND_URL}` (default: `http://127.0.0.1:5050`)
- **Server-side:** Uses `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` directly with admin tokens from cookies

The routing pattern inside each API function:
```ts
const url = typeof window === "undefined"
  ? `${BACKEND_URL}/endpoint`   // server: direct backend URL
  : `${API_BASE_URL}/endpoint`  // client: /api/* rewrite
```

Authentication tokens:
- User (customer): stored in `localStorage` as `user_token`
- Admin: stored in cookies (`admin_token`) + `Authorization: Bearer` header

Helper functions exported from `api.ts`: `getAdminToken()`, `getAdminTokenServer(cookieHeader)`, `getAuthHeaders()`, `getAuthHeadersServer(cookieHeader)`.

Note: `lib/api.ts.bak` and `lib/api.ts.bak2` are backup files — ignore them.

### State Management

Four React Context providers (in `/contexts/`), composed in `/app/layout.tsx`:
- `AuthContext` — user auth, login/register, token management
- `CartContext` — shopping cart and favorites, persisted in `localStorage` as `bausing_cart` / `bausing_favorites`
- `LocalityContext` — delivery address detection/selection; selected address persisted in `localStorage` as `bausing_selected_address_id` with 24h expiration
- `HomepageDistributionContext` — homepage layout config

Cross-tab sync is done via `storage` events.

### Route Structure

```
/app
├── (auth)/                   # login, register, forgot-password, reset-password, verify-email
├── (protected)/              # Requires user auth: usuario, tracking, reviews
├── admin/                    # Admin dashboard
│   ├── layout.tsx            # Sidebar + ScrollableContainer
│   └── */page.tsx            # bancos-tarjetas, billetera, blog, catalogos,
│                             #   clientes, configuracion, distribucion-inicio,
│                             #   envios, eventos, logistica, mensajes, metricas,
│                             #   metricas-usuarios, ordenes-fallidas, productos,
│                             #   promos, referidos, reportes, resenas, usuarios,
│                             #   ventas, zonas-entrega
├── api/construction-unlock/  # API route for construction mode cookie
├── blog/                     # Public blog listing and [slug] detail
├── catalogo/                 # Customer product catalog (with [...slug] for categories)
├── checkout/success/         # Post-payment success page
├── club-beneficios/          # Benefits club page
├── en-construccion/          # Under-construction gate page
├── favoritos/                # Customer favorites
├── local/                    # Local store page
├── login-admin/              # Admin login
├── politica-de-privacidad/   # Privacy policy
├── preguntas-frecuentes/     # FAQ page
├── productos/[id]/           # Product detail + /combos sub-route
├── programa-de-creadores/    # Creator program page
├── programa-de-referidos/    # Referral program page
└── terminos-y-condiciones/   # Terms and conditions
```

Admin route protection is handled in `middleware.ts` — checks `admin_token` cookie and redirects unauthenticated requests to `/login-admin`. Authenticated users visiting `/login-admin` are redirected to `/admin`.

**Construction mode** (`CONSTRUCTION_MODE=true`): `middleware.ts` redirects all public traffic to `/en-construccion` unless the request carries a valid SHA-256 cookie derived from `CONSTRUCTION_PASSKEY`. Admin routes are exempt.

### Component Organization

All shared components live in `/components/`. Larger admin pages split into a server `page.tsx` + a `*Client.tsx` component (e.g., `ProductosClient.tsx`, `UsuariosClient.tsx`, `LogisticaClient.tsx`).

### Pricing System

`utils/priceUtils.ts` is the single source of truth for price calculation. Always use `calculateProductPrice(product, quantity, options?)` — never compute prices ad-hoc.

Products have three price fields: `min_price` (legacy/aggregate), `min_transfer_price` (cash/transfer), `min_card_price` (card/list price). When `min_card_price` exists, product cards show transfer price as primary with card price as secondary.

Promo types (handled in `utils/promoUtils.ts`): `percentage`, `fixed`, `promotional_message`, `2x1`, `bundle`, `wallet_multiplier`.

Variant prices are looked up by catalog ID first (via `getVariantPriceByLocality`), falling back to locality ID for backwards compatibility. Call `initializeCatalogCache(localityId)` before bulk variant price lookups.

### SEO

SEO utilities live in `lib/seo/` (product, catalog paths, site config, fetch helpers). Use `SeoJsonLd` component for structured data and `lib/sanitizeBlogHtml.ts` (backed by `isomorphic-dompurify`) for rendering user HTML safely.

### Blog Editor

Admin blog uses Tiptap v3 (`BlogRichTextEditor` / `BlogRichTextInner` components) with extensions: color, highlight, image, link, placeholder, text-style, underline. Charts in admin metrics pages use Recharts.

### Payment Integration

`MercadoPagoCardForm` component handles payment card input via MercadoPago SDK.

### Image Handling

Custom image loader at `/lib/wsrvLoader.ts` proxies images through `wsrv.nl`. Remote patterns are configured in `next.config.ts` for Unsplash and Supabase CDN (`*.supabase.co`, `*.supabase.in`). Always use `next/image` with the custom loader for external images.

### Path Aliases

`@/*` maps to the project root (e.g., `@/components/...`, `@/lib/api`, `@/contexts/...`).

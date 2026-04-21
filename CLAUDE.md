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

## Architecture

**Stack:** Next.js (App Router) + React 19 + TypeScript + Tailwind CSS 4
**Font:** DM Sans (loaded via `next/font/google`, variable `--font-dm-sans`)

This is a full-stack e-commerce platform ("Bausing") with a customer-facing storefront and a comprehensive admin dashboard.

### API Layer

All API calls go through `/lib/api.ts` (~5500 lines). It conditionally routes requests:
- **Client-side:** Uses `/api/*` rewrite → `${NEXT_PUBLIC_BACKEND_URL}` (default: `http://localhost:5050`)
- **Server-side:** Uses `NEXT_PUBLIC_BACKEND_URL` directly with admin tokens from cookies

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
├── blog/                     # Public blog listing and [slug] detail
├── catalogo/                 # Customer product catalog (with [...slug] for categories)
├── checkout/success/         # Post-payment success page
├── favoritos/                # Customer favorites
├── local/                    # Local store page
├── login-admin/              # Admin login
├── politica-de-privacidad/   # Privacy policy
├── productos/[id]/           # Product detail + /combos sub-route
└── terminos-y-condiciones/   # Terms and conditions
```

Admin route protection is handled in `middleware.ts` — checks `admin_token` cookie and redirects unauthenticated requests to `/login-admin`. Authenticated users visiting `/login-admin` are redirected to `/admin`.

### Component Organization

All shared components live in `/components/`. Larger admin pages split into a server `page.tsx` + a `*Client.tsx` component (e.g., `ProductosClient.tsx`, `UsuariosClient.tsx`, `LogisticaClient.tsx`).

### Payment Integration

`MercadoPagoCardForm` component handles payment card input via MercadoPago SDK.

### Image Handling

Custom image loader at `/lib/wsrvLoader.ts` proxies images through `wsrv.nl`. Remote patterns are configured in `next.config.ts` for Unsplash and Supabase CDN (`*.supabase.co`, `*.supabase.in`). Always use `next/image` with the custom loader for external images.

### Path Aliases

`@/*` maps to the project root (e.g., `@/components/...`, `@/lib/api`, `@/contexts/...`).

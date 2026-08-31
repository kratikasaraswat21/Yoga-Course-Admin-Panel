# Admin Panel

Developer handover documentation for the Kratika Yoga platform Admin Panel. This document covers the Admin Panel frontend and the integration points it depends on in the sibling Backend and `yoga-course-landing-page` applications.

## 1. Project overview

The Admin Panel is a React 19 + TypeScript single-page application built with Vite. It provides the platform owner with authenticated tools to:

- Sign in with email, password, and OTP verification.
- Recover and reset the admin password.
- Create, edit, publish, delete, search, filter, and reorder video courses.
- Upload course thumbnails to Cloudflare Images.
- Upload course videos to Cloudflare Stream using resumable uploads.
- Review course analytics, enrolments, ratings, and video processing status.
- Revoke or restore a learner’s access to a course.
- Create, edit, delete, search, and reorder PDF courses.
- Create, edit, delete, search, and reorder affiliate products.

The Admin Panel is an operator interface. Public course, PDF course, affiliate product, authentication, checkout, and learner-facing course experiences are implemented by the Backend and landing-page applications.

## 2. Repository layout

The platform is split into three sibling projects:

```text
Yoga-Course-Platform/
├── Admin-Panel/                 # This project: React/Vite admin application
├── Backend/                     # Express API, Prisma database layer, integrations
└── yoga-course-landing-page/    # Next.js public and learner-facing application
```

### Admin Panel source layout

```text
src/
├── app.tsx                      # Online/offline application shell
├── main.tsx                     # React bootstrap, providers, toaster
├── router/                      # Public/auth and protected route guards
├── layouts/                     # Root router and authenticated dashboard shell
├── modules/
│   ├── auth/                    # Login, OTP, forgot password, reset password
│   ├── dashboard/               # Dashboard landing page and summary sections
│   ├── course/                  # Course list, add/edit stepper, analytics
│   ├── pdf-course/              # PDF course management and upload drawer
│   └── affiliate-product/       # Affiliate product management and upload drawer
├── components/                  # Shared dashboard, course, and UI components
├── hooks/                       # Debounce and online-status hooks
├── utils/
│   ├── api/                    # Axios request abstraction and API helpers
│   ├── constants/               # Navigation, messages, and feature constants
│   ├── helper/                 # Cookies, storage, formatting, and utilities
│   ├── interface/              # TypeScript domain interfaces
│   └── validation/             # Client-side form validation
├── assets/                      # Logo and authentication imagery
└── style/                       # Global CSS and Tailwind styles
```

## 3. Technology stack

- React 19 and React DOM
- TypeScript 6
- Vite 8
- React Router DOM 7
- Axios for HTTP requests
- Tailwind CSS 4 with the Vite plugin
- TipTap for rich-text editing
- `tus-js-client` for Cloudflare Stream resumable video uploads
- `js-cookie` for client-side auth-token storage
- Lucide React for icons
- Vercel deployment configuration

## 4. Local development

### Prerequisites

- Node.js compatible with the installed project toolchain
- pnpm
- A running Backend instance or access to the deployed API
- An admin account seeded in the Backend database

### Install and run

```bash
pnpm install
pnpm dev
```

The Vite development server normally runs at `http://localhost:5173`.

### Available scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start Vite development server with HMR |
| `pnpm build` | Type-check and create the production bundle |
| `pnpm lint` | Run ESLint |
| `pnpm preview` | Preview the production build locally |

### Environment variables

Create an `.env` file in the Admin Panel root:

```env
VITE_API_BASE_URL=http://localhost:501/app/api/v1/admin
VITE_OWNER_MAIL=admin@example.com
```

The deployed configuration currently uses the equivalent API path on `https://api.kratikayoga.com`.

Important: Vite exposes every `VITE_*` variable to browser code. Never place API secrets, database credentials, Cloudinary secrets, JWT secrets, or private service tokens in this project’s environment variables. Those belong only in the Backend environment.

## 5. Application routing

### Authentication routes

| Route | Component / purpose |
|---|---|
| `/auth/login` | Admin email and password form |
| `/auth/verify-otp?signature=<id>` | Six-digit email OTP verification |
| `/reset-password?token=<token>` | Admin password reset form |

If an auth token exists, auth routes redirect to `/dashboard`. If the token is absent, protected routes redirect to `/auth/login`.

### Protected routes

| Route | Purpose |
|---|---|
| `/dashboard` | Dashboard overview; the index route renders the dashboard sections |
| `/course` | Video course management |
| `/course/add` | Multi-step course creation |
| `/course/edit?id=<courseId>` | Multi-step course editing |
| `/course/analytics/<courseId>` | Course analytics and learner access management |
| `/pdf-courses` | PDF course management |
| `/affiliate-products` | Affiliate product management |

`DashboardLayout` owns the sidebar, navbar, outlet, loading state, and session verification. `ProtectedRoute` checks for the local auth cookie before rendering the protected outlet. The dashboard layout then calls `auth/verify/me` against the Backend to validate the token server-side.

## 6. Authentication and session behavior

1. The admin submits email and password to `POST /auth/login`.
2. The Backend validates the admin credentials and sends a one-time password by email.
3. The Admin Panel navigates to the OTP route with the returned signature.
4. The admin submits the six-digit OTP to `POST /auth/verify-otp`.
5. The Backend returns a JWT. The Admin Panel stores it in the `yoga_platform_auth_token` cookie.
6. Protected requests add `Authorization: Bearer <token>` automatically when `protected: true` is passed to `multipleApiHandler`.
7. Dashboard entry verifies the token with `GET /auth/verify/me`.
8. Logout clears cookies, local storage, and session storage, then returns to login.

The token lifetime is controlled by the Backend’s `ADMIN_JWT_EXPIRES_IN` setting. The frontend does not refresh tokens; an invalid or expired token sends the user back to login.

The OTP resend countdown uses local storage key `yoga_admin_otp_resend_available_at`. The course stepper draft uses local storage key `yoga-admin-add-course-draft`.

## 7. API integration

### URL construction

`src/utils/api/multiple.api.ts` joins `VITE_API_BASE_URL` and the feature endpoint. The production base URL is intentionally the admin namespace:

```text
https://api.kratikayoga.com/app/api/v1/admin
```

Therefore, feature code must use paths relative to that base. For example:

```text
base + /course/fetch/all
= https://api.kratikayoga.com/app/api/v1/admin/course/fetch/all
```

Do not prepend `/app/api/v1/admin` inside a feature endpoint.

### Shared response shape

Most Backend responses follow this shape:

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {}
}
```

`multipleApiHandler` returns an additional frontend wrapper containing `ok`, `status`, `data`, and `error`. Feature modules should check both transport success (`ok`) and API success (`data.success`) when the distinction matters.

### Admin API endpoint map

The following paths are relative to `VITE_API_BASE_URL` and require the Bearer token unless stated otherwise.

#### Admin authentication

| Method | Path | Used by |
|---|---|---|
| `POST` | `/auth/login` | Login credentials |
| `POST` | `/auth/forgot-password` | Forgot-password request |
| `POST` | `/auth/reset-password` | Reset password; body contains `token`, `password` |
| `POST` | `/auth/verify-otp` | Login OTP; body contains `otp` |
| `GET` | `/auth/verify/me` | Session verification |
| `POST` | `/auth/resend-otp?signature=<id>` | OTP resend |

#### Video courses

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/course/fetch/all` | List all admin courses |
| `POST` | `/course/add/step-one` | Create course metadata and receive course ID |
| `GET` | `/course/fetch/course/step-one/<courseId>` | Load course metadata for editing |
| `POST` | `/course/edit/<courseId>` | Save course metadata |
| `PATCH` | `/course/publish/<courseId>` | Publish a course |
| `DELETE` | `/course/delete/<courseId>` | Delete a course |
| `GET` | `/course/fetch/course/details/<courseId>` | Load course review data |
| `GET` | `/course/analytics/<courseId>` | Load analytics, users, reviews, and videos |
| `POST` | `/course/<courseId>/users/<userId>/revoke-access` | Revoke access with a reason |
| `POST` | `/course/<courseId>/users/<userId>/restore-access` | Restore access |
| `POST` | `/course/cloud/thumbnail/upload-url` | Generate a Cloudflare Images upload URL |
| `DELETE` | `/course/cloud/thumbnail/<imageId>` | Delete a course thumbnail |

#### Course videos

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/uploads/videos/fetch?courseId=<courseId>` | List videos for a course |
| `POST` | `/uploads/videos/upload-url` | Request a Cloudflare Stream upload URL |
| `PUT` | `/uploads/videos/edit` | Update video title, description, and thumbnail |
| `PUT` | `/uploads/videos/reorder` | Persist video order |
| `DELETE` | `/uploads/videos/delete/<videoId>` | Delete video and associated Cloudflare asset |

The Backend validates video uploads up to 50 GB and supports `video/mp4`, `video/webm`, and `video/quicktime`. The UI uses `tus-js-client` with the returned upload URL and refreshes the video list after upload.

#### PDF courses

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/pdf-course/fetch` | List PDF courses |
| `POST` | `/pdf-course/cloud/pdf/signature` | Request signed PDF upload data |
| `POST` | `/pdf-course/cloud/thumbnail/signature` | Request signed thumbnail upload data |
| `POST` | `/pdf-course/add` | Create a PDF course |
| `POST` | `/pdf-course/edit?id=<id>` | Edit a PDF course |
| `PUT` | `/pdf-course/reorder` | Persist PDF course order |
| `DELETE` | `/pdf-course/delete?id=<id>` | Delete a PDF course |

PDF and thumbnail files are uploaded directly to Cloudinary after the Backend returns signed upload data. The final Cloudinary URLs are then sent to the Backend in the add/edit request.

#### Affiliate products

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/affiliate-product/fetch` | List affiliate products |
| `POST` | `/affiliate-product/cloud/affiliate-products/signature` | Request signed image upload data |
| `POST` | `/affiliate-product/add` | Create a product |
| `POST` | `/affiliate-product/edit?id=<id>` | Edit a product |
| `PUT` | `/affiliate-product/reorder` | Persist product order |
| `DELETE` | `/affiliate-product/delete?id=<id>` | Delete a product |

## 8. Main feature workflows

### Course creation and editing

The course editor is a three-step flow:

1. Course details: title, rich-text description, price, discount, rounding behavior, and thumbnail.
2. Course videos: upload/configure videos, upload custom thumbnails, edit metadata, delete videos, and reorder videos.
3. Review: fetch the saved course details and publish when ready.

The first save calls `/course/add/step-one` and stores the returned `course_id` in the draft. Subsequent saves use `/course/edit/<courseId>`. The draft is persisted locally so a page reload can restore progress. Clear the draft after successful completion or when intentionally abandoning the flow.

Course listing filters and pagination are client-side. The current implementation displays 10 courses per page. Analytics user filtering and pagination are also client-side.

### Course analytics and access control

Analytics loads:

- Course summary and pricing information.
- Enrollment totals and status information.
- Enrolled users.
- Course reviews and ratings.
- Video status, duration, processing details, and ratings.

Revoke access requires a reason between 5 and 1,000 characters. Restore access does not require a reason. Both actions refresh the analytics state after a successful response.

### PDF course publishing

The PDF management page uses a drawer form. It validates the form locally, requests signed upload data, uploads the PDF and thumbnail directly to Cloudinary, then submits the resulting URLs to the Backend. Drag-and-drop reorder performs an optimistic UI update and persists the ordered IDs through `/pdf-course/reorder`.

### Affiliate product publishing

Affiliate products use the same signed-image pattern as PDF courses. Product fields include title, description, status, affiliate link, button title, and thumbnail. Reordering is persisted with the ordered product IDs.

## 9. Backend and landing-page relationship

The Backend mounts the API under:

```text
/app/api/v1
```

Admin routes are mounted under:

```text
/app/api/v1/admin
```

The public landing page uses the non-admin namespaces, including `/courses`, `/pdf-courses`, `/affiliate-products`, `/auth`, and `/payments`. Admin-created and admin-updated content becomes visible to the landing page according to its publication/availability rules.

Examples:

- Publishing a video course in the Admin Panel makes it eligible for the landing page’s public course listing.
- PDF course order in the Admin Panel controls the order returned to the public PDF course pages.
- Affiliate product order and status affect the public affiliate product listing.
- Course pricing and discount fields are consumed by the landing page and checkout flow.
- Video upload processing is asynchronous; a newly uploaded video may remain in `Processing` until Cloudflare Stream updates the Backend through its webhook.

The landing page uses the same Backend deployment but is a separate Next.js application with its own environment variables and public/user authentication behavior. Do not import Admin Panel modules into the landing page or share admin tokens with learner sessions.

## 10. External services

### Cloudflare Images

Used for course thumbnails, PDF thumbnails, affiliate product images, and custom video thumbnails. The browser receives an upload URL/signature from the Backend and uploads directly to Cloudflare. Cloudflare credentials must remain server-side.

### Cloudflare Stream

Used for course video storage and streaming. The Admin Panel requests a resumable upload URL, uploads with TUS, and saves video metadata through the Backend. Processing and playback metadata are finalized asynchronously by Backend webhook handling.

### Cloudinary

Used for PDF files, PDF thumbnails, and affiliate product thumbnails. Signed upload data is generated by the Backend; the browser performs the direct upload and sends the resulting URL back to the Backend.

### Email provider

The Backend sends admin OTP and password-reset emails. Email provider credentials and templates are in `Backend/src/email`; the Admin Panel only consumes the API responses.

## 11. Error handling and operational notes

- Network availability is checked globally. When `navigator.onLine` is false, the app renders the offline screen instead of the router.
- API errors are normalized by `multipleApiHandler`; Axios errors expose the server response in `error` and `data`.
- A failed session verification clears browser storage and redirects to login.
- Loading states and toast messages are implemented per feature rather than through a global query/cache library.
- Requests generally use `useDebounce` to avoid duplicate calls during rapid interaction.
- Abort signals are supported by `multipleApiHandler`, although individual feature adoption should be reviewed when adding long-running requests.
- Rich-text descriptions are rendered as HTML by shared rich-text components. Preserve the Backend’s sanitization expectations before changing rendering behavior.

## 12. Deployment

The project is configured for Vercel. `vercel.json` rewrites all paths to `/`, allowing the client-side router to handle deep links. A production deployment must define:

```env
VITE_API_BASE_URL=https://api.kratikayoga.com/app/api/v1/admin
VITE_OWNER_MAIL=<owner email>
```

After deployment, verify all of the following:

1. `/auth/login` loads directly and after a browser refresh.
2. OTP email delivery works.
3. `/dashboard` loads after authentication.
4. The browser sends `Authorization: Bearer <token>` for protected API calls.
5. Course thumbnail, PDF, affiliate image, and video uploads work.
6. Cloudflare processing eventually changes uploaded video status to `Ready`.
7. Public landing-page listings reflect published/available admin content.
8. CORS permits the deployed Admin Panel origin.

## 13. Verification checklist for developers

Run before handing over a change:

```bash
pnpm lint
pnpm build
```

Manual smoke test:

- Login with valid and invalid credentials.
- Verify valid, invalid, expired, and resent OTP behavior.
- Verify logout and expired-session redirect.
- Create a draft course and reload during each step.
- Upload a course thumbnail and video.
- Edit, reorder, publish, and delete a course.
- Open analytics and test revoke/restore access.
- Create, edit, reorder, and delete a PDF course.
- Create, edit, reorder, and delete an affiliate product.
- Test empty, loading, API-error, offline, and mobile navigation states.

## 14. Known implementation considerations

- The Admin Panel uses a browser-readable JWT cookie rather than an HttpOnly cookie. Treat XSS prevention and dependency hygiene as high priority if this authentication model remains.
- There is no automated test suite configured in `package.json`; confidence currently comes from TypeScript compilation, linting, and manual smoke testing.
- Client-side filtering and pagination assume the full collection is returned by the Backend. Large catalogs may eventually require server-side search and pagination.
- Uploads depend on third-party signatures and asynchronous processing, so retry, cancellation, and stale-upload cleanup should be considered in future improvements.
- The single-admin assumptions currently live in Backend admin authentication services. Multi-admin roles and permissions would require coordinated changes in Backend middleware, JWT claims, navigation, and feature authorization.
- Keep the Admin Panel API base URL pointed at the `/admin` namespace. Public endpoints from the landing page must not be substituted into admin feature calls.

## 15. Useful files for future maintenance

| Concern | File(s) |
|---|---|
| Root routing | `src/layouts/root.layout.tsx` |
| Auth guard and token verification | `src/router/protected.router.tsx`, `src/layouts/dashboard.layout.tsx` |
| API request behavior | `src/utils/api/multiple.api.ts` |
| Auth persistence and logout | `src/utils/helper/helper.tsx` |
| Navigation | `src/utils/constants/dashboard.constants.ts`, `src/components/dashboard/sidebar.component.tsx` |
| Course editor | `src/modules/course/add-course/` |
| Course analytics | `src/modules/course/courseAnalyticsPage.tsx` |
| PDF management | `src/modules/pdf-course/` |
| Affiliate management | `src/modules/affiliate-product/` |
| Backend route registration | `../Backend/src/routes/routes.js` |
| Backend admin route modules | `../Backend/src/routes/modules/admin/` |
| Backend database schema | `../Backend/prisma/schema.prisma` |
| Public API consumers | `../yoga-course-landing-page/lib/api/`, `../yoga-course-landing-page/features/` |

## 16. Handover summary

To work safely on the Admin Panel, start with the relevant module under `src/modules`, follow its calls through `multipleApiHandler`, and verify the matching protected route under `Backend/src/routes/modules/admin`. Keep request paths relative to the configured admin base URL, keep credentials in the Backend, and validate any content-management change against the public landing page because the Admin Panel is the source of truth for operator-managed course and commerce content.

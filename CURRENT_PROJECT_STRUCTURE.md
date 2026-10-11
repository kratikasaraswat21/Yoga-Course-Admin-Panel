# Admin Panel: current project structure (`Admin-Panel`)

> A snapshot of the code **as it is today** (2026-10-09). It lists every folder, file, route and function so new features can be planned against the real codebase.
> Related docs in this folder: `ADMIN_PANEL_HANDOVER.md`, `README.md`.
> Sister docs: `../Backend/CURRENT_PROJECT_STRUCTURE.md`, `../yoga-course-landing-page/CURRENT_PROJECT_STRUCTURE.md`.

The admin panel is a Vite + React single-page app used by the platform owner to manage courses, course videos, PDF courses and affiliate products, view course analytics, and revoke or restore user access. It talks only to the **admin** routes of the backend.

---

## 1. Tech stack

| Area | Tool |
|---|---|
| Build / dev server | Vite 8 (`@vitejs/plugin-react`, `@tailwindcss/vite`) |
| UI | React 19.2, TypeScript 6, React Router DOM 7 |
| Styling | Tailwind CSS 4 + `tw-animate-css`, font `@fontsource-variable/geist` |
| UI primitives | `@base-ui/react` (shadcn-style wrappers in `src/components/ui/`), `lucide-react` |
| Rich text | Tiptap (`@tiptap/react`, `starter-kit`, `extension-text-align`) for course descriptions |
| HTTP | `axios` |
| Auth storage | `js-cookie` |
| Video upload | `tus-js-client` (resumable upload to Cloudflare Stream) |
| Image/file upload | Direct browser upload to Cloudinary (PDFs, PDF and affiliate thumbnails) and Cloudflare Images (course and video thumbnails, via `XMLHttpRequest`) |
| Validation | `validator` + hand-written validators in `src/utils/validation/` |
| OTP input | `input-otp` |
| Hosting | Vercel (`vercel.json` rewrites every path to `/` for SPA routing) |

Scripts:

| Script | Command |
|---|---|
| `pnpm dev` | `vite` |
| `pnpm build` | `tsc -b && vite build` (output in `dist/`) |
| `pnpm preview` | `vite preview` |
| `pnpm lint` | `eslint .` |

Path alias: `@/*` → `./src/*` (set in `vite.config.ts` and `tsconfig.app.json`).

### Environment variables (`.env`)

| Variable | Used in | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `src/utils/api/multiple.api.ts` | Backend **admin** base URL, e.g. `https://<host>/app/api/v1/admin`. All endpoint paths below are relative to this |
| `VITE_OWNER_MAIL` | `src/utils/config/envConfig.ts` | Owner email shown in the UI |

`src/utils/config/envConfig.ts` → `EnvConfig { CURRENT_ENVIRONMENT, OWNER_NAME, OWNER_MAIL }`.

---

## 2. Folder tree

```text
Admin-Panel/
├── index.html                        # Vite HTML entry (mounts #root)
├── public/                           # favicon.svg, icons.svg
├── src/
│   ├── main.tsx                      # createRoot: <TooltipProvider><App /><Toaster /></TooltipProvider>
│   ├── app.tsx                       # Online → RootLayout, offline → OfflineScreenComponent
│   ├── style/index.css               # Tailwind + theme tokens
│   ├── assets/                       # auth-page-bg.png, logo.png, vite.svg
│   │
│   ├── layouts/
│   │   ├── root.layout.tsx           # BrowserRouter + full route table
│   │   └── dashboard.layout.tsx      # Sidebar + navbar shell; verifies session via auth/verify/me
│   │
│   ├── router/
│   │   ├── auth.router.tsx           # /auth/* routes (login, verify-otp, reset-password)
│   │   └── protected.router.tsx      # Redirects to /auth/login when there is no token cookie
│   │
│   ├── modules/                      # Feature pages (one folder per feature)
│   │   ├── auth/                     # index.tsx (route array), logIn, otpVerification, resetPassword
│   │   ├── dashboard/dashboard.tsx   # Combines the 3 dashboard sections
│   │   ├── course/
│   │   │   ├── courseManagement.tsx          # /course list: filter, paginate, publish, delete
│   │   │   ├── courseAnalyticsPage.tsx       # /course/analytics/:courseId
│   │   │   ├── courseDashboardSection.tsx    # Dashboard widget
│   │   │   └── add-course/                   # 3-step add/edit course wizard
│   │   │       ├── add-course-page.tsx       # Wizard container (/course/add, /course/edit)
│   │   │       ├── add-course-stepper.tsx    # Step indicator
│   │   │       ├── course-details-step.tsx   # Step 1: details + thumbnail
│   │   │       ├── course-videos-step.tsx    # Step 2: videos list, upload, reorder, delete
│   │   │       ├── configure-video-dialog.tsx# Upload/edit one video (TUS) + thumbnail
│   │   │       ├── course-review-step.tsx    # Step 3: review + publish
│   │   │       ├── add-course.storage.ts     # localStorage draft helpers
│   │   │       └── add-course.types.ts       # Wizard types
│   │   ├── pdf-course/
│   │   │   ├── pdfCourseManagement.tsx       # /pdf-courses list: search, reorder, delete
│   │   │   ├── uploadPdfCourseSidebar.tsx    # Add/edit drawer (Cloudinary upload)
│   │   │   └── pdfCourseDashboardSection.tsx # Dashboard widget
│   │   └── affiliate-product/
│   │       ├── affiliateProductManagement.tsx        # /affiliate-products list: search, reorder
│   │       ├── uploadAffiliateProductSidebar.tsx     # Add/edit drawer (Cloudinary upload)
│   │       └── affiliateProductDashboardSection.tsx  # Dashboard widget
│   │
│   ├── components/
│   │   ├── course/                   # course-page-header, course-status-badge, course-table
│   │   ├── dashboard/                # navbar.component, sidebar.component
│   │   ├── offline.component.tsx
│   │   ├── page-metadata.component.tsx  # Sets document title/description per route
│   │   └── ui/                       # alert-dialog, badge, button, card, checkbox, dialog, drawer, dropdown-menu,
│   │                                 # input, input-otp, label, pagination, rich-text-content, rich-text-editor,
│   │                                 # select, skeleton, table, textarea, toast, tooltip
│   │       └── variants/             # button.variants.ts, toast.manager.ts
│   │
│   ├── hooks/                        # useDebounce.ts, useOnline.hook.ts
│   │
│   └── utils/
│       ├── api/                      # multiple.api.ts (axios wrapper), pdf-course.api.ts
│       ├── config/envConfig.ts
│       ├── constants/                # course, dashboard (sidebar nav), error, global, success
│       ├── helper/                   # helper.tsx (cookies, cn), course, course-video, dashboard, pdf-course helpers
│       ├── interface/                # TS types: affiliate-product, auth, course, dashboard, global, helper, pdf-course
│       ├── lib/redirectToDashboard.tsx
│       ├── mock/course.mock.ts       # MOCK_COURSES (only referenced by unused helpers)
│       └── validation/               # affiliate-product, auth, course, course-video, pdf-course
│
├── vite.config.ts, tsconfig*.json, eslint.config.js, components.json, vercel.json
├── dist/                             # Build output (generated)
├── ADMIN_PANEL_HANDOVER.md, README.md
└── CURRENT_PROJECT_STRUCTURE.md      # This file
```

**Module pattern.** Each feature has a folder in `src/modules/<feature>/`:
- A `*Management.tsx` page: list, search, actions.
- An `upload*Sidebar.tsx` drawer: add/edit form and media upload.
- A `*DashboardSection.tsx` widget for the dashboard page.

Types live in `utils/interface/`, validators in `utils/validation/`, and toast strings in `utils/constants/{error,success}.constants.ts`.

There is no global state library. State is local `useState`, plus `localStorage` for the add-course draft.

---

## 3. App bootstrap and auth pipeline

1. **`main.tsx`** renders `<App />` inside `TooltipProvider`, plus the global `<Toaster />`.
2. **`app.tsx`** uses `useOnlineStatus()`. When offline it renders `OfflineScreenComponent`, otherwise `RootLayout`.
3. **`root.layout.tsx`** holds the `BrowserRouter` and route table (section 4). `PageMetadata` updates the tab title for each path.
4. **`ProtectedRoute`** (`router/protected.router.tsx`) checks the `yoga_platform_auth_token` cookie. If it is missing, it redirects to `/auth/login`.
5. **`DashboardLayout`** wraps every protected page. On mount it calls `GET auth/verify/me`:
   - On success it renders the sidebar, navbar and `<Outlet />`.
   - On failure it runs `clearLocalSessionStorage()`, sets `sessionStorage["yoga_platform_auth_verification_failed"] = "true"`, shows a toast and redirects to `/auth/login`.
6. **`AuthRoutes`** (`router/auth.router.tsx`) sends an already-logged-in user to `/dashboard`, unless the verification-failed flag is set.

**Login flow (two steps, OTP):**
1. `LogInPage` → `POST /auth/login { email, password }`. The response contains a `signature`.
2. Navigate to `/auth/verify-otp?signature=<signature>`.
3. `OTPVerificationPage` → `POST /auth/verify-otp { otp }`. The response contains an `auth_token`, saved with `storeDataInSecureCookie(token, "yoga_platform_auth_token", true)`, then navigate to `/dashboard`.
4. **Resend:** `POST /auth/resend-otp?signature=...`. The resend cooldown is stored in `localStorage["otpResendCodeAvailableAt"]`.

**Forgot password:** a dialog on `LogInPage` calls `POST /auth/forgot-password` with no body. The backend emails the single admin account. The email link opens `/reset-password?token=...` (or `/auth/reset-password`), and `ResetPasswordPage` calls `POST /auth/reset-password { token, password }`.

**Logout:** `DashboardSidebar.handleLogout` calls `clearLocalSessionStorage()`. This clears `localStorage`, `sessionStorage`, and every cookie on the `admin.kratikayoga.com` / `kratikayoga.com` domains. It then navigates to `/auth/login`.

**Cookie config** (`helper.tsx` → `getCookieConfig`): `Secure` + `SameSite=Lax`. The cookie is persistent (30 days by default) when `is_persistent` is true.

**API wrapper** (`utils/api/multiple.api.ts`): `multipleApiHandler([{ endPoint, method, protected, data, header }])` runs all requests in parallel and returns `ApiReturnInterface[]` (`{ ok, status, data, error }`). For `protected: true` it adds `Authorization: Bearer <cookie token>`. Unlike the landing page, it does **not** redirect on 401/403/404. Each page checks `res.data.success` itself.

---

## 4. Route map (`layouts/root.layout.tsx`)

| URL | Guard | Layout | Page component |
|---|---|---|---|
| `/auth/login` | public (redirects if logged in) | `AuthRoutes` | `LogInPage` |
| `/auth/verify-otp?signature=` | public | `AuthRoutes` | `OTPVerificationPage` |
| `/auth/reset-password?token=` | public | `AuthRoutes` | `ResetPasswordPage` |
| `/reset-password?token=` | public | none | `ResetPasswordPage` |
| `/dashboard` | `ProtectedRoute` | `DashboardLayout` | `DashboardPage` |
| `/dashboard/courses` | `ProtectedRoute` | `DashboardLayout` | redirect → `/course` |
| `/course` | `ProtectedRoute` | `DashboardLayout` | `CourseManagementPage` |
| `/course/add?courseId=&step=` | `ProtectedRoute` | `DashboardLayout` | `AddCoursePage` |
| `/course/edit?id=` (or `courseId=`) | `ProtectedRoute` | `DashboardLayout` | `AddCoursePage` |
| `/course/analytics/:courseId` | `ProtectedRoute` | `DashboardLayout` | `CourseAnalyticsPage` |
| `/pdf-courses` | `ProtectedRoute` | `DashboardLayout` | `PdfCourseManagementPage` |
| `/affiliate-products` | `ProtectedRoute` | `DashboardLayout` | `AffiliateProductManagementPage` |
| `*` | – | – | `RedirectToDashboard` (to `/dashboard` with a token, else `/auth/login`) |

Sidebar items (`utils/constants/dashboard.constants.ts` → `DASHBOARD_NAVIGATION_ITEMS`): Dashboard `/dashboard`, Courses `/course`, PDF Course Manager `/pdf-courses`, Affiliate Products `/affiliate-products`.

To add a new page:
1. Add a route in `root.layout.tsx` inside `<ProtectedRoute>` with `DashboardLayout`.
2. Add a sidebar item to `DASHBOARD_NAVIGATION_ITEMS`.
3. Add a title case in `page-metadata.component.tsx`.

---

## 5. Backend endpoints used by the admin panel

All paths are relative to `VITE_API_BASE_URL` (`…/app/api/v1/admin`). A leading `/` is optional because `getUrl` normalises it.

| Method | Endpoint | Auth | Called from |
|---|---|---|---|
| POST | `/auth/login` | – | `modules/auth/logIn.tsx` |
| POST | `/auth/forgot-password` | – | `logIn.tsx` |
| POST | `/auth/verify-otp` | – | `otpVerification.tsx` |
| POST | `/auth/resend-otp?signature=` | – | `otpVerification.tsx` |
| POST | `/auth/reset-password` | – | `resetPassword.tsx` |
| GET | `/auth/verify/me` | ✔ | `layouts/dashboard.layout.tsx` |
| GET | `/course/fetch/all` | ✔ | `courseManagement.tsx`, `courseDashboardSection.tsx` |
| POST | `/course/add/step-one` | ✔ | `add-course-page.tsx` (new course) |
| POST | `/course/edit/:courseId` | ✔ | `add-course-page.tsx` (existing draft) |
| GET | `/course/fetch/course/step-one/:courseId` | ✔ | `course-details-step.tsx` |
| GET | `/course/fetch/course/details/:courseId` | ✔ | `course-review-step.tsx` |
| PATCH | `/course/publish/:courseId` | ✔ | `add-course-page.tsx`, `courseManagement.tsx` |
| DELETE | `/course/delete/:courseId` | ✔ | `courseManagement.tsx` |
| POST | `/course/cloud/thumbnail/upload-url` | ✔ | `course-details-step.tsx`, `configure-video-dialog.tsx` (Cloudflare Images direct-upload URL) |
| DELETE | `/course/cloud/thumbnail/:imageId` | ✔ | `course-details-step.tsx`, `configure-video-dialog.tsx` |
| GET | `/course/analytics/:courseId` | ✔ | `courseAnalyticsPage.tsx` |
| POST | `/course/:courseId/users/:userId/revoke-access` | ✔ | `courseAnalyticsPage.tsx` (`{ reason }`) |
| POST | `/course/:courseId/users/:userId/restore-access` | ✔ | `courseAnalyticsPage.tsx` |
| POST | `/uploads/videos/upload-url` | ✔ | `configure-video-dialog.tsx` (Cloudflare Stream TUS URL) |
| GET | `/uploads/videos/fetch?courseId=` | ✔ | `course-videos-step.tsx` |
| PUT | `/uploads/videos/edit` | ✔ | `configure-video-dialog.tsx` |
| PUT | `/uploads/videos/reorder` | ✔ | `course-videos-step.tsx` |
| DELETE | `/uploads/videos/delete/:videoId` | ✔ | `course-videos-step.tsx` |
| GET | `/pdf-course/fetch` | ✔ | `pdfCourseManagement.tsx`, `pdfCourseDashboardSection.tsx` |
| POST | `/pdf-course/add` | ✔ | `uploadPdfCourseSidebar.tsx` |
| POST | `/pdf-course/edit?id=` | ✔ | `uploadPdfCourseSidebar.tsx` |
| DELETE | `/pdf-course/delete?id=` | ✔ | `pdfCourseManagement.tsx` |
| PUT | `/pdf-course/reorder` | ✔ | `utils/api/pdf-course.api.ts` → `reorderPdfCourses` |
| POST | `/pdf-course/cloud/pdf/signature` | ✔ | `uploadPdfCourseSidebar.tsx` (Cloudinary signed upload) |
| POST | `/pdf-course/cloud/thumbnail/signature` | ✔ | `uploadPdfCourseSidebar.tsx` |
| GET | `/affiliate-product/fetch` | ✔ | `affiliateProductManagement.tsx`, `affiliateProductDashboardSection.tsx` |
| POST | `/affiliate-product/add` | ✔ | `uploadAffiliateProductSidebar.tsx` |
| POST | `/affiliate-product/edit?id=` | ✔ | `uploadAffiliateProductSidebar.tsx` |
| PUT | `/affiliate-product/reorder` | ✔ | `affiliateProductManagement.tsx` |
| POST | `/affiliate-product/cloud/affiliate-products/signature` | ✔ | `uploadAffiliateProductSidebar.tsx` |

**Third-party uploads straight from the browser:**
- Cloudinary: `https://api.cloudinary.com/v1_1/<cloudName>/<image|raw>/upload` using the backend signature. Used for PDFs, PDF thumbnails and affiliate thumbnails.
- Cloudflare Images: `XMLHttpRequest` POST to the one-time `uploadURL` from `/course/cloud/thumbnail/upload-url`. Used for course and video thumbnails.
- Cloudflare Stream: `tus.Upload` to the URL from `/uploads/videos/upload-url`. After the upload, the backend receives Cloudflare's webhook and marks the video READY.

---

## 6. Key flows

**Add or edit course (3-step wizard: `add-course-page.tsx`)**
- The draft (`AddCourseDraft { courseId, step, details, videos }`) is saved in `localStorage["yoga-admin-add-course-draft"]` via `add-course.storage.ts`. It is mirrored in the URL (`?courseId=&step=`).
- A `beforeunload` guard (`confirmBeforeLeave`) warns before closing with unsaved work.
- **Step 1, `CourseDetailsStep`:** title, rich-text description, price, discount %, and round payable amount. Upload a thumbnail to Cloudflare Images, then "Save and continue" (`handelSaveMoveToNextStep`), which calls `add/step-one` (new) or `edit/:id` (existing) and stores the returned `course_id`.
- **Step 2, `CourseVideosStep`:** list videos (`fetch?courseId`), add a video, which opens `ConfigureVideoDialog` (title, description, thumbnail auto/custom, TUS upload), then drag to reorder and delete.
- **Step 3, `CourseReviewStep`:** read-only summary from `fetch/course/details/:id`, then **Publish** (`publishCourseFunction` → `PATCH publish/:id`). The backend rejects the publish unless every video is READY.
- Cancel or "Save as draft" (`handelSaveAsDraftFunction`) saves with placeholder `-` values for empty fields and returns to `/course`.

**Course list (`courseManagement.tsx`):** status filter (`All`/`Draft`/`Published`/`Archived`), client-side pagination (`COURSES_PER_PAGE = 5`), and row actions in `CourseTable`: Edit → `/course/edit?id=`, Publish, Analytics, Delete (with confirm dialog).

**Course analytics (`courseAnalyticsPage.tsx`):** summary cards, enrollments table, reviews, and per-video ratings. **Revoke access** asks for a reason in a dialog and emails the user. **Restore access** reactivates the enrollment.

**PDF courses:** the drawer (`UploadPdfCourseSidebar`) handles:
- PDF file + thumbnail selection, then signature, then Cloudinary upload.
- Price / discount / free toggle (`updatePrice`, `updateDiscount`, `toggleFreeCourse`).
- Submit to `add` or `edit?id=`.

The list page supports search, drag-and-drop reorder (`handleCourseDrop` → `reorderPdfCourses`) and delete.

**Affiliate products:** the same pattern as PDF courses: a drawer with a Cloudinary thumbnail, link, button title and status, plus drag-and-drop reorder (`handleProductDrop`).

**Debounced handlers:** almost every API call is wrapped in `useDebounce(fn, delay)` (default 500 ms, often 100 ms) to stop double submits.

**Toasts:** `toast.add({ title, description, type: "success" | "error" })` from `@/components/ui/variants/toast.manager`.

---

## 7. File-by-file reference (functions and exports)

`(internal)` = not exported. Pages are default exports.

### Core

| File | Functions / exports |
|---|---|
| `main.tsx` | renders root |
| `app.tsx` | `App` |
| `layouts/root.layout.tsx` | `RootLayout` (route table) |
| `layouts/dashboard.layout.tsx` | `DashboardLayout`: `fetchUserStatus` (debounced), `openSidebar`, `closeSidebar` |
| `router/auth.router.tsx` | `AuthRoutes` |
| `router/protected.router.tsx` | `ProtectedRoute` |
| `utils/lib/redirectToDashboard.tsx` | `RedirectToDashboard` |

### Modules: auth

| File | Functions / exports |
|---|---|
| `modules/auth/index.tsx` | `APP_AUTH_ROUTES_MODULE_ARRAY` (`/login`, `/verify-otp`, `/reset-password`) |
| `modules/auth/logIn.tsx` | `LogInPage`: `handleChange`, `handleLoginApi`, `handleSendResetPasswordApi`, `handelOtpNavigation`, `handleSendResetPasswordInstructions`, `handleSubmit` |
| `modules/auth/otpVerification.tsx` | `OTPVerificationPage`: `handelOtpVerification`, `handelResendOtpVerificationCode`, `updateRemainingCountDown`, `handleVerificationCodeChange`, `handleOtpVerificationSubmit`, `handleResendVerificationCode` |
| `modules/auth/resetPassword.tsx` | `ResetPasswordPage`: `handlePasswordResetRequest`, `handlePasswordChange`, `handleResetPasswordSubmit` |

### Modules: dashboard

| File | Functions / exports |
|---|---|
| `modules/dashboard/dashboard.tsx` | `DashboardPage` (renders `CourseDashboardSection`, `AffiliateProductDashboardSection`, `PdfCourseDashboardSection`) |

### Modules: course

| File | Functions / exports |
|---|---|
| `course/courseManagement.tsx` | `CourseManagementPage`: `handleDeleteCourse`, `handlePublishCourse`, `fetchAllTheCreatedCourse`; type `CourseStatusFilter` |
| `course/courseDashboardSection.tsx` | `CourseDashboardSection`: `fetchCourses` |
| `course/courseAnalyticsPage.tsx` | `CourseAnalyticsPage`: `fetchAnalytics`, `revokeAccess`, `openRevokeDialog`, `closeRevokeDialog`, `submitRevoke`, `restoreAccess`, `openRestoreDialog`, `closeRestoreDialog`, `submitRestore`. Internal components `StatusBadge`, `StarRating`, `SummaryCard`, `LoadingState`, `EmptyState`. Helpers `formatDate`, `formatDuration`, `formatFileSize`, `statusClassName`. Types `User`, `Enrollment`, `Review`, `VideoRating`, `AnalyticsVideo`, `CourseAnalytics` |
| `course/add-course/add-course-page.tsx` | `AddCoursePage`: `confirmBeforeLeave`, `setStep`, `handelSaveAsDraftFunction`, `saveAndLeave`, `stopProcess`, `handleCancel`, `handelSaveMoveToNextStep`, `handleSaveAndContinue`, `publishCourseFunction`, `handelPublishCourse` |
| `course/add-course/add-course-stepper.tsx` | `AddCourseStepper` |
| `course/add-course/course-details-step.tsx` | `CourseDetailsStep`: `fetchStepOneFormData`, `setThumbnail`, `handleThumbnailChange`, `handleThumbnailDrop`, `handelRemoveThumbnailFunction`, `removeThumbnail`, `handleUploadImageToCloudflare`, `handelGetCloudflareUploadUrl`, `handelCloudImageUpload`; internal `normalizePriceInput` |
| `course/add-course/course-videos-step.tsx` | `CourseVideosStep({ courseId, videos, onVideosChange })`: `fetchVideos`, `handleFetchAgain`, `reorderVideos`, `handleVideoDrop`, `addVideo`, `editVideo`, `readVideoDuration`, `confirmVideo`, `handleFileChange`, `handleDrop`, `handelDeleteVideoWithDebounce`, `handelDeleteYogaVideo` |
| `course/add-course/configure-video-dialog.tsx` | `ConfigureVideoDialog({ courseId, configuration, onClose, onConfirm, fetchVideos })`: `selectThumbnail`, `handleThumbnailChange`, `handleThumbnailDrop`, `handelRemoveThumbnailFunction`, `removeThumbnail`, `getCloudFlairVideoUploadationUrl`, `uploadVideoToCloudflareWithTUS`, `handleProceedVideoUploadation`, `handleUpdateVideo`, `handleConfirm`, `handleUploadImageToCloudflare`, `handelGetCloudflareUploadUrl`, `handelUploadVideoThumbnail`; internal `formatFileSize`, `formatDuration` |
| `course/add-course/course-review-step.tsx` | `CourseReviewStep`: `fetchCourseDetailsToReview`; internal `ReadyStatus`, `formatDuration` |
| `course/add-course/add-course.storage.ts` | `ADD_COURSE_DRAFT_KEY`, `readAddCourseDraft`, `saveAddCourseDraft`, `updateAddCourseStep`, `clearAddCourseDraft` |
| `course/add-course/add-course.types.ts` | `AddCourseStep` (1 \| 2 \| 3), `CourseVideoStatus`, `AddCourseDetails`, `CourseVideo`, `CourseVideoConfiguration`, `CourseVideoFormData`, `AddCourseDraft` |

### Modules: PDF course

| File | Functions / exports |
|---|---|
| `pdf-course/pdfCourseManagement.tsx` | `PdfCourseManagementPage`: `openDrawer`, `openEditDrawer`, `deletePdf`, `confirmDeletePdf`, `fetchPdfCourses`, `handelDeletePdfCourse`, `reFetchThePdfCourseData`, `handleCourseDrop`; internal `ActionTooltip` |
| `pdf-course/uploadPdfCourseSidebar.tsx` | `UploadPdfCourseSidebar`: `updateField`, `updatePrice`, `updateDiscount`, `toggleFreeCourse`, `selectThumbnail`, `selectPdf`, `cancelPendingUpload`, `uploadMediaToCloudinary`, `getMediaFileSigned`, `proceedWithUpload`, `clearPdfSelection`, `clearThumbnailSelection`, `handlePdfDrop`, `handelAddPdfCourseApiCall`, `handleSubmit`, `handleThumbnailChange`, `handleThumbnailDrop` |
| `pdf-course/pdfCourseDashboardSection.tsx` | `PdfCourseDashboardSection`: `fetchPdfCourses` |

### Modules: affiliate product

| File | Functions / exports |
|---|---|
| `affiliate-product/affiliateProductManagement.tsx` | `AffiliateProductManagementPage`: `fetchAffiliateProducts`, `reFetchAffiliateProducts`, `openDrawer`, `openEditDrawer`, `handleProductDrop`; internal `ActionTooltip` |
| `affiliate-product/uploadAffiliateProductSidebar.tsx` | `UploadAffiliateProductSidebar`: `updateField`, `selectThumbnail`, `cancelPendingThumbnail`, `uploadImageToCloudinary`, `getAffiliateThumbnailSignature`, `uploadAffiliateThumbnail`, `proceedWithThumbnail`, `clearThumbnail`, `handelAddAffiliateProducts`, `handleSubmit`, `handleThumbnailDrop` |
| `affiliate-product/affiliateProductDashboardSection.tsx` | `AffiliateProductDashboardSection`: `fetchAffiliateProducts` |

### Components

| File | Functions / exports |
|---|---|
| `components/course/course-page-header.component.tsx` | `CoursePageHeader({ onAddCourse })` |
| `components/course/course-status-badge.component.tsx` | `CourseStatusBadge({ status })` |
| `components/course/course-table.component.tsx` | `CourseTable({ courses, isLoading, onDelete, onEdit, onPublish, onAnalytics })`; internal `CourseActions`, `EmptyCourseState`, `CourseTableSkeleton` |
| `components/dashboard/navbar.component.tsx` | `DashboardNavbar({ onOpenSidebar })` |
| `components/dashboard/sidebar.component.tsx` | `DashboardSidebar({ isCollapsed, isOpen, onClose, onToggleCollapse })`: `handleLogout` |
| `components/offline.component.tsx` | `OfflineScreenComponent` |
| `components/page-metadata.component.tsx` | `PageMetadata`; internal `getPageMetadata(pathname)` |
| `components/ui/rich-text-editor.tsx` | `RichTextEditor({ id, value, onChange, placeholder, className, minHeight })` (Tiptap); internal `ToolbarButton` |
| `components/ui/rich-text-content.tsx` | `RichTextContent({ html, className, fallback })` |
| `components/ui/variants/toast.manager.ts` | `toast`, `createToastManager`, `useToastManager` |
| `components/ui/variants/button.variants.ts` | `buttonVariants` (cva) |
| `components/ui/*.tsx` | shadcn/base-ui wrappers: `alert-dialog`, `badge`, `button`, `card`, `checkbox`, `dialog`, `drawer`, `dropdown-menu`, `input`, `input-otp`, `label`, `pagination`, `select`, `skeleton`, `table`, `textarea`, `toast` (`Toaster`), `tooltip` (`TooltipProvider`) |

### Hooks

| File | Exports |
|---|---|
| `hooks/useDebounce.ts` | `useDebounce(callback, delay = 500)` |
| `hooks/useOnline.hook.ts` | default `useOnlineStatus()` |

### Utils

| File | Functions / exports |
|---|---|
| `utils/api/multiple.api.ts` | `multipleApiHandler(endpoints[], signal?)`; types `ApiMethod`, `EndpointObject`, `CommonDataFormat`, `ApiReturnInterface`; internal `getUrl`, `axiosApiErrorHandler`, `fetchEndpoint` |
| `utils/api/pdf-course.api.ts` | `reorderPdfCourses(payload)`, `ReorderPdfCoursesPayload` |
| `utils/config/envConfig.ts` | `EnvConfig` |
| `utils/constants/course.constants.ts` | `COURSE_STATUSES`, `EMPTY_COURSE_FORM`, `COURSES_PER_PAGE` (5) |
| `utils/constants/dashboard.constants.ts` | `DASHBOARD_NAVIGATION_ITEMS` |
| `utils/constants/error.constants.ts` | `ERROR_MESSAGES` |
| `utils/constants/success.constants.ts` | `SUCCESS_MESSAGES` |
| `utils/constants/global.constants.ts` | `PDF_STATUSES`, `statusClassName` |
| `utils/helper/helper.tsx` | `cn`, `getDataFromSecureCookie`, `storeDataInSecureCookie`, `clearLocalSessionStorage`, `getRemainingCountDownSeconds`, `formatCountDownTime`, `isValidUrl`; internal `getCookieConfig` |
| `utils/helper/course.helper.ts` | `formatCoursePrice`, `formatCourseDate`, `calculatePayableAmount`, `normalizeNonNegativeDecimalInput`, `convertCourseToFormData`, `getMockCourses`, `storeMockCourses`; internal `normalizeCourse` |
| `utils/helper/course-video.helper.ts` | `formatCourseVideos(videos, courseId)` (API → `CourseVideo[]`) |
| `utils/helper/dashboard.helper.ts` | `getTimeBasedGreeting(date?)` |
| `utils/helper/pdf-course.helper.ts` | `formatPdfDate(date)` |
| `utils/validation/auth.validation.ts` | `validateSignInForm`, `validateOtpVerificationForm`, `validateResetPasswordForm` |
| `utils/validation/course.validation.ts` | `validateCourseForm`, `validateAddCourseDetails`, type `AddCourseDetailsErrors`; internal `hasRichTextContent` |
| `utils/validation/course-video.validation.ts` | `validateCourseVideoConfiguration`, `validateCourseVideoFile`, `validateCourseVideoThumbnail`, type `CourseVideoConfigurationErrors` |
| `utils/validation/pdf-course.validation.ts` | `validatePdfCourseForm`, `validatePdfFile`, `validatePdfThumbnail` |
| `utils/validation/affiliate-product.validation.ts` | `validateAffiliateProductForm`, `validateAffiliateThumbnail` |
| `utils/mock/course.mock.ts` | `MOCK_COURSES` |

### Types (`utils/interface/`)

| File | Types |
|---|---|
| `auth.interface.ts` | `LoginFormData`, `OtpVerificationFormData`, `ResetPasswordFormData` |
| `course.interface.ts` | `CourseStatus` ("Draft" \| "Published" \| "Archived"), `VideoThumbnailMode`, `Course`, `CourseFormData`, `CourseFormErrors` |
| `pdf-course.interface.ts` | `PdfCourseStatus` ("DRAFT" \| "PUBLISHED" \| "ARCHIVED"), `PdfCourse`, `PdfCourseFormData`, `PdfCourseFormErrors`, `PendingUpload`, `uploadPdfCourseInterface`, `MediaSignature` |
| `affiliate-product.interface.ts` | `AffiliateProductStatus`, `AffiliateProductFormData`, `AffiliateProduct`, `AffiliateProductFormErrors`, `PendingAffiliateThumbnail`, `AffiliateProductFormProps` |
| `dashboard.interface.ts` | `DashboardNavigationItem` |
| `global.interface.ts` | `AuthRoutersArrayInterface`, `ValidationResult`, `CloudflareImageUploadResponse` |
| `helper.interface.ts` | `CookieConfigInterface` |

### Storage keys

| Key | Where | Purpose |
|---|---|---|
| `yoga_platform_auth_token` (cookie) | `otpVerification.tsx`, `multiple.api.ts`, routers | Admin JWT |
| `yoga_platform_auth_verification_failed` (sessionStorage) | `dashboard.layout.tsx`, `auth.router.tsx` | Prevents a redirect loop after a failed `verify/me` |
| `otpResendCodeAvailableAt` (localStorage) | `otpVerification.tsx` | OTP resend cooldown |
| `yoga-admin-add-course-draft` (localStorage) | `add-course.storage.ts` | Add/edit course wizard draft |

---

## 8. Adding a new feature (follow the existing pattern)

1. **Backend first:** add the admin route under `Backend/src/routes/modules/admin/<feature>/` and mount it under `/admin/<feature>` (see the backend structure doc).
2. **Types:** `src/utils/interface/<feature>.interface.ts`.
3. **Validation:** `src/utils/validation/<feature>.validation.ts`.
4. **Messages:** add toast strings to `ERROR_MESSAGES` / `SUCCESS_MESSAGES`.
5. **Pages:** `src/modules/<feature>/<feature>Management.tsx` (list page), `upload<Feature>Sidebar.tsx` (drawer form), and optionally `<feature>DashboardSection.tsx`, added to `DashboardPage`.
6. **API calls:** `multipleApiHandler([{ endPoint: "<feature>/...", method, protected: true, data }])`, wrapped in `useDebounce`. Check `res.data.success` and show a toast.
7. **Routing:** add the route in `layouts/root.layout.tsx`, the sidebar item in `DASHBOARD_NAVIGATION_ITEMS`, and the title in `page-metadata.component.tsx`.
8. **UI:** reuse `src/components/ui/*` (Drawer, Dialog, AlertDialog, Table, Tooltip, Pagination, RichTextEditor).

## 9. Known quirks (current state, not yet changed)

- **Affiliate product delete is not wired up.** The trash button in `affiliateProductManagement.tsx` has no `onClick`, even though the backend has `DELETE /admin/affiliate-product/delete`.
- Course status values differ between apps: the admin `Course` type uses `"Draft" | "Published" | "Archived"`, while PDF and affiliate types (and the backend) use upper case `"DRAFT" | ...`. Course statuses are converted inline when fetched (`courseManagement.tsx`, `courseDashboardSection.tsx`).
- `utils/mock/course.mock.ts` plus `getMockCourses` / `storeMockCourses` are leftovers that no page uses.
- `utils/api/pdf-course.api.ts` → `reorderPdfCourses` still has a `console.log(payload)`.
- `ResetPasswordPage` is reachable at both `/reset-password` and `/auth/reset-password`.
- Misspelled names are used throughout (`handel...` for handle, `CloudFlair` for Cloudflare, `Uploadation`). Keep the existing names when calling them.
- `package.json` lists unused packages (`add`, `dlx`, `tooltip`).
- Unlike the landing page API wrapper, `multipleApiHandler` here does not auto-logout on 401/403/404. Session expiry is caught only by `DashboardLayout` on page load, or by individual pages (e.g. analytics).

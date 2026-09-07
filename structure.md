# PromptVerse Server - Modular Architecture Documentation

This document describes the refactored modular architecture of `promptverse-server`.

---

## 1. Project Directory Tree

```
promptverse-server/
├── config/
│   └── db.js                    # MongoDB initialization & collection exports
├── middleware/
│   └── auth.middleware.js       # Authentication & authorization middlewares
├── controllers/
│   ├── prompt.controller.js     # Handlers for prompt management & moderation
│   ├── bookmark.controller.js   # Handlers for user bookmarks
│   ├── review.controller.js     # Handlers for prompt reviews & ratings
│   ├── report.controller.js     # Handlers for prompt reporting
│   ├── admin.controller.js      # Handlers for platform analytics & admin actions
│   ├── subscription.controller.js # Handlers for payment & plan subscriptions
│   └── creator.controller.js    # Handlers for top creators & creator analytics
├── routes/
│   ├── prompt.routes.js         # Routes for prompt endpoints
│   ├── bookmark.routes.js       # Routes for bookmark endpoints
│   ├── review.routes.js         # Routes for review endpoints
│   ├── report.routes.js         # Routes for report endpoints
│   ├── admin.routes.js          # Routes for admin endpoints
│   ├── subscription.routes.js   # Routes for subscription endpoints
│   ├── creator.routes.js        # Routes for creator & warning endpoints
│   └── index.js                 # Central router aggregating feature routes
├── .env                         # Environment variables configuration
├── .gitignore                   # Git ignore rules
├── index.js                     # Server entry point & Express configuration
├── package.json                 # Node.js dependencies & scripts
├── package-lock.json            # Lockfile
├── README.md                    # Project overview & documentation
├── structure.md                 # Architectural design documentation
└── vercel.json                  # Vercel deployment configuration
```

---

## 2. Folder Responsibilities

| Folder | Responsibility |
|---|---|
| `config/` | Database connection setup, client configuration, and export of database collection instances. |
| `middleware/` | Reusable HTTP request pre-processing functions (e.g. JWT token verification, role-based access control). |
| `controllers/` | Request processing logic, database queries, business rule execution, and HTTP response formatting. |
| `routes/` | Endpoint definition, HTTP method mapping, middleware binding, and controller delegation. |

---

## 3. File Responsibilities

| File | Responsibility |
|---|---|
| [index.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/index.js) | Server entry point. Sets up DNS, Express app, global middleware, router mounting, root `/` endpoint, and listens on `PORT`. |
| [config/db.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/config/db.js) | Initializes `MongoClient`, connects to MongoDB database `PromptVerse`, and exports collection instances. |
| [middleware/auth.middleware.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/middleware/auth.middleware.js) | Contains `verifyToken`, `verifyUser`, `verifyCreator`, and `verifyAdmin` authentication/authorization checks. |
| [controllers/prompt.controller.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/controllers/prompt.controller.js) | Implements handlers for prompt creation, searching/filtering with aggregation pipelines, lookup, status updates, copying, editing, and deletion. |
| [controllers/bookmark.controller.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/controllers/bookmark.controller.js) | Implements handlers for adding, checking, fetching, and deleting user bookmarks. |
| [controllers/review.controller.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/controllers/review.controller.js) | Implements handlers for checking review existence, submitting reviews, fetching user reviews, and prompt-specific reviews. |
| [controllers/report.controller.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/controllers/report.controller.js) | Implements handlers for submitting content reports, checking user report status, and admin report moderation. |
| [controllers/admin.controller.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/controllers/admin.controller.js) | Implements handlers for platform-wide analytics, creator warnings, and deleting reported content. |
| [controllers/subscription.controller.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/controllers/subscription.controller.js) | Implements handlers for updating user plans upon payment and fetching admin subscription logs. |
| [controllers/creator.controller.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/controllers/creator.controller.js) | Implements handlers for leaderboard analytics, creator-specific stats, and creator warning notices. |
| [routes/prompt.routes.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/routes/prompt.routes.js) | Express Router for all prompt endpoints. |
| [routes/bookmark.routes.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/routes/bookmark.routes.js) | Express Router for bookmark endpoints. |
| [routes/review.routes.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/routes/review.routes.js) | Express Router for review endpoints. |
| [routes/report.routes.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/routes/report.routes.js) | Express Router for report endpoints. |
| [routes/admin.routes.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/routes/admin.routes.js) | Express Router for admin management & analytics endpoints. |
| [routes/subscription.routes.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/routes/subscription.routes.js) | Express Router for subscription & plan management endpoints. |
| [routes/creator.routes.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/routes/creator.routes.js) | Express Router for creator analytics & warnings endpoints. |
| [routes/index.js](file:///d:/Progamming-Hero-Bostcamp/All-assinment/assinment10/promptverse-server/routes/index.js) | Central Router linking feature routes together. |

---

## 4. Route → Controller Mapping (34 Routes Total)

| Method | Endpoint Path | Route File | Controller Function | Middleware |
|---|---|---|---|---|
| `POST` | `/api/prompts` | `routes/prompt.routes.js` | `promptController.addPrompt` | `verifyToken` |
| `GET` | `/api/prompts` | `routes/prompt.routes.js` | `promptController.getPrompts` | None |
| `GET` | `/api/prompts/:id` | `routes/prompt.routes.js` | `promptController.getPromptById` | `verifyToken` |
| `GET` | `/api/featured/prompts` | `routes/prompt.routes.js` | `promptController.getFeaturedPrompts` | None |
| `GET` | `/api/my/prompts` | `routes/prompt.routes.js` | `promptController.getMyPrompts` | `verifyToken` |
| `GET` | `/api/admin/prompts` | `routes/prompt.routes.js` | `promptController.getAdminPrompts` | `verifyToken`, `verifyAdmin` |
| `DELETE` | `/api/prompt/:id` | `routes/prompt.routes.js` | `promptController.deletePrompt` | `verifyToken` |
| `PATCH` | `/api/prompts/:id` | `routes/prompt.routes.js` | `promptController.editPrompt` | None |
| `PATCH` | `/api/prompts/:id/copy` | `routes/prompt.routes.js` | `promptController.copyPrompt` | `verifyToken` |
| `PATCH` | `/api/admin/prompts/:id/status` | `routes/prompt.routes.js` | `promptController.updatePromptStatus` | `verifyToken`, `verifyAdmin` |
| `PATCH` | `/api/admin/prompts/:id/reject` | `routes/prompt.routes.js` | `promptController.rejectPrompt` | `verifyToken`, `verifyAdmin` |
| `PATCH` | `/api/admin/prompts/:id/featured` | `routes/prompt.routes.js` | `promptController.updatePromptFeatured` | `verifyToken`, `verifyAdmin` |
| `POST` | `/api/bookmarks` | `routes/bookmark.routes.js` | `bookmarkController.addBookmark` | `verifyToken` |
| `GET` | `/api/bookmarks/check` | `routes/bookmark.routes.js` | `bookmarkController.checkBookmark` | None |
| `GET` | `/api/my/bookmarks` | `routes/bookmark.routes.js` | `bookmarkController.getMyBookmarks` | `verifyToken` |
| `DELETE` | `/api/bookmarks/:id` | `routes/bookmark.routes.js` | `bookmarkController.deleteBookmark` | `verifyToken` |
| `GET` | `/api/reviews/check` | `routes/review.routes.js` | `reviewController.checkReview` | None |
| `POST` | `/api/reviews` | `routes/review.routes.js` | `reviewController.addReview` | `verifyToken` |
| `GET` | `/api/my/reviews` | `routes/review.routes.js` | `reviewController.getMyReviews` | `verifyToken` |
| `GET` | `/api/reviews` | `routes/review.routes.js` | `reviewController.getReviews` | None |
| `GET` | `/api/prompt/reviews` | `routes/review.routes.js` | `reviewController.getPromptReviews` | `verifyToken` |
| `GET` | `/api/reports/check` | `routes/report.routes.js` | `reportController.checkReport` | None |
| `POST` | `/api/reports` | `routes/report.routes.js` | `reportController.addReport` | `verifyToken` |
| `GET` | `/api/admin/reports` | `routes/report.routes.js` | `reportController.getAdminReports` | `verifyToken`, `verifyAdmin` |
| `DELETE` | `/api/admin/reports/:id` | `routes/report.routes.js` | `reportController.deleteAdminReport` | `verifyToken`, `verifyAdmin` |
| `GET` | `/api/admin/analytics` | `routes/admin.routes.js` | `adminController.getAnalytics` | `verifyToken`, `verifyAdmin` |
| `POST` | `/api/admin/warn-creator` | `routes/admin.routes.js` | `adminController.warnCreator` | `verifyToken`, `verifyAdmin` |
| `DELETE` | `/api/admin/delete-reported-prompt` | `routes/admin.routes.js` | `adminController.deleteReportedPrompt` | `verifyToken`, `verifyAdmin` |
| `POST` | `/api/subscriptions` | `routes/subscription.routes.js` | `subscriptionController.createSubscription` | `verifyToken` |
| `GET` | `/api/admin/subscriptions` | `routes/subscription.routes.js` | `subscriptionController.getAdminSubscriptions` | `verifyToken`, `verifyAdmin` |
| `GET` | `/api/top/creators` | `routes/creator.routes.js` | `creatorController.getTopCreators` | None |
| `GET` | `/api/analytics/:creatorId` | `routes/creator.routes.js` | `creatorController.getCreatorAnalytics` | `verifyToken` |
| `GET` | `/api/creator/warnings` | `routes/creator.routes.js` | `creatorController.getCreatorWarnings` | `verifyToken` |
| `GET` | `/` | `index.js` | Root Handler | None |

---

## 5. Request Lifecycle & Authentication Flow

```
HTTP Request
     │
     ▼
index.js (Express & CORS)
     │
     ▼
routes/index.js (/api)
     │
     ▼
Feature Router (e.g. routes/prompt.routes.js)
     │
     ├────────► auth.middleware.js (verifyToken -> verifyAdmin)
     │                 │ (Extracts Bearer token, checks session & user in DB)
     │                 ▼
     └────────► Controller (e.g. controllers/prompt.controller.js)
                       │
                       ▼
                 config/db.js (MongoDB Collection Query)
                       │
                       ▼
                 HTTP Response JSON
```

---

## 6. Database Architecture

- Database Name: `PromptVerse`
- MongoDB Driver: `mongodb` v7.3.0 (`MongoClient` with `ServerApiVersion.v1`)
- Collections Preserved:
  - `prompts`
  - `reviews`
  - `bookmarks`
  - `payments`
  - `reports`
  - `user` (aliased as `users`)
  - `session` (aliased as `sessions`)
  - `subscriptions`
  - `warnings`

---

## 7. Refactoring Summary

1. Extracted all connection initialization and collection instances from `index.js` into `config/db.js`.
2. Extracted `verifyToken`, `verifyUser`, `verifyCreator`, and `verifyAdmin` into `middleware/auth.middleware.js`.
3. Created 7 domain-focused controller files in `controllers/` preserving exact business logic, status codes, and response objects.
4. Created 7 feature route files and aggregated them under `routes/index.js`.
5. Cleaned `index.js` to handle server entry responsibilities only.
6. Maintained 100% API compatibility, CommonJS modules (`require` / `module.exports`), and database query parity across all 34 endpoints.

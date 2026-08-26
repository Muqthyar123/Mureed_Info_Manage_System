# Frontend to Backend Contract

The frontend source of truth is `frontend_MIS/src/types/index.ts` plus the files in `frontend_MIS/src/services`.

## Mureed

| UI label | Frontend field | FastAPI schema | Database column |
| --- | --- | --- | --- |
| Mureed Name | `name` | `name` | `mureeds.name` |
| Date of Birth | `dateOfBirth` | `dateOfBirth` | `mureeds.date_of_birth` |
| Age | derived from `dateOfBirth` | not stored | not stored |
| Gender | `gender` | `gender` | `mureeds.gender` |
| Address | `address` | `address` | `mureeds.address` |
| Phone Number | `phone` | `phone` | `mureeds.phone` |
| Email | `email` | `email` | `mureeds.email` |
| Peer Name | `peerName` | `peerName` | `mureeds.peer_name`, `mureeds.peer_id` |
| Mureed Status | `status` | `status` | `mureeds.status` |

Allowed values:

`gender`: `Male`, `Female`

`status`: `Available`, `Passed Out`

## Peer

| UI label | Frontend field | FastAPI schema | Database column |
| --- | --- | --- | --- |
| Peer Name | `name` | `name` | `peers.name` |
| Number of Mureeds | `mureedCount` | `mureedCount` | computed count from `mureeds.peer_name` |
| Status | `status` | `status` | `peers.status` |

Allowed values: `Active`, `Inactive`

## User Account

| UI label | Frontend field | FastAPI schema | Database column |
| --- | --- | --- | --- |
| Name | `name` | `name` | `user_accounts.name` |
| Email | `email` | `email` | `user_accounts.email` |
| Role | `role` | `role` | `user_accounts.role` |
| Account Status | `accountStatus` | `accountStatus` | `user_accounts.account_status` |
| Created Date | `createdDate` | `createdDate` | `user_accounts.created_date` |
| Mureed Link | `mureedId` | `mureedId` | `user_accounts.mureed_id` |

Allowed values:

`role`: `Admin`, `Mureed`

`accountStatus`: `Active`, `Inactive`, `Pending Setup`

Admin-only fields:

| Frontend field | Database column |
| --- | --- |
| `adminRole` | `user_accounts.admin_role` |
| admin access state | `user_accounts.admin_access_status` |
| auth method list | `user_accounts.auth_methods` |
| password hash | `user_accounts.password_hash` |

## Admin Approval Request

| Frontend field | Database column |
| --- | --- |
| `id` | `admin_approval_requests.id` |
| `name` | `admin_approval_requests.name` |
| `email` | `admin_approval_requests.email` |
| `status` | `admin_approval_requests.status` |
| `authMethod` | `admin_approval_requests.auth_method` |
| `requestedDate` | `admin_approval_requests.requested_date` |

Allowed values:

`status`: `PENDING`, `APPROVED`, `REJECTED`

`authMethod`: `password`, `google`

## Endpoints

Base URL expected by the opt-in frontend adapter: `VITE_API_BASE_URL=http://localhost:8000/api`

| Frontend service | Method | Endpoint | Request | Response |
| --- | --- | --- | --- | --- |
| `loginAdmin` | `POST` | `/auth/admin/login` | `{ email, password }` | `{ user, accessToken }` |
| `loginMureed` | `POST` | `/auth/mureed/login` | `{ email, password }` | `{ user, accessToken }` |
| `requestPasswordReset` | `POST` | `/auth/password-reset` | `{ email }` | `204` |
| `completeAccountSetup` | `POST` | `/auth/mureed/setup` | `{ email, password }` | `204` |
| `startAdminSignup` | `POST` | `/auth/admin/signup/start` | `{ name, email, password }` | `{ name, email, passwordHash, expiresAt }` |
| `verifyAdminSignupOtp` | `POST` | `/auth/admin/signup/verify` | `{ signup, otp }` | `{ status, user?, accessToken? }` |
| `resendAdminSignupOtp` | `POST` | `/auth/admin/signup/resend` | signup object | signup object |
| `loginAdminWithGoogle` | `POST` | `/auth/admin/google` | `{ email }` | `{ user, accessToken }` |
| `listAdminApprovalRequests` | `GET` | `/auth/admin/approval-requests` | none | `AdminApprovalRequest[]` |
| `approveAdminRequest` | `POST` | `/auth/admin/approval-requests/{id}/approve` | none | `204` |
| `rejectAdminRequest` | `POST` | `/auth/admin/approval-requests/{id}/reject` | none | `204` |
| `listMureeds` | `GET` | `/mureeds` | query params below | `{ rows, total, page, pageSize }` |
| `listMureedsForExport` | `GET` | `/mureeds/export-data` | filter/sort query params | `Mureed[]` |
| `listLocations` | `GET` | `/mureeds/locations` | none | `string[]` |
| `getMureed` | `GET` | `/mureeds/{id}` | none | `Mureed` |
| `getMureedByEmail` | `GET` | `/mureeds/by-email?email=` | email query | `Mureed` |
| `createMureed` | `POST` | `/mureeds` | `MureedInput` | `Mureed` |
| `updateMureed` | `PUT` | `/mureeds/{id}` | `MureedInput` | `Mureed` |
| `deleteMureed` | `DELETE` | `/mureeds/{id}` | none | `204` |
| `listPeer` | `GET` | `/peers` | `search`, `status` | `PeerRow[]` |
| `listPeerNames` | `GET` | `/peers/names` | none | `string[]` |
| `createPeer` | `POST` | `/peers` | `{ name, status }` | `Peer` |
| `updatePeer` | `PUT` | `/peers/{id}` | `{ name, status }` | `Peer` |
| `deletePeer` | `DELETE` | `/peers/{id}` | none | `204` |
| `listUsers` | `GET` | `/users` | `search`, `role`, `status` | `AppUser[]` |
| `createMureedAccount` | `POST` | `/users/mureed-accounts` | `{ name, email, mureedId? }` | `AppUser` |
| `setAccountStatus` | `PATCH` | `/users/{id}/status` | `{ accountStatus }` | `AppUser \| null` |
| `resendSetupEmail` | `POST` | `/users/{id}/resend-setup-email` | none | `AppUser \| null` |
| `deleteUser` | `DELETE` | `/users/{id}` | none | `204` |
| `getOverviewStats` | `GET` | `/reports/overview` | none | `OverviewStats` |
| `getMureedsByPeer` | `GET` | `/reports/mureeds-by-peer` | none | `PeerBreakdown[]` |

Mureed list query parameters:

`page`, `pageSize`, `search`, `peerName`, `location`, `gender`, `status`, `sortBy`, `sortDir`

Errors use FastAPI's default `{ "detail": "message" }` shape; the frontend adapter converts that into thrown `Error(message)`.

## Authorization

The backend checks Bearer tokens on protected routes.

Admin routes require `user_accounts.role = 'Admin'`.

Main Admin approval routes also require `user_accounts.admin_role = 'MAIN_ADMIN'`.

Mureed self-read routes allow `role = 'Mureed'` only when `user_accounts.mureed_id` matches the requested Mureed ID.

For Supabase RLS, mirror the same policy boundaries:

`Admin`: full CRUD on `mureeds`, `peers`, `user_accounts`, reports, and approval requests.

`Mureed`: read-only access to exactly one `mureeds` row where `mureeds.id = auth user mureed_id`.

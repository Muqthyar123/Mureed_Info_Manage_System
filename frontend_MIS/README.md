# Mureed Hub

# Mureed Information Management System — Frontend Development Prompt

## 1. ROLE

You are an expert **frontend engineer, UI/UX designer, and React application architect** with experience building production-quality information management systems.

Build the frontend for a **Mureed Information Management System**.

The frontend must be:

* Production-quality
* Clean
* Modern
* Attractive
* Responsive
* User-friendly
* Accessible
* Professional
* Well-structured
* Maintainable
* Suitable for a final-year B.Tech college project

The design should feel like a **modern professional SaaS/admin management application**, not a basic college CRUD project.

---

## 2. STRICT REQUIREMENT RULE

Follow the requirements in this prompt exactly.

**DO NOT invent, add, assume, or implement requirements, features, fields, pages, workflows, permissions, or user roles that are not explicitly specified here.**

If something is not specified:

* Do not invent functionality.
* Do not add extra fields.
* Do not add extra modules.
* Do not add extra user roles.
* Do not add academic features.
* Do not add unnecessary dashboard features.
* Use a simple neutral UI placeholder only when required.

Do not add common college-management features simply because they are normally present in such systems.

---

# 3. TERMINOLOGY

The following terminology must be used throughout the visible UI.

### Replace:

**Student → Mureed**

**Department → Mrushid**

Therefore, use:

* Mureed Login
* Mureed Dashboard
* Mureed Information
* Add Mureed
* Edit Mureed
* Mureed Management
* Mureed Status
* Mrushid
* Mrushid Management
* Mrushid Name

Do **not** display the words:

* Student
* Department

anywhere in the user-facing interface.

---

# 4. USER ROLES

There are exactly **two user roles**:

### 1. Admin

Admin has full management permissions.

### 2. Mureed

Mureed has read-only access to their own information.

Do not create any additional roles.

Do not add:

* Faculty
* Teacher
* Staff
* Parent
* Manager
* Super Admin

---

# 5. INITIAL LOGIN EXPERIENCE

When the website is opened, show a clean role-selection screen.

The user should see two options:

```text
Mureed Information Management System

Choose Login Type

[ Admin Login ]

[ Mureed Login ]
```

Make the two login options visually distinct but consistent.

---

# 6. ADMIN LOGIN

When the user selects **Admin Login**, display:

* Email
* Password
* Show/Hide Password
* Login button
* Forgot Password

After successful login:

```text
Admin Login
     ↓
Admin Dashboard
```

For the frontend prototype, use mock authentication.

Keep authentication logic centralized so that it can later be connected to the backend.

---

# 7. MUREED LOGIN

When the user selects **Mureed Login**, display:

* Registered Email
* Password
* Show/Hide Password
* Login button
* Forgot Password

The Mureed's login email is the email that was previously entered and registered by the Admin.

A Mureed cannot create their own account.

---

# 8. MUREED ACCOUNT CREATION WORKFLOW

When Admin adds a new Mureed, the Admin enters the Mureed's email.

The workflow is:

```text
Admin
  ↓
Add Mureed
  ↓
Enter Mureed information
  ↓
Enter Mureed email
  ↓
Create Mureed Account
  ↓
System sends account setup email
  ↓
Mureed opens setup link
  ↓
Mureed creates password
  ↓
Account activated
  ↓
Mureed can log in
```

The Admin must **never create or see the Mureed's password**.

For the frontend prototype, do not implement actual email delivery.

Instead, show a confirmation such as:

```text
Mureed account created successfully.

Account setup email sent to:
mureed@example.com
```

Prepare the UI so actual email functionality can be connected later.

---

# 9. ADMIN DASHBOARD

After Admin login, display an Admin Dashboard.

Use a professional sidebar.

### Admin Sidebar

```text
Dashboard
Mureeds
Mrushid
Reports
User Management
Settings
Logout
```

Do not add other sidebar modules.

The dashboard can display only the following relevant overview information:

* Total Mureeds
* Available Mureeds
* Passed Out Mureeds
* Total Mrushid

Use clean dashboard cards.

Also include simple quick actions such as:

```text
Add Mureed
View Mureeds
View Mrushid
```

Do not invent additional dashboard functionality.

---

# 10. MUREED MANAGEMENT

Create a dedicated **Mureed Management** page for Admin.

The Admin must be able to:

* Add Mureed
* View Mureed
* Edit Mureed
* Delete Mureed
* Search Mureeds
* Filter Mureeds
* Sort Mureeds
* View individual Mureed details

Use a clean, professional data table.

The table should support pagination because the system may contain approximately **10,000 Mureed records**.

Do not load all 10,000 records into the UI at once.

Use mock data sufficient to demonstrate pagination, searching, and filtering.

---

# 11. MUREED TABLE

The Admin Mureed table should contain:

```text
Mureed Name
Age
Gender
Address
Phone Number
Email
Mrushid Name
Mureed Status
Actions
```

Actions:

```text
View
Edit
Delete
```

Do not include:

* Student ID
* Parent Name
* Parent Phone
* Course
* Academic Information
* Marks & Grades
* Attendance
* Timetable

---

# 12. ADD MUREED

Create a clean and professional **Add Mureed** form.

The fields must appear in exactly this order:

### 1. Mureed Name

Text input.

### 2. Date of Birth

Date picker.

### 3. Age

Automatically calculated from Date of Birth.

The Admin must **not manually enter Age**.

Example:

```text
Date of Birth
15-05-2005

Age
21 years
```

The Age field must be read-only.

Calculate age correctly using the current date.

Do not simply calculate:

```text
Current Year - Birth Year
```

The birthday must be taken into account.

### 4. Gender

Provide a simple appropriate selection.

### 5. Address

Provide a suitable address input.

### 6. Phone Number

Provide phone-number validation.

### 7. Email

This email becomes the Mureed's registered login email.

### 8. Mrushid Name

Provide a selection from available Mrushid records.

### 9. Mureed Status

The available options are exactly:

```text
Available
Passed Out
```

Do not add other statuses unless explicitly requested.

---

# 13. MUREED FIELD ORDER

The field order must ALWAYS remain:

```text
1. Mureed Name
2. Date of Birth
3. Age
4. Gender
5. Address
6. Phone Number
7. Email
8. Mrushid Name
9. Mureed Status
```

Do not reorder these fields.

Do not add extra fields.

---

# 14. MUREED FIELD PERMISSIONS

The Admin has the following permissions:

| Field         | Add       | View | Edit | Delete    |
| ------------- | --------- | ---- | ---- | --------- |
| Mureed Name   | Yes       | Yes  | Yes  | Yes       |
| Date of Birth | Yes       | Yes  | Yes  | Yes       |
| Age           | Automatic | Yes  | No   | Automatic |
| Gender        | Yes       | Yes  | Yes  | Yes       |
| Address       | Yes       | Yes  | Yes  | Yes       |
| Phone Number  | Yes       | Yes  | Yes  | Yes       |
| Email         | Yes       | Yes  | Yes  | Yes       |
| Mrushid Name  | Yes       | Yes  | Yes  | Yes       |
| Mureed Status | Yes       | Yes  | Yes  | Yes       |

### Important Age Rule

Age is derived from Date of Birth.

```text
Date of Birth
      ↓
Automatic Age Calculation
      ↓
Age
```

The Admin cannot manually edit Age.

---

# 15. EDIT MUREED

Create an Edit Mureed page using exactly the same fields and order as Add Mureed.

Admin can edit:

* Mureed Name
* Date of Birth
* Gender
* Address
* Phone Number
* Email
* Mrushid Name
* Mureed Status

Age automatically recalculates whenever Date of Birth changes.

Age remains read-only.

If the Admin changes the email, display a clear confirmation because the email is associated with the Mureed's login account.

---

# 16. VIEW MUREED

Create a professional Mureed Details page.

Display the information in exactly this order:

```text
Mureed Name
Date of Birth
Age
Gender
Address
Phone Number
Email
Mrushid Name
Mureed Status
```

Use clean cards or a responsive information grid.

Admin should have:

```text
Back
Edit
Delete
```

actions.

---

# 17. DELETE MUREED

Do not immediately delete a Mureed.

Show a confirmation modal:

```text
Delete Mureed?

Are you sure you want to delete this Mureed?
This action cannot be undone.

[ Cancel ]    [ Delete ]
```

Use a clear destructive-action style.

---

# 18. MUREED DASHBOARD

After Mureed login, display a simplified read-only dashboard.

Sidebar:

```text
Dashboard
My Information
Logout
```

Do not show Admin features.

The dashboard can display:

* Mureed Name
* Age
* Gender
* Mureed Status
* Mrushid Name
* Phone Number
* Email
* Address

---

# 19. MUREED "MY INFORMATION"

Create a dedicated **My Information** page.

Display exactly:

```text
Mureed Name
Date of Birth
Age
Gender
Address
Phone Number
Email
Mrushid Name
Mureed Status
```

Everything must be read-only.

There must be:

* No Edit button
* No Delete button
* No Add button

The Mureed cannot modify any information.

---

# 20. MUREED DATA VISIBILITY

A Mureed must only see **their own information**.

Example:

```text
Database

Mureed A
Mureed B
Mureed C
Mureed D
```

If Mureed A logs in:

```text
Mureed A
   ↓
Mureed Dashboard
   ↓
Only Mureed A's information
```

Mureed A must not see:

* Mureed B
* Mureed C
* Mureed D

This must be represented in the frontend architecture and will later be enforced by the backend/database authorization system.

---

# 21. ADMIN → DATABASE → MUREED REFLECTION

The Admin's data must eventually be reflected automatically in the corresponding Mureed's login.

Example:

Admin enters:

```text
Address: Hyderabad
```

Mureed sees:

```text
Address: Hyderabad
```

If Admin changes:

```text
Hyderabad → Vijayawada
```

the Mureed should see:

```text
Address: Vijayawada
```

The frontend should be structured around a shared data source/API so that this works naturally once the backend is connected.

Do not maintain separate duplicate Mureed data for Admin and Mureed interfaces.

---

# 22. MRUSHID MANAGEMENT

Create an Admin-only **Mrushid Management** page.

Admin can:

* Add Mrushid
* View Mrushid
* Edit Mrushid
* Delete Mrushid
* Search Mrushid
* Filter Mrushid

Use a clean table.

Example columns:

```text
Mrushid Name
Number of Mureeds
Status
Actions
```

Do not add academic or departmental functionality.

---

# 23. REPORTS

Create an Admin-only Reports page.

The page should provide a clean overview of:

* Total Mureeds
* Available Mureeds
* Passed Out Mureeds
* Mureeds by Mrushid

Use simple, professional charts/cards where appropriate.

Do not invent additional report categories.

---

# 24. USER MANAGEMENT

Create an Admin-only User Management page.

Display:

```text
Name
Email
Role
Account Status
Created Date
Actions
```

Roles must only be:

```text
Admin
Mureed
```

Admin can:

* View users
* Create Mureed accounts
* Activate accounts
* Deactivate accounts
* Manage account status
* Resend account setup email
* Delete user accounts where appropriate

The Admin must never see the Mureed's actual password.

---

# 25. SETTINGS

Create an Admin-only Settings page.

Keep it simple.

Include only appropriate system settings such as:

* Admin profile
* Email/account settings
* Security settings
* Application preferences

Do not invent unnecessary configuration options.

---

# 26. ADMIN PERMISSION MATRIX

The Admin has full management access to the following:

| Feature              | Admin |
| -------------------- | ----- |
| Login                | Yes   |
| Dashboard            | Yes   |
| View Mureeds         | Yes   |
| Add Mureed           | Yes   |
| Edit Mureed          | Yes   |
| Delete Mureed        | Yes   |
| Search Mureeds       | Yes   |
| Filter Mureeds       | Yes   |
| View Mureed Details  | Yes   |
| Manage Mureed fields | Yes   |
| Manage Mrushid       | Yes   |
| Reports              | Yes   |
| User Management      | Yes   |
| Settings             | Yes   |
| Logout               | Yes   |

---

# 27. MUREED PERMISSION MATRIX

| Feature              | Mureed |
| -------------------- | ------ |
| Login                | Yes    |
| Dashboard            | Yes    |
| View own information | Yes    |
| View other Mureeds   | No     |
| Add Mureed           | No     |
| Edit Mureed          | No     |
| Delete Mureed        | No     |
| Manage Mrushid       | No     |
| Reports              | No     |
| User Management      | No     |
| System Settings      | No     |
| Logout               | Yes    |

---

# 28. OPTIONAL MODULE CONTROL

The Admin may be allowed to **enable/disable optional application modules**, but the Admin must not be able to permanently delete the core application architecture.

If this UI is implemented, use:

```text
System Modules

☑ Mureed Management
☑ Mrushid Management
☑ Reports
☑ User Management
☑ Settings
```

Do not allow the Admin to delete:

* Authentication
* Core Users
* Core Mureed data structure
* Admin access
* Core application architecture

Use enable/disable for optional modules rather than permanent deletion.

---

# 29. RESPONSIVE DESIGN

The website must be fully responsive.

Support:

* Desktop
* Laptop
* Tablet
* Mobile

### Desktop

Use:

```text
Sidebar + Main Content
```

### Tablet

Use:

```text
Collapsible Sidebar
```

### Mobile

Use:

```text
Mobile Header
Hamburger Menu
Full-width Content
```

Tables should either:

* become responsive cards, or
* support horizontal scrolling

on small screens.

Forms should switch from multi-column layouts to a single-column layout on mobile.

---

# 30. UI/UX DESIGN

The interface should be:

* Clean
* Minimal
* Modern
* Attractive
* Professional
* Spacious
* Consistent

Use:

* Rounded cards
* Subtle shadows
* Thin borders
* Clear typography
* Consistent spacing
* Professional icons
* Status badges
* Hover states
* Focus states
* Toast notifications
* Confirmation dialogs
* Loading states
* Empty states

Avoid:

* Excessive gradients
* Excessive animations
* Too many colors
* Large decorative graphics
* Excessive glassmorphism
* Cluttered layouts
* Unnecessary UI elements

Use subtle animations only where they improve usability.

---

# 31. COLOR AND VISUAL STYLE

Use a professional modern color system.

Suggested style:

* Neutral/light background
* White cards
* Dark readable text
* One primary accent color
* Subtle success color for Available
* Subtle informational/neutral color for Passed Out
* Clear destructive color for Delete

Do not use excessive bright colors.

---

# 32. SEARCH AND FILTERING

The Mureed Management page must support:

### Search

Search by:

* Mureed Name
* Email
* Phone Number

### Filters

Filter by:

* Mrushid Name
* Gender
* Mureed Status

Do not add additional filters unless required.

---

# 33. PAGINATION

The system may contain approximately **10,000 Mureed records**.

Do not render 10,000 records on one page.

Use pagination such as:

```text
Showing 1–25 of 10,000

< Previous   1 2 3 4 5   Next >
```

The frontend should be designed so pagination can later be handled by the backend API.

---

# 34. MOCK DATA

Create centralized mock data.

Each Mureed record should contain only:

```text
id
name
dateOfBirth
gender
address
phone
email
mrushidName
status
```

Do not add:

* Student ID
* Parent details
* Course
* Marks
* Attendance
* Academic information
* Timetable

Generate enough mock records to demonstrate:

* Search
* Filtering
* Sorting
* Pagination
* Dashboard statistics

Do not scatter mock data throughout components.

---

# 35. AGE CALCULATION

Create a reusable age-calculation utility.

Input:

```text
dateOfBirth
```

Output:

```text
age in years
```

The calculation must correctly consider whether the birthday has occurred in the current year.

Age should update automatically as the current date changes.

Do not store Age as an independently editable field.

---

# 36. FRONTEND ARCHITECTURE

Use a clean structure similar to:

```text
src/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── tables/
│   └── forms/
│
├── pages/
│   ├── auth/
│   ├── admin/
│   └── mureed/
│
├── layouts/
│   ├── AdminLayout
│   └── MureedLayout
│
├── routes/
│
├── services/
│   ├── authService
│   ├── mureedService
│   ├── mrushidService
│   └── reportService
│
├── context/
│   └── AuthContext
│
├── hooks/
│
├── types/
│
├── utils/
│
├── mock/
│
└── App
```

Use reusable components.

Do not duplicate UI logic.

---

# 37. ROUTING

Use protected routes.

### Public

```text
/
 /login
 /admin-login
 /mureed-login
 /setup-account
```

### Admin

```text
/admin/dashboard
/admin/mureeds
/admin/mureeds/add
/admin/mureeds/:id
/admin/mureeds/:id/edit
/admin/mrushid
/admin/reports
/admin/users
/admin/settings
```

### Mureed

```text
/mureed/dashboard
/mureed/my-information
```

Unauthenticated users should be redirected to the appropriate login page.

A Mureed attempting to access Admin routes must be redirected to the Mureed dashboard.

---

# 38. FUTURE BACKEND INTEGRATION

This is currently a **frontend-only implementation**.

Do not build the actual backend yet.

However, structure the application so it can later connect to:

```text
React + Vite
       ↓
FastAPI
       ↓
Supabase PostgreSQL
```

Supabase PostgreSQL will eventually store the actual Mureed data.

The backend will eventually handle:

* Authentication
* Authorization
* Mureed CRUD
* Mrushid CRUD
* Account setup
* Email workflow
* Database operations
* Security

The frontend should use a service/API abstraction so mock data can later be replaced by real API calls.

---

# 39. DATABASE-READY DESIGN

The frontend should assume that approximately **10,000+ Mureed records** may exist.

Therefore:

* Use pagination.
* Use server-ready search.
* Use server-ready filtering.
* Avoid loading all records unnecessarily.
* Keep API service functions separate from UI components.
* Use stable IDs.
* Do not depend on array indexes as database IDs.

---

# 40. ACCESS CONTROL

Frontend role protection must be implemented for the prototype.

However, understand that frontend protection alone is not security.

The final architecture will enforce permissions in the backend/database as well.

The final system should follow:

```text
Admin
  ↓
Full Management

Mureed
  ↓
Own Information
  ↓
Read Only
```

---

# 41. IMPORTANT EXCLUDED FEATURES

The following features are explicitly excluded from the current project:

* Student ID
* Parent/Guardian Name
* Parent/Guardian Phone
* Course
* Academic Information
* Marks & Grades
* Attendance
* Timetable
* Faculty management
* Teacher management
* Parent portal
* Multiple additional roles
* Unspecified AI features
* Unspecified notifications
* Unspecified academic analytics

Do not implement any of these.

---

# 42. FINAL INFORMATION STRUCTURE

The core Mureed information is exactly:

```text
Mureed Name
Date of Birth
Age (Automatically calculated)
Gender
Address
Phone Number
Email
Mrushid Name
Mureed Status
```

The order must remain exactly as listed.

---

# 43. FINAL USER FLOW

### Admin

```text
Open Website
     ↓
Select Admin Login
     ↓
Admin Login
     ↓
Admin Dashboard
     ↓
Mureed Management
     ↓
Add / View / Edit / Delete
     ↓
Database
```

### Mureed

```text
Open Website
     ↓
Select Mureed Login
     ↓
Enter Admin-registered Email
     ↓
Enter Password
     ↓
Mureed Dashboard
     ↓
My Information
     ↓
Read Only
```

### New Mureed

```text
Admin
 ↓
Add Mureed
 ↓
Enter Mureed Information
 ↓
Enter Email
 ↓
Create Account
 ↓
Setup Email Sent
 ↓
Mureed Creates Password
 ↓
Account Activated
 ↓
Mureed Login
```

---

# 44. FINAL DATA FLOW

The same underlying Mureed record must power both interfaces.

```text
                    ADMIN
                      │
                Add / Edit / Delete
                      │
                      ▼
              Backend / Database
                      │
                      ▼
                   MUREED
                      │
                Read Only View
```

Do not create separate duplicated datasets for Admin and Mureed.

When Admin updates a Mureed's information, the updated information must be reflected in that Mureed's dashboard when connected to the real backend.

---

# 45. FINAL DEVELOPMENT INSTRUCTION

First analyze all the requirements above.

Then:

1. Create the application structure.
2. Create reusable UI components.
3. Create the routing structure.
4. Create the authentication/role UI.
5. Create the Admin interface.
6. Create the Mureed interface.
7. Create Mureed CRUD screens.
8. Implement automatic Age calculation.
9. Implement search, filtering, sorting, and pagination using mock data.
10. Implement responsive behavior.
11. Implement loading, empty, success, and error states.
12. Keep all mock data centralized.
13. Keep API/service logic separate from UI.
14. Ensure the code is ready for future FastAPI + Supabase PostgreSQL integration.
15. Test all routes and responsive layouts.

## MOST IMPORTANT INSTRUCTION

**Do not invent anything beyond the requirements in this prompt.**

If a feature, field, page, role, workflow, or permission is not explicitly specified, **do not add it**.

The final result should be a **clean, responsive, attractive, professional, production-quality frontend** for the specified Mureed Information Management System.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2e93685d-c54e-424f-83a4-ae742f4048a7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

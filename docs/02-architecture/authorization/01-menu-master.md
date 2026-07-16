# Menu Master Configuration

This document defines the structural representation, navigation constraints, and metadata registry for the platform's navigation elements.

---

## 1. Design Principles

1. **Decoupled from RBAC**: Menus only represent **what features exist** and their visual relationships. They contain no reference to Roles or Users.
2. **Dynamic Tree Rendering**: The sidebar navigation must render dynamically by querying the Menu Master structure and filtering active nodes based on active feature flags and permission sets.
3. **Three-Level Max Depth**: Navigation depth is strictly limited to 3 levels to maintain mobile-friendliness and prevent UI layout distortion:
   - Level 1: Module Group (e.g., _Learning_)
   - Level 2: Sub-module / Entity (e.g., _Study Materials_)
   - Level 3: Auxiliary action page / Detail view (e.g., _Upload Vault_)

---

## 2. Menu Master Registry

Every menu node in the database must match this structural schema:

| Field              |  Type   | Description                                                                                                                      |
| :----------------- | :-----: | :------------------------------------------------------------------------------------------------------------------------------- |
| `menu_id`          | String  | Unique Menu identifier code                                                                                                      |
| `parent_menu_id`   | String  | Nullable reference to the parent menu node                                                                                       |
| `title`            | String  | Internationalized string translation key                                                                                         |
| `route`            | String  | Target browser URL relative path                                                                                                 |
| `icon`             | String  | Lucide icon string lookup code                                                                                                   |
| `display_order`    | Integer | Ascending sequence ordering index                                                                                                |
| `feature_id`       | String  | Reference ID to the [Product Module Inventory](file:///d:/FreeLance/NEET_platform/docs/architecture/product-module-inventory.md) |
| `module`           | String  | Bounded context identifier (e.g. `'ACAD'`, `'LEARN'`)                                                                            |
| `is_visible`       | Boolean | Override to completely hide a menu globally                                                                                      |
| `is_system`        | Boolean | True if the menu is a platform core structure                                                                                    |
| `license_key`      | String  | Subscription plan constraint tag                                                                                                 |
| `feature_flag_key` | String  | Nullable feature configuration toggle key                                                                                        |

### 2.1 Navigation Tree Catalog

#### Level 1: Platform Setup (Root)

- **Menu ID:** `MENU-PLATFORM` | **Parent:** `NULL` | **Route:** `/platform` | **Icon:** `Settings` | **Order:** `10` | **Feature ID:** `NULL` | **Module:** `PLF` | **Visible:** `TRUE` | **System:** `TRUE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Tenant Profile**
    - **Menu ID:** `MENU-PLF-TEN` | **Parent:** `MENU-PLATFORM` | **Route:** `/platform/tenant` | **Icon:** `Building` | **Order:** `1` | **Feature ID:** `PLF-TEN-001` | **Module:** `PLF` | **Visible:** `TRUE` | **System:** `TRUE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Branches Directory**
    - **Menu ID:** `MENU-PLF-BRN` | **Parent:** `MENU-PLATFORM` | **Route:** `/platform/branches` | **Icon:** `GitFork` | **Order:** `2` | **Feature ID:** `PLF-BRN-001` | **Module:** `PLF` | **Visible:** `TRUE` | **System:** `TRUE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Calendar Periods**
    - **Menu ID:** `MENU-PLF-ACY` | **Parent:** `MENU-PLATFORM` | **Route:** `/platform/academic-years` | **Icon:** `Calendar` | **Order:** `3` | **Feature ID:** `PLF-ACY-001` | **Module:** `PLF` | **Visible:** `TRUE` | **System:** `TRUE` | **License:** `NULL` | **Feature Flag:** `NULL`

#### Level 1: Admissions (Root)

- **Menu ID:** `MENU-ADMISSIONS` | **Parent:** `NULL` | **Route:** `/admissions` | **Icon:** `UserPlus` | **Order:** `20` | **Feature ID:** `NULL` | **Module:** `ADM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Student Registry**
    - **Menu ID:** `MENU-ADM-STU` | **Parent:** `MENU-ADMISSIONS` | **Route:** `/admissions/students` | **Icon:** `Users` | **Order:** `1` | **Feature ID:** `ADM-STU-001` | **Module:** `ADM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Document Vault**
    - **Menu ID:** `MENU-ADM-DOC` | **Parent:** `MENU-ADMISSIONS` | **Route:** `/admissions/documents` | **Icon:** `FolderOpen` | **Order:** `2` | **Feature ID:** `ADM-DOC-001` | **Module:** `ADM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Parent Directory**
    - **Menu ID:** `MENU-ADM-PAR` | **Parent:** `MENU-ADMISSIONS` | **Route:** `/admissions/parents` | **Icon:** `Heart` | **Order:** `3` | **Feature ID:** `ADM-PAR-001` | **Module:** `ADM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`

#### Level 1: Academics (Root)

- **Menu ID:** `MENU-ACADEMICS` | **Parent:** `NULL` | **Route:** `/academics` | **Icon:** `GraduationCap` | **Order:** `30` | **Feature ID:** `NULL` | **Module:** `ACD` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Curriculum Catalog**
    - **Menu ID:** `MENU-ACD-CUR` | **Parent:** `MENU-ACADEMICS` | **Route:** `/academics/curriculum` | **Icon:** `BookOpen` | **Order:** `1` | **Feature ID:** `ACD-CUR-001` | **Module:** `ACD` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Batch Execution**
    - **Menu ID:** `MENU-ACD-BAT` | **Parent:** `MENU-ACADEMICS` | **Route:** `/academics/batches` | **Icon:** `Boxes` | **Order:** `2` | **Feature ID:** `ACD-BAT-001` | **Module:** `ACD` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Scheduler**
    - **Menu ID:** `MENU-ACD-SCH` | **Parent:** `MENU-ACADEMICS` | **Route:** `/academics/timetable` | **Icon:** `Clock` | **Order:** `3` | **Feature ID:** `ACD-SCH-001` | **Module:** `ACD` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`

#### Level 1: Learning & Materials (Root)

- **Menu ID:** `MENU-LEARNING` | **Parent:** `NULL` | **Route:** `/learning` | **Icon:** `Library` | **Order:** `40` | **Feature ID:** `NULL` | **Module:** `LRN` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Study Materials**
    - **Menu ID:** `MENU-LRN-MAT` | **Parent:** `MENU-LEARNING` | **Route:** `/learning/materials` | **Icon:** `FileText` | **Order:** `1` | **Feature ID:** `LRN-MAT-001` | **Module:** `LRN` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Video Lectures**
    - **Menu ID:** `MENU-LRN-VID` | **Parent:** `MENU-LEARNING` | **Route:** `/learning/videos` | **Icon:** `Video` | **Order:** `2` | **Feature ID:** `LRN-VID-001` | **Module:** `LRN` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `enterprise` | **Feature Flag:** `feat_recorded_videos`
  - **Level 2: Assignment Hub**
    - **Menu ID:** `MENU-LRN-ASG` | **Parent:** `MENU-LEARNING` | **Route:** `/learning/assignments` | **Icon:** `ClipboardSignature` | **Order:** `3` | **Feature ID:** `LRN-ASG-001` | **Module:** `LRN` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`

#### Level 1: Examinations (Root)

- **Menu ID:** `MENU-EXAMS` | **Parent:** `NULL` | **Route:** `/exams` | **Icon:** `Award` | **Order:** `50` | **Feature ID:** `NULL` | **Module:** `EXM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Question Bank**
    - **Menu ID:** `MENU-EXM-QB` | **Parent:** `MENU-EXAMS` | **Route:** `/exams/questions` | **Icon:** `Database` | **Order:** `1` | **Feature ID:** `EXM-QB-001` | **Module:** `EXM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Mock Tests Console**
    - **Menu ID:** `MENU-EXM-CBT` | **Parent:** `MENU-EXAMS` | **Route:** `/exams/mock-tests` | **Icon:** `MonitorPlay` | **Order:** `2` | **Feature ID:** `EXM-CBT-001` | **Module:** `EXM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Grade Sheets**
    - **Menu ID:** `MENU-EXM-SCO` | **Parent:** `MENU-EXAMS` | **Route:** `/exams/scores` | **Icon:** `FileSpreadsheet` | **Order:** `3` | **Feature ID:** `EXM-SCO-001` | **Module:** `EXM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`

#### Level 1: Fees & Ledger (Root)

- **Menu ID:** `MENU-FEES` | **Parent:** `NULL` | **Route:** `/fees` | **Icon:** `CreditCard` | **Order:** `60` | **Feature ID:** `NULL` | **Module:** `FEE` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `premium` | **Feature Flag:** `feat_billing`
  - **Level 2: Fee Tariffs**
    - **Menu ID:** `MENU-FEE-STR` | **Parent:** `MENU-FEES` | **Route:** `/fees/tariffs` | **Icon:** `Layers` | **Order:** `1` | **Feature ID:** `FEE-STR-001` | **Module:** `FEE` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `premium` | **Feature Flag:** `feat_billing`
  - **Level 2: Payment Processing**
    - **Menu ID:** `MENU-FEE-PAY` | **Parent:** `MENU-FEES` | **Route:** `/fees/payments` | **Icon:** `DollarSign` | **Order:** `2` | **Feature ID:** `FEE-PAY-001` | **Module:** `FEE` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `premium` | **Feature Flag:** `feat_billing`

#### Level 1: Communication (Root)

- **Menu ID:** `MENU-COMMUNICATION` | **Parent:** `NULL` | **Route:** `/communication` | **Icon:** `Megaphone` | **Order:** `70` | **Feature ID:** `NULL` | **Module:** `COM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`
  - **Level 2: Notice Board**
    - **Menu ID:** `MENU-COM-ANN` | **Parent:** `MENU-COMMUNICATION` | **Route:** `/communication/notices` | **Icon:** `Bell` | **Order:** `1` | **Feature ID:** `COM-ANN-001` | **Module:** `COM` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `NULL` | **Feature Flag:** `NULL`

#### Level 1: AI Portals (Root)

- **Menu ID:** `MENU-AI` | **Parent:** `NULL` | **Route:** `/ai` | **Icon:** `Cpu` | **Order:** `80` | **Feature ID:** `NULL` | **Module:** `AIS` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `enterprise` | **Feature Flag:** `feat_ai_coach`
  - **Level 2: Coach Room**
    - **Menu ID:** `MENU-AIS-TUT` | **Parent:** `MENU-AI` | **Route:** `/ai/coach` | **Icon:** `MessageSquare` | **Order:** `1` | **Feature ID:** `AIS-TUT-001` | **Module:** `AIS` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `enterprise` | **Feature Flag:** `feat_ai_coach`
  - **Level 2: Prompt Master**
    - **Menu ID:** `MENU-AIS-PRM` | **Parent:** `MENU-AI` | **Route:** `/ai/prompts` | **Icon:** `Terminal` | **Order:** `2` | **Feature ID:** `AIS-PRM-001` | **Module:** `AIS` | **Visible:** `TRUE` | **System:** `FALSE` | **License:** `enterprise` | **Feature Flag:** `feat_ai_coach`

---

## 3. UI & Behavioral Rules

### 3.1 Visibility Evaluation Rules

1. **Feature Flag Check**: If `feature_flag_key` is not null, the frontend must verify if the flag is enabled in the current tenant settings. If disabled, the node (and all its children) must be completely skipped.
2. **Sub-Menu Bubble-up**: If all sub-menus (Level 2) of a root module (Level 1) are hidden from a user, the root menu item itself must be hidden from the sidebar to prevent empty groups.

### 3.2 Navigation & Breadcrumb Generation

- **Breadcrumb Path**: Determined dynamically by parsing upward from the active child node to the root.
  - _Example Path:_ `Learning` ➔ `Study Materials` (derived from `/learning/materials`).
- **Active State styling**: Sidebar must highlight the Level 2 menu matching the beginning segment of the current router window URL.

### 3.3 Layout Constraints (Mobile/Sidebar)

- **Desktop Sidebar**: Displays Level 1 and Level 2 menus in a collapsible tree or accordion panel.
- **Mobile Sidebar**: Accordion design layout. Clicking Level 1 accordion opens Level 2 selections. Level 3 pages must be handled as action panels or tabs inside the Level 2 page window to avoid excessive nesting.

---

## 4. Future Extension Protocol

- When introducing a new functional module (e.g., _Hostel Management_):
  1. Register the parent node `MENU-HOSTEL` under root.
  2. Create child sub-menus (Level 2) pointing to the parent.
  3. Ensure the routes align with the modular URL patterns `/hostel/...`

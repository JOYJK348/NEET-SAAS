# 02 — Coding Standards & Engineering Guidelines

This playbook defines naming conventions, folder layouts, and styling standards to ensure maintainability and prevent structural decay as the codebase grows.

---

## 1. Naming Conventions

### File Naming
*   **Database Migrations:** Use the sequential pattern: `<sprint>_<module_name>_<action>.sql` (e.g., `00_auth_roles.sql`).
*   **TypeScript Files:** Use camelCase with dots indicating the artifact type:
    *   Controllers: `student.controller.ts`
    *   Services: `student.service.ts`
    *   Repositories: `student.repository.ts`
    *   DTOs: `create-student.dto.ts`
    *   Hooks: `useMarkAttendance.ts`
    *   Components: PascalCase (e.g., `DataTable.tsx`, `SidebarItem.tsx`).

### Code Identifiers
*   **Types & Interfaces:** PascalCase (e.g., `StudentFilters`).
*   **Classes:** PascalCase (e.g., `StudentService`).
*   **Functions & Methods:** camelCase (e.g., `markAttendance()`).
*   **Variables:** camelCase (e.g., `activeAcademicYear`).
*   **Enums:** UPPERCASE with snake_case (e.g., `ACADEMIC_STATUS`).

### Git Commit Conventions
We enforce the Conventional Commits specification. Every commit message must match:
`type(scope): description`

Approved Types:
*   `feat`: A new feature (e.g., `feat(auth): add refresh token rotation`)
*   `fix`: A bug fix (e.g., `fix(attendance): resolve duplicate marking`)
*   `refactor`: Code changes that neither fix a bug nor add a feature (e.g., `refactor(people): simplify repository`)
*   `docs`: Documentation only changes (e.g., `docs(api): update swagger examples`)
*   `test`: Adding missing tests or correcting existing tests (e.g., `test(billing): add payment integration tests`)
*   `chore`: Changes to the build process or auxiliary tools/libraries.

---

## 2. Directory Layout Standards

### Backend NestJS Modules
NestJS modules must follow the bounded context architecture:
```
src/modules/<context>/
├── dto/                              # Validation schemas
│   ├── create-<entity>.dto.ts
│   └── update-<entity>.dto.ts
├── entities/                         # Local types / interfaces
├── controllers/                      # HTTP routing endpoints
├── services/                         # Business logic
├── repositories/                     # DB operations wrapper
└── <context>.module.ts               # Dependency injection imports
```

### Frontend Next.js Features
Frontend feature modules must remain strictly sandboxed. Deep imports across features are prohibited (e.g., `@/features/billing` cannot import from `features/attendance/components/`).
```
src/features/<context>/
├── components/                       # Feature-specific client components
├── hooks/                            # Query & mutation hooks
├── services/                         # API client services
├── store/                            # Local Zustand slices (if needed)
└── index.ts                          # Public interface exports
```

---

## 3. Data Transfer Objects (DTO) Rules

1.  **Strict Typing:** Never use `any` or `Record<string, unknown>` for requests/responses. Define exact fields.
2.  **Validation Annotations:** Every input DTO must have decorators from `class-validator` (e.g., `@IsString()`, `@IsEmail()`, `@IsOptional()`).
3.  **Sanitization:** Apply `class-transformer` annotations if input types need conversion (e.g., `@Type(() => Date)` for date parsing).
4.  **Swagger Documentation:** Every field must have an `@ApiProperty()` annotation with descriptive values and examples.

```typescript
// Example: src/modules/people/dto/create-student.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStudentDto {
  @ApiProperty({ example: 'Ravi Kumar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ravi@neet.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '2010-06-15' })
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;
}
```

---

## 4. Multi-Tenant Coding Guidelines

1.  **Enforce RLS:** Do not bypass Row-Level Security in migrations unless explicitly required for platform metrics.
2.  **Trace Tenant Context:** Controllers must extract tenant context via the custom decorator `@CurrentTenant()` and forward it to services.
3.  **Cross-Tenant Isolation:** Never allow joint queries across distinct tenants. Every query **must** filter on `tenant_id`.

# Student Lifecycle Journey Map

Student profiles transition through strict statuses in namma SaaS platform:

```mermaid
stateDiagram-Obj
    [*] --> DRAFT : Admissions Enquiry / Application
    DRAFT --> ADMITTED : Verified + sp_promote_student
    ADMITTED --> ACTIVE : Batch Allocation Triggered
    ACTIVE --> SUSPENDED : Disciplinary Hold / Fees Due
    SUSPENDED --> ACTIVE : Re-instated / Cleared
    ACTIVE --> LEFT : Withdraws / sp_archive_student
    LEFT --> REJOINED : Restored / sp_restore_student
    REJOINED --> ACTIVE : Re-enrolled
    ACTIVE --> GRADUATED : sp_graduate_students (Year End)
    GRADUATED --> [*]
```

## State Definitions

- **DRAFT**: Application initialized, documents pending verification.
- **ACTIVE**: Fully verified student enrolled in an active batch.
- **SUSPENDED**: Profile locked from dashboard access (e.g. fee arrears).
- **LEFT**: Soft-archived account representing alumni or withdrawals.
- **GRADUATED**: Completed program (NEET qualification/Term completion).

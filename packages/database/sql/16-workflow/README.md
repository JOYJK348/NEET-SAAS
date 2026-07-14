# Workflow Bounded Context Schema Specifications

This sub-domain governs the generic, entity-agnostic State Machine Engine. It coordinates multi-tenant lifecycle steps, approvals routing, temporal delegation rules, automatic timeout escalations, and outbox notifications.

---

## 1. Core Architecture Principles

1.  **Loose Coupling with Authorization**: Approvals are bound to system capability _permissions_ (e.g. `exam.approve`, `admissions.approve`), never directly to hardcoded role IDs.
2.  **Generic State Machine**: Instead of duplicating logic across entities, any model registers via composite keys `(entity_type, entity_id)` to walk through configured transitions.
3.  **Strict Auditability**: Historical state changes are append-only. Requests transitions register new rows in `workflow_history` to log execution checkpoints.

---

## 2. Compile Dependency Sequence

The SQL scripts in this folder must compile in the following order:

1.  `tables/` DDL scripts (numeric order):
    - `001_workflows.sql`
    - `002_workflow_states.sql`
    - `003_workflow_actions.sql`
    - `004_workflow_steps.sql`
    - `005_workflow_requests.sql`
    - `006_workflow_history.sql`
    - `007_workflow_comments.sql`
    - `008_workflow_attachments.sql`
    - `009_workflow_notifications.sql`
    - `010_workflow_delegations.sql`
    - `011_workflow_escalations.sql`
    - `012_workflow_transitions.sql`
    - `013_workflow_notification_dead_letters.sql`
2.  `functions/001_workflow_engine_functions.sql`
3.  `procedures/001_workflow_engine_procedures.sql`
4.  `triggers/001_workflow_engine_triggers.sql`
5.  `views/001_workflow_engine_views.sql`
6.  `rls/001_workflow_engine_rls.sql`
7.  `indexes/001_workflow_engine_indexes.sql`
8.  `seeds/001_workflow_engine_seeds.sql`
9.  `validation/999_validation.sql`

> `contracts/` directory is documentation-only (event payload schemas, naming conventions). No SQL execution required.

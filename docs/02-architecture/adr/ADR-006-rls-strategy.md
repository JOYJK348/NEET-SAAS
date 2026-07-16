# ADR-006: Row-Level Security (RLS) Strategy

## Context and Problem Statement

Supabase is utilized as the primary database infrastructure, allowing clients to interface directly with database endpoints. Strict tenant isolation is mandatory.

## Decision Outcome

Chosen Option: **Supabase Row-Level Security (RLS) with JWT Claims**.

### Rules

1. RLS policies match custom JWT claims (`auth.uid()`, tenant IDs, role arrays).
2. Direct client checks verify contextual matches on `institute_id` or `branch_id`.

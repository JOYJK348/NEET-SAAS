# ADR-003: Event-Driven Architecture

## Context and Problem Statement

Downstream systems (Analytics engines, notification dispatches, CRM updates) need real-time triggers without coupling transactional APIs.

## Decision Outcome

Chosen Option: **Transactional Domain Events Pattern**.

### Rules

1. Write operations publish standard events (e.g. `StudentEnrolled`, `PaymentReceived`) carrying unique UUIDs and correlation IDs inside database transaction boundaries.
2. Background consumers (Bull MQ) dequeue messages asynchronously, protecting the user from latency bottlenecks.

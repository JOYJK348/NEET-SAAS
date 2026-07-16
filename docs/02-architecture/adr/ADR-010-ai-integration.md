# ADR-010: AI & Context Integration Strategy

## Context and Problem Statement

The platform is designed as an AI-first educational tool. Adaptability scoring, weak-topic analytics, and automated context lookups require stable database hooks.

## Decision Outcome

Chosen Option: **Decoupled AI Metadata and Telemetry Logging**.

### Rules

1. Master tables (courses, subjects) store AI-compatible difficulty, tag, and taxonomies (e.g. Bloom's) directly.
2. Dynamic conversational logs, RAG vector chunks contents, and prompt usage costs are saved in separate system tables (`ai_conversations`, `ai_usage_logs`) to keep the core transaction tables clean.

# Workflow Event Name Catalog

## Naming Convention

All event names follow the pattern: `workflow.<action>` (lowercase, snake_case)

## Standard Events

| Event Name | Trigger | Description |
|---|---|---|
| `workflow.submitted` | DRAFT → PENDING via SUBMIT | Request submitted for initial review |
| `workflow.resubmitted` | CHANGES_REQUESTED → PENDING via SUBMIT | Corrected request re-submitted |
| `workflow.completed` | Any → APPROVED via APPROVE | Workflow completed successfully |
| `workflow.rejected` | Any → REJECTED via REJECT | Workflow rejected |
| `workflow.changes_requested` | Any → CHANGES_REQUESTED via RETURN | Changes requested by reviewer |
| `workflow.cancelled` | Any → CANCELLED via CANCEL | Workflow cancelled by initiator |
| `workflow.escalated` | Any via ESCALATE | SLA timeout auto-escalation |

## Custom Events

Custom events can be defined by setting `event_name` on any transition. Follow the pattern:

```
workflow.<domain>.<action>
```

Examples:
- `workflow.exam.published`
- `workflow.admission.approved`
- `workflow.fee.waiver.granted`

## System Events (Reserved)

These are reserved for internal engine use:

| Event Name | Purpose |
|---|---|
| `workflow.dead_letter` | Notification moved to dead letter queue |
| `workflow.delegated` | Review delegated to another user |
| `workflow.escalated` | Step escalated due to SLA timeout |

## Registering New Events

1. Set `event_name` on the `workflow_transitions` row
2. Add listener in the consuming service
3. Document the event in this catalog
4. No code change required in the engine

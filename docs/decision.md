# Technical Decisions & Assumptions

# Overview

This document summarizes the design decisions, implemented features, assumptions, constraints, and intentionally excluded functionality for the Health Insurance Claims Management System.

The objective of this take-home assignment was to build a clean, extensible backend system demonstrating:

- Domain modeling
- Workflow management
- State machine handling
- Relational data modeling
- API-first backend architecture
- Basic authentication and authorization
- Business rule enforcement

---

# Implemented Features

## Authentication & User Management

### Features

- User registration
- User login
- JWT token generation
- User logout
- Authenticated API access

### Design Decisions

- Email-based authentication was used instead of username-based login.
- JWT authentication was selected for stateless API authentication.
- Custom user model was implemented for future extensibility.

### Current Limitations

- No password reset functionality
- No email verification flow
- No profile management APIs
- No refresh-token rotation
- No session management

---

# Member Management

## Features

- Member registration
- Member profile management
- Personal details storage
- Address and contact management

## Design Decisions

- Each member is linked to exactly one user account.
- Member and authentication user are separated entities to maintain domain clarity.
- Audit fields (`created_by`, `updated_by`) were added for traceability.

## Business Rules

- Member email must be unique.
- Mobile numbers are assumed to be 10 digits.
- Only two genders are considered:
  - Male
  - Female

---

# Policy Management

## Features

- Policy creation
- Policy updates
- Policy item configuration
- Policy eligibility validation
- Policy status management

## Design Decisions

- Policies and policy coverage rules were separated into:
  - `Policy`
  - `PolicyItem`
- Policy items were modeled independently to support diagnosis-level coverage rules.
- Policy pricing is snapshotted during purchase using `MemberPolicy`.

## Business Rules

- Policies validate:
  - Minimum age
  - Maximum age
  - Gender eligibility
- Policies support:
  - Active status
  - Cancelled status
- Coverage limits are diagnosis-specific.

## Current Limitations

- No dynamic pricing engine
- No waiting-period support for diagnosis codes
- No complex underwriting rules
- No policy renewal workflow
- No policy versioning

---

# Member Policy Management

## Features

- Policy purchase tracking
- Validity management
- Historical pricing preservation

## Design Decisions

- `MemberPolicy` acts as a purchase snapshot.
- Policy price is copied at purchase time to preserve historical accuracy.
- `PROTECT` delete strategy was used on policies to preserve transactional integrity.

## Assumptions

- Policies are individual-only.
- No family or dependent coverage exists.
- One purchase record represents one member-policy relationship.

---

# Claim Management

## Features

- Claim creation
- Claim workflow management
- Claim state transitions
- Claim line-item adjudication
- Aggregate claim decision logic

## Design Decisions

- Claim workflow is enforced using explicit state machines.
- Claim and line-item states are separated intentionally:
  - Claim-level workflow
  - Diagnosis/service-level adjudication
- Claims use line-item aggregation to determine final outcomes.
- Financial closure (`PAID`) is treated as immutable.

## Business Rules

- Claims belong to exactly one policy.
- Claims contain one or more line items.
- Invalid workflow transitions are blocked.
- Once a claim becomes `PAID`, line items cannot be modified.

## Aggregate Decision Logic

| Line Item Outcome | Claim Outcome |
|---|---|
| All Approved | Approved |
| All Denied | Denied |
| Mixed Results | Partially Approved |

## Current Limitations

- No multi-level approval workflow
- No escalation chains
- No SLA tracking
- No fraud detection
- No attachment/document upload support
- No automated claim scoring
- No reimbursement/payment integration

---

# Claim Line Item Management

## Features

- Independent line-item adjudication
- Manual review support
- Terminal-state enforcement

## Design Decisions

- Line items were modeled independently for granular coverage decisions.
- Manual review state was introduced to support human intervention scenarios.

## Current Limitations

- No diagnosis-code validation against external standards
- No duplicate-claim detection
- No AI-assisted adjudication

---

# Dispute Management

## Features

- Dispute creation
- Dispute workflow transitions
- Dispute review lifecycle

## Design Decisions

- Disputes use a separate workflow from claims.
- Disputes are linked directly to claims.

## Current Limitations

- No escalation hierarchy
- No threaded conversations/comments
- No arbitration workflow
- No reopen mechanism after resolution

---

# Authorization & Permissions

## Current Design

- Single authentication model
- Any authenticated user can access all operations

## Intentionally Excluded

- Role-based access control (RBAC)
- Permission groups
- Fine-grained authorization
- UI-level action restrictions

## Future Improvements

Potential future roles:

- Admin
- Claims Adjuster
- Reviewer
- Finance
- Support Staff
- Member Portal User

---

# State Machine Design

## Design Decisions

State transitions are implemented using centralized transition maps instead of direct status mutation.

Benefits:

- Prevents invalid transitions
- Makes workflows explicit
- Improves maintainability
- Simplifies validation logic
- Easier future extensibility

## Additional Behaviors

- Same-state transitions are treated as idempotent no-ops.
- Terminal states restrict further workflow changes.
- Claim payment locks line-item modifications.

---

# Data Integrity Decisions

## Referential Integrity

The system uses relational constraints heavily.

Examples:

- `CASCADE`
  - Used where child records should be removed automatically.
- `PROTECT`
  - Used for transactional entities requiring preservation.
- `SET_NULL`
  - Used for audit ownership fields.

## Auditability

Most business entities contain:

- `created_by`
- `updated_by`
- `checked_by`
- `created_at`
- `updated_at`

This supports operational traceability and debugging.

---

# Performance & Scalability

## Current Scope

The system was designed primarily for correctness and maintainability within take-home assignment constraints.

## Intentionally Excluded

- Caching layer
- Query optimization
- Async processing
- Event-driven architecture
- Distributed locking
- Read replicas
- Background job processing
- Search indexing

## Future Improvements

Potential additions:

- Redis caching
- Celery/RQ background jobs
- Kafka/event streaming
- ElasticSearch/OpenSearch
- Database partitioning
- API rate limiting

---

# API & UX Limitations

## Currently Missing

- Pagination
- Filtering
- Search
- Sorting
- Bulk operations
- Export functionality
- API versioning
- OpenAPI documentation
- Rate limiting

---

# Deletion & Recovery Decisions

## Current Design

- Claims and disputes cannot be deleted after creation.
- Final workflow states are treated as terminal.

## Intentionally Excluded

- Soft delete
- Recovery workflows
- Archive mechanism

## Rationale

For insurance systems, transactional records are typically immutable for audit and compliance reasons.

---

# Assumptions

| Area | Assumption |
|---|---|
| Member Coverage | Individual-only policies |
| Gender | Only male/female supported |
| Mobile Number | Fixed 10-digit format |
| Pricing | Static pricing only |
| Claim Deletion | Claims cannot be deleted |
| Dispute Deletion | Disputes cannot be deleted |
| Final States | Finalized records cannot be reversed |
| Authentication | Single authentication model |
| Currency | Single currency assumed |
| Geography | No country-specific validation logic |

---

# Architectural Considerations

## What Was Prioritized

- Clean domain modeling
- Explicit workflow handling
- Data integrity
- Maintainability
- Readability
- Extensibility

## What Was Deprioritized

- Enterprise-scale optimization
- Advanced authorization
- Distributed systems complexity
- UI/UX sophistication
- Operational tooling

---

# Potential Future Enhancements

## Security

- RBAC
- MFA
- Audit logs
- IP restrictions

## Claims

- AI-assisted adjudication
- Fraud detection
- Document OCR
- External provider integrations

## Policies

- Dynamic pricing
- Risk scoring
- Waiting periods
- Family plans

## Infrastructure

- Containerization
- Kubernetes deployment
- Event-driven workflows
- Observability stack
- CI/CD pipelines

---

# Summary

The implementation focuses on building a clean and extensible insurance claims management foundation with:

- Explicit workflow management
- Strong relational modeling
- Clear business boundaries
- State-machine-driven transitions
- Auditability
- Maintainable domain separation

Several enterprise-level capabilities were intentionally excluded to keep the scope realistic for a one-day take-home assignment while still demonstrating architectural thinking and backend engineering fundamentals.

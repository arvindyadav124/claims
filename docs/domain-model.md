# Domain Model

## Overview

This document describes the core domain entities, relationships, and workflow state machines for the Health Insurance Claims Management System.

The system supports:

- Member registration and profile management
- Policy and policy item configuration
- Policy purchase by members
- Claim submission and adjudication
- Claim line-item review
- Dispute management
- User authentication and authorization

---

# Entity Overview

| Entity | Purpose |
|---|---|
| User | Authentication and system access |
| Member | Insurance customer/member profile |
| Policy | Insurance policy definition |
| PolicyItem | Coverage rules within a policy |
| MemberPolicy | Purchased policy instance for a member |
| Claim | Insurance claim submitted against a policy |
| ClaimLineItem | Diagnosis/service-level entries within a claim |
| Dispute | Escalation or objection raised on a claim |

---

# Entities

---

## User

Represents an authenticated system user.

### Attributes

| Field | Type | Description |
|---|---|---|
| id | UUID / Integer | Primary identifier |
| email | Email | Unique login email |
| is_staff | Boolean | Administrative access |
| is_active | Boolean | User activation status |
| date_joined | DateTime | Account creation timestamp |

### Responsibilities

- Authentication
- JWT token generation
- Audit ownership (`created_by`, `updated_by`, `checked_by`)

---

## Member

Represents an insured customer.

### Attributes

| Field | Type | Description |
|---|---|---|
| id | UUID / Integer | Primary identifier |
| first_name | String | Member first name |
| last_name | String | Member last name |
| email | Email | Unique member email |
| dob | Date | Date of birth |
| gender | Enum | Male / Female |
| mobile | String | Contact number |
| address | Text | Address |
| district | String | District |
| state | String | State |
| pincode | String | Postal code |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Relationships

| Relationship | Type |
|---|---|
| User → Member | One-to-One |
| Member → MemberPolicy | One-to-Many |

### Notes

- Each member is linked to exactly one user account.
- Members can purchase multiple policies.

---

## Policy

Represents an insurance policy product.

### Attributes

| Field | Type | Description |
|---|---|---|
| id | UUID / Integer | Primary identifier |
| name | String | Policy name |
| price | Decimal | Base policy price |
| min_age | Integer | Minimum eligible age |
| max_age | Integer | Maximum eligible age |
| eligible_gender | Enum | Male / Female / Both |
| status | Enum | Active / Cancelled |
| total_cover | Integer | Maximum coverage amount |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Relationships

| Relationship | Type |
|---|---|
| Policy → PolicyItem | One-to-Many |
| Policy → MemberPolicy | One-to-Many |
| Policy → Claim | One-to-Many |

### Business Rules

- Policy eligibility depends on age and gender.
- Cancelled policies cannot be newly purchased.
- A policy may contain multiple coverage rules.

---

## PolicyItem

Represents diagnosis-level coverage rules within a policy.

### Attributes

| Field | Type | Description |
|---|---|---|
| id | UUID / Integer | Primary identifier |
| diagnosis_code | String | Diagnosis/procedure code |
| max_percent_of_policy | Integer | Maximum percentage allowed |
| max_yearly_limit | Decimal | Annual monetary limit |
| max_claims_per_year | Integer | Maximum yearly claim count |

### Relationships

| Relationship | Type |
|---|---|
| PolicyItem → Policy | Many-to-One |

### Business Rules

- Coverage limits are diagnosis specific.
- Percentage cannot exceed 100%.

---

## MemberPolicy

Represents a purchased policy owned by a member.

### Attributes

| Field | Type | Description |
|---|---|---|
| id | UUID / Integer | Primary identifier |
| purchasing_date | Date | Purchase date |
| price | Decimal | Snapshot price at purchase time |
| valid_up_to | Date | Policy validity end date |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Relationships

| Relationship | Type |
|---|---|
| MemberPolicy → Member | Many-to-One |
| MemberPolicy → Policy | Many-to-One |

### Notes

- Stores historical pricing snapshot.
- Preserves purchased policy details even if base policy changes later.

---

## Claim

Represents an insurance claim submitted against a policy.

### Attributes

| Field | Type | Description |
|---|---|---|
| id | UUID / Integer | Primary identifier |
| claim_number | String | Unique claim reference |
| amount_cents | Integer | Total claim amount |
| status | Enum | Claim workflow state |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Relationships

| Relationship | Type |
|---|---|
| Claim → Policy | Many-to-One |
| Claim → ClaimLineItem | One-to-Many |
| Claim → Dispute | One-to-Many |

### Business Rules

- Claims belong to exactly one policy.
- Claims contain one or more line items.
- Claim state changes are strictly controlled via state machine transitions.

---

## ClaimLineItem

Represents diagnosis-level entries within a claim.

### Attributes

| Field | Type | Description |
|---|---|---|
| id | UUID / Integer | Primary identifier |
| diagnosis_code | String | Diagnosis/procedure code |
| amount | Decimal | Claimed amount |
| status | Enum | Line-item review status |

### Relationships

| Relationship | Type |
|---|---|
| ClaimLineItem → Claim | Many-to-One |

### Business Rules

- Each line item is independently adjudicated.
- Line-item status updates are blocked once the parent claim is paid.

---

## Dispute

Represents a dispute raised against a claim decision.

### Attributes

| Field | Type | Description |
|---|---|---|
| id | UUID / Integer | Primary identifier |
| reason | Text | Dispute reason |
| status | Enum | Dispute workflow state |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Relationships

| Relationship | Type |
|---|---|
| Dispute → Claim | Many-to-One |

### Business Rules

- Multiple disputes can exist for a claim.
- Disputes follow a separate workflow lifecycle.

---

# Relationship Diagram

```text
User
 └── 1:1 ── Member
                │
                └── 1:N ── MemberPolicy ── N:1 ── Policy
                                                       │
                                                       ├── 1:N ── PolicyItem
                                                       │
                                                       └── 1:N ── Claim
                                                                        │
                                                                        ├── 1:N ── ClaimLineItem
                                                                        │
                                                                        └── 1:N ── Dispute
```

---

# State Machines

---

# Claim State Machine

## States

| State | Description |
|---|---|
| Draft | Initial draft state |
| Submitted | Claim submitted for processing |
| In Review | Claim under evaluation |
| Partially Approved | Some line items approved |
| Approved | Fully approved |
| Denied | Fully denied |
| Paid | Financial settlement completed |

## Workflow

```text
DRAFT
  ↓
SUBMITTED
  ↓
IN_REVIEW
  ├──→ PARTIALLY_APPROVED ──→ APPROVED ──→ PAID
  │                               │
  │                               └──→ DENIED
  │
  ├──→ APPROVED ──→ PAID
  │
  └──→ DENIED
```

## Transition Rules

| From | Allowed To |
|---|---|
| Draft | Submitted |
| Submitted | In Review |
| In Review | Partially Approved, Approved, Denied |
| Partially Approved | Approved, Denied |
| Approved | Paid |
| Denied | Terminal |
| Paid | Terminal |

---

# Claim Line Item State Machine

## States

| State | Description |
|---|---|
| Pending | Awaiting review |
| Approved | Accepted |
| Denied | Rejected |
| Manual Review | Requires human intervention |

## Workflow

```text
PENDING
 ├──→ APPROVED
 ├──→ DENIED
 └──→ MANUAL_REVIEW
            ├──→ APPROVED
            └──→ DENIED
```

## Transition Rules

| From | Allowed To |
|---|---|
| Pending | Approved, Denied, Manual Review |
| Manual Review | Approved, Denied |
| Approved | Terminal |
| Denied | Terminal |

---

# Dispute State Machine

## States

| State | Description |
|---|---|
| Draft | Initial dispute |
| Submitted | Submitted for review |
| In Review | Under investigation |
| Resolved | Final resolution completed |

## Workflow

```text
DRAFT
  ↓
SUBMITTED
  ↓
IN_REVIEW
  ↓
RESOLVED
```

## Transition Rules

| From | Allowed To |
|---|---|
| Draft | Submitted |
| Submitted | In Review |
| In Review | Resolved |
| Resolved | Terminal |

---

# Aggregate Claim Decision Logic

Claim status may be automatically derived from line-item outcomes.

| Line Item Outcome | Claim Outcome |
|---|---|
| All Approved | Approved |
| All Denied | Denied |
| Mixed Results | Partially Approved |

Additional rules:

- Claim transitions must still follow valid workflow transitions.
- Same-state transitions are treated as idempotent no-ops.
- Line-item updates are blocked once claim status becomes `Paid`.

---

# Audit Fields

Most entities include standard audit metadata.

| Field | Purpose |
|---|---|
| created_by | User who created the record |
| updated_by | User who last updated the record |
| checked_by | User who reviewed/validated the record |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

---

# Design Considerations

- Explicit state machines prevent invalid workflow transitions.
- Policy pricing is snapshotted at purchase time for historical consistency.
- Claim adjudication supports granular line-item evaluation.
- Separate dispute workflow enables post-decision escalation.
- Auditability is enforced across all critical entities.

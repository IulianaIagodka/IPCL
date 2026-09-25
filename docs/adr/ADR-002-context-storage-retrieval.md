# ADR-002: Store context as structured memory + semantic index + immutable sources

**Status:** Accepted  
**Date:** 2026-09-25

## Context

The product needs to maintain portable AI context across multiple tools and models.

Simply storing all user information as one large text blob creates several problems:

- irrelevant context is sent to models
- token usage grows continuously
- old and new information may contradict each other
- users cannot understand where a statement came from
- individual facts are difficult to update or delete
- semantic search becomes noisy
- AI-generated summaries may gradually distort original information

At the same time, storing only embeddings is insufficient because embeddings are optimized for retrieval, not as a canonical representation of knowledge.

The system therefore needs to distinguish between:

1. **original information**
2. **normalized reusable context**
3. **retrieval index**

## Decision

Context will be stored in three layers:

```text
RAW SOURCE
    ↓
MEMORY EXTRACTION
    ↓
STRUCTURED MEMORY
    ↓
SEMANTIC INDEX
```

### Layer 1 — Raw Sources

The original information supplied by the user.

Examples:

- pasted conversation
- uploaded document
- note
- project description
- README
- imported text
- manually entered information

Raw sources are preserved so every extracted memory can be traced back to its origin.

Example:

```text
Source
────────────────────────

type: conversation
title: Paypace pricing discussion
created_at: 2026-09-24

content:
"We decided that Paypace should have
monthly and yearly subscriptions..."
```

Raw source is **evidence**, not active memory.

## Layer 2 — Structured Memory

Reusable context is extracted into small independent memory objects.

A memory should represent **one meaningful idea**.

Example:

```text
Memory

type: decision
scope: project/paypace

statement:
"Paypace offers monthly and yearly subscriptions."

confidence: high

source:
conversation_182

created_at:
2026-09-24

status:
active
```

We explicitly avoid storing a project as one giant AI-generated summary.

Instead:

```text
Paypace

├── product
├── audience
├── design preference
├── decision
├── decision
├── technical constraint
├── terminology
└── open question
```

This makes individual pieces independently searchable, editable and removable.

## Memory Types

Initial memory types:

### Profile

Stable information about the user.

Example:

```text
role:
Technical Product Owner
```

### Preference

How the user prefers AI to behave.

Example:

```text
Avoid explaining basic software
engineering concepts unless requested.
```

### Project Fact

Information describing a project.

Example:

```text
Paypace is a personal budgeting product.
```

### Decision

Something that has already been decided.

Example:

```text
Receipt scanning will use AI.
```

Decisions receive higher retrieval priority than historical discussion.

### Constraint

Something that limits possible solutions.

Example:

```text
The MVP must work without requiring
users to install a browser extension.
```

### Goal

Desired outcome.

Example:

```text
Launch the MVP within four weeks.
```

### Terminology

User/project-specific vocabulary.

Example:

```text
"Pace" means available daily spending,
not current account balance.
```

### Open Question

Something explicitly unresolved.

Example:

```text
Pricing for AI receipt packages
has not yet been finalized.
```

This is intentionally different from a decision.

## Scope

Every memory belongs to a scope.

Initial hierarchy:

```text
USER

├── GLOBAL
│
├── WORK
│
├── PROJECT
│   ├── Paypace
│   ├── Signoff
│   └── Other project
│
└── CUSTOM PROFILE
```

A memory can therefore be:

```text
global
```

or:

```text
project/paypace
```

or potentially:

```text
work/platform-engineering
```

## Canonical memory object

Initial logical schema:

```text
Memory {
    id

    type
    scope

    statement

    importance
    confidence

    valid_from
    valid_until

    status

    source_ids[]

    created_at
    updated_at

    embedding
}
```

Possible statuses:

```text
active
superseded
archived
disputed
deleted
```

## Critical rule: memories are temporal

A user can change their mind.

Therefore we must not simply overwrite old information.

Example:

```text
OLD

Paypace uses lifetime pricing.

status:
superseded
```

```text
NEW

Paypace uses monthly and yearly pricing.

status:
active
```

This allows the system to understand:

> This was true before.  
> This is true now.

Without this distinction, long-lived AI memory becomes increasingly unreliable.

## Conflict handling

When newly extracted information conflicts with an active memory, the system should not silently replace it.

Example:

Existing:

```text
Launch target:
October
```

New source:

```text
Launch moved to November.
```

System proposes:

```text
Possible update detected

Current:
Launch target is October.

New:
Launch target is November.

[ Update memory ]
[ Keep both ]
[ Ignore ]
```

For low-risk information, automatic replacement may eventually be possible.

For important:

- decisions
- identity information
- financial information
- permissions
- constraints

explicit confirmation should be preferred.

## Layer 3 — Semantic Index

Each memory receives an embedding used for semantic retrieval.

Embeddings are **not the source of truth**.

They are an index.

```text
memory
   ↓
embedding
   ↓
vector search
```

The canonical value remains:

```text
statement + metadata + provenance
```

This distinction allows embeddings to be regenerated later if models or vector infrastructure change.

## Retrieval Architecture

When an AI client sends a request:

```text
User request
      ↓
Intent detection
      ↓
Scope selection
      ↓
Semantic retrieval
      ↓
Metadata filtering
      ↓
Ranking
      ↓
Context package
      ↓
AI
```

Example user request:

> Review the pricing architecture for Paypace.

The system should preferentially retrieve:

```text
scope = Paypace

type:
decision
constraint
project_fact

topic:
pricing
monetization
AI costs
```

It should not retrieve unrelated information merely because it is globally associated with the user.

## Retrieval ranking

Initial conceptual scoring:

```text
score =

semantic_similarity

+ scope_match

+ importance

+ recency

+ decision_priority

+ explicit_user_pin

- contradiction_penalty

- stale_penalty
```

Exact weights remain implementation details and should be tunable.

## Memory importance

Memories receive an importance level.

Example:

```text
LOW

User likes compact cards.
```

```text
MEDIUM

Project uses Supabase.
```

```text
HIGH

The production database must remain
in the EU.
```

High-importance information should be harder to automatically supersede and more likely to be included when relevant.

## Context assembly

Retrieval results should not be dumped directly into the model.

A dedicated context assembler creates a compact package.

Example:

```text
PROJECT CONTEXT: PAYPACE

Product
- Personal budgeting application.
- Focuses on spending pace rather than
  traditional expense tracking.

Current decisions
- Monthly and yearly subscriptions.
- AI receipt processing may have separate
  usage limits.

Technical constraints
- iOS-first.

Relevant terminology
- "Pace" = recommended daily spending.
```

This context package is ephemeral.

It exists for the current AI interaction and does not become a new memory automatically.

## Prevent memory loops

AI-generated answers must **not automatically become memory**.

Otherwise:

```text
AI invents something
        ↓
system remembers it
        ↓
next AI sees it as fact
        ↓
false information becomes reinforced
```

Therefore:

```text
AI output ≠ memory
```

Information becomes memory only through:

1. explicit user save
2. extraction from user-provided source
3. approved memory suggestion

## Memory extraction

When content is imported, the extraction pipeline identifies candidate memories.

Example:

```text
INPUT

"We originally wanted a lifetime
subscription, but we've decided to use
monthly and yearly plans instead."
```

Extraction:

```text
candidate memory

type: decision
statement:
Paypace uses monthly and yearly subscriptions.

supersedes:
Paypace uses lifetime pricing.
```

The extraction system should prefer **facts expressed by the user**, not assumptions made by the model.

## Provenance

Every memory must answer:

> **Why does the system believe this?**

Example:

```text
Memory

"Paypace uses monthly and yearly plans."

Sources

→ Conversation Sep 23
→ Pricing note Sep 24
```

The UI should eventually expose:

**Why is this in my context?**

This is both a trust feature and a debugging feature.

## User controls

For every memory users must be able to:

```text
View
Edit
Pin
Archive
Delete
See source
See where it is used
```

Eventually:

```text
Never share with external AI
```

can exist as a privacy flag.

## Sensitive context

Structured memories may contain highly sensitive information.

The system should therefore support classification such as:

```text
normal

sensitive

restricted
```

Restricted memories should never be returned through integrations without an explicit permission policy.

## Storage architecture

Logical architecture:

```text
┌──────────────────────────┐
│ Relational database      │
│                          │
│ users                    │
│ projects                 │
│ memories                 │
│ sources                  │
│ memory_source_links      │
│ integrations             │
└────────────┬─────────────┘
             │
             │ memory.id
             ↓
┌──────────────────────────┐
│ Vector index             │
│                          │
│ memory embedding         │
└──────────────────────────┘

             +

┌──────────────────────────┐
│ Object storage           │
│                          │
│ original documents       │
│ imported files           │
└──────────────────────────┘
```

For the MVP the vector index may live in the same database if the selected database supports vector search.

A separate vector database is not required initially.

## Recommended MVP implementation

A pragmatic implementation could use:

```text
PostgreSQL
    ↓
structured memory

pgvector
    ↓
semantic retrieval

object storage
    ↓
raw documents
```

This keeps the architecture simple while preserving the ability to split components later.

## Context budget

Every integration request receives a maximum context budget.

Example:

```text
Context budget:
3,000 tokens
```

The retrieval system should therefore select the **best context**, rather than every potentially relevant memory.

Potential allocation:

```text
15% global profile

70% task/project context

15% recent/related decisions
```

Actual allocation should be dynamic rather than permanently fixed.

## MVP retrieval strategy

The first implementation does not need sophisticated agents.

Use:

```text
1. determine scope
2. embed query
3. retrieve top candidate memories
4. metadata filter
5. rerank
6. assemble context
7. return
```

Simple and measurable.

## Evaluation

Retrieval quality must be testable.

Create benchmark scenarios such as:

```text
User has 500 memories.

Question:
"What pricing model did we choose for Paypace?"
```

Expected context:

```text
monthly subscription
yearly subscription
AI usage decision
```

Incorrect context:

```text
old lifetime-pricing proposal
unrelated design decisions
other projects
```

Core metrics:

```text
Relevant memory recall

Irrelevant context rate

Contradiction rate

Context token usage

User correction rate
```

## Product implication

The fundamental product object is **not a document**.

It is:

# Memory

A memory is:

> one reusable piece of context  
> with scope, meaning, freshness and provenance.

Documents, chats and notes are merely sources from which memories can be created.

## Consequences

### Positive

- Context remains understandable as it grows.
- Individual memories can be corrected.
- Conflicting information can be handled safely.
- Retrieval is cheaper than sending complete history.
- AI providers receive only relevant context.
- Users can inspect where information originated.
- Embedding vendors can be changed without migrating canonical knowledge.
- The model can eventually support personal, project and organizational memory.

### Negative

- Extraction adds complexity.
- Incorrect extraction must be detectable.
- Memory conflicts require lifecycle management.
- Retrieval quality becomes a core product competency.
- Users need a usable interface for inspecting context without turning the product into a knowledge-management tool.

## Key product rule

The system should feel like:

> **AI remembers what matters.**

It must **not** feel like:

> Maintain your personal knowledge database.

The complexity belongs inside the product.

The user experience should remain:

```text
Add something
      ↓
AI understands it
      ↓
Relevant context appears
when needed
```

## Success criterion

After months of use and thousands of pieces of source information, the system should still reliably answer:

1. **What is currently true?**
2. **Where did we learn it?**
3. **Is it relevant to this request?**
4. **Should this AI be allowed to see it?**

without requiring the user to manually maintain a giant prompt.

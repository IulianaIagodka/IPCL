# ADR-004: Web-first control plane with separate context service and MCP integration layer

**Status:** Accepted  
**Date:** 2026-09-25

## Context

The product is not intended to replace ChatGPT, Claude, Cursor, Codex, Gemini, or other AI clients.

Its core responsibility is to:

- store portable user and project context
- manage memory and permissions
- retrieve relevant context
- expose that context safely to external AI tools

Users need a place to configure and inspect their context, but their daily AI work should continue inside the tools they already use.

This creates two distinct product surfaces:

1. **Control plane** — where users manage context, projects, integrations and permissions.
2. **Integration layer** — where external AI clients request relevant context during normal use.

## Decision

We will build the product as a **web-first control plane** backed by a separate context service.

External AI tools will integrate primarily through **MCP and API-based interfaces**.

The high-level architecture is:

```text
                Web App
             Control Plane
                  │
                  ↓
        ┌────────────────────┐
        │ Context Service    │
        │                    │
        │ memory             │
        │ retrieval          │
        │ permissions        │
        │ audit              │
        └─────────┬──────────┘
                  │
          ┌───────┴────────┐
          ↓                ↓
        MCP API        Product API
          │
    ┌─────┼─────┐
    ↓     ↓     ↓
 Claude Cursor ChatGPT
        / Codex / others
```

The web application is the **management surface**.

The context service is the **system of record and policy enforcement layer**.

MCP is the primary AI-facing integration surface where supported.

## Web application responsibilities

The web application will support:

- onboarding
- profile setup
- project creation
- memory inspection
- source import
- context editing
- integration setup
- permission management
- activity and audit visibility
- account and privacy controls

The web application should not become a primary AI chat product.

## Context service responsibilities

The context service owns:

- canonical memory
- source metadata
- retrieval
- scope resolution
- authorization
- data classification
- context assembly
- integration policies
- audit events

External clients must not bypass this service to query storage directly.

## Integration layer

External AI clients access context through a narrow interface.

Primary mechanism:

```text
MCP
```

Fallback mechanisms may include:

```text
REST / HTTPS API
manual export
copy-to-clipboard
provider-specific integrations
```

The integration layer must enforce the same authorization and privacy rules regardless of transport.

## Why web-first

A web application is the preferred initial control plane because it:

- works across operating systems
- does not require app-store distribution
- simplifies onboarding and account management
- is suitable for permission-heavy configuration
- allows fast iteration
- keeps the product independent of any single desktop or mobile platform

## Why not mobile-first

The main MVP tasks are:

- managing projects
- reviewing context
- configuring integrations
- inspecting permissions
- auditing what was shared

These are not primarily mobile workflows.

A native mobile app would add distribution and platform complexity without materially improving the initial core experience.

## Why not desktop-first

A desktop application may later improve:

- local context access
- filesystem integration
- background sync
- developer workflows

However, it is not required to validate the core product hypothesis:

> Users want one portable context layer across multiple AI systems.

Desktop-specific capabilities should therefore not block MVP delivery.

## Why not build our own AI chat

The product should complement existing AI tools rather than compete with them.

Building a first-party chat interface would introduce unrelated complexity:

- model routing
- conversation management
- streaming
- attachment UX
- model-specific features
- chat history
- inference costs

without proving the unique value of portable context.

The core product experience should be:

```text
Configure context once
        ↓
Use existing AI tool
        ↓
Relevant context is available there
```

## Service boundary

The web client must not contain core authorization or retrieval logic.

The backend context service is the trusted boundary.

Conceptually:

```text
Web UI
  ↓
Authenticated API
  ↓
Context Service
  ↓
Database / Vector Index / Object Storage
```

MCP clients use the same policy layer:

```text
AI Client
  ↓
MCP
  ↓
Context Service
  ↓
Authorized retrieval
```

This ensures that web and AI integrations cannot diverge in security behavior.

## Data layer

The implementation should support:

- structured relational data
- semantic retrieval
- source storage

The exact vendor or technology is not fixed by this ADR.

The architectural requirement is:

```text
Structured memory
+
Semantic index
+
Source storage
```

These may initially live in a small number of services and be separated later if scale requires it.

## MVP boundaries

The MVP includes:

1. Web control plane.
2. Authenticated backend.
3. Project and memory management.
4. Context retrieval.
5. Integration permissions.
6. MCP server.
7. At least one working external AI integration.
8. Manual export fallback.
9. Audit visibility.

## Explicitly out of scope for MVP

The MVP will not require:

- native iOS app
- native Android app
- native macOS app
- native Windows app
- browser extension
- custom AI chat
- local background daemon
- filesystem indexing
- automatic sync with every AI provider
- direct access to provider-native memory

These may be added only when they solve a validated user problem.

## Deployment principle

The system should be deployable as independently evolvable components:

```text
Web frontend

Context backend

MCP/integration endpoint

Persistent storage
```

This does not require microservices.

The initial implementation may remain a modular monolith as long as the logical boundaries are preserved.

## Key invariant

The web application is not the product's core intelligence.

The **context service is**.

The web app is a control surface over that service.

Likewise, MCP is not a separate source of truth.

It is an access layer over the same context and policy engine.

## Consequences

### Positive

- Fast MVP delivery.
- Cross-platform from day one.
- Clear separation between management and usage.
- Existing AI clients remain the user's primary workspace.
- Security and retrieval logic live in one trusted backend.
- Future desktop, mobile, browser and enterprise clients can reuse the same backend.
- MCP can evolve independently from the web UI.

### Negative

- Some AI products may not support MCP or equivalent integrations.
- Manual fallback may be needed for certain clients.
- The product may initially feel less visible because much of its value appears inside other AI tools.
- Desktop-specific integrations may eventually require additional local components.

## Success criterion

A user should be able to:

```text
Open web app
    ↓
Create or import context
    ↓
Connect an AI tool
    ↓
Return to that AI tool
    ↓
Use relevant context without re-explaining it
```

The web app manages the system.

The AI client is where the value is experienced.

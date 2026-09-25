# ADR-001: Build an independent portable context layer

**Status:** Accepted  
**Date:** 2026-09-25

## Context

Users increasingly work across multiple AI products such as ChatGPT, Claude, Cursor, Codex and Gemini.

Their context is fragmented across these tools:

- personal preferences
- project background
- previous decisions
- terminology
- instructions
- working style
- documents and notes

Users repeatedly have to explain the same information to each AI.

Native memory systems are vendor-specific and generally cannot be reliably read, synchronized or modified by third-party applications.

The product goal is:

> Stop explaining yourself.  
> Your context follows you across AI.

Short form: **One memory. Every AI.**

The product should let users maintain their context once and make the relevant parts available to whichever AI they are using.

## Decision

We will build an independent context layer rather than attempting to synchronize native memory between AI providers.

The system will maintain its own canonical user context.

```
                 Eidothea
              ┌───────────────┐
              │ User profile  │
              │ Preferences   │
              │ Projects      │
              │ Decisions     │
              │ Knowledge     │
              └───────┬───────┘
                      │
              Context retrieval
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
     ChatGPT       Claude         Cursor
        ↓             ↓             ↓
      Codex          Gemini       Other AI
```

AI clients will access this context through supported integration mechanisms, primarily:

- MCP
- API
- copy/export where direct integration is unavailable
- browser/app extensions later if necessary

## Context model

Context will not initially be stored as one giant prompt.

It will be structured into reusable entities.

### Profile

Long-lived information about the user.

Examples: role, expertise, communication preferences, recurring instructions.

### Project

Context belonging to a specific project.

Examples: product description, technology stack, target users, architecture, constraints.

### Decision

Previously agreed decisions that AI should not repeatedly reopen.

Example: Paypace uses monthly and yearly subscriptions.

### Preference

Reusable behavioral instructions.

Example: Avoid explaining basic software engineering concepts unless asked.

### Source

Original material from which context was extracted.

Examples: conversation, document, note, repository README.

## Context retrieval

The system should not send the entire user context to every model call.

For each request it should retrieve only relevant context.

```
User message
     ↓
Intent / topic
     ↓
Context search
     ↓
Relevant context fragments
     ↓
AI model
```

This reduces token usage, irrelevant information, context pollution, and privacy exposure.

## MCP interface

Initial MCP capabilities should be intentionally small.

- `get_profile()`
- `get_project(project_id)`
- `search_context(query)`
- `get_decisions(project_id)`
- `get_preferences()`
- `save_context(content)`
- `save_decision(project_id, decision)`

AI clients can request additional context only when necessary.

## MVP scope

The first version will support:

1. Creating a personal context profile.
2. Creating project contexts.
3. Adding notes and decisions.
4. Importing text or conversations.
5. AI-assisted extraction of reusable context.
6. Semantic context search.
7. MCP access.
8. Manual copy/export fallback.
9. Context preview showing exactly what will be shared.

## Explicitly out of scope for MVP

We will not initially attempt to:

- read ChatGPT native memory
- modify Claude native memory
- synchronize vendor memories
- import full conversation history automatically
- continuously monitor user conversations
- build autonomous agents
- support every AI provider
- store credentials for external AI products

These may be reconsidered later if reliable official APIs become available.

## Privacy principle

The context vault may contain highly sensitive information.

Therefore:

Nothing is shared with an AI provider unless the user explicitly connects or invokes that integration.

Users must be able to see:

What AI is asking for → what context will be sent → where it is going.

Context should be removable at the individual item, project and account level.

## Product principle

The product owns the context, not the conversation.

AI providers remain responsible for generating responses.

This product (**Eidothea**) acts as the portable knowledge layer between the user and their AI tools.

## Consequences

### Positive

- Vendor-independent.
- Technically achievable without privileged access to AI-provider memories.
- Works better as the number of AI products grows.
- Creates a single source of truth for user/project context.
- MCP gives compatible AI clients a natural integration mechanism.
- The architecture can later support teams and organizations.

### Negative

- Experience will differ between AI clients depending on their integration capabilities.
- Some products may initially require copy/export rather than automatic retrieval.
- Context retrieval quality becomes a core technical problem.
- Privacy and security requirements are significantly higher than for a simple prompt manager.

## Success criterion

A user should be able to start using a new AI tool and, within seconds, give it enough relevant context that they do not have to explain their project and preferences again.

The defining product experience is:

> Connect AI → choose context → continue where you left off.

# ADR-005: Product experience and visual design direction

**Status:** Accepted  
**Date:** 2026-09-25

## Context

The product is a portable context layer for AI tools.

Its value depends heavily on trust, clarity and perceived control.

Users may store sensitive personal, work and project information. They must be able to understand:

- what the system remembers
- where that memory came from
- which AI tools can access it
- what is being shared right now
- what can be edited, restricted or removed

A generic AI-SaaS visual language would weaken the product because it suggests novelty and automation rather than reliability and control.

The product should not feel like:

- another chatbot
- a prompt manager
- a knowledge-base app
- a cyberpunk security vault
- an AI toy

It should feel like:

> **A calm control plane for personal AI context.**

---

## Decision

The product will use a **dark-first, restrained, memory-centric visual system** with an emphasis on:

- clarity
- privacy
- hierarchy
- traceability
- controlled motion
- low visual noise

The core experience should communicate:

> **Everything AI knows about me is visible and under my control.**

The product personality is:

```text
Calm
Private
Precise
Powerful
```

---

# Primary product metaphor

The interface is not organized around documents or folders.

The primary object is:

# Memory

A memory is a small reusable unit of context.

Examples:

```text
DECISION

Paypace uses monthly and yearly subscriptions.

Project: Paypace
Source: Pricing discussion
Updated: Sep 24
```

The interface should make memory feel:

- inspectable
- editable
- scoped
- traceable
- alive

without turning the product into a knowledge-management system.

---

# Primary experience

The core user question is:

> **What does my AI know?**

This should shape navigation and content hierarchy.

A primary screen may be centered around:

```text
What your AI knows

Search your context...
```

followed by scopes such as:

```text
ME
WORK
PAYPACE
OTHER PROJECTS
```

Each scope contains structured memories rather than pages or notes.

---

# Dark-first visual direction

The product will launch with a dark-first interface.

Recommended initial palette direction:

```text
Background       #0D0F12
Surface          #14171C
Elevated         #1B1F25
Border           #292E36

Primary text     #F4F5F7
Secondary text   #969DA8

Accent           #A7FFCE
Accent muted     #173D2D

Warning          #F1B86A
Danger           #E77C7C
```

The palette should remain mostly neutral.

Accent color is used intentionally for:

- connected
- allowed
- active
- verified
- successfully shared

It should not be used decoratively across large surfaces.

---

# Visual references

The intended design quality sits conceptually between:

- Linear — precision and hierarchy
- Raycast — modern technical utility
- 1Password — trust and permission clarity
- Arc — restrained personality and motion

These are references for qualities, not templates to copy.

The product should develop its own identity around context flow and memory state.

---

# Typography

Primary UI typography should be neutral and highly legible.

Preferred direction:

```text
Primary:
Inter / Geist / SF Pro

Metadata:
Geist Mono / SF Mono
```

Mono typography may be used for:

```text
DECISION
SOURCE
RESTRICTED
PROJECT
LAST USED
```

This gives the interface a subtle infrastructure/control-plane feel without making it look like a developer console.

---

# Memory card design

The memory object should be visually compact.

Avoid oversized card layouts.

Preferred structure:

```text
DECISION                              09:42

Paypace uses monthly and yearly
subscriptions.

Paypace
Source: Pricing discussion
```

Expanded state may reveal:

```text
Used by
Claude
Cursor

Last accessed
Today 10:43

[ Edit ] [ Archive ] [ Restrict ]
```

The user should be able to understand a memory without opening a full detail page.

---

# Context scopes

Context should be visually grouped by meaningful scope, not file hierarchy.

Examples:

```text
GLOBAL
WORK
PROJECT
CUSTOM PROFILE
```

Within a project:

```text
Product
Decisions
Preferences
Constraints
Open Questions
```

The hierarchy should reflect the semantic model from ADR-002.

---

# Integration design

Integrations should not primarily appear as decorative cards.

The preferred mental model is:

> **Who can see what?**

Therefore permission views should use a matrix-like representation where useful.

Example:

```text
              Global   Work   Paypace

ChatGPT         ●        ○       ●

Claude          ●        ○       ●

Cursor          ○        ○       ●

Gemini          ○        ○       ○
```

This should make access relationships understandable at a glance.

---

# Context flow as signature interaction

The visual system should include a restrained representation of context moving from the vault to an AI client.

Example:

```text
Paypace ─────────→ Claude
```

or:

```text
Claude is using 6 memories
```

This interaction should be subtle and informative.

It may become a signature brand element used across:

- loading states
- integration activity
- product illustrations
- onboarding
- logo motion
- empty states

The motion should imply controlled transfer, not AI magic.

---

# Activity and transparency

When an AI integration accesses context, the interface should make that visible.

Examples:

```text
Claude used 6 memories from Paypace
Today, 10:43
```

or:

```text
Cursor requested:
Project context

Shared:
4 decisions
2 constraints
```

The design should support trust through visibility.

The product should avoid hiding context-sharing behavior behind abstract status messages.

---

# Interaction principles

## 1. Calm over flashy

Motion and effects should be subtle.

Avoid unnecessary visual stimulation.

## 2. Dense but readable

The product contains structured information.

The UI should not overinflate simple data into large cards and excessive whitespace.

## 3. State must be visible

Users should always be able to distinguish:

```text
active
restricted
superseded
connected
disconnected
shared
not shared
```

without reading long explanations.

## 4. Privacy should be legible

Permission and classification state should be visible in the main UI, not hidden in settings.

## 5. Metadata supports trust

Source, scope, last updated and last accessed are important product information.

They should be visually quiet, but easy to inspect.

---

# Product navigation

Recommended primary navigation:

```text
Home
Context
Projects
Integrations
Activity
Settings
```

Alternative naming may evolve, but the structure should preserve:

```text
memory
scope
access
activity
control
```

Navigation should not mimic a document-management application.

---

# Home screen

The home screen should answer:

1. What does the system know?
2. What changed recently?
3. Which integrations are active?
4. Is anything requiring attention?

Example:

```text
Your context

42 memories
3 projects
4 integrations

Recently learned

● Paypace uses monthly + yearly pricing
● MVP does not require a browser extension
● Prefer concise product feedback
```

The dashboard should not become an analytics page.

Its job is orientation and trust.

---

# Brand language

The visual brand should avoid common AI clichés.

Do not use as primary brand motifs:

- glowing AI orb
- magic wand
- sparkle iconography
- robot heads
- brain illustrations
- neural-network constellations
- purple-blue AI gradients
- generic glassmorphism

These patterns make the product feel interchangeable with other AI products.

The design language should instead use:

- controlled lines
- memory states
- scope relationships
- permission boundaries
- context flow

---

# Brand positioning

The design should support messaging such as:

> **Stop explaining yourself.**

> **Your context. Every AI.**

> **One memory. Every AI.**

> **Your context. Under your control.**

The tone should remain restrained and direct.

Avoid language implying that the product secretly knows everything about the user.

---

# Logo direction

The logo should not depict a brain, robot or chat bubble.

Preferred direction:

- a single line
- linked context nodes
- a path moving between boundaries
- a memory-to-AI transfer metaphor
- a compact symbol that can animate

The visual identity should be able to scale from:

```text
favicon
app icon
loading animation
integration activity
marketing illustration
```

without requiring a detailed illustration.

---

# Accessibility

The visual system must preserve:

- sufficient text contrast
- clear focus states
- keyboard usability
- non-color-only status communication
- readable text at standard browser zoom
- motion reduction support

Sensitive and restricted states must not rely solely on color.

---

# MVP design scope

The MVP design system should include:

1. dark-first visual tokens
2. typography system
3. memory row/card
4. project/scope view
5. integrations permission view
6. activity/audit view
7. connect integration flow
8. context-sharing preview
9. state badges
10. restrained context-flow animation

---

# Explicitly out of scope for MVP

The MVP should not prioritize:

- extensive illustration systems
- elaborate 3D graphics
- animated AI avatars
- decorative dashboards
- social-feed mechanics
- heavy customization
- theme marketplace
- playful gamification

These do not help validate the core value proposition.

---

# Design invariant

The interface must make the following relationship understandable:

```text
Memory
  ↓
Scope
  ↓
Permission
  ↓
AI access
```

If the user cannot tell why an AI knows something, the design has failed.

---

# Consequences

## Positive

- Trust becomes part of the product experience.
- The product is visually differentiated from generic AI SaaS.
- The UI matches the underlying architecture of memory, scopes and permissions.
- The design can scale from individual users to team and enterprise use.
- Context activity becomes visible rather than hidden.

## Negative

- Dark-first design may require a light theme later.
- Dense information design requires careful hierarchy.
- Permission visibility can create complexity if overexposed.
- The product must resist adding decorative AI patterns as it grows.
- Motion needs discipline to avoid undermining the calm visual language.

---

# Success criterion

A new user should understand within a few minutes:

- what the system remembers
- which project a memory belongs to
- where the memory came from
- which AI can access it
- when it was last used
- how to change or restrict it

The interface should feel less like:

> an AI app

and more like:

> **the control layer behind all of the user's AI tools.**

# MONOLITH OS Interface Handover

## Purpose

MONOLITH OS is a second-brain operating system designed to reduce cognitive load by capturing, connecting, recalling, prioritising, and acting on information.

This branch introduces the first interface scaffold and the initial Supabase schema.

## Product Mission

Capture everything. Understand everything. Connect everything. Remember everything. Help build anything.

## Seven Core Systems

1. Capture
2. Memory
3. Knowledge
4. Missions
5. Creation
6. Automation
7. Evolution

No feature should enter the build unless it clearly belongs to one of these systems.

## Interface Scope in This Branch

- Command dashboard
- Universal capture box
- Voice capture using the browser Speech Recognition API where supported
- Workspace switcher
- Mission overview
- Focus task list
- Second-brain metrics
- AI department placeholders
- Recent memory stream
- Evolution-loop recommendation panel
- Responsive desktop and mobile layout

## File Map

- `monolith/index.html` — interface structure
- `monolith/styles.css` — responsive visual system
- `monolith/app.js` — navigation, capture simulation, voice input
- `supabase/monolith-schema.sql` — initial second-brain data model and RLS

## Database Entities

- `workspaces`
- `captures`
- `memories`
- `knowledge_nodes`
- `knowledge_edges`
- `missions`
- `tasks`
- `decisions`
- `ai_runs`
- `evolution_events`

## Build Order

### Alpha 1: Interface Shell

- [x] Dashboard hierarchy
- [x] Navigation model
- [x] Universal capture interaction
- [x] Voice capture proof of concept
- [x] Responsive layout
- [ ] Convert scaffold to React/Next.js app shell
- [ ] Add authenticated workspace state
- [ ] Replace sample data with Supabase queries

### Alpha 2: Capture and Memory

- [ ] Persist captures
- [ ] Auto-classify capture type
- [ ] Generate summaries and embeddings
- [ ] Create memory records
- [ ] Add semantic search
- [ ] Add source and context traceability

### Alpha 3: Missions

- [ ] Mission CRUD
- [ ] Task CRUD
- [ ] Priority and blocker states
- [ ] Decision log
- [ ] Daily briefing

### Alpha 4: Knowledge Graph

- [ ] Extract entities
- [ ] Create nodes and edges
- [ ] Visual relationship explorer
- [ ] Timeline and provenance view

### Alpha 5: Automation and Evolution

- [ ] AI department routing
- [ ] Review queue
- [ ] Pattern detection
- [ ] Recommendation approval workflow
- [ ] Audit log

## Product Rules

- Local-first where practical.
- User data must be exportable.
- AI-generated memory must preserve source provenance.
- Important decisions require rationale, not just outcome.
- The system may recommend changes but must not silently rewrite canon.
- Architecture remains frozen until Alpha 1 is demonstrably usable.

## Immediate Next Build

Convert the static interface into a production frontend using Next.js, TypeScript, and Supabase. Keep the current information architecture intact while replacing mock interactions with typed components and real data access.

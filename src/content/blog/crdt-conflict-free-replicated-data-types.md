---
title: "CRDT - Conflict Free Replicated Data Types"
description: "A brief intro to Conflict Free Replicated Data Types"
date: 2025-02-24T09:58:08+07:00
draft: false
tags:
  - dart
  - distributed-systems
---

## Two devices. Independent changes. No server. No conflicts.

I was building an offline-first feature in Flutter — two devices needed to modify the same data independently and sync later without losing anything. Last-write-wins throws data away. Distributed locks need a server. Neither worked.

That's when I found CRDTs — Conflict-free Replicated Data Types. A data structure that can be modified independently on multiple nodes and always merged into a consistent final state, without real-time coordination.

Since I was working in Dart, I used the [CRDT library](https://github.com/cachapa/crdt) by cachapa. It implements the core concepts. The common types:

1. **G-Counter (Grow-only Counter)**: A counter that can only be incremented.
2. **P-Counter (Decrement Counter)**: A counter that can be both incremented and decremented.
3. **G-Set (Grow-only Set)**: A set that only allows elements to be added.
4. **2P-Set (Two-Phase Set)**: A set that allows elements to be added and removed, maintaining two sets (one for additions and one for removals).
5. **OR-Set (Observed Remove Set)**: A set that allows elements to be added and removed, using unique identifiers to track additions and removals.
6. **LWW-Register (Last Write Wins Register)**: A register that stores the last written value, using a timestamp to determine the most recent update.
7. **MV-Register (Multi-Value Register)**: A register that stores all values that have been written, using unique identifiers to track writes.

---

### How It Works

Two main components:

- **HLC (Hybrid Logical Clock)** — combines wall clock time, an incrementing counter, and an optional node ID for uniqueness.
- **The record itself** — a key, a value, and the HLC of its last modification.

**The scenario:** Device A and Device B both start with the same dataset. They each make changes offline. When they sync, CRDT merges both changesets deterministically.

**Initial state (both devices):**

| Key | Value | isDeleted | Last Modified |
| --- | ----- | --------- | ------------- |
| 1   | Alice | false     | HLC: A1       |
| 2   | Bob   | false     | HLC: A2       |

---

**Device A deletes Bob's record (key 2):**

| Key | Value | isDeleted | Last Modified |
| --- | ----- | --------- | ------------- |
| 2   | null  | true      | HLC: A3       |

**Device B updates Alice's name (key 1):**

| Key | Value       | isDeleted | Last Modified |
| --- | ----------- | --------- | ------------- |
| 1   | Alice Smith | false     | HLC: B3       |

---

### Synchronization and Merge

Each device sends only its changeset — the records it modified since the last sync.

The `merge` method processes incoming records:

1. **Validate the changeset** — schema check, valid HLC timestamps.
2. **Compare records for key 1 (Alice):**

Device A has `HLC: A1`. Incoming from Device B: `HLC: B3`. Higher HLC wins — Device A updates Alice to:

| Key | Value       | isDeleted | Last Modified |
| --- | ----------- | --------- | ------------- |
| 1   | Alice Smith | false     | HLC: B3       |

3. **Compare records for key 2 (Bob):**

Device B has `HLC: A2`. Incoming from Device A: `HLC: A3`. Higher HLC wins — Device B applies the delete:

| Key | Value | isDeleted | Last Modified |
| --- | ----- | --------- | ------------- |
| 2   | null  | true      | HLC: A3       |

4. **Both devices now have identical datasets.**

**Final merged state:**

| Key | Value       | isDeleted | Last Modified |
| --- | ----------- | --------- | ------------- |
| 1   | Alice Smith | false     | HLC: B3       |
| 2   | null        | true      | HLC: A3       |

---

### The Rules

1. **Higher HLC wins** — later timestamps overwrite earlier ones.
2. **Soft deletes win when newer** — a `null` + `isDeleted: true` record beats an older live record.
3. **Deterministic everywhere** — every node applies the same logic independently and arrives at the same result.

That's eventual consistency without coordination. The data converges no matter what order the syncs happen in.

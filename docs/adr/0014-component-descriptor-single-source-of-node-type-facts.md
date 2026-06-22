# The Component Descriptor is the single source of per-node-type facts, keyed off the union as a mapped type

Every fact about a node **type** that is neither structural traversal (the Node Walk, ADR-0008) nor
theming (the Catalog, ADR-0004) now lives in one **Component Descriptor** —
`src/editor/descriptors.ts` — declared as a **mapped type over the node union**:

```ts
type Descriptors = { [T in Node['type']]: Descriptor<T> };
```

`Descriptor<T>` carries `{ label, icon, group, emailSafe, create, styleKeys, controls }`, and each row's
`create: () => Extract<Node, { type: T }>` is checked against its own variant. The old smear — the same
type list re-encoded across the Palette, the email rule in `frames.ts`, the a11y `describe()`, the
Inspector control/style gates — collapses to **one row per type**, read by projections/lookups.

**Why a mapped type, not a `Descriptor[]` array or exhaustive switches.** The point is not locality for
its own sake; it is turning _silent_ omissions into _compile_ errors. Keyed off the union as a mapped
type, **a missing row is a build error**, and `create`'s per-`T` return type makes create()/union parity
hold **by construction** — no "every type has an entry" test, no `assertNever`. An array or a
`Record<string, …>` would re-admit the silent gap (a forgotten entry compiles); a pile of exhaustive
`switch`es is what we already had, smeared across ~12 sites.

**Why no `kind` field — container-ness stays union-derived.** A hand-authored `kind: 'container' | 'leaf'`
could drift from `walk.ts`, which is the real owner of structure. The descriptor complements the Node
Walk; it never mirrors it. "Can this hold children?" stays `'children' in node` everywhere (and
`isContainer` keeps that one-liner). The descriptor owns only facts the type system **cannot** express —
labels, icons, the email-safe flag, default-node factories, the control/style spec.

**Why `src/editor/`, not `src/ir/`.** The descriptor carries editor-runtime chrome — the palette `icon`
and the Inspector `controls` — which would pull the design-system into the dependency-free IR substrate,
violating ADR-0007/0008. The IR stays pure; the descriptor sits in the editor with the rest of the chrome.

**Considered and rejected.** Generating the `Node` union _from_ the descriptor (inverts the dependency —
the IR would depend on editor chrome, and the four generators key off the IR union, not the descriptor).
A runtime parity test instead of the mapped type (weaker — it fails late, in CI, not in the editor).
Folding the per-target renderers in too (they belong to a **separate** library registry — see below).

**Consequences.**

- **ADR-0006 reconciled, not changed.** The email-safe rule has one home: `Descriptor.emailSafe`.
  `frames.ts` derives `EMAIL_UNSAFE_TYPES` from it (the hard-coded `['Grid']` is gone) and the Palette
  projects it, so `canInsertComponent`, the locked-tile affordance, and `isEmailFrameClean`'s import
  audit all read the same flag. The `frames.test` drift-guard that asserted Palette-vs-`EMAIL_UNSAFE`
  never diverge is **deleted** — there is nothing left to drift. `isNodeEmailSafe` keeps its Set shape so
  an unknown imported type stays permissive.
- **The Palette is a projection, not a parallel list.** `PALETTE` is built from per-type specs: a bare
  node type projects its descriptor wholesale; a named **variant** (the two Buttons, the Heading-vs-Text
  split, Grid's "(2-col)" label) overrides only `id`/`label`/`icon`/`create`. `group` and `emailSafe` are
  type facts and are never per-variant. Column has a descriptor row but no palette entry — exportable
  without being offered.
- **Adding a Component** = a `Node` union branch (compile-forces `walk.ts` + `leaf-style` already) **+ one
  descriptor row** (compile-forced here) **+ N target renderers**. The 8 previously-silent satellites are
  now one row; `describe()` and the email rule are lookups.
- **RP-9 stays separate (deliberate).** Making a forgotten _per-target renderer_ a build error is its own
  `Record<LeafType, Renderer>` library registry (beside the generators), **not** this descriptor — the
  descriptor is editor-runtime and must not be imported by the export substrate (ADR-0007). RP-2 fixes the
  _facts_; RP-9 fixes _render exhaustiveness_; they compose but do not merge.
- **`controls` / `styleKeys` are declared now, consumed by RP-6/RP-4.** They are a static spec (what a
  type _can_ expose); the Inspector still renders inline today. RP-6's `resolveEditModel` will read them
  and own the _dynamic_ visibility (a `fill` Row hides justify/wrap; an email root limits style keys), and
  RP-4 will grow the Text `styleKeys`. Declaring them here is intentional, so RP-6 reads a finished table.
- **Guarded by RP-11.** The descriptor changes editor wiring but **zero** emitter output — the golden
  snapshots were unchanged through the refactor, confirming the projection reproduces the prior Palette /
  email / a11y behaviour exactly.

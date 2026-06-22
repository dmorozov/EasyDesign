# Frame lifecycle is a pure module; Board↔React-Flow is a reconciling seam; medium is fixed at creation

Frame create/delete/move/rename and the "what may go in this Frame" rule (ADR-0006) live in a single
**pure, in-process module** `src/editor/frames.ts` (no React, no zustand, no React Flow — unit-tested
directly in `frames.test.ts`). The store actions are thin wrappers that call it and add the cross-cutting
concerns: `commit()` (undo/redo + persistence) and Selection reconciliation. React Flow is fed by a
**seam** `src/editor/useFrameNodes.ts` that reconciles its node list against the store's Frames in place.
A Frame's **medium (`web` | `email`) is FIXED at creation**: there is no `setFrameTarget`.

**Why a pure module.** The email-safe rule was being re-stated inline at three call sites (the Palette
tile, the Palette click-insert, the canvas drop) plus the Editor drop guard — four copies of
`target === 'email' && !item.emailSafe` that could drift. Concentrating it as
`canInsertComponent(frame, item)` (with `canInsertInTarget`/`insertHint` siblings) makes ADR-0006 a
single predicate every site consults. `createFrame`/`deleteFrame`/`moveFrame` being pure makes the
lifecycle testable without a DOM or a store, and keeps `nextSlot` placement and the same-position
move short-circuit honest.

**Why the seam (not a frozen seed + remount).** The Board previously seeded React Flow node positions
once from a `useMemo([], …)` snapshot and re-seeded by **remounting** the whole `<Board>` (keyed on a
`docKey` the store bumped on undo/redo/load/reset). That remount also reset the viewport via `fitView`
— so every undo snapped the user's pan/zoom. `useFrameNodes` instead subscribes to a cheap `id:x:y`
signature and reconciles: new Frames are added, removed Frames drop out, and a Frame whose committed
position changed (e.g. undo of a move) adopts it — while an in-flight drag is never clobbered (the
effect doesn't run during a drag because the store position only changes on drop, and it adopts a
position only when it actually differs). React Flow owns the transient drag; the store owns the Frame
set and committed positions; neither fights the other.

**Why the medium is fixed.** The header used to carry a Web/Email toggle (`setFrameTarget`). Its real
job was to _identify_ the Frame and _drive the Component Palette_ — not to _convert_ a design between
media. Conversion is exactly what was unsafe: flipping a web Frame containing a Grid to `email` left an
email-mode Frame holding an email-unsafe node, which MJML export cannot represent (ADR-0006). Since the
medium only needs to be **shown** (a read-only label), not **toggled**, deleting the toggle removes the
invalid-state path for free. The medium is chosen once, at the `+ Web page` / `+ Email` controls.

**Consequences.**

- `docKey` is bumped only by `loadDocument`/`resetDocument` (a fresh document _should_ re-fit), not by
  `undo`/`redo`. `Editor` still renders `<Board key={docKey}>`, so load/reset remount + `fitView`,
  while every in-session edit reconciles through the seam with the viewport preserved.
- The medium drives the Palette purely by **Selection**: the Palette reads the _selected_ Frame's
  target and locks non-email-safe tiles. So selecting a Frame (clicking its title label, or any node
  inside it, or adding one — all set `selectedFrameId`) is what surfaces the right Component set. A
  new, empty Frame auto-selects so its medium shows immediately.
- Frame chrome is deliberately minimal: a thin dashed body, a title label top-left that is **both** the
  React Flow `dragHandle` (`.ed-frame-drag`) and the select affordance, and a read-only medium label
  top-right. The body keeps `ed-board-content` so user Theme tokens resolve there, not on `:root`
  (ADR-0007 golden rule). Nodes are `selectable: false` in React Flow — Selection is owned entirely by
  the store.
  - **Superseded (ADR-0013):** overloading the title as _both_ drag handle and select target shrank the
    grabbable surface to a few characters and made the Frame feel un-movable. The drag handle is now a
    **dedicated grip** (`.ed-frame-grip`) left of the title; the title is **select-only**. The whole
    labels strip moves **onto the thin dashed top border** (fieldset-legend chrome) — no header-over-body
    "window" — with the grip + title on the left and the read-only medium on the right, and the Frame
    gained a **Preview width**; see ADR-0013.
- A Frame-level Selection is `selectedFrameId` set with `selectedPath: null`; the Inspector renders a
  Frame panel (editable title, read-only medium, Delete) for that state. Deleting the selected Frame
  clears the Selection.
- Scope stays the four named targets (ADR-0002): the medium is a closed `web | email` set encoded as
  `TARGET_PROFILES`; there is no general "add a medium" path.
- An **import-time audit** closes the one ADR-0006 gap the interactive guards can't cover (a
  hand-edited or cross-version document): `frames.ts` `isEmailFrameClean(target, root)` — the
  type-level twin of the insert rule, its `EMAIL_UNSAFE_TYPES` kept in sync with the Palette's per-item
  `emailSafe` by a test — is consulted in `isEditorFrame`, so a document with an email-unsafe node in an
  email Frame is rejected on load/import rather than reaching (and throwing in) the MJML generator.
- A newly-added Frame is **panned into view** (zoom preserved) via a transient `pendingFocusFrameId` the
  store sets on `addFrame` and a `ViewportFocus` child inside React Flow that `setCenter`s on it — so
  the cascade-right placement can't strand a new Frame off-screen.

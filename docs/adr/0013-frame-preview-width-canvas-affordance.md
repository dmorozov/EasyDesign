# Frame Preview width is a Board viewing affordance, not a design/export property

A Frame carries a **Preview width** chosen from a small, **medium-aware** preset set (web: Mobile 375 /
Tablet 768 / Desktop 1280, default Desktop; email: a single canonical 600, default 600). It sets only
how wide the Frame is shown on the Board so the user can eyeball a content-flow design narrow vs wide.
The width is persisted and undoable, but it **never enters the IR and never reaches the four
generators** — export output is independent of it. A Frame has **no height**: its vertical size is
always whatever its content needs. The user can also **drag a Frame around the Board** (workspace-level
position, already part of `EditorFrame` as `x`/`y`); Preview width is the sibling viewing property.

**Why preview-only, not a real design property.** Making width semantic — a `max-width` container for the
web targets and `<mj-body width>` for MJML — was rejected:

- It **contradicts the content-flow model** (ADR-0003: structure is a tree, never fixed dimensions) and
  **reopens responsive** (ADR-0009): a single baked-in export width is the first half of a breakpoint
  model we have deliberately deferred, and would invite the assumption that the design adapts when it
  does not.
- It **changes export output** for three web Export Targets + MJML and every golden snapshot, widening
  the blast radius of a feature whose whole point is _previewing_, and putting the clean-export gate at
  risk for no user-visible export gain.
- Email already rides **MJML's default 600px body**, so keeping width preview-only loses nothing today.

**Why not the hybrid** (web preview-only, email a real `mj-body width`). It gives one control two meanings
depending on the Frame's medium — hard to explain in a beginner tool — for a benefit (email ≠ 600) we do
not yet need. The preview can still _default_ email Frames to 600 so what you see mirrors what MJML emits,
without making the control semantic.

**Why presets, not free drag-resize.** Beginner ethos, and because preview-only width makes pixel
precision low-value; presets also sidestep the drag-resize edge cases (min/max clamps, handle styling,
and — since there is no height — an overflow policy). Free drag remains a clean later addition because
width is just a stored number.

**Why width-only, no height.** The Frame body is auto-height content-flow today. A fixed height would
force an overflow decision (clip / scroll / overflow) and leave dead space under short content, for no
benefit to a preview affordance.

**Frame chrome: a labeled dashed box, not a windowed header — and Frame-only.** The editor's Frame chrome
is a single **thin dashed box**. Its identity and controls live **on the top border** (fieldset-legend
style, transparent so the dashed border reads continuously behind them): a **grip** (`.ed-frame-grip`,
the React Flow `dragHandle` — board move) and the **title** (click = select) on the left, the
**read-only medium label** (WEB / EMAIL) on the right.
There is no header bar over a body "window"; content lays out directly inside the box. When the Frame is
the Selection, the border, grip, title, and medium all turn accent. This supersedes the prior chrome (a
title-label strip above a surface-filled body, ADR-0011): it is lighter and unifies the move grip, the
identity, the medium, and — via the Inspector — the Preview-width control into one Frame outline.

The labeled-box treatment is deliberately **Frame-only**. Nested **Layout elements** (Stack / Row /
Column / Grid) keep their existing lightweight affordance — a hover grip (`.ed-node-handle`, a dnd-kit
_tree-reorder_, a different mechanism from the Frame's board move) plus a selection outline — and stay
**nameless** (they carry a type, never a user title). A mockup that showed nested containers wearing the
same labeled box with semantic names ("Nav", "Body") was considered and **rejected for this pass**:
naming Layout elements is a new IR concept (and forces a per-target export question — emit the name as an
HTML comment / `data-*` / ignore it?), and stamping every container with a labeled box adds real visual
density to deep trees. Recorded so the absence reads as a boundary, not an oversight; revisit if container
naming is taken up.

**Consequences.**

- The preset catalog and default width are **medium facts**, so they live in `TARGET_PROFILES`
  (`frames.ts`) beside the email-safe rule — keeping ADR-0011's "one home for what a Frame is" intact. A
  Frame's medium now gates both _what may go in it_ and _what widths it offers_.
- `EditorFrame` gains `width: number`. It is part of the undoable **DocumentBody** (like `x`/`y`), so it
  flows through the `mutate()` funnel (undo/redo + persistence) via a `setFrameWidth` action wrapping a
  pure `resizeFrame` (same-width short-circuit, mirroring `moveFrame`).
- **Back-compat:** documents saved before this change have no `width`. Validation accepts a missing width
  and the load-migration pass backfills it to the medium default, so old saves keep validating and the
  document `version` stays `1` (the field is additive + migrated, not a shape break).
- The **IR, the four generators, and the golden snapshots are untouched** — the export pipeline and its
  clean-output gate are unaffected. Email Frames now _preview_ at the 600px MJML already emits.
- The chrome redesign is **CSS/JSX only** (`FrameNode.tsx` + `editor.css`) — no IR, store, generator, or
  document-shape impact. The one care point: the border legend must sit **within** the React Flow node's
  measured box (reserve top padding rather than overflowing above it) so `fitView`/centering stay
  accurate, and `ViewportFocus`'s height estimate should account for it.
- **Promotable:** because width already lives on the Frame, if responsive is ever taken up (ADR-0009),
  turning Preview width into a real design property is additive, not a data migration.
- New web Frames default to Desktop 1280 (a "Web page" should preview like one); on first load after this
  change, existing Frames re-preview at their medium default — a reversible, one-click viewing change
  that never touches their content or export.

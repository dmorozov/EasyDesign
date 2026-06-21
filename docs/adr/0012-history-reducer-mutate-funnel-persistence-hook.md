# Editor history is a pure reducer behind one `mutate()` funnel; the present is denormalised; persistence is a hook

Undo/redo lives in a **pure module** `src/editor/history.ts` — a reducer over `DocumentBody`
(`{frames, themeOverrides}`) with `record`/`undo`/`redo`, no React/zustand/I-O, unit-tested directly. The
store holds that `history` **plus a denormalised present** (top-level `frames`/`themeOverrides`), and a
single internal **`mutate(coalesceKey, edit)` funnel** is the one path for all 13 document mutations:
each `edit` is a pure `(doc, state) => { body, ui? } | null` (null = no-op), and `mutate` records history
and applies the body + UI in one `set()`. Persistence is a **`usePersistence()` hook** mounted once at the
editor root; `saveStatus` is a transient store field the Toolbar renders.

**Why.** The invariant _"every document change is undoable **and** auto-persisted"_ was enforced
**per action** — each of (now) 13 mutations had to remember to call `commit(...)`, and a 14th that forgot
would silently break undo with nothing to catch it (D3 added three such callers by hand). The undoable
shape also existed twice (`Snapshot` vs `EditorDocument`), hand-synced, and the debounced save was a
`useEffect` parked in the Toolbar — load-bearing logic in a presentation component.

**Why a pure reducer + a funnel (not middleware or a command enum).** Coalescing needs the per-edit
**intent key** (`text:frame:path`), which a zustand middleware can't see without the action passing it
through anyway — so middleware buys nothing over an explicit funnel and adds magic. A Redux-style
reducer + 13-variant command enum is foreign to the zustand idiom the rest of the store uses. The
`mutate()` funnel collapses the ritual to one call: actions return a pure transform and never touch
`set`/history, so a stray `set({frames})` becomes an obvious smell (a strong convention + the regression
net, not a hard compiler guarantee — zustand still exposes `set`). `history.ts` being pure makes
coalescing/limit/undo/redo testable without zustand or React.

**Why denormalised, not derived.** The present could be `history.present` (true single-source) but that
ripples to every `useEditor(s => s.frames)` selector across ~7 components. Keeping `frames`/`themeOverrides`
top-level — with `mutate`/`undo`/`redo`/`loadDocument`/`resetDocument` as their only writers — keeps the
ripple at zero and left the 17 existing regression tests and every component selector untouched.

**Why a hook, not a store-level subscription.** A `.subscribe()` at store-module load would fire a
timer-scheduling side effect on every document change — including inside the store's own unit tests —
polluting the regression net and muddying `history.ts`'s purity. A framework-agnostic `persistence.ts`
with explicit init was the other option, but the autosave is ~14 lines of standard debounce with one
caller — framework-agnostic ceremony for a concern that has no bugs there. The hook keeps the store +
`history.ts` pure and uses React's lifecycle for the inherently-effectful timer.

**Consequences.**

- The pure/UI split the store already implied is now explicit: `history.ts` is pure over `DocumentBody`;
  clearing Selection on undo/redo, the `rightTab='inspector'` thread, and the pan-focus signal are
  **UI side-effects the store owns** and that never enter history.
- Whole-document ops (`loadDocument`/`resetDocument`) and `undo`/`redo` call the reducer directly rather
  than through `mutate`, because they replace/restore the body wholesale and need `docKey`/`state`.
  `removeFrame` stays in `mutate` but reads `state.selectedFrameId` (the `edit`'s 2nd arg) to decide
  whether to clear a Selection on the dead Frame.
- One document shape: `DocumentBody` is shared; `EditorDocument = DocumentBody & {version: 1}`;
  `Snapshot` is deleted. One `parseDocument(raw)` pipeline (validate incl. the ADR-0006 email audit, then
  migrate D2 kebab→dot) is used by both load paths. The persisted format is **unchanged** (`version` stays
  1, lenient normalisation), so existing saves load as-is.
- A regression net (`store.test.ts`, 17 characterization tests) was written **before** the refactor and
  kept green through it — proving behaviour preservation (coalescing, the `{frames, themeOverrides}`
  snapshot, undo-clears-selection, redo-stack-clear, the 100 cap). It now reads the `history.*` shape;
  the assertions are unchanged.
- Not done (deferred): **restore-selection on undo** (selection stays out of history — undo clears it);
  a `version` bump / explicit 1→2 migrations (revisit when the saved shape actually breaks).

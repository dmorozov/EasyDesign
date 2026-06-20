# Structured layout tree (auto-layout), not free-form absolute positioning

The Board presents as an infinite whiteboard, but each Frame's contents are a **structured tree
of Layout elements** (Stack / Row / Column / Grid) holding Components — flow-based, with **no
absolute `{x,y}` positioning** of content.

**Why.** Export must reach MJML (email), which has no absolute positioning at all — only sections
of columns that stack on mobile. Absolute coordinates also produce non-responsive `position:absolute`
output for React/Angular/HTML. A stack/row/column tree maps cleanly to all four targets (flexbox
for web, sections/columns for MJML); pixel coordinates map to none. Every code-exporting builder
surveyed (Webstudio, Builder.io, Puck, Craft.js) uses a structured tree; the free-form tools
(Figma, Sketch) are exactly the ones whose code export is unusable.

The infinite-whiteboard feel is preserved at the **workspace** level (pan/zoom over multiple
Frames), and the drag-drop feel is preserved **inside** a Frame via snap-into-flow insertion — but
the export-bearing model is the tree, not coordinates.

**Consequences.**

- Editor cost: drop-indicator / insertion UX instead of a trivial free canvas.
- This **overrides the free-form positioning tools** (react-rnd / react-moveable) that earlier
  research had suggested: intra-Frame editing is tree drag-drop (dnd-kit), and React Flow's role
  narrows to the infinite workspace that hosts Frames.
- Users give up literal pixel-anywhere placement (arbitrary overlaps, offsets, rotation) in
  exchange for clean, responsive, email-capable export.

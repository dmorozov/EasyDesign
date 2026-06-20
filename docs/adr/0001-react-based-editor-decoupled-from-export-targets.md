# React-based editor, deliberately decoupled from export targets

The EasyDesign editor (Board, palettes, live theming) is built as a React application, using
React DOM components as the on-Board nodes so placed Components read live Design Token values
(CSS variables) and the preview matches exported web output. This keys the editor stack to
React-only libraries (React Flow for the canvas, React Aria for primitives).

We accept this even though one Export Target is Angular and another is email, because **the
editor's framework is independent of the Export Targets**: exports are produced by generators
that walk a framework-neutral design model, not by the editor's runtime. A React editor that
emits clean Angular/HTML/MJML is expected, not a contradiction. Choosing a framework-neutral
or custom canvas was the alternative; it was rejected as far more effort for no export benefit.

Decided with the explicit constraint (from the product owner) that this only holds **so long
as the tool can export a Selection cleanly to all four targets** — export fidelity is the gate
on the whole approach.

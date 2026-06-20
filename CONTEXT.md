# EasyDesign

A visual UI design tool: a beginner-friendly infinite board where non-designers compose
UIs from a themed, finite palette of components, then export a chosen region to React,
Angular, static HTML, or MJML email.

## Language

**Board**:
The infinite canvas where the user composes designs by placing and arranging Components.
_Avoid_: whiteboard, canvas, artboard

**Component**:
A themed UI element from the finite palette (label, button, input, image, …) that can be
placed on the Board. Always renders through the Theme.
_Avoid_: widget, element, control

**Layout element**:
A Component whose role is to structure or group other Components rather than to display
content. The kinds are **Stack**, **Row**, **Column**, and **Grid**; Components are arranged by
the tree they sit in, never by absolute coordinates.
_Avoid_: wrapper, container, frame

**Frame**:
A top-level design unit on the Board whose contents form one layout tree, and the natural unit of
export. Carries a **target medium**: a _web_ Frame exports to React, Angular, or static HTML
interchangeably; an _email_ Frame is restricted to email-safe Components and layout and exports
to MJML.
_Avoid_: artboard, screen, page, canvas

**Theme**:
The single, editable set of Design Tokens that every placed Component references; the one
place a change propagates from.
_Avoid_: skin, style, schema

**Design Token**:
A named, semantic style value (a color, spacing step, radius, or typography setting) defined
once in the Theme and referenced by Components, so editing it re-themes everything at once.
_Avoid_: variable, style prop

**Design Palette**:
The panel that displays the Theme as a live style guide (type scale, color swatches, sample
Components) and is where the user edits Design Tokens.
_Avoid_: design palette used loosely to also mean the Component Palette (see Flagged ambiguities)

**Component Palette**:
The panel listing draggable Components and Layout elements that the user drags onto the Board.
_Avoid_: toolbox, components palette used loosely to also mean the Design Palette

**Selection**:
The user-designated part of the Board chosen for a single export — usually a whole **Frame**,
occasionally a sub-tree within one.
_Avoid_: region, group

**Export Target**:
One of the four output formats a Selection can be exported to: React, Angular, static HTML,
or MJML (email).
_Avoid_: format, renderer

## Relationships

- A **Board** hosts one or more **Frames**; a **Frame**'s contents form a layout tree of **Layout elements** and **Components**, never absolute-positioned
- Every **Component** references the **Theme** through **Design Tokens**
- The **Design Palette** edits the **Theme**; the **Component Palette** supplies draggable **Components** — both show the same Components in different roles
- A **Selection** — usually a whole **Frame** — is exported to exactly one **Export Target** at a time
- A **Frame**'s target medium is fixed when it is created: _web_ (React / Angular / static HTML, interchangeable) or _email_ (email-safe subset → MJML)
- Editing one **Design Token** re-themes every **Component** on every **Board** that references it

## Example dialogue

> **Dev:** "When the user drags a button from the **Component Palette** onto the **Board**, where do its colors come from?"
> **Product:** "From the **Theme** — the button references the brand **Design Token**, it never stores its own color. If you recolor the brand token in the **Design Palette**, every button updates."
> **Dev:** "And on export?"
> **Product:** "They pick a **Selection** and an **Export Target**. For web targets the tokens become CSS variables; for the MJML **Export Target** they're baked into literal values because email can't read variables."

## Flagged ambiguities

- "palette" was used to mean both the Theme editor and the draggable component toolbox —
  resolved: **Design Palette** (edits the Theme) vs **Component Palette** (supplies draggable
  Components). They are distinct panels that happen to display the same Components.
- "schema"/"theme" were used interchangeably for the design system — resolved: the canonical
  term is **Theme**, composed of **Design Tokens**.

# Walking Skeleton

**Purpose.** Kill the project's #1 risk before any editor exists: prove that **one IR → four
faithful exports** (React, Angular, static HTML, MJML) actually works. If MJML _and_ Angular both
come out clean from the same hand-authored IR, the concept is validated and the editor becomes just
a tool for producing IR. No Board, no palette, no DnD, no persistence.

## Sample design (hand-authored IR, email-safe so all four generators run on it)

```
Frame(target: email)
└─ Stack (card: surface bg, radius.lg, padding.lg, gap.md)
   ├─ Image            (banner)
   ├─ Text  h2         ("Welcome aboard")
   ├─ Text  body       ("Your account is ready…")
   └─ Row              (gap.md)            ← exercises Row → two mj-columns
      ├─ Button primary   ("Get started")
      └─ Button secondary ("Learn more")
```

The button **Row** already validates the two-column → `mj-column` mapping that real two-column
emails need. Full two-column **content** layouts (e.g. image-left/text-right) are a confirmed future
requirement to validate when the palette is built — out of scope for the skeleton.

## IR shape

```ts
type Node = {
  type: 'Stack' | 'Row' | 'Column' | 'Text' | 'Button' | 'Image';
  props?: Record<string, unknown>; // text content, src, variant, heading level…
  style?: Record<string, string>; // token refs, e.g. { background: "color.surface" }
  children?: Node[];
};
type Frame = { target: 'web' | 'email'; root: Node };
```

## Theming spine (ADR-0004)

~12 DTCG tokens (brand/surface/text colors, sm/md/lg spacing, one radius, a type scale) compiled by
Style Dictionary **two ways from one source**:

- `theme.css` — `:root` CSS variables for HTML/React/Angular + the live canvas.
- `tokens.literals.json` — fully-resolved hex/px for the MJML generator to inline.

## Generators (pure `IR → string`)

| Target  | Output                                                                               | Skeleton verification bar                                                                                                  |
| ------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| HTML    | semantic HTML + CSS vars + flex                                                      | render in headless Chrome → screenshot (visual ground truth)                                                               |
| React   | JSX referencing same classes/vars                                                    | `renderToStaticMarkup` → diff against HTML output                                                                          |
| Angular | standalone component (`.ts` + inline template)                                       | typecheck against `@angular/core`; template structurally mirrors HTML _(full ng runtime render deferred — documented gap)_ |
| MJML    | `mj-section`/`mj-column`/`mj-text`/`mj-button`/`mj-image` with **resolved literals** | `mjml()` compile → render in headless Chrome → compare to HTML                                                             |

React Aria integration is **out** — the skeleton proves codegen, not the primitive layer.

## Build order (riskiest first)

IR + sample → token spine → **MJML** → HTML → React → Angular → compare all four.
MJML first: it's the tightest envelope, so if the IR can't produce clean email, reshape the IR
_now_, before the other three depend on it.

## Success criterion

All four outputs render a recognizably identical card; HTML and MJML are visually equivalent; React
and Angular compile. Any IR reshaping the MJML mapping forces is written up below.

## How it's built

Foundation scaffolded inline (deps + frozen IR/token contract); the four generators implemented in
parallel via a workflow; rendered output verified in headless Chrome via the chrome-devtools MCP.

## Findings — RESULT: thesis proven ✅

One hand-authored IR exported to all four targets and rendered correctly (verified in headless
Chrome via the chrome-devtools MCP):

| Target      | Outcome                              | How verified                                                                                                                |
| ----------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Static HTML | ✅ renders the card exactly          | browser screenshot                                                                                                          |
| React       | ✅ **pixel-identical to HTML**       | generated `Card.tsx` compiled + `renderToStaticMarkup` → browser screenshot                                                 |
| MJML email  | ✅ visually equivalent (table-based) | `mjml()` compile (`errors: []`) → browser screenshot                                                                        |
| Angular     | ✅ **renders through real Angular**  | generated standalone component JIT-compiled + `@angular/platform-server` SSR → browser screenshot (pixel-identical to HTML) |

- **Theming spine works (ADR-0004):** one DTCG graph → `build/theme.css` (CSS vars, web) **and**
  `build/tokens.literals.json` (resolved hex/px, email), both from one source. No token leaked into
  the email output (`#4f46e5`, `24px` literals only).
- **Generated code is clean and idiomatic** per target (default-export React fn component; modern
  standalone Angular component; semantic HTML; tidy MJML) — validating the hand-written-generators
  bet (ADR-0002).
- **Web DOM parity holds:** HTML/React/Angular emit the same markup; buttons render as
  `<a href="#">` consistently across all three.

### MJML mapping learnings (the headline value of the skeleton)

The email generator surfaced exactly the bounded degradations ADR-0006 predicted — now evidenced:

1. **Nesting flattens.** MJML can't nest `<mj-section>` inside an `<mj-column>`, so the card's
   nested **Row** became its **own sibling section** (one `mj-column` per child). ⇒ _Design
   implication:_ an \*_email Frame is effectively a vertical sequence of sections, each a single
   row of columns._ The email-mode palette/IR should constrain nesting to that shape.
2. **`border-radius` can't apply to the card frame** (`mj-section` has none) → **square corners in
   email**; the radius token is honored only on leaf elements (image, buttons).
3. **`gap` is not a real flex gap** in email — approximated via section/column padding.
4. **Mobile:** the two button columns **stack vertically** on narrow clients (MJML's responsive
   default); side-by-side isn't guaranteed.
5. **data-URI images are blocked** by real clients (Gmail/Outlook) — production email needs a
   **hosted https URL**; the data URI works only for this offline skeleton.

### Angular runtime render — gap CLOSED ✅

The generated standalone component is bootstrapped through real Angular via `@angular/platform-server`
`renderApplication` (JIT-compiling its inline template at runtime, zoneless), and the SSR output
renders **pixel-identical** to the HTML/React targets in the browser (`src/render-angular.ts`, wired
into `npm run build`). Angular 22 API note: the `renderApplication` bootstrap callback now receives a
`BootstrapContext` that must be passed to `bootstrapApplication`. Production notes: this uses JIT for
a toolchain-light proof; a shipped pipeline would AOT-compile via the Angular CLI, and client-side
hydration isn't exercised here (static render only).

### Reproduce

From `skeleton/`: `npm install` then `npm run build` (regenerates tokens + all four outputs, each
self-checking) and `npm run typecheck` (clean). Outputs land in `skeleton/out/<target>/`.

### What this tells the real build to do next

- The IR shape is validated. Let the **email mapping inform the IR**: carry enough structure for the
  MJML mapper to flatten deterministically, and have **email-mode** restrict nesting to
  "sections of column-rows" (ADR-0006).
- Then: wrap the IR node types over **React Aria** components; build the canvas/editor that _produces_
  this IR; add the email-mode restriction.

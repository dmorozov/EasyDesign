# Own intermediate representation (IR); Mitosis rejected as the export engine

Export to React, Angular, static HTML, and MJML is EasyDesign's flagship feature, gated on
clean output to **all four**. The input is a finite, known palette of themed Components, not
arbitrary user code.

**Decision.** The export engine's single source of truth is our own small JSON IR — a tree of
typed nodes carrying layout, Design Token bindings, props, and children. Each Export Target has
a hand-written generator that walks the IR. Export scope is fixed to **exactly the four named
targets** (no Vue/Svelte/Solid/etc.).

We rejected adopting Mitosis (its JSON IR + generators) as the engine: it has **no MJML target**,
its `--to=html` output is a JS-runtime fragment that renders blank statically (verified in headless
Chrome), and its Angular output is buggy/non-idiomatic and mid-rebuild. It therefore cannot reach
our gate, would still require hand-written HTML and MJML generators, and would couple the flagship
to a single-vendor 0.x dependency. Because our input is a finite palette, an own IR is _simpler_
than Mitosis's general-purpose one and yields cleaner, beginner-readable output.

**Consequences.** We own and maintain four generators — a real, ongoing cost (Angular idioms churn
fastest). Mitosis is retained only as a possible future optimization for the React generator alone;
revisit only if maintaining that one generator proves burdensome. Adding it later is cheap;
un-coupling after adoption would not be.

# Row is content-flow by default (`fit`); equal columns are opt-in (`fill`)

A **Row** lays its children out left-to-right, each sized to its own content (`distribute: 'fit'`, the
default). Equal-width columns — every child grows to fill the Row — are available as an explicit
`distribute: 'fill'` (implemented as a `flex:1` wrapper per child). The three flow primitives now have
distinct, learnable identities: **Stack / Column = vertical flow**, **Row = horizontal flow**, **Grid =
equal tracks**.

**Why.** Row originally wrapped _every_ child in `flex:1` unconditionally — i.e. it was always equal
columns. That had two problems. (1) It duplicated **Grid**: "equal columns" is exactly what Grid means,
so a flex Row was a worse Grid. (2) It made the layout controls meaningless on the one container where
they matter most: with `flex:1` children there is no free space, so `justify-content` (start / center /
between / around) and `flex-wrap` are dead — a Row is where a user most wants "push these apart" or
"center this group". Defaulting Row to content-sized children makes justify/align/wrap actually do
something, and leaves equal-columns to Grid (or to explicit `fill`).

**Consequences.**

- Existing Rows render **content-sized** by default instead of equal-width. This deliberately changed
  the web generators' output (the per-child `flex:1` wrappers are gone unless `fill` is set) — an
  intentional semantic improvement, not a regression. MJML is unaffected: it maps a Row to its own
  `mj-column`s, never `flex:1` (ADR-0006).
- The Inspector hides **Justify** and **Wrap** for a `fill` Row, since they are no-ops there; **Align**
  (cross-axis) stays, as it still applies.
- The change cost one line: `shapeOf` derives `wrapChildren` from `distribute` instead of hardcoding
  `true` for Row. Every renderer already keys off `shape.wrapChildren` (ADR-0008), so no adapter
  changed — the payoff of the Node Walk seam.
- This was a cheap, safe change _now_ because there are no saved user designs yet; once there are,
  flipping a layout default like this becomes a breaking migration. Pair future such decisions with the
  responsive work (ADR-0009).

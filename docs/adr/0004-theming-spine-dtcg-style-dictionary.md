# Theming spine: DTCG tokens compiled by Style Dictionary, dual-output for web vs email

The Theme is stored once as **W3C DTCG design tokens** (pinned to the 2025.10 spec) with semantic
aliases (e.g. `button.bg → color.brand.500`), and compiled by **Style Dictionary** into two
distinct outputs **from the same source**:

- **CSS custom properties** (`var(--token)`) for the web targets (React / Angular / static HTML)
  and the live canvas — so editing one token re-themes every Component instantly.
- **Fully-resolved literal values** (hex / px) for **MJML**, because email clients don't support
  CSS variables.

**This dual compilation is the load-bearing, non-obvious part** — it's what lets a single edit
re-theme everything _and_ keeps email correct. Do **not** "simplify" the email path to also use
variables; it will silently produce broken emails. Style Dictionary v5 footgun: custom email
formats must read `token.$value`, not `token.value`.

Alternative considered: **Terrazzo** (MIT, DTCG-native) — rejected for now as less mature;
revisit if tighter DTCG conformance is ever needed.

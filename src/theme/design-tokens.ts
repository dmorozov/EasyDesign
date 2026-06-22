// The Design-Token Model (D2). A queryable catalog over the build-generated token graph
// (src/theme/generated/tokens.catalog.json, emitted by Style Dictionary — ADR-0004). Pure,
// in-process: imports only the generated catalog, no design-system, no React.
//
// Keying: the dot-path `ref` ('color.onBrand') is the ONE canonical identity; kebab survives only as
// the SD-derived `cssVarName` ('--color-on-brand'), never a second key — so the hand-rolled
// `.replace(/\./g,'-')` (and its camelCase bug) is gone. Scope-blind: resolveVar emits a `var(--…)`
// reference; the .ed-board-content/:root selector is the caller's concern (the Model never touches
// chrome :root tokens — ADR-0007 — because it only ever reads the user token graph).
import rawCatalog from './generated/tokens.catalog.json';

// The fine-grained token categories (RP-4 split the coarse `font` bucket so a "pick weight" picker
// sources only weights). Mirrors `TokenCategory` in token-category.d.mts — the catalog is built from it.
export type Category =
  | 'color'
  | 'space'
  | 'radius'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing';

/** A resolved Design Token that describes itself. `ref` (dot) is the canonical key. */
export interface Token {
  readonly ref: string; // 'color.onBrand' — the IR dot-path, the canonical id
  readonly category: Category; // from the DTCG $type
  readonly cssVarName: string; // '--color-on-brand' — SD-derived, camelCase-correct
  readonly literal: string; // '#ffffff' — resolved hex/px (for email + swatches)
}

/** Every token-bound style key, each with the Category its ref must reference (RP-4). This is the
 *  key→category fact ONLY — WHICH keys a given node type exposes is the descriptor's `styleKeys`
 *  (RP-2), and the Inspector composes the two. Text's `fontSize`/`fontWeight` are free-form bindings
 *  (CONTEXT.md: pick from the Type scale, never a raw value). */
export type StyleKey =
  | 'background'
  | 'padding'
  | 'borderRadius'
  | 'gap'
  | 'fontSize'
  | 'fontWeight';
export const STYLE_KEY_CATEGORY: Record<StyleKey, Category> = {
  background: 'color',
  padding: 'space',
  borderRadius: 'radius',
  gap: 'space',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
};

/** Presentation metadata per category, for the Design Palette (RP-4, landed with RP-6). A `Record` over
 *  the `Category` union → a new category is a COMPILE error here, so ThemePanel can auto-discover the
 *  category set from the Catalog yet present it in a deliberate order with a friendly label (no
 *  hard-coded `byCategory('color')`). `order` sorts the sections; lower is higher in the rail. */
export const CATEGORY_META: Record<Category, { label: string; order: number }> = {
  color: { label: 'Brand colors', order: 0 },
  fontSize: { label: 'Type scale', order: 1 },
  fontWeight: { label: 'Font weights', order: 2 },
  lineHeight: { label: 'Line heights', order: 3 },
  letterSpacing: { label: 'Letter spacing', order: 4 },
  fontFamily: { label: 'Font family', order: 5 },
  space: { label: 'Spacing', order: 6 },
  radius: { label: 'Corner radius', order: 7 },
};

export interface Catalog {
  /** Resolve a ref to its full entry, or undefined for an unknown/misspelled ref — this IS isValidRef. */
  get(ref: string): Token | undefined;
  /** Every Token in a category, catalog order — powers ThemePanel swatches + Inspector pickers. */
  byCategory(category: Category): readonly Token[];
  /** Dot-ref -> web `var(--…)`. Shared by the generators + component layer. Throws on an unknown ref
   *  (fail loud — a broken var() can never reach an Export Target). */
  resolveVar(ref: string): string;
  /** Dot-ref -> resolved literal ('space.md' -> '16px'). Throws on an unknown ref. */
  resolveLiteral(ref: string): string;
  /** An override-aware literal resolver for MJML export: `(ref) => override ?? base literal`.
   *  Overrides are dot-keyed (post keying-collapse). Replaces the old literalsWithOverrides. */
  withOverrides(overrides: Readonly<Record<string, string>>): (ref: string) => string;
  /** 'color-on-brand' -> 'color.onBrand'. Only for the one-shot legacy-save migration shim. */
  fromKebab(kebab: string): string | undefined;
}

function unknownRef(ref: string): never {
  throw new Error(`Unknown token ref "${ref}"`);
}

export function createCatalog(entries: readonly Token[]): Catalog {
  const byRef = new Map(entries.map((t) => [t.ref, t]));
  const byKebab = new Map(entries.map((t) => [t.cssVarName.slice(2), t.ref])); // strip the leading '--'
  const buckets = new Map<Category, Token[]>();
  for (const t of entries) {
    const list = buckets.get(t.category);
    if (list) list.push(t);
    else buckets.set(t.category, [t]);
  }
  return {
    get: (ref) => byRef.get(ref),
    byCategory: (category) => buckets.get(category) ?? [],
    resolveVar: (ref) => `var(${(byRef.get(ref) ?? unknownRef(ref)).cssVarName})`,
    resolveLiteral: (ref) => (byRef.get(ref) ?? unknownRef(ref)).literal,
    withOverrides: (overrides) => (ref) =>
      overrides[ref] ?? (byRef.get(ref) ?? unknownRef(ref)).literal,
    fromKebab: (kebab) => byKebab.get(kebab),
  };
}

/** The singleton, bound to the generated catalog — what every caller imports. */
export const catalog: Catalog = createCatalog(rawCatalog as readonly Token[]);

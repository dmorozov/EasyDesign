// Maps a DTCG `$type` + token path to a fine-grained Design-Token category. Shared by the Style
// Dictionary catalog format (build) and the app's tests, so the rule is stated and unit-tested ONCE
// rather than buried in the build config. Pure; typed by token-category.d.mts.
//
// RP-4 split the coarse `font` bucket by path so a "pick weight" picker sources only weights, and so
// RP-3's codegen can derive FontSize/FontWeight step unions per category. Composite `typography`
// tokens (the named Text styles) are NOT catalog entries — the catalog format filters them out before
// calling this, so a `typography` $type never reaches here.
export function categoryOf(type, path) {
  if (type === 'color') return 'color';
  if (type === 'fontFamily') return 'fontFamily';
  if (type === 'fontWeight') return 'fontWeight';
  if (type === 'dimension') {
    const group = path[0];
    if (group === 'space') return 'space';
    if (group === 'radius') return 'radius';
    if (group === 'font') {
      if (path[1] === 'size') return 'fontSize';
      if (path[1] === 'letterSpacing') return 'letterSpacing';
    }
    throw new Error(`Uncategorised dimension token at "${path.join('.')}"`);
  }
  if (type === 'number') {
    if (path[0] === 'font' && path[1] === 'lineHeight') return 'lineHeight';
    throw new Error(`Uncategorised number token at "${path.join('.')}"`);
  }
  throw new Error(`Unknown token $type "${type}" at "${path.join('.')}"`);
}

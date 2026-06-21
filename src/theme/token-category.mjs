// Maps a DTCG `$type` + token path to a Design-Token category (color | space | radius | font).
// Shared by the Style Dictionary catalog format (build) and the app's tests, so the rule is stated
// and unit-tested ONCE rather than buried in the build config. Pure; typed by token-category.d.ts.
export function categoryOf(type, path) {
  if (type === 'color') return 'color';
  if (type === 'fontFamily' || type === 'number') return 'font';
  if (type === 'dimension') {
    const group = path[0];
    if (group === 'space') return 'space';
    if (group === 'radius') return 'radius';
    return 'font'; // font.h2 / font.body are dimensions under the `font` group
  }
  throw new Error(`Unknown token $type "${type}" at "${path.join('.')}"`);
}

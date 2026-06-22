export type TokenCategory =
  | 'color'
  | 'space'
  | 'radius'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing';

/** Maps a DTCG `$type` + token path to a Design-Token category. Throws on an unknown/uncategorised
 *  token. Composite `typography` tokens are filtered out upstream and never reach this. */
export function categoryOf(type: string, path: readonly string[]): TokenCategory;

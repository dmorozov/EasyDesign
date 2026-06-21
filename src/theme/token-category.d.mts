export type TokenCategory = 'color' | 'space' | 'radius' | 'font';

/** Maps a DTCG `$type` + token path to a Design-Token category. Throws on an unknown `$type`. */
export function categoryOf(type: string, path: readonly string[]): TokenCategory;

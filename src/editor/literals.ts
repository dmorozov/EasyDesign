import { type TokenLiterals } from '../ir/types';
import rawLiterals from '../theme/generated/tokens.literals.json';

// Base resolved token literals (run `npm run tokens` to regenerate the JSON).
export const baseLiterals: TokenLiterals = rawLiterals;

/** Merge live theme overrides (kebab-keyed) over the base literals for MJML export. */
export function literalsWithOverrides(overrides: Record<string, string>): TokenLiterals {
  return { ...baseLiterals, ...overrides };
}

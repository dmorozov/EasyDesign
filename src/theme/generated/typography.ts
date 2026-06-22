// AUTO-GENERATED from the token graph by Style Dictionary — do not edit by hand.
// The named Text styles (DTCG composite `text.*`) + the primitive Type-scale refs they bind to (RP-3).

export type TextStyle = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
export type FontSizeRef = 'font.size.sm' | 'font.size.base' | 'font.size.lg' | 'font.size.xl' | 'font.size.2xl' | 'font.size.3xl';
export type FontWeightRef = 'font.weight.regular' | 'font.weight.medium' | 'font.weight.semibold' | 'font.weight.bold';

export interface TextStyleBinding {
  readonly fontSize: FontSizeRef;
  readonly fontWeight: FontWeightRef;
  readonly lineHeight: string;
}

/** Each Text style -> the primitive refs it resolves to (web `var()` / email literal). */
export const TEXT_STYLE_BINDING: Record<TextStyle, TextStyleBinding> = {
  h1: { fontSize: 'font.size.3xl', fontWeight: 'font.weight.bold', lineHeight: 'font.lineHeight.tight' },
  h2: { fontSize: 'font.size.2xl', fontWeight: 'font.weight.bold', lineHeight: 'font.lineHeight.tight' },
  h3: { fontSize: 'font.size.xl', fontWeight: 'font.weight.semibold', lineHeight: 'font.lineHeight.tight' },
  body: { fontSize: 'font.size.base', fontWeight: 'font.weight.regular', lineHeight: 'font.lineHeight.normal' },
  caption: { fontSize: 'font.size.sm', fontWeight: 'font.weight.regular', lineHeight: 'font.lineHeight.normal' },
  label: { fontSize: 'font.size.sm', fontWeight: 'font.weight.medium', lineHeight: 'font.lineHeight.normal' },
};

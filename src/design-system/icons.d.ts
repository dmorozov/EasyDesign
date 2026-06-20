import * as React from 'react';

/** Props accepted by every icon and by the shared `Svg` wrapper. */
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /** Square size in px (sets both width and height). Default 18. */
  size?: number;
  /** When set, the glyph is filled with this color and the stroke is removed
   *  (otherwise it is a 2px `currentColor` outline). */
  fill?: string;
}

/** The set of available icon names (Lucide-style, 2px rounded stroke). */
export type IconName =
  | 'diamond' | 'undo' | 'redo' | 'search' | 'stack' | 'row' | 'column' | 'grid'
  | 'heading' | 'text' | 'button' | 'image' | 'code' | 'layers' | 'settings' | 'help'
  | 'folder' | 'puzzle' | 'copy' | 'download' | 'upload' | 'plus' | 'trash' | 'check'
  | 'hand' | 'cursor' | 'zoomIn' | 'zoomOut' | 'fit' | 'play' | 'web' | 'mail'
  | 'alignL' | 'alignC' | 'alignR' | 'alignJ' | 'dots' | 'sliders' | 'palette'
  | 'react' | 'share' | 'sun' | 'moon';

/** Inline icon set. Each entry is a component: `<Icon.undo size={18} />`. */
export declare const Icon: Record<IconName, (props: IconProps) => React.JSX.Element>;

/** Shared SVG wrapper (24px viewBox, currentColor stroke). */
export declare function Svg(props: IconProps & { children?: React.ReactNode }): React.JSX.Element;

// EasyDesign IR (ADR-0002, ADR-0003).
// A Frame's contents are a STRUCTURED TREE of nodes — never absolute {x,y}.
// `style` values are token references in dot notation (e.g. "color.surface"),
// resolved to var(--color-surface) for web and to literals for email.

export type TokenRef = string; // dot path into the token graph, e.g. "space.md"
export type StyleMap = Record<string, TokenRef>;

// Friendly, target-agnostic layout keywords (mapped to CSS per Export Target —
// 'start' -> flex-start, etc.). Plain language in the IR; CSS jargon stays in the
// generators / component layer.
export type Justify = 'start' | 'center' | 'end' | 'space-between' | 'space-around';
export type Align = 'start' | 'center' | 'end' | 'stretch';
export type Wrap = 'nowrap' | 'wrap';

/** Optional layout controls shared by the flow containers (Stack/Row/Column). */
export interface FlowProps {
  justify?: Justify;
  align?: Align;
  wrap?: Wrap;
}

// How a Row distributes children along the main axis. 'fit' (default) = each child
// sizes to its content, so justify/wrap are meaningful; 'fill' = every child grows
// equally (flex:1) into equal columns, so justify has no free space to act on.
export type Distribute = 'fit' | 'fill';

/** Row also chooses how to distribute its children; Stack/Column always fit. */
export interface RowProps extends FlowProps {
  distribute?: Distribute;
}

export type Node =
  | { type: 'Stack'; props?: FlowProps; style?: StyleMap; children: Node[] }
  | { type: 'Row'; props?: RowProps; style?: StyleMap; children: Node[] }
  | { type: 'Column'; props?: FlowProps; style?: StyleMap; children: Node[] }
  | {
      type: 'Grid';
      props: { columns: number; justify?: Justify; align?: Align };
      style?: StyleMap;
      children: Node[];
    }
  | { type: 'Text'; props: { content: string; variant: 'h2' | 'body' }; style?: StyleMap }
  | {
      type: 'Button';
      props: { content: string; variant: 'primary' | 'secondary' };
      style?: StyleMap;
    }
  | { type: 'Image'; props: { src: string; alt: string; width?: number }; style?: StyleMap };

export interface Frame {
  target: 'web' | 'email';
  root: Node;
}

// Fully-resolved token values (hex/px), keyed by kebab name (e.g. "color-surface").
// Produced by Style Dictionary for the email generator (ADR-0004).
export type TokenLiterals = Record<string, string | number>;

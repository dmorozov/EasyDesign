// EasyDesign IR (ADR-0002, ADR-0003).
// A Frame's contents are a STRUCTURED TREE of nodes — never absolute {x,y}.
// `style` values are token references in dot notation (e.g. "color.surface"),
// resolved to var(--color-surface) for web and to literals for email.

export type TokenRef = string; // dot path into the token graph, e.g. "space.md"
export type StyleMap = Record<string, TokenRef>;

export type Node =
  | { type: 'Stack'; style?: StyleMap; children: Node[] }
  | { type: 'Row'; style?: StyleMap; children: Node[] }
  | { type: 'Column'; style?: StyleMap; children: Node[] }
  | { type: 'Grid'; props: { columns: number }; style?: StyleMap; children: Node[] }
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

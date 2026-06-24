import { Fragment, type ReactElement } from 'react';

import { type Frame, type Node } from '../ir/types';
import { type Emitter, walkNode } from '../ir/walk';

import { AppShell } from './AppShell';
import { Button } from './Button';
import { layoutElement } from './layoutElement';
import { Image, Text } from './primitives';
import { Radio, RadioGroup } from './RadioGroup';

/**
 * The canvas runtime — render IR as live React-Aria elements (ADR-0001/0005). It
 * walks the shared Node Walk (src/ir/walk): α (structure + layout properties) comes
 * from the walk, β (styling) is delegated to the component layer. No editing chrome
 * and no node path, so the context type is `void`.
 *
 * Exports stay separate: the generators emit framework-native code, while this tree
 * powers the in-app preview (React Aria is the editor runtime, not the export
 * substrate).
 */
const canvasEmitter: Emitter<ReactElement, void> = {
  container(node, shape, children) {
    const body =
      shape.kind === 'flow' && shape.wrapChildren
        ? children.map((c, i) => (
            <div key={i} style={{ flex: 1 }}>
              {c}
            </div>
          ))
        : children.map((c, i) => <Fragment key={i}>{c}</Fragment>);
    return layoutElement(node, body);
  },
  component: {
    RadioGroup: (node, children) => (
      <RadioGroup label={node.props.label} style={node.style}>
        {children.map((c, i) => (
          <Fragment key={i}>{c}</Fragment>
        ))}
      </RadioGroup>
    ),
    AppShell: (node, children) => (
      <AppShell
        areas={node.children.map((c) => c.props.area)}
        style={node.style}
        cells={node.children.map((c, i) => ({ area: c.props.area, content: children[i] }))}
      />
    ),
  },
  leaf: {
    Text: (node) => (
      <Text variant={node.props.variant} style={node.style}>
        {node.props.content}
      </Text>
    ),
    Button: (node) => <Button variant={node.props.variant}>{node.props.content}</Button>,
    Image: (node) => <Image src={node.props.src} alt={node.props.alt} width={node.props.width} />,
    Radio: (node) => <Radio value={node.props.value}>{node.props.label}</Radio>,
  },
  descend() {
    /* void context: the canvas threads no per-node state */
  },
};

/** Renders one IR node as live React elements using the themed component layer. */
export function CanvasNode({ node }: { node: Node }): ReactElement {
  return walkNode<ReactElement, void>(node, undefined, canvasEmitter);
}

/** Renders a whole Frame's tree. */
export function CanvasFrame({ frame }: { frame: Frame }): ReactElement {
  return <CanvasNode node={frame.root} />;
}

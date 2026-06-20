import { type ReactElement } from 'react';

import { type Frame, type Node } from '../ir/types';

import { Button } from './Button';
import { Column, Grid, Row, Stack } from './Layout';
import { Image, Text } from './primitives';

/**
 * Renders one IR node as live React elements using the themed component layer.
 * This is the canvas runtime — what the editor shows on the Board (ADR-0001).
 * Exports stay separate: the generators emit framework-native code, while this
 * tree powers the in-app preview (so React Aria is the editor runtime, not the
 * export substrate).
 */
export function CanvasNode({ node }: { node: Node }): ReactElement {
  switch (node.type) {
    case 'Stack':
      return (
        <Stack style={node.style}>
          {node.children.map((child, i) => (
            <CanvasNode key={i} node={child} />
          ))}
        </Stack>
      );
    case 'Column':
      return (
        <Column style={node.style}>
          {node.children.map((child, i) => (
            <CanvasNode key={i} node={child} />
          ))}
        </Column>
      );
    case 'Row':
      return (
        <Row style={node.style}>
          {node.children.map((child, i) => (
            <div key={i} style={{ flex: 1 }}>
              <CanvasNode node={child} />
            </div>
          ))}
        </Row>
      );
    case 'Grid':
      return (
        <Grid columns={node.props.columns} style={node.style}>
          {node.children.map((child, i) => (
            <CanvasNode key={i} node={child} />
          ))}
        </Grid>
      );
    case 'Text':
      return <Text variant={node.props.variant}>{node.props.content}</Text>;
    case 'Button':
      return <Button variant={node.props.variant}>{node.props.content}</Button>;
    case 'Image':
      return <Image src={node.props.src} alt={node.props.alt} width={node.props.width} />;
  }
}

/** Renders a whole Frame's tree. */
export function CanvasFrame({ frame }: { frame: Frame }): ReactElement {
  return <CanvasNode node={frame.root} />;
}

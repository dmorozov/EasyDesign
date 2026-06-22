import { type ReactElement, type ReactNode } from 'react';

import { type LayoutContainerNode } from '../ir/walk';

import { Column, Grid, Row, Stack } from './Layout';

/**
 * Maps a LAYOUT container Node to its React-Aria layout component, threading the layout
 * properties (justify/align/wrap, Grid columns). The single IR -> component structural
 * mapping (β's React home, ADR-0005), shared by the canvas renderer and the editor — so
 * the two React emitters never restate it. Component containers (RadioGroup) render via
 * their own component layer, not here (ADR-0016).
 */
export function layoutElement(node: LayoutContainerNode, children: ReactNode): ReactElement {
  switch (node.type) {
    case 'Stack':
      return (
        <Stack
          style={node.style}
          justify={node.props?.justify}
          align={node.props?.align}
          wrap={node.props?.wrap}
        >
          {children}
        </Stack>
      );
    case 'Column':
      return (
        <Column
          style={node.style}
          justify={node.props?.justify}
          align={node.props?.align}
          wrap={node.props?.wrap}
        >
          {children}
        </Column>
      );
    case 'Row':
      return (
        <Row
          style={node.style}
          justify={node.props?.justify}
          align={node.props?.align}
          wrap={node.props?.wrap}
        >
          {children}
        </Row>
      );
    case 'Grid':
      return (
        <Grid
          columns={node.props.columns}
          style={node.style}
          justify={node.props.justify}
          align={node.props.align}
        >
          {children}
        </Grid>
      );
  }
}

// The editor's node tree, built on the shared Node Walk (src/ir/walk) — the seam's
// hardest adapter. Per-NODE chrome (drop target + drag handle + selection + the
// node's OWN before/after drop lines) is applied via the path context; Row's flex:1
// comes from shape.wrapChildren; the empty-hint is just children.length === 0; β is
// delegated to the component layer (ADR-0005). design-system (chrome) imports are
// allowed here — but the walk + leaf-style never touch it (ADR-0007).
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { type CSSProperties, Fragment, type ReactElement, type ReactNode } from 'react';

import { AppShell } from '../components/AppShell';
import { Button } from '../components/Button';
import { DataTable, TableRow } from '../components/DataTable';
import { layoutElement } from '../components/layoutElement';
import {
  AppBar,
  Breadcrumb,
  MenuBar,
  NavLink,
  Pagination,
  SideNav,
  TopNav,
} from '../components/Nav';
import { Divider, Image, Spacer, Text } from '../components/primitives';
import { Radio, RadioGroup } from '../components/RadioGroup';
import { Step, Stepper } from '../components/Stepper';
import { ToolBar, ToolButton } from '../components/ToolBar';
import { Icon } from '../design-system';
import { type Node } from '../ir/types';
import { type Emitter, walkNode } from '../ir/walk';

import { type NodePath, samePath } from './paths';
import { useEditor } from './store';
import { useCanvasA11y } from './useCanvasA11y';

// Selection + drop indicators use CHROME tokens (NOT the user's --color-brand), so they stay
// visible and on-brand for the editor regardless of what the user themes their design to.
const selectedOutline: CSSProperties = { outline: '1px dashed var(--selection)', outlineOffset: 1 };
const insideOutline: CSSProperties = { outline: '2px dashed var(--accent)', outlineOffset: 1 };
// A drop the email rule forbids (RP-5): the same placement, shown disallowed (danger, not accent).
const blockedOutline: CSSProperties = { outline: '2px dashed var(--danger)', outlineOffset: 1 };

function DragHandle({ frameId, path }: { frameId: string; path: NodePath }): ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `move:${frameId}:${path.join('.')}`,
    data: { kind: 'move', frameId, path },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className="ed-node-handle"
      aria-label="Move node"
      onClick={(e) => {
        e.stopPropagation();
      }}
      style={isDragging ? { opacity: 1 } : undefined}
      {...listeners}
      {...attributes}
    >
      <Icon.dots size={12} />
    </button>
  );
}

// An insertion-point ("gap") droppable: a WIDE overlay hit-strip at a sibling boundary, so dropping a
// node BETWEEN/UNDER siblings catches across the whole gap instead of a node's 25%-tall edge sliver
// (the "works but only after several tries" reorder bug). It anchors to an existing child + a side
// (`before` the child, or `after` the last child = append), so the drop resolves through the SAME
// node-target path and reuses that anchor's before/after indicator line — this element shows nothing
// itself. `pointer-events: none`: dnd-kit detects droppables by measured rect, not DOM events, so the
// strip never blocks the selection click beneath it and adds NO layout (the canvas still mirrors the IR).
function GapDrop({
  frameId,
  anchorPath,
  mode,
  placement,
}: {
  frameId: string;
  anchorPath: NodePath;
  mode: 'before' | 'after';
  placement: 'before' | 'append';
}): ReactElement {
  const { setNodeRef } = useDroppable({
    id: `gap:${frameId}:${anchorPath.join('.')}:${mode}`,
    data: { kind: 'gap', frameId, anchorPath, mode },
  });
  return <div ref={setNodeRef} className={`ed-gap ed-gap-${placement}`} aria-hidden="true" />;
}

// Per-node editor chrome — the "decorate each node" wrapper, keyed on its path. A
// child's own before/after drop lines live in the child's wrapper (keyed on the
// child path), so the parent never interleaves anything.
function EditableShell({
  frameId,
  path,
  node,
  children,
}: {
  frameId: string;
  path: NodePath;
  node: Node;
  children: ReactNode;
}): ReactElement {
  const selected = useEditor(
    (s) => s.selectedFrameId === frameId && samePath(s.selectedPath, path),
  );
  const selectNode = useEditor((s) => s.selectNode);
  const a11y = useCanvasA11y(frameId, path, node);
  const { setNodeRef } = useDroppable({
    id: `drop:${frameId}:${path.join('.')}`,
    data: { frameId, path },
  });
  const drop = useEditor((s) =>
    s.dropTarget?.frameId === frameId && samePath(s.dropTarget.path, path) ? s.dropTarget : null,
  );
  const mode = drop?.mode ?? null;
  const blocked = drop?.blocked ?? false;
  // Insertion points: a leading gap before every non-root node (= "before me" among my siblings), and a
  // trailing gap on every non-empty container (= "append to the end of me"). Both anchor to an existing
  // child node, so they drive that node's own before/after line and reuse the whole node-drop path.
  const lastChildIndex =
    'children' in node && node.children.length > 0 ? node.children.length - 1 : -1;
  const style: CSSProperties = {
    position: 'relative',
    cursor: blocked ? 'not-allowed' : 'pointer',
    ...(selected
      ? selectedOutline
      : mode === 'inside'
        ? blocked
          ? blockedOutline
          : insideOutline
        : {}),
  };
  return (
    <div
      ref={setNodeRef}
      className="ed-node"
      style={style}
      role={a11y.role}
      tabIndex={a11y.tabIndex}
      aria-label={a11y['aria-label']}
      aria-level={a11y['aria-level']}
      aria-expanded={a11y['aria-expanded']}
      aria-selected={a11y['aria-selected']}
      data-ed-path={a11y['data-ed-path']}
      onKeyDown={a11y.onKeyDown}
      onClick={(e) => {
        e.stopPropagation();
        selectNode(frameId, path);
      }}
    >
      {path.length > 0 && <DragHandle frameId={frameId} path={path} />}
      {path.length > 0 && (
        <GapDrop frameId={frameId} anchorPath={path} mode="before" placement="before" />
      )}
      {mode === 'before' && (
        <div className={`ed-drop-line ed-drop-before${blocked ? ' ed-drop-blocked' : ''}`} />
      )}
      {children}
      {mode === 'after' && (
        <div className={`ed-drop-line ed-drop-after${blocked ? ' ed-drop-blocked' : ''}`} />
      )}
      {lastChildIndex >= 0 && (
        <GapDrop
          frameId={frameId}
          anchorPath={[...path, lastChildIndex]}
          mode="after"
          placement="append"
        />
      )}
    </div>
  );
}

function makeEditableEmitter(frameId: string): Emitter<ReactElement, NodePath> {
  return {
    container(node, shape, children, ctx) {
      const wrapFlex = shape.kind === 'flow' && shape.wrapChildren;
      const body: ReactNode =
        children.length === 0 ? (
          <div className="ed-empty-hint">Drop into {node.type}…</div>
        ) : wrapFlex ? (
          children.map((c, i) => (
            <div key={i} style={{ flex: 1 }}>
              {c}
            </div>
          ))
        ) : (
          children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
        );
      return (
        <EditableShell frameId={frameId} path={ctx} node={node}>
          {layoutElement(node, body)}
        </EditableShell>
      );
    },
    component: {
      RadioGroup(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop a Radio here…</div>
          ) : (
            children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <RadioGroup label={node.props.label} style={node.style}>
              {body}
            </RadioGroup>
          </EditableShell>
        );
      },
      AppShell(node, children, ctx) {
        // The Region children carry their own EditableShell (drop target + selection); AppShell only
        // places each into its grid area. Its own shell makes the shell itself selectable.
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <AppShell
              areas={node.children.map((c) => c.props.area)}
              style={node.style}
              cells={node.children.map((c, i) => ({ area: c.props.area, content: children[i] }))}
            />
          </EditableShell>
        );
      },
      AppBar(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop into App bar…</div>
          ) : (
            children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <AppBar style={node.style}>{body}</AppBar>
          </EditableShell>
        );
      },
      TopNav(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop a Nav link here…</div>
          ) : (
            children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <TopNav style={node.style}>{body}</TopNav>
          </EditableShell>
        );
      },
      SideNav(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop a Nav link here…</div>
          ) : (
            children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <SideNav style={node.style}>{body}</SideNav>
          </EditableShell>
        );
      },
      Breadcrumb(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop a Nav link here…</div>
          ) : (
            children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Breadcrumb style={node.style}>{body}</Breadcrumb>
          </EditableShell>
        );
      },
      MenuBar(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop a Nav link here…</div>
          ) : (
            children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <MenuBar style={node.style}>{body}</MenuBar>
          </EditableShell>
        );
      },
      Stepper(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop a Step here…</div>
          ) : (
            children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Stepper orientation={node.props.orientation} style={node.style}>
              {body}
            </Stepper>
          </EditableShell>
        );
      },
      ToolBar(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop a Tool button here…</div>
          ) : (
            children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <ToolBar label={node.props.label} style={node.style}>
              {body}
            </ToolBar>
          </EditableShell>
        );
      },
      // ADR-0021: a <table>'s interior can't carry the per-node chrome `<div role="treeitem">` (a div
      // can't sit between <table>/<tbody> and <tr>). So the WHOLE table is ONE editable node — its rows
      // and cells render clean (no shell), edited via the Structure tree + Inspector. The rows partition
      // into thead/tbody exactly as on the canvas; an empty table shows the drop hint instead.
      DataTable(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop a Table row here…</div>
          ) : (
            <DataTable
              caption={node.props.caption}
              style={node.style}
              headerRows={children.filter((_, i) => node.children[i]?.props.header)}
              bodyRows={children.filter((_, i) => !node.children[i]?.props.header)}
            />
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            {body}
          </EditableShell>
        );
      },
      // A TableRow renders a clean <tr> with NO EditableShell — a shell `<div>` is illegal inside a
      // <table> (this ADR). Its DataTable carries the only shell.
      TableRow(node, children) {
        return (
          <TableRow header={node.props.header}>
            {children.map((c, i) => (
              <Fragment key={i}>{c}</Fragment>
            ))}
          </TableRow>
        );
      },
      Pagination(node, children, ctx) {
        const body =
          children.length === 0 ? (
            <div className="ed-empty-hint">Drop a Nav link here…</div>
          ) : (
            children.map((c, i) => <Fragment key={i}>{c}</Fragment>)
          );
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Pagination style={node.style}>{body}</Pagination>
          </EditableShell>
        );
      },
    },
    leaf: {
      Text(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Text variant={node.props.variant} style={node.style}>
              {node.props.content}
            </Text>
          </EditableShell>
        );
      },
      Button(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Button variant={node.props.variant}>{node.props.content}</Button>
          </EditableShell>
        );
      },
      Image(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Image src={node.props.src} alt={node.props.alt} width={node.props.width} />
          </EditableShell>
        );
      },
      Radio(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Radio value={node.props.value}>{node.props.label}</Radio>
          </EditableShell>
        );
      },
      NavLink(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <NavLink href={node.props.href} active={node.props.active}>
              {node.props.label}
            </NavLink>
          </EditableShell>
        );
      },
      Step(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Step status={node.props.status} label={node.props.label} />
          </EditableShell>
        );
      },
      ToolButton(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <ToolButton icon={node.props.icon} label={node.props.label} />
          </EditableShell>
        );
      },
      Divider(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Divider />
          </EditableShell>
        );
      },
      Spacer(node, ctx) {
        return (
          <EditableShell frameId={frameId} path={ctx} node={node}>
            <Spacer />
          </EditableShell>
        );
      },
      // A TableCell renders its bare text with NO EditableShell — a shell `<div>` is illegal inside a
      // <tr> (this ADR). The cell is selected/edited via the Structure tree + Inspector, not the canvas.
      TableCell(node) {
        return <>{node.props.content}</>;
      },
    },
    descend(ctx, index) {
      return [...ctx, index];
    },
  };
}

/** A Frame's editable tree: a drop target with before/after/inside indicators, a
 *  selection click, and (non-root) a drag handle for reordering/moving each node. */
export function EditableNode({
  frameId,
  node,
  path,
}: {
  frameId: string;
  node: Node;
  path: NodePath;
}): ReactElement {
  return walkNode<ReactElement, NodePath>(node, path, makeEditableEmitter(frameId));
}

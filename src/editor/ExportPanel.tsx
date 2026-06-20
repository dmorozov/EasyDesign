import { useMemo, useState, type ReactElement } from 'react';

import { Button, Icon, SegmentedControl } from '../design-system';
import { emitAngularSource, emitHTML, emitMJML, emitReactSource } from '../generators';
import { type Frame } from '../ir/types';

import { literalsWithOverrides } from './literals';
import { useEditor, type EditorFrame, type ExportTarget } from './store';

const TARGETS: { value: ExportTarget; label: string }[] = [
  { value: 'react', label: 'React' },
  { value: 'angular', label: 'Angular' },
  { value: 'html', label: 'HTML' },
  { value: 'mjml', label: 'Email' },
];

function generate(
  frame: EditorFrame,
  target: ExportTarget,
  overrides: Record<string, string>,
): string {
  const f: Frame = { target: frame.target, root: frame.root };
  try {
    switch (target) {
      case 'html':
        return emitHTML(f);
      case 'react':
        return emitReactSource(f);
      case 'angular':
        return emitAngularSource(f);
      case 'mjml':
        return emitMJML(f, literalsWithOverrides(overrides));
    }
  } catch (err) {
    return `/* Cannot export this frame to ${target}:\n   ${err instanceof Error ? err.message : String(err)} */`;
  }
}

/** Live code export for the selected Frame (the flagship feature, ADR-0002).
 *  Rendered as the Export tab body in the right rail. */
export function ExportPanel(): ReactElement {
  const frames = useEditor((s) => s.frames);
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const exportTarget = useEditor((s) => s.exportTarget);
  const setExportTarget = useEditor((s) => s.setExportTarget);
  const overrides = useEditor((s) => s.themeOverrides);
  const [copied, setCopied] = useState(false);

  const frame = frames.find((f) => f.id === selectedFrameId) ?? frames[0];
  const code = useMemo(
    () => (frame ? generate(frame, exportTarget, overrides) : ''),
    [frame, exportTarget, overrides],
  );

  const onCopy = () => {
    void navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
        }, 1200);
      },
      () => {
        // clipboard blocked (permissions / insecure context) — ignore
      },
    );
  };

  return (
    <div className="ed-export">
      <p className="ed-rail-intro">Your design, as real code.</p>
      <SegmentedControl
        className="ed-export-targets"
        options={TARGETS}
        value={exportTarget}
        onChange={(v) => {
          setExportTarget(v as ExportTarget);
        }}
      />
      <p className="ed-export-meta">{frame ? `${frame.title} → ${exportTarget}` : 'No frame'}</p>
      <div className="ed-code-surface">
        <pre className="ed-code">{code}</pre>
      </div>
      <Button
        variant="secondary"
        size="md"
        block
        icon={copied ? <Icon.check /> : <Icon.copy />}
        onClick={onCopy}
      >
        {copied ? 'Copied!' : 'Copy code'}
      </Button>
    </div>
  );
}

import { useMemo, type ReactElement } from 'react';

import { emitAngularSource, emitHTML, emitMJML, emitReactSource } from '../generators';
import { type Frame } from '../ir/types';

import { literalsWithOverrides } from './literals';
import { useEditor, type EditorFrame, type ExportTarget } from './store';

const TARGETS: ExportTarget[] = ['html', 'react', 'angular', 'mjml'];

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

/** Live code export for the selected Frame (the flagship feature, ADR-0002). */
export function ExportPanel(): ReactElement {
  const frames = useEditor((s) => s.frames);
  const selectedFrameId = useEditor((s) => s.selectedFrameId);
  const exportTarget = useEditor((s) => s.exportTarget);
  const setExportTarget = useEditor((s) => s.setExportTarget);
  const overrides = useEditor((s) => s.themeOverrides);

  const frame = frames.find((f) => f.id === selectedFrameId) ?? frames[0];
  const code = useMemo(
    () => (frame ? generate(frame, exportTarget, overrides) : ''),
    [frame, exportTarget, overrides],
  );

  return (
    <section className="ed-panel ed-export">
      <h3>Export</h3>
      <div className="ed-targets">
        {TARGETS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={t === exportTarget}
            onClick={() => {
              setExportTarget(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="ed-hint">{frame ? `${frame.title} → ${exportTarget}` : 'no frame'}</p>
      <pre className="ed-code">{code}</pre>
    </section>
  );
}

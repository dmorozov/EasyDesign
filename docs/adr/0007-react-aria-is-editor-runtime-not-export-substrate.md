# React Aria is the editor runtime, not the export substrate

The component layer (`src/components`) wraps each IR node type over React Aria Components — `Button`
is an accessible React Aria button; `CanvasNode`/`CanvasFrame` render an IR tree live. This is what
the editor Board shows. The four **export generators**, by contrast, emit plain framework-native
markup and do **not** depend on `react-aria-components`.

**Why.** The canvas wants React Aria's accessible interaction (focus management, keyboard, press
states) for a good editing experience. But exported code must be clean, dependency-light, and span
four targets — Angular, static HTML, and MJML cannot consume a React library, and even the React
export shouldn't force `react-aria-components` on the user. So React Aria powers **editing**; the
generators emit **native** code.

**Consequences.** Accessibility of the _exported_ output is the generators' job (semantic HTML:
real `<a>`/`<button>`, `alt` text), separate from the canvas's React-Aria-driven a11y. The exported
React component is plain JSX, not a React Aria tree. If shipping React Aria inside exported React is
ever wanted, it becomes an opt-in generator mode — never the default.

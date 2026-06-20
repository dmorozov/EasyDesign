import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Editor } from './editor/Editor';

// Order matters. 1) DS chrome tokens (+ dark) own :root. 2) The user's design Theme is scoped to
// .ed-board-content (NOT :root) so it can't collide with chrome (e.g. --radius-lg). 3) Editor chrome.
import './design-system/chrome.css';
import './theme/generated/theme.scoped.css';
import './editor/editor.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Editor />
    </StrictMode>,
  );
}

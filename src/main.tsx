import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Editor } from './editor/Editor';

import './theme/generated/theme.css';
import './editor/editor.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Editor />
    </StrictMode>,
  );
}

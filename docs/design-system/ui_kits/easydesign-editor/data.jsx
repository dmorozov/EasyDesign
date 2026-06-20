/* EasyDesign editor — document model, palette catalog, sample content, default theme. */

const uid = () => Math.random().toString(36).slice(2, 9);

// The user's design Theme — independent of the editor chrome palette.
const DEFAULT_THEME = {
  primary: '#4648D4',
  secondary: '#EEF0FF',
  background: '#FFFFFF',
  text: '#161B27',
  muted: '#5B6475',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  headingSize: 40,
  bodySize: 16,
  radius: 8,
  gap: 16,
};

// Palette catalog. `email:false` => greyed in Email frames.
const CATALOG = {
  layout: [
    { type: 'stack',  label: 'Stack',  icon: 'stack',  email: true },
    { type: 'row',    label: 'Row',    icon: 'row',    email: true },
    { type: 'column', label: 'Column', icon: 'column', email: true },
    { type: 'grid',   label: 'Grid',   icon: 'grid',   email: false },
  ],
  content: [
    { type: 'heading',   label: 'Heading',          icon: 'heading', email: true },
    { type: 'text',      label: 'Text',             icon: 'text',    email: true },
    { type: 'button',    label: 'Primary Button',   icon: 'button',  email: true, variant: 'primary' },
    { type: 'button2',   label: 'Secondary Button', icon: 'button',  email: true, variant: 'secondary' },
    { type: 'image',     label: 'Image',            icon: 'image',   email: true },
  ],
};

// Default props for a freshly-dropped node.
function makeNode(type) {
  const base = { id: uid(), type };
  switch (type) {
    case 'heading': return { ...base, type: 'heading', text: 'Your headline here', align: 'left' };
    case 'text':    return { ...base, type: 'text', text: 'A short paragraph describing what this section is about.', align: 'left' };
    case 'button':  return { ...base, type: 'button', text: 'Get Started', variant: 'primary' };
    case 'button2': return { ...base, type: 'button', text: 'Learn More', variant: 'secondary' };
    case 'image':   return { ...base, type: 'image', alt: 'Placeholder image', src: '' };
    case 'row':     return { ...base, type: 'row', children: [] };
    case 'column':  return { ...base, type: 'column', children: [] };
    case 'stack':   return { ...base, type: 'stack', children: [] };
    case 'grid':    return { ...base, type: 'grid', columns: 2, children: [] };
    default:        return base;
  }
}

const isContainer = (t) => ['row', 'column', 'stack', 'grid'].includes(t);

// Sample populated frame matching the reference (Landing Page Header).
function sampleFrame() {
  return {
    id: uid(),
    name: 'Landing Page Header',
    medium: 'web',
    children: [
      { id: uid(), type: 'heading', text: 'Design the future of your next big project.', align: 'left' },
      { id: uid(), type: 'text', text: 'Experience the ultimate workspace for modern teams. Build beautiful interfaces with precision and ease — no code required.', align: 'left' },
      { id: uid(), type: 'row', children: [
        { id: uid(), type: 'button', text: 'Get Started', variant: 'primary' },
        { id: uid(), type: 'button', text: 'Learn More', variant: 'secondary' },
      ] },
      { id: uid(), type: 'image', alt: 'Product preview', src: '' },
    ],
  };
}

Object.assign(window, { EDS_DATA: { uid, DEFAULT_THEME, CATALOG, makeNode, isContainer, sampleFrame } });

// EasyDesign Design System — vendored chrome component layer.
// Source: docs/design-system (delivered .jsx + .d.ts). Imported by the editor
// chrome only (src/editor/*). NOT the board-content / export substrate
// (src/components/*), which renders the user's design (ADR-0007).
//
// Consumed via source (.jsx) — NOT the global `_ds_bundle.js` (that assumes a
// window.React global; see plan). Vite compiles the .jsx; types come from the
// co-located .d.ts. Link `./chrome.css` once for the tokens.

export { Button, type ButtonProps } from './components/core/Button';
export { IconButton, type IconButtonProps } from './components/core/IconButton';
export { Badge, type BadgeProps } from './components/core/Badge';
export { Card, type CardProps } from './components/core/Card';

export { Input, type InputProps } from './components/forms/Input';
export { Select, type SelectOption, type SelectProps } from './components/forms/Select';
export { Checkbox, type CheckboxProps } from './components/forms/Checkbox';
export { Switch, type SwitchProps } from './components/forms/Switch';
export {
  SegmentedControl,
  type SegmentOption,
  type SegmentedControlProps,
} from './components/forms/SegmentedControl';

export { Tabs, type TabItem, type TabsProps } from './components/editor/Tabs';
export {
  PanelSection,
  PanelHeader,
  type PanelSectionProps,
  type PanelHeaderProps,
} from './components/editor/PanelSection';
export { Swatch, SwatchChip, type SwatchProps, type SwatchChipProps } from './components/editor/Swatch';
export { PaletteItem, type PaletteItemProps } from './components/editor/PaletteItem';

export { Icon, Svg, type IconName, type IconProps } from './icons';

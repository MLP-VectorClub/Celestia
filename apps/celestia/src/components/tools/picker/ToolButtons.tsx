import classNames from 'classnames';
import { FC } from 'react';

import styles from 'modules/PickerToolbar.module.scss';
import { Tool } from 'src/utils/picker/reducer';

const TOOLS: Array<{ tool: Tool; label: string; key: string; title: string }> = [
  { tool: 'hand', label: 'Hand', key: 'H', title: 'Hand tool (H): move around without holding Space' },
  { tool: 'picker', label: 'Eyedropper', key: 'I', title: 'Eyedropper tool (I): click to place picking areas' },
  { tool: 'zoom', label: 'Zoom', key: 'Z', title: 'Zoom tool (Z): click to zoom in, Alt+click or right click to zoom out' },
];

export const ToolButtons: FC<{ tool: Tool; onChange: (tool: Tool) => void }> = ({ tool, onChange }) => (
  <div className={styles.group} role="group" aria-label="Tools">
    {TOOLS.map((t) => (
      <button
        key={t.tool}
        type="button"
        className={classNames(styles.button, { [styles.active]: tool === t.tool })}
        aria-pressed={tool === t.tool}
        data-hint={t.title}
        onClick={() => onChange(t.tool)}
      >
        {t.label}
      </button>
    ))}
  </div>
);

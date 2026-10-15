import { IconProp } from '@fortawesome/fontawesome-svg-core';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/PickerPanels.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { Tool } from 'src/utils/picker/reducer';

const TOOLS: { name: Tool; icon: IconProp }[] = [
  { name: 'hand', icon: 'hand-paper' },
  { name: 'picker', icon: 'eye-dropper' },
  { name: 'zoom', icon: 'search' },
];

/** The picking tools as icon buttons; the levels button next to them is part of the same grid (see `StagePanels`) */
export const ToolButtons: FC<{ tool: Tool; onChange: (tool: Tool) => void }> = ({ tool, onChange }) => {
  const t = useTranslations();
  return (
    <>
      {TOOLS.map(({ name, icon }) => (
        <button
          key={name}
          type="button"
          className={classNames(styles.iconButton, { [styles.selected]: tool === name })}
          aria-label={t(`picker.tools.${name}.name`)}
          aria-pressed={tool === name}
          data-hint={t(`picker.tools.${name}.hint`)}
          onClick={() => onChange(name)}
        >
          <InlineIcon icon={icon} />
        </button>
      ))}
    </>
  );
};

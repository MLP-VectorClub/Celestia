import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/PickerToolbar.module.scss';
import { Tool } from 'src/utils/picker/reducer';

const TOOLS: Tool[] = ['hand', 'picker', 'zoom'];

export const ToolButtons: FC<{ tool: Tool; onChange: (tool: Tool) => void }> = ({ tool, onChange }) => {
  const t = useTranslations();
  return (
    <div className={styles.group} role="group" aria-label={t('picker.tools.label')}>
      {TOOLS.map((name) => (
        <button
          key={name}
          type="button"
          className={classNames(styles.button, { [styles.active]: tool === name })}
          aria-pressed={tool === name}
          data-hint={t(`picker.tools.${name}.hint`)}
          onClick={() => onChange(name)}
        >
          {t(`picker.tools.${name}.name`)}
        </button>
      ))}
    </div>
  );
};

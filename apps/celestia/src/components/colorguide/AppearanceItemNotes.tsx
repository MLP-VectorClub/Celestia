import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC, useMemo } from 'react';

import { Appearance } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearanceNotes.module.scss';
import { AppearanceNotesText } from 'src/components/colorguide/AppearanceNotesText';
import { processAppearanceNotes } from 'src/utils/html-parsers/appearance-notes-parser';

const cmSpacingClasses = 'ms-2 ps-2 border-start';

const AppearanceItemNotes: FC<Pick<Appearance, 'notes' | 'hasCutieMarks'>> = ({ notes, hasCutieMarks }) => {
  const t = useTranslations();
  const processedNotes = useMemo(() => (notes ? processAppearanceNotes(notes) : null), [notes]);

  return (
    <section className={styles.appearanceNotes} aria-label={t('colorGuide.appearance.notes')}>
      <AppearanceNotesText>
        {processedNotes}
        {hasCutieMarks && (
          <span
            className={classNames({
              [cmSpacingClasses]: processedNotes !== null,
            })}
          >
            {t('colorGuide.appearances.cmAvailable')}
          </span>
        )}
      </AppearanceNotesText>
    </section>
  );
};

export default AppearanceItemNotes;

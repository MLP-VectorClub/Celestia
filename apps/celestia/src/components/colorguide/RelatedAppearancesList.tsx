import { PreviewAppearance } from '@went.tf/mlp-vectorclub-api-types';
import { FC } from 'react';

import styles from 'modules/RelatedAppearancesList.module.scss';
import { AppearanceLink } from 'src/components/colorguide/AppearanceLink';

interface PropTypes {
  appearances: Array<
    Pick<PreviewAppearance, 'id' | 'label'> & Partial<Pick<PreviewAppearance, 'guide' | 'previewData' | 'ownerId' | 'nutshellNames'>>
  >;
}

/** The appearances related to an episode or to another appearance: their colors' preview and name as links, side by side and wrapping */
export const RelatedAppearancesList: FC<PropTypes> = ({ appearances }) => (
  <ul className={styles.list}>
    {appearances.map((appearance) => (
      <li key={appearance.id}>
        <AppearanceLink {...appearance} />
      </li>
    ))}
  </ul>
);

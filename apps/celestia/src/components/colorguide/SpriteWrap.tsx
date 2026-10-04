import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useRef, useState } from 'react';
import { Alert } from 'reactstrap';

import { Sprite } from '@mlp-vectorclub/api-types';
import styles from 'modules/SpriteWrap.module.scss';
import { SpriteDialog } from 'src/components/colorguide/SpriteDialog';
import SpriteImage from 'src/components/colorguide/SpriteImage';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, useApiMutation } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  appearanceId: number;
  sprite: Sprite | null;
}

/**
 * The sprite of an appearance for the people who may change it: an image (or an empty box when there is none) that takes a file straight away,
 * and a menu on a right click with the other things to do, as on the old site
 */
export const SpriteWrap: FC<PropTypes> = ({ appearanceId, sprite }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const input = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState(false);

  const options = { invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]] };
  const upload = useApiMutation((file: File) => AppearanceEditService.uploadSprite(appearanceId, file), options);
  const remove = useApiMutation(() => AppearanceEditService.removeSprite(appearanceId), options);
  const error = upload.error ?? remove.error;

  // The menu goes away with a click anywhere or Escape
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const askToRemove = async () => {
    setMenu(false);
    if (
      await confirm({
        title: t('colorGuide.edit.sprite.removeTitle'),
        body: t('colorGuide.edit.sprite.removeBody'),
        color: 'danger',
        confirmLabel: t('colorGuide.edit.common.delete'),
      })
    )
      remove.mutate();
  };

  return (
    <div className="text-center mb-3">
      <div
        className={classNames('upload-wrap', styles.wrap, { nosprite: !sprite })}
        data-testid="sprite-wrap"
        onClick={() => !sprite && input.current?.click()}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenu(true);
        }}
      >
        {sprite ? (
          <SpriteImage appearanceId={appearanceId} sprite={sprite} height={300} />
        ) : (
          <span className="text-muted">{t('colorGuide.edit.sprite.none')}</span>
        )}
        <input
          ref={input}
          type="file"
          hidden
          accept="image/png,image/jpeg"
          aria-label={t('colorGuide.edit.sprite.image')}
          onChange={(e) => {
            const field = e.target;
            const file = field.files?.[0];
            field.value = '';
            if (file) upload.mutate(file);
          }}
        />
        {menu && (
          <ul className={styles.menu} role="menu">
            <li role="none">
              <a
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  setDialog(true);
                }}
              >
                {t('colorGuide.edit.sprite.uploadNew')}
              </a>
            </li>
            {sprite && (
              <li role="none">
                <a role="menuitem" onClick={() => void askToRemove()}>
                  {t('colorGuide.edit.sprite.removeImage')}
                </a>
              </li>
            )}
          </ul>
        )}
      </div>
      {error && (
        <Alert color="danger" fade={false} className="mt-2" role="alert" style={{ whiteSpace: 'pre-line' }}>
          {describeApiError(error)}
        </Alert>
      )}
      <SpriteDialog appearanceId={appearanceId} hasSprite={Boolean(sprite)} isOpen={dialog} onClose={() => setDialog(false)} />
    </div>
  );
};

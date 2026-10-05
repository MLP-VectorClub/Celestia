import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC, useRef, useState } from 'react';
import { Alert } from 'reactstrap';

import { Sprite } from '@mlp-vectorclub/api-types';
import styles from 'modules/SpriteWrap.module.scss';
import { SpriteDialog } from 'src/components/colorguide/SpriteDialog';
import SpriteImage from 'src/components/colorguide/SpriteImage';
import { ActionMenu, ActionMenuItem } from 'src/components/shared/ActionMenu';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, useApiMutation } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';
import { copyText } from 'src/utils/clipboard';
import { getSpriteUrl } from 'src/utils/color-guide';

interface PropTypes {
  appearanceId: number;
  sprite: Sprite | null;
}

/**
 * The sprite of an appearance for the people who may change it: an image (or an empty box when there is none) that takes a file straight away,
 * and a "⋯" menu with the other things to do (the old site had them in a right click menu)
 */
export const SpriteWrap: FC<PropTypes> = ({ appearanceId, sprite }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [dialog, setDialog] = useState(false);

  const options = { invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]] };
  const upload = useApiMutation((file: File) => AppearanceEditService.uploadSprite(appearanceId, file), options);
  const remove = useApiMutation(() => AppearanceEditService.removeSprite(appearanceId), options);
  const error = upload.error ?? remove.error;

  const askToRemove = async () => {
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

  const spriteUrl = sprite ? getSpriteUrl(appearanceId, sprite, 600) : null;
  const menuItems: ActionMenuItem[] = [
    { key: 'open', label: t('colorGuide.edit.sprite.openInNewTab'), icon: 'external-link-alt', href: spriteUrl ?? undefined, external: true, disabled: !sprite },
    {
      key: 'copy',
      label: copied ? t('common.copied') : t('colorGuide.edit.sprite.copyUrl'),
      icon: 'clipboard',
      disabled: !sprite,
      onClick: () => {
        if (!spriteUrl) return;
        void copyText(new URL(spriteUrl, window.location.origin).toString()).then(setCopied);
        setTimeout(() => setCopied(false), 1500);
      },
    },
    { key: 'upload', label: t('colorGuide.edit.sprite.uploadNew'), icon: 'upload', onClick: () => setDialog(true) },
    ...(sprite
      ? [{ key: 'remove', label: t('colorGuide.edit.sprite.removeImage'), icon: 'trash' as const, danger: true, separated: true, onClick: () => void askToRemove() }]
      : []),
  ];

  return (
    <div className="text-center mb-3">
      <div
        className={classNames('upload-wrap', styles.wrap, { nosprite: !sprite })}
        data-testid="sprite-wrap"
        onClick={() => !sprite && input.current?.click()}
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
        <div className={styles.menuButton} onClick={(e) => e.stopPropagation()}>
          <ActionMenu title={t('colorGuide.edit.sprite.menu')} alignEnd items={menuItems} />
        </div>
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

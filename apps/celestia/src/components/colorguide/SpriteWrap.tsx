import { useQueryClient } from '@tanstack/react-query';
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
  /** The small box of a guide list item: no padding or border of its own (the list draws one), a 150px image */
  compact?: boolean;
  /** Whether the visitor may upload and remove the sprite; others only get the menu entries that read it. Defaults to true */
  editable?: boolean;
}

/**
 * The sprite of an appearance for the people who may change it: an image (or an empty box when there is none) that takes a file straight away,
 * and a "⋯" menu with the other things to do (the old site had them in a right click menu)
 */
export const SpriteWrap: FC<PropTypes> = ({ appearanceId, sprite, compact = false, editable = true }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [dragging, setDragging] = useState(false);

  const queryClient = useQueryClient();
  // The list items come from the lists' queries (`/appearances?...`), the page from the appearance's own
  const options = {
    invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]],
    onSuccess: () =>
      void queryClient.invalidateQueries({
        predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/appearances'),
      }),
  };
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
    {
      key: 'open',
      label: t('colorGuide.edit.sprite.openInNewTab'),
      icon: 'external-link-alt',
      href: spriteUrl ?? undefined,
      external: true,
      disabled: !sprite,
    },
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
    ...(editable
      ? [{ key: 'upload', label: t('colorGuide.edit.sprite.uploadNew'), icon: 'upload' as const, onClick: () => setDialog(true) }]
      : []),
    ...(editable && sprite
      ? [
          {
            key: 'remove',
            label: t('colorGuide.edit.sprite.removeImage'),
            icon: 'trash' as const,
            danger: true,
            separated: true,
            onClick: () => void askToRemove(),
          },
        ]
      : []),
  ];

  return (
    <div className={compact ? undefined : 'text-center mb-3'}>
      <div
        className={classNames('upload-wrap', styles.wrap, { nosprite: !sprite, [styles.compact]: compact, [styles.dragging]: dragging })}
        data-testid="sprite-wrap"
        onClick={() => editable && !sprite && input.current?.click()}
        // Like the old site's upload zone, an image dropped onto the sprite is uploaded straight away
        onDragOver={(e) => {
          if (!editable || !e.dataTransfer.types.includes('Files')) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!editable) return;
          const file = e.dataTransfer.files[0];
          if (file && /^image\/(png|jpeg)$/.test(file.type)) upload.mutate(file);
        }}
      >
        {sprite ? (
          <SpriteImage appearanceId={appearanceId} sprite={sprite} height={compact ? 150 : 600} />
        ) : (
          editable && !compact && <span className="text-muted">{t('colorGuide.edit.sprite.none')}</span>
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
        {(sprite || editable) && (
          <div className={styles.menuButton} onClick={(e) => e.stopPropagation()}>
            <ActionMenu title={t('colorGuide.edit.sprite.menu')} alignEnd items={menuItems} />
          </div>
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

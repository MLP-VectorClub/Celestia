import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Alert, Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { describeApiError } from 'src/hooks';
import { ColorGuideService } from 'src/services/color-guide';
import { SpriteColorEntry, SpriteColorKind, SpriteColorPaletteEntry } from 'src/types/sprite-colors';
import { ENDPOINTS } from 'src/utils';
import { httpResponseMapper } from 'src/utils/common';

interface PropTypes {
  appearanceId: number;
  isOpen: boolean;
  onClose: () => void;
  token?: string;
}

const service = new ColorGuideService();

const KIND_COLORS: Record<SpriteColorKind, string> = {
  listed: 'success',
  blend: 'info',
  near: 'warning',
  nearSpeck: 'secondary',
  unknown: 'danger',
  unknownSpeck: 'secondary',
  translucent: 'secondary',
};

const Swatch: FC<{ hex: string }> = ({ hex }) => (
  <span
    className="d-inline-block align-middle me-2 border"
    style={{ width: '1.25rem', height: '1.25rem', backgroundColor: hex }}
    aria-hidden="true"
  />
);

const SpriteColorRow: FC<{ color: SpriteColorEntry }> = ({ color }) => {
  const t = useTranslations('colorGuide.spriteColors');
  let explanation: string;
  if (color.kind === 'listed') explanation = t('explain.listed', { labels: color.labels.join(', ') });
  else if (color.kind === 'blend' && color.blendOf && color.blendMode)
    explanation = t(`explain.${color.blendMode}`, { a: color.blendOf[0], b: color.blendOf[1] });
  else if (color.kind === 'translucent') explanation = t('explain.translucent');
  else if (color.nearest)
    explanation = t(color.kind.startsWith('near') ? 'explain.near' : 'explain.unknown', {
      label: color.nearest.label,
      hex: color.nearest.hex,
    });
  else explanation = '';

  return (
    <tr data-kind={color.kind}>
      <td className="text-nowrap">
        <Swatch hex={color.hex} />
        <code>{color.hex}</code>
      </td>
      <td>
        <Badge color={KIND_COLORS[color.kind]}>{t(`kind.${color.kind}`)}</Badge>
      </td>
      <td>{explanation}</td>
      <td className="text-end">{color.pixels + color.translucentPixels}</td>
    </tr>
  );
};

const PaletteRow: FC<{ color: SpriteColorPaletteEntry }> = ({ color }) => {
  const t = useTranslations('colorGuide.spriteColors');
  const status = color.status === 'missing' && color.optional ? 'optional' : color.status;
  const badge = color.status === 'present' ? 'success' : status === 'missing' ? 'danger' : 'secondary';

  return (
    <tr data-status={status}>
      <td className="text-nowrap">
        <Swatch hex={color.hex} />
        <code>{color.hex}</code>
      </td>
      <td>
        {color.group} | {color.label}
      </td>
      <td>
        <Badge color={badge}>{t(`status.${status}`)}</Badge>
      </td>
    </tr>
  );
};

/** What the colors of the sprite image are and how they relate to the colors listed for the appearance */
export const SpriteColorsDialog: FC<PropTypes> = ({ appearanceId, isOpen, onClose, token }) => {
  const t = useTranslations('colorGuide.spriteColors');
  const tc = useTranslations();
  const check = useQuery({
    queryKey: [ENDPOINTS.APPEARANCE_SPRITE_COLORS({ id: appearanceId })],
    queryFn: () => service.getSpriteColors({ id: appearanceId, token }).then((r) => r.data),
    enabled: isOpen,
    // The sprite or the colors may have been changed since the last look
    refetchOnMount: 'always',
    gcTime: 0,
  });
  const data = check.data;
  const problems = data ? data.summary.missing + data.summary.translucentOnly + data.summary.near + data.summary.unknown : 0;

  return (
    <Modal className="modal-ui" centered size="lg" scrollable isOpen={isOpen} toggle={onClose}>
      <ModalHeader toggle={onClose}>{t('title')}</ModalHeader>
      <ModalBody>
        <p className="text-muted">{t('intro')}</p>
        {check.isPending && check.fetchStatus !== 'idle' && <InlineIcon loading first />}
        {check.isError && (
          <Alert color="danger" fade={false} role="alert">
            {describeApiError(httpResponseMapper(check.error)) || t('error')}{' '}
            <Button type="button" color="link" size="sm" onClick={() => void check.refetch()}>
              {t('retry')}
            </Button>
          </Alert>
        )}
        {data && (
          <>
            <Alert color={data.summary.ok ? 'success' : 'warning'} fade={false} data-testid="sprite-colors-summary">
              {data.summary.ok ? t('ok') : t('problems', { count: problems })}
            </Alert>
            <h5>{t('inSprite')}</h5>
            {data.colors.length === 0 ? (
              <p className="text-muted">{t('empty')}</p>
            ) : (
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>{t('color')}</th>
                    <th />
                    <th />
                    <th className="text-end">{t('pixels')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.colors.map((color) => (
                    <SpriteColorRow key={color.hex} color={color} />
                  ))}
                </tbody>
              </table>
            )}
            <h5>{t('inPalette')}</h5>
            <table className="table table-sm align-middle">
              <tbody>
                {[...data.palette]
                  // Things to look at first
                  .sort((a, b) => Number(b.status === 'missing' && !b.optional) - Number(a.status === 'missing' && !a.optional))
                  .map((color, i) => (
                    <PaletteRow key={`${color.group}-${color.label}-${i}`} color={color} />
                  ))}
              </tbody>
            </table>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" color="link" onClick={onClose} data-testid="dialog-btn-cancel">
          {tc('common.actions.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

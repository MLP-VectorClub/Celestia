import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC, MouseEvent, useMemo, useState } from 'react';
import { Alert, Badge, Button } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { describeApiError } from 'src/hooks';
import { ColorGuideService } from 'src/services/color-guide';
import { SpriteColorEntry, SpriteColorKind, SpriteColorPaletteEntry } from 'src/types/sprite-colors';
import { ENDPOINTS } from 'src/utils';
import { getSwatchStyle } from 'src/utils/color-guide';
import { httpResponseMapper } from 'src/utils/common';

interface PropTypes {
  appearanceId: number;
  label: string;
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

const Swatch: FC<{ hex: string; opacity?: number | null; blendMode?: string | null }> = ({ hex, opacity, blendMode }) => (
  <span
    className="d-inline-block align-middle me-2 border"
    style={{ width: '1.25rem', height: '1.25rem', ...getSwatchStyle(hex, opacity, blendMode) }}
    aria-hidden="true"
  />
);

const SpriteColorRow: FC<{ color: SpriteColorEntry; active: boolean; onHover: (hex: string | null) => void }> = ({
  color,
  active,
  onHover,
}) => {
  const t = useTranslations('colorGuide.spriteColors');
  const mode = (value: string) => t(`blendModes.${value}` as 'blendModes.normal');
  let explanation = '';
  if (color.kind === 'listed') explanation = color.labels.join(', ');
  else if (color.kind === 'translucent') explanation = t('explain.translucent');
  else if (color.kind === 'blend' && color.blendOf && color.blendMode) {
    const [a, b] = color.blendOf;
    if (color.blendMode === 'mix') explanation = t('explain.mix', { a, b });
    else if (color.blendOpacity !== null)
      explanation = t('explain.layer', { a, b, opacity: color.blendOpacity, mode: mode(color.blendMode) });
    else explanation = t('explain.combo', { a, b, mode: mode(color.blendMode) });
  } else if (color.nearest)
    explanation = t(color.kind.startsWith('near') ? 'explain.near' : 'explain.unknown', {
      label: color.nearest.label,
      hex: color.nearest.hex,
    });

  return (
    <tr
      data-kind={color.kind}
      data-hex={color.hex}
      className={active ? 'table-active' : undefined}
      onMouseEnter={() => onHover(color.hex)}
      onMouseLeave={() => onHover(null)}
    >
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

const PaletteRow: FC<{ color: SpriteColorPaletteEntry; active: boolean; onHover: (hex: string | null) => void }> = ({
  color,
  active,
  onHover,
}) => {
  const t = useTranslations('colorGuide.spriteColors');
  const status = color.status === 'missing' && color.optional ? 'optional' : color.status;
  const badge = color.status === 'present' ? 'success' : status === 'missing' ? 'danger' : 'secondary';

  return (
    <tr
      data-status={status}
      data-hex={color.hex}
      className={active ? 'table-active' : undefined}
      onMouseEnter={() => onHover(color.hex)}
      onMouseLeave={() => onHover(null)}
    >
      <td className="text-nowrap">
        <Swatch hex={color.hex} opacity={color.opacity} blendMode={color.blendMode} />
        <code>{color.hex}</code>
      </td>
      <td>
        {color.group} | {color.label}
        {color.opacity !== null && (
          <small className="text-muted ms-2">
            {color.opacity}%{' '}
            {color.blendMode && color.blendMode !== 'normal' ? t(`blendModes.${color.blendMode}` as 'blendModes.normal') : ''}
          </small>
        )}
      </td>
      <td>
        <Badge color={badge}>{t(`status.${status}`)}</Badge>
      </td>
    </tr>
  );
};

/**
 * How the colors of the sprite image relate to the colors listed for the appearance. The sprite is drawn next to the tables, pointing at a color
 * in either one lights up where it is in the other
 */
export const SpriteColorsReport: FC<PropTypes> = ({ appearanceId, label, token }) => {
  const t = useTranslations('colorGuide.spriteColors');
  const [hovered, setHovered] = useState<string | null>(null);
  const check = useQuery({
    queryKey: [ENDPOINTS.APPEARANCE_SPRITE_COLORS({ id: appearanceId }), token],
    queryFn: () => service.getSpriteColors({ id: appearanceId, token }).then((r) => r.data),
    // The sprite or the colors may have been changed since the last look
    refetchOnMount: 'always',
  });
  const svg = useQuery({
    queryKey: [ENDPOINTS.APPEARANCE_IMAGE({ id: appearanceId, type: 'sprite', format: 'svg' }), token],
    queryFn: () => service.getSpriteSvg({ id: appearanceId, token }).then((r) => r.data),
    refetchOnMount: 'always',
  });
  const data = check.data;
  const problems = data ? data.summary.missing + data.summary.translucentOnly + data.summary.near + data.summary.unknown : 0;
  const palette = useMemo(
    () =>
      data
        ? // Things to look at first
          [...data.palette].sort((a, b) => Number(b.status === 'missing' && !b.optional) - Number(a.status === 'missing' && !a.optional))
        : [],
    [data]
  );

  const onSpriteHover = (e: MouseEvent) => {
    const fill = e.target instanceof SVGElement ? e.target.getAttribute('fill') : null;
    setHovered(fill && /^#[0-9A-F]{6}$/i.test(fill) ? fill.toUpperCase() : null);
  };

  if (check.isError) {
    return (
      <Alert color="danger" fade={false} role="alert">
        {describeApiError(httpResponseMapper(check.error)) || t('error')}{' '}
        <Button type="button" color="link" size="sm" onClick={() => void check.refetch()}>
          {t('retry')}
        </Button>
      </Alert>
    );
  }
  if (!data) return <InlineIcon loading first />;

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <div className="sticky-top" style={{ top: '1rem' }}>
          {svg.data && (
            <>
              {/* Only the pixels whose color is pointed at stay fully visible */}
              {hovered && <style>{`.sprite-colors-svg path:not([fill='${hovered}']) { opacity: 0.12; }`}</style>}
              <div
                className="sprite-colors-svg border rounded p-2 mb-2"
                role="img"
                aria-label={t('spriteAlt', { label })}
                onMouseOver={onSpriteHover}
                onMouseLeave={() => setHovered(null)}
                // The SVG comes from the API as paths with a hex fill, nothing else
                dangerouslySetInnerHTML={{ __html: svg.data }}
              />
              <p className="text-muted small">{t('spriteHint')}</p>
            </>
          )}
        </div>
      </div>
      <div className="col-lg-7">
        <Alert color={data.summary.ok ? 'success' : 'warning'} fade={false} data-testid="sprite-colors-summary">
          {data.summary.ok ? t('ok') : t('problems', { count: problems })}
        </Alert>
        <h4>{t('inSprite')}</h4>
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
                <SpriteColorRow key={color.hex} color={color} active={hovered === color.hex} onHover={setHovered} />
              ))}
            </tbody>
          </table>
        )}
        <h4>{t('inPalette')}</h4>
        <table className="table table-sm align-middle">
          <tbody>
            {palette.map((color, i) => (
              <PaletteRow key={`${color.group}-${color.label}-${i}`} color={color} active={hovered === color.hex} onHover={setHovered} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

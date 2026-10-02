import classNames from 'classnames';
import { saveAs } from 'file-saver';
import { useTranslations } from 'next-intl';
import { ChangeEventHandler, FC, FormEventHandler, MouseEventHandler, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Col, Form, Input, Label, Progress, Row } from 'reactstrap';

import { SpriteGeneratorCustomizer } from 'src/components/colorguide/sprite-generator/SpriteGeneratorCustomizer';
import { SpriteGeneratorPreview } from 'src/components/colorguide/sprite-generator/SpriteGeneratorPreview';
import ExternalLink from 'src/components/shared/ExternalLink';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useCopyToClipboard } from 'src/hooks/copy';
import { PATHS } from 'src/paths';
import {
  SPRITE_GENERATOR_ASSETS,
  SpriteGeneratorBaseColor,
  SpriteGeneratorBodyOptions,
  SpriteGeneratorColorMap,
  SpriteGeneratorEyeOptions,
  SpriteGeneratorImageMap,
  SpriteGeneratorOptions,
} from 'src/types/sprite-generator';
import { assembleSeoUrl, convertNumberToRgb } from 'src/utils';

const DEFAULT_OPTIONS: SpriteGeneratorOptions = {
  body: SpriteGeneratorBodyOptions.FEMALE,
  cm: true,
  wing: false,
  horn: false,
  eye: SpriteGeneratorEyeOptions.EYES_FEMALE_1,
  gradientStops: 2,
};

export const SpriteGenerator: FC = () => {
  const t = useTranslations();
  const canvasRef = useRef<HTMLCanvasElement>(null) as RefObject<HTMLCanvasElement>;
  const imageMap = useRef<SpriteGeneratorImageMap | undefined>(undefined);
  const [colorMap, setColorMap] = useState<SpriteGeneratorColorMap>(() => ({
    [SpriteGeneratorBaseColor.COAT_OUTLINE]: convertNumberToRgb(SpriteGeneratorBaseColor.COAT_OUTLINE),
    [SpriteGeneratorBaseColor.COAT_SHADOW_OUTLINE]: convertNumberToRgb(SpriteGeneratorBaseColor.COAT_SHADOW_OUTLINE),
    [SpriteGeneratorBaseColor.COAT_FILL]: convertNumberToRgb(SpriteGeneratorBaseColor.COAT_FILL),
    [SpriteGeneratorBaseColor.COAT_SHADOW_FILL]: convertNumberToRgb(SpriteGeneratorBaseColor.COAT_SHADOW_FILL),
    [SpriteGeneratorBaseColor.IRIS_GRADIENT_TOP]: convertNumberToRgb(SpriteGeneratorBaseColor.IRIS_GRADIENT_TOP),
    [SpriteGeneratorBaseColor.IRIS_GRADIENT_MIDDLE]: convertNumberToRgb(SpriteGeneratorBaseColor.IRIS_GRADIENT_MIDDLE),
    [SpriteGeneratorBaseColor.IRIS_GRADIENT_BOTTOM]: convertNumberToRgb(SpriteGeneratorBaseColor.IRIS_GRADIENT_BOTTOM),
    [SpriteGeneratorBaseColor.IRIS_HIGHLIGHT_TOP]: convertNumberToRgb(SpriteGeneratorBaseColor.IRIS_HIGHLIGHT_TOP),
    [SpriteGeneratorBaseColor.IRIS_HIGHLIGHT_BOTTOM]: convertNumberToRgb(SpriteGeneratorBaseColor.IRIS_HIGHLIGHT_BOTTOM),
    [SpriteGeneratorBaseColor.MAGIC_AURA]: convertNumberToRgb(SpriteGeneratorBaseColor.MAGIC_AURA),
  }));
  const loadingErrors = useRef<Array<keyof SpriteGeneratorImageMap>>([]);
  const [loadedImages, setLoadedImages] = useState(0);
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const [options, setOptions] = useState<SpriteGeneratorOptions>(DEFAULT_OPTIONS);
  const copyButtonRef = useRef<HTMLButtonElement>(null) as RefObject<HTMLButtonElement>;
  const attributionTextRef = useRef<HTMLSpanElement>(null) as RefObject<HTMLSpanElement>;

  useEffect(() => {
    let localLoadedImages = 0;
    let mounted = true;
    loadingErrors.current = [];
    imageMap.current = SPRITE_GENERATOR_ASSETS.reduce((acc, imageName) => {
      const imageEl = new Image();
      const cacheBustVersion = 1;
      imageEl.src = `/img/sprite_template/${imageName}.png?v=${cacheBustVersion}`;
      imageEl.onload = () => {
        localLoadedImages++;
        if (mounted) {
          setLoadedImages(localLoadedImages);
        }
      };
      imageEl.onerror = () => {
        loadingErrors.current.push(imageName);
      };
      return { ...acc, [imageName]: imageEl };
    }, {} as SpriteGeneratorImageMap);

    return () => {
      mounted = false;
    };
  }, []);

  const { tooltip, clearCopyStatus } = useCopyToClipboard({
    copyButtonRef,
    targetRef: attributionTextRef,
  });

  const loading = imageMap.current !== null && loadedImages < SPRITE_GENERATOR_ASSETS.length;
  const loadingFailed = loadingErrors.current.length > 0;

  const handleSubmit: FormEventHandler = useCallback((e) => {
    e.preventDefault();
  }, []);
  const handleLicenseChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    setLicenseAccepted(e.target.checked);
  }, []);
  const handleDownload: MouseEventHandler = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      saveAs(blob, 'sprite.png');
    });
  }, []);

  return (
    <>
      <h2>{t('colorGuide.spriteGenerator.about')}</h2>
      <p>{t('colorGuide.spriteGenerator.intro')}</p>
      <p>
        {t.rich('colorGuide.spriteGenerator.instructions', {
          paintNet: (chunks) => <ExternalLink href="https://www.getpaint.net/">{chunks}</ExternalLink>,
          gimp: (chunks) => <ExternalLink href="https://www.gimp.org/">{chunks}</ExternalLink>,
        })}
      </p>
      <h2>{t('colorGuide.spriteGenerator.options')}</h2>
      <Form onSubmit={handleSubmit}>
        <Row className="flex-row-reverse flex-lg-row">
          <Col lg={12} xl={6} className="col-xxl-auto">
            <SpriteGeneratorPreview
              canvasRef={canvasRef}
              loading={loading}
              options={options}
              colorMap={colorMap}
              imageMap={imageMap.current}
            />
            {loading && (
              <div className="mt-2 text-center">
                <div className={classNames('mb-2', loadingFailed ? 'text-danger' : 'text-ui')}>
                  <InlineIcon icon={loadingErrors ? 'exclamation-triangle' : 'info'} first />
                  {loadingErrors.current.length > 0 ? (
                    <>
                      {t('colorGuide.spriteGenerator.loadFailed')}
                      <ul>
                        {loadingErrors.current.map((name, k) => (
                          <li key={k}>{name}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    t('colorGuide.spriteGenerator.loading')
                  )}
                </div>
                <Progress
                  value={(loadedImages / SPRITE_GENERATOR_ASSETS.length) * 100}
                  animated={!loadingFailed}
                  color={loadingFailed ? 'danger' : 'ui'}
                />
              </div>
            )}
          </Col>
          <SpriteGeneratorCustomizer options={options} setOptions={setOptions} colorMap={colorMap} setColorMap={setColorMap} />
        </Row>
      </Form>
      <h2 className="mt-3">{t('colorGuide.spriteGenerator.download')}</h2>
      <div className="form-check mb-3">
        <Input type="checkbox" className="form-check-input" id="accept-license" checked={licenseAccepted} onChange={handleLicenseChange} />
        <Label check htmlFor="accept-license" className="form-check-label">
          {t.rich('colorGuide.spriteGenerator.license', {
            cc: (chunks) => <ExternalLink href="https://creativecommons.org/licenses/by-nc-sa/4.0/">{chunks}</ExternalLink>,
          })}
        </Label>
      </div>
      <p className="text-info">
        <InlineIcon icon="info" first fixedWidth />
        {t('colorGuide.spriteGenerator.attributionExample')}
        <span className="user-select-all p-1 ms-2 border rounded" ref={attributionTextRef}>
          {t('colorGuide.spriteGenerator.attributionText', { url: assembleSeoUrl(PATHS.GUIDE_SPRITE) })}
        </span>
        <Button type="button" size="sm" color="link" innerRef={copyButtonRef} onMouseLeave={clearCopyStatus}>
          <InlineIcon icon="clipboard" first />
          {t('colorGuide.share.copy')}
        </Button>
        {tooltip}
      </p>
      <Button type="button" size="lg" color="primary" disabled={!licenseAccepted} onClick={handleDownload}>
        <InlineIcon icon="download" first />
        {t('colorGuide.spriteGenerator.downloadButton')}
      </Button>
    </>
  );
};

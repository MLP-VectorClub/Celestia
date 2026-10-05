import { useTranslations } from 'next-intl';
import { FC, ReactNode, useState } from 'react';
import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import { API_PREFIX } from 'src/config';

interface PropTypes {
  appearanceId: number;
  name: string;
  isOpen: boolean;
  onClose: () => void;
}

const isMac = () => typeof navigator !== 'undefined' && /Macintosh/i.test(navigator.userAgent);

const Embed: FC<{ src: string }> = ({ src }) => (
  <div className="ratio ratio-16x9 mt-2">
    <iframe src={src} allowFullScreen loading="lazy" title="Tutorial" />
  </div>
);

/** The "Download swatch file" dialog of the old site: pick Inkscape or Adobe Illustrator and get that program's files and instructions */
export const SwatchDialog: FC<PropTypes> = ({ appearanceId, name, isOpen, onClose }) => {
  const t = useTranslations();
  const [program, setProgram] = useState<'' | 'inkscape' | 'ai'>('');
  const palette = (format: string) => `${API_PREFIX}/appearances/${appearanceId}/palette?format=${format}`;
  const keys: ReactNode = isMac() ? (
    <>
      <kbd>fn</kbd>
      <kbd>⌘</kbd>
      <kbd>F12</kbd>
    </>
  ) : (
    <>
      <kbd>Ctrl</kbd>
      <kbd>F12</kbd>
    </>
  );

  return (
    <Modal className="modal-ui" centered isOpen={isOpen} toggle={onClose}>
      <ModalHeader toggle={onClose}>{t('colorGuide.item.swatchDialog.title', { name })}</ModalHeader>
      <ModalBody>
        <FormGroup className="text-center">
          <Label for={`swatch-program-${appearanceId}`}>{t('colorGuide.item.swatchDialog.chooseProgram')}</Label>
          <Input
            id={`swatch-program-${appearanceId}`}
            type="select"
            value={program}
            onChange={(e) => setProgram(e.target.value as typeof program)}
            required
          >
            <option value="" hidden>
              {t('colorGuide.item.swatchDialog.chooseOne')}
            </option>
            <option value="inkscape">{t('colorGuide.item.swatchDialog.inkscape')}</option>
            <option value="ai">{t('colorGuide.item.swatchDialog.illustrator')}</option>
          </Input>
        </FormGroup>
        {program === 'ai' && (
          <div className="section ai">
            <h4>{t('colorGuide.item.swatchDialog.illustratorTitle')}</h4>
            <ul>
              <li>
                {t.rich('colorGuide.item.swatchDialog.illustratorStep1', {
                  script: (chunks) => (
                    <a href="/dist/Import%20Swatches%20from%20JSON.jsx?v=1.5" download="Import Swatches from JSON.jsx" className="btn btn-sm btn-ui">
                      {chunks}
                    </a>
                  ),
                })}
              </li>
              <li>
                {t.rich('colorGuide.item.swatchDialog.illustratorStep2', {
                  json: (chunks) => (
                    <a href={palette('json')} className="btn btn-sm btn-primary">
                      {chunks}
                    </a>
                  ),
                  code: (chunks) => <code>{chunks}</code>,
                })}
              </li>
              <li>
                {t.rich('colorGuide.item.swatchDialog.illustratorStep3', {
                  keys: () => keys,
                  strong: (chunks) => <strong>{chunks}</strong>,
                  code: (chunks) => <code>{chunks}</code>,
                })}
              </li>
              <li>
                {t.rich('colorGuide.item.swatchDialog.illustratorStep4', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                  code: (chunks) => <code>{chunks}</code>,
                })}
              </li>
            </ul>
            <Embed src="https://www.youtube.com/embed/oobQZ2xiDB8" />
          </div>
        )}
        {program === 'inkscape' && (
          <div className="section inkscape">
            <h4>{t('colorGuide.item.swatchDialog.inkscapeTitle')}</h4>
            <p>
              {t.rich('colorGuide.item.swatchDialog.inkscapeStep1', {
                gpl: (chunks) => (
                  <a href={palette('gpl')} className="btn btn-sm btn-primary">
                    {chunks}
                  </a>
                ),
                code: (chunks) => <code>{chunks}</code>,
              })}
            </p>
            <p>
              {t.rich('colorGuide.item.swatchDialog.inkscapeStep2', {
                em: (chunks) => <em>{chunks}</em>,
                kbd: (chunks) => <kbd>{chunks}</kbd>,
              })}
            </p>
            <Embed src="https://www.youtube.com/embed/zmaJhbIKQqM" />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="link" onClick={onClose}>
          {t('colorGuide.item.swatchDialog.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

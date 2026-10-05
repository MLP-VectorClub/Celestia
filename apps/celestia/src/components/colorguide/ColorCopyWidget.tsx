import { useTranslations } from 'next-intl';
import { FC, useMemo } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { useColorCopySettings } from 'src/hooks/color-copy';
import { useSidebarWidget } from 'src/hooks/sidebar-widget';

/** The "Color Guide" sidebar section of the old site: what clicking a color does and whether the `#` is copied; plus a switch for devices without Shift */
export const ColorCopyWidget: FC = () => {
  const t = useTranslations();
  const { copyHash, rgbOnClick, setCopyHash, setRgbOnClick } = useColorCopySettings();
  return (
    <section id="hash-copy" className="text-center">
      <h2>{t('colorGuide.colorCopy.widgetTitle')}</h2>
      <p>{t('colorGuide.colorCopy.widgetHint')}</p>
      <FormGroup check className="d-inline-block text-start mb-1">
        <Input id="toggle-copy-hash" type="checkbox" checked={copyHash} onChange={(e) => setCopyHash(e.target.checked)} />
        <Label for="toggle-copy-hash" check>
          {t('colorGuide.colorCopy.copyHash')}
        </Label>
      </FormGroup>
      <br />
      <FormGroup check className="d-inline-block text-start">
        <Input id="toggle-rgb-click" type="checkbox" checked={rgbOnClick} onChange={(e) => setRgbOnClick(e.target.checked)} />
        <Label for="toggle-rgb-click" check>
          {t('colorGuide.colorCopy.rgbOnClick')}
        </Label>
      </FormGroup>
    </section>
  );
};

/** Puts the widget in the sidebar for as long as the page is shown */
export function useColorCopyWidget(): void {
  const widget = useMemo(() => <ColorCopyWidget />, []);
  useSidebarWidget(widget);
}

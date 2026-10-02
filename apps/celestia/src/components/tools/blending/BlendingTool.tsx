import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Alert } from 'reactstrap';

import styles from 'modules/Blending.module.scss';
import { BlendingInputs } from 'src/components/tools/blending/BlendingInputs';
import { BlendingResultView } from 'src/components/tools/blending/BlendingResult';
import { RgbEntryDialog } from 'src/components/tools/blending/RgbEntryDialog';
import { BlendingField, useBlending } from 'src/components/tools/blending/useBlending';
import { MAX_RELIABLE_DELTA } from 'src/utils/color';

/** Finds the original color from two backgrounds and the blended results over them */
export const BlendingTool: FC = () => {
  const t = useTranslations();
  const { values, setField, result } = useBlending();
  const [rgbField, setRgbField] = useState<BlendingField | null>(null);

  return (
    <>
      <div className={styles.wrap}>
        <BlendingInputs values={values} onChange={setField} onRequestRgb={setRgbField} />
        <span className={styles.arrow} aria-hidden>
          →
        </span>
        <BlendingResultView result={result} />
      </div>
      {result && result.delta > MAX_RELIABLE_DELTA && (
        <Alert color="warning" fade={false} className="mt-3 text-center">
          {t('tools.blending.inaccurate')}
        </Alert>
      )}
      <RgbEntryDialog
        initial={rgbField ? values[rgbField] : null}
        onClose={() => setRgbField(null)}
        onSubmit={(hex) => rgbField && setField(rgbField, hex)}
      />
    </>
  );
};

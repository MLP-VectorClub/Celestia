import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Button } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { describeApiError, useApiMutation } from 'src/hooks';
import { AdminService } from 'src/services/admin';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/** The developer-only "Export" and "Re-index" buttons of the color guide list; the answer or error shows underneath */
export const DeveloperGuideButtons: FC = () => {
  const t = useTranslations();
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const reindex = useApiMutation(() => AdminService.reindexColorGuide(), {
    onSuccess: (data) => setMessage({ text: data.message, error: false }),
  });
  const exportGuide = useApiMutation(() => AdminService.exportColorGuide(), {
    onSuccess: (blob) => {
      setMessage(null);
      downloadBlob(blob, 'mlpvc-colorguide.json');
    },
  });
  const failure = reindex.error || exportGuide.error;

  return (
    <>
      <Button color="primary" id="cg-export" disabled={exportGuide.isPending} onClick={() => exportGuide.mutate()}>
        <InlineIcon icon="download" first />
        {t('colorGuide.index.buttons.export')}
      </Button>
      <Button color="warning" id="cg-reindex" disabled={reindex.isPending} onClick={() => reindex.mutate()}>
        <InlineIcon icon="database" first />
        {t('colorGuide.index.buttons.reindex')}
      </Button>
      {(message || failure) && (
        <div role="status" className={`w-100 text-center small ${failure ? 'text-danger' : 'text-success'}`}>
          {failure ? describeApiError(failure) : message?.text}
        </div>
      )}
    </>
  );
};

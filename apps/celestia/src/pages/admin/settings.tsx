import { useQuery } from '@tanstack/react-query';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { AdminPage } from 'src/components/admin/AdminPage';
import { describeApiError, useApiMutation, useAuth } from 'src/hooks';
import { AdminService, SiteSettingKey } from 'src/services/admin';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';
import { permission } from 'src/utils/permission';

const SETTINGS: Array<{ name: SiteSettingKey; textKey: string; multiline: boolean }> = [
  { name: 'reservation_rules', textKey: 'reservationRules', multiline: true },
  { name: 'about_reservations', textKey: 'aboutReservations', multiline: true },
  { name: 'dev_role_label', textKey: 'devRoleLabel', multiline: false },
];

const SettingForm: FC<(typeof SETTINGS)[number]> = ({ name: settingKey, textKey, multiline }) => {
  const t = useTranslations();
  const stored = useQuery({
    queryKey: [`/settings/${settingKey}`],
    queryFn: () => AdminService.getSetting(settingKey).then((r) => r.data.value),
  });
  const [value, setValue] = useState('');
  useEffect(() => {
    if (stored.data !== undefined) setValue(stored.data);
  }, [stored.data]);
  const save = useApiMutation(() => AdminService.setSetting(settingKey, value), { invalidate: [[`/settings/${settingKey}`]] });
  const id = `setting-${settingKey}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <FormGroup>
        <Label for={id}>{t(`admin.settings.${textKey}.label`)}</Label>
        <Input
          id={id}
          type={multiline ? 'textarea' : 'text'}
          rows={6}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={stored.isLoading}
        />
        <FormText>{t(`admin.settings.${textKey}.help`)}</FormText>
        {stored.isError && <div className="text-danger small">{t('admin.settings.loadFailed')}</div>}
        {save.error && <div className="text-danger small">{describeApiError(save.error)}</div>}
        <Button color="primary" size="sm" className="mt-2" disabled={save.isPending || stored.isLoading || value === stored.data}>
          {t('admin.settings.save')}
        </Button>
        {save.isSuccess && value === stored.data && <small className="ms-2 text-muted">{t('admin.settings.saved')}</small>}
      </FormGroup>
    </form>
  );
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const DeveloperTools: FC = () => {
  const t = useTranslations();
  const reindex = useApiMutation(() => AdminService.reindexColorGuide());
  const [exportFailed, setExportFailed] = useState(false);
  const exportGuide = useApiMutation(() => AdminService.exportColorGuide(), {
    onSuccess: (blob) => {
      setExportFailed(false);
      downloadBlob(blob, 'mlpvc-colorguide.json');
    },
  });

  return (
    <section id="developer-tools" className="mt-4">
      <h2 className="h5">{t('admin.settings.developerTools.heading')}</h2>
      <FormGroup>
        <Button color="secondary" size="sm" id="reindex-color-guide" disabled={reindex.isPending} onClick={() => reindex.mutate()}>
          {t('admin.settings.developerTools.reindex.button')}
        </Button>
        <FormText className="d-block">{t('admin.settings.developerTools.reindex.help')}</FormText>
        {reindex.isSuccess && <div className="text-success small">{reindex.data.message}</div>}
        {reindex.error && <div className="text-danger small">{describeApiError(reindex.error)}</div>}
      </FormGroup>
      <FormGroup>
        <Button
          color="secondary"
          size="sm"
          id="export-color-guide"
          disabled={exportGuide.isPending}
          onClick={() => {
            setExportFailed(false);
            exportGuide.mutate(undefined, { onError: () => setExportFailed(true) });
          }}
        >
          {t('admin.settings.developerTools.export.button')}
        </Button>
        <FormText className="d-block">{t('admin.settings.developerTools.export.help')}</FormText>
        {(exportFailed || exportGuide.error) && (
          <div className="text-danger small">
            {exportGuide.error ? describeApiError(exportGuide.error) : t('admin.settings.developerTools.export.failed')}
          </div>
        )}
      </FormGroup>
    </section>
  );
};

const SettingsPage: NextPage = () => {
  const { user } = useAuth();
  const isDeveloper = permission(user, 'developer');
  return (
    <AdminPage section="settings">
      {SETTINGS.filter((s) => s.name !== 'dev_role_label' || isDeveloper).map((s) => (
        <SettingForm key={s.name} {...s} />
      ))}
      {isDeveloper && <DeveloperTools />}
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('settings');

export default SettingsPage;

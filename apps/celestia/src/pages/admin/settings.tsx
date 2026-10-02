import { useQuery } from '@tanstack/react-query';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { AdminPage } from 'src/components/admin/AdminPage';
import { describeApiError, useApiMutation } from 'src/hooks';
import { AdminService, SiteSettingKey } from 'src/services/admin';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';

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

const SettingsPage: NextPage = () => (
  <AdminPage section="settings">
    {SETTINGS.map((s) => (
      <SettingForm key={s.name} {...s} />
    ))}
  </AdminPage>
);

export const getServerSideProps = createAdminGetServerSideProps('settings');

export default SettingsPage;

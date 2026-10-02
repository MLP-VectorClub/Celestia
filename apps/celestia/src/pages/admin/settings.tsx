import { useQuery } from '@tanstack/react-query';
import { NextPage } from 'next';
import { FC, useEffect, useState } from 'react';
import { Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { AdminPage } from 'src/components/admin/AdminPage';
import { describeApiError, useApiMutation } from 'src/hooks';
import { AdminService, SiteSettingKey } from 'src/services/admin';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';

const SETTINGS: Array<{ name: SiteSettingKey; label: string; help: string; multiline: boolean }> = [
  { name: 'reservation_rules', label: 'Reservation rules', help: 'Shown next to the reservation form.', multiline: true },
  { name: 'about_reservations', label: 'About reservations', help: 'Shown on the reservations info page.', multiline: true },
  { name: 'dev_role_label', label: 'Developer role label', help: 'How the developer role is named on profiles.', multiline: false },
];

const SettingForm: FC<(typeof SETTINGS)[number]> = ({ name: settingKey, label, help, multiline }) => {
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
        <Label for={id}>{label}</Label>
        <Input
          id={id}
          type={multiline ? 'textarea' : 'text'}
          rows={6}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={stored.isLoading}
        />
        <FormText>{help}</FormText>
        {stored.isError && <div className="text-danger small">Could not load this setting.</div>}
        {save.error && <div className="text-danger small">{describeApiError(save.error)}</div>}
        <Button color="primary" size="sm" className="mt-2" disabled={save.isPending || stored.isLoading || value === stored.data}>
          Save
        </Button>
        {save.isSuccess && value === stored.data && <small className="ms-2 text-muted">Saved.</small>}
      </FormGroup>
    </form>
  );
};

const SettingsPage: NextPage = () => (
  <AdminPage title="Settings">
    {SETTINGS.map((s) => (
      <SettingForm key={s.name} {...s} />
    ))}
  </AdminPage>
);

export const getServerSideProps = createAdminGetServerSideProps('Settings');

export default SettingsPage;

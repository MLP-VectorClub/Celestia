import { useTranslations } from 'next-intl';
import { FC, FormEvent, useEffect, useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';

import { useHydrated } from 'src/hooks/hydrated';
import { getStatsOptOutExpiry, isStatsOptedOut, setStatsOptOut } from 'src/utils/stats-opt-out';
import { reconnectSocket } from 'src/utils/websocket';

/**
 * The opt-out from the anonymous visitor statistics (see `utils/stats-opt-out.ts`). Saving sets or removes a cookie and sends no request; the open
 * websocket connection is started over so the server hears the new choice right away. The cookie only exists in the browser, so nothing about the
 * saved choice is shown until the page is running.
 */
const StatsOptOutForm: FC = () => {
  const t = useTranslations('privacyPolicy.statistics.optOut');
  const hydrated = useHydrated();
  /** What is stored on this device right now, as opposed to the checkbox, which may not be saved yet */
  const [saved, setSaved] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const refresh = () => {
    const optedOut = isStatsOptedOut();
    setSaved(optedOut);
    setExpiresAt(optedOut ? getStatsOptOutExpiry() : null);
    return optedOut;
  };

  useEffect(() => {
    setChecked(refresh());
  }, []);

  const save = (event: FormEvent) => {
    event.preventDefault();
    setStatsOptOut(checked);
    refresh();
    reconnectSocket();
    setJustSaved(true);
  };

  return (
    <form className="stats-opt-out-form" onSubmit={save}>
      {hydrated && (
        <p role="status">
          <strong>{saved ? t('statusOptedOut') : t('statusNotOptedOut')}</strong>
        </p>
      )}
      <FormGroup check>
        <Input
          type="checkbox"
          id="stats-opt-out"
          checked={checked}
          disabled={!hydrated}
          onChange={(event) => {
            setChecked(event.target.checked);
            setJustSaved(false);
          }}
        />
        <Label check for="stats-opt-out">
          {t('label')}
        </Label>
      </FormGroup>
      {hydrated && saved && expiresAt !== null && (
        <p className="mt-2 mb-0">
          <small>{t('cookieExpiry', { date: new Date(expiresAt).toLocaleDateString('en', { dateStyle: 'long', timeZone: 'UTC' }) })}</small>
        </p>
      )}
      <Button type="submit" id="stats-opt-out-save" color="primary" size="sm" className="mt-2" disabled={!hydrated || checked === saved}>
        {t('save')}
      </Button>
      {justSaved && <span className="ms-2">{t('saved')}</span>}
    </form>
  );
};

export default StatsOptOutForm;

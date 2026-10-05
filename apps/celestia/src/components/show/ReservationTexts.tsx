import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';

import { GetShowReservationInfoResult } from '@mlp-vectorclub/api-types';
import styles from 'modules/ShowEntry.module.scss';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import InlineIcon from 'src/components/shared/InlineIcon';
import { RibbonHeading } from 'src/components/show/RibbonHeading';
import { describeApiError, useApiMutation, useAuth, useReservationInfo } from 'src/hooks';
import { AdminService } from 'src/services/admin';
import { Nullable } from 'src/types';
import { ENDPOINTS } from 'src/utils';

type SettingKey = 'about_reservations' | 'reservation_rules';

/** Staff edit one of the two texts as HTML, the API sanitizes it and answers with what it kept */
const EditTextDialog: FC<{ settingKey: SettingKey; isOpen: boolean; onClose: () => void }> = ({ settingKey, isOpen, onClose }) => {
  const t = useTranslations();
  const stored = useQuery({
    queryKey: [`/settings/${settingKey}`],
    queryFn: () => AdminService.getSetting(settingKey).then((r) => r.data.value),
    enabled: isOpen,
  });
  const [value, setValue] = useState('');
  useEffect(() => {
    if (isOpen && stored.data !== undefined) setValue(stored.data);
  }, [isOpen, stored.data]);
  const save = useApiMutation(() => AdminService.setSetting(settingKey, value), {
    invalidate: [[`/settings/${settingKey}`], [ENDPOINTS.SHOW_RESERVATION_INFO]],
    onSuccess: onClose,
  });
  const id = `edit-${settingKey}`;

  return (
    <FormDialog
      title={t(settingKey === 'about_reservations' ? 'show.entry.aboutReservations' : 'show.entry.reservationRules')}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={() => save.mutate()}
      submitLabel={t('show.entry.saveText')}
      busy={save.isPending}
      error={save.error ? describeApiError(save.error) : stored.isError ? t('show.entry.loadTextFailed') : null}
    >
      <FormGroup>
        <Label for={id}>{t('show.entry.textHtml')}</Label>
        <Input id={id} type="textarea" rows={10} value={value} onChange={(e) => setValue(e.target.value)} disabled={stored.isLoading} />
      </FormGroup>
    </FormDialog>
  );
};

const TextSection: FC<{
  className: string;
  color: 'blue' | 'orange';
  title: string;
  html: string;
  settingKey: SettingKey;
  canEdit: boolean;
}> = ({ className, color, title, html, settingKey, canEdit }) => {
  const t = useTranslations();
  const [editing, setEditing] = useState(false);
  return (
    <section className={classNames(styles.section, styles[color], className)}>
      <RibbonHeading color={color}>
        {title}
        {canEdit && (
          <>
            <Button color={color === 'blue' ? 'primary' : 'warning'} size="sm" id={`edit-${settingKey}`} onClick={() => setEditing(true)}>
              <InlineIcon icon="pencil-alt" first />
              {t('show.entry.edit')}
            </Button>
            <EditTextDialog settingKey={settingKey} isOpen={editing} onClose={() => setEditing(false)} />
          </>
        )}
      </RibbonHeading>
      {/* The API sanitized this HTML when staff saved it (only paragraphs, lists and the usual inline tags are kept) */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
};

/** "What Vector Reservations Are" and "Reservation Rules" at the top of every episode page, editable by staff */
export const ReservationTexts: FC<{ initial?: Nullable<GetShowReservationInfoResult> }> = ({ initial }) => {
  const t = useTranslations();
  const info = useReservationInfo(initial || undefined);
  const { isStaff } = useAuth();
  if (!info) return null;
  return (
    <>
      <TextSection
        className="about-res"
        color="blue"
        title={t('show.entry.aboutReservations')}
        html={info.aboutReservations}
        settingKey="about_reservations"
        canEdit={isStaff}
      />
      <TextSection
        className={classNames('rules', styles.rules)}
        color="orange"
        title={t('show.entry.reservationRules')}
        html={info.reservationRules}
        settingKey="reservation_rules"
        canEdit={isStaff}
      />
    </>
  );
};

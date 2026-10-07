import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, useState } from 'react';
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import Axios from 'axios';

import { PostItem, ShowListItem } from '@mlp-vectorclub/api-types';
import { ImageZoomLink } from 'src/components/shared/ImageZoomLink';
import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import { describeApiError, useApiMutation, useAuth } from 'src/hooks';
import { PATHS } from 'src/paths';
import { PostService } from 'src/services/posts';
import { UnifiedErrorResponse } from 'src/types';
import { httpResponseMapper } from 'src/utils';
import { permission } from 'src/utils/permission';
import { formatShowId } from 'src/utils/show';
import postStyles from 'modules/PostList.module.scss';

type Suggestion = PostItem & { show: ShowListItem };

/** "Request Roulette™" of the pending reservations section: a random open request, again and again, with a reserve button for members */
export const RequestRouletteDialog: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [loaded, setLoaded] = useState<number[]>([]);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<UnifiedErrorResponse | null>(null);
  const reserve = useApiMutation((id: number) => PostService.reserve(id));

  const draw = async () => {
    setBusy(true);
    setError(null);
    setImageFailed(false);
    try {
      const { data } = await Axios.get<{ post: Suggestion }>('/posts/requests/suggestion', { params: loaded.length ? { alreadyLoaded: loaded.join(',') } : {} });
      setLoaded((ids) => [...ids, data.post.id]);
      setSuggestion(data.post);
    } catch (e) {
      setSuggestion(null);
      setError(httpResponseMapper(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal className="modal-ui" centered isOpen={isOpen} toggle={onClose}>
      <ModalHeader toggle={onClose}>{t('users.roulette.title')}</ModalHeader>
      <ModalBody>
        <p>{t('users.roulette.intro1')}</p>
        <p>{t('users.roulette.intro2')}</p>
        <p>{t('users.roulette.intro3')}</p>
        <div className="text-center">
          <Button color="orange" size="lg" id="suggestion-press" disabled={busy} onClick={() => void draw()}>
            <InlineIcon icon="lightbulb" first />
            {t('users.roulette.give')}
          </Button>
        </div>
        {error && (
          <Alert color="danger" fade={false} className="mt-3" role="alert">
            {describeApiError(error)}
          </Alert>
        )}
        {imageFailed && (
          <Alert color="danger" fade={false} className="mt-3" role="alert">
            {t('users.roulette.imageFailed')}
          </Alert>
        )}
        {suggestion && (
          <ul className={postStyles.list} id="suggestion-output">
            <li id={`request-${suggestion.id}`} className={postStyles.card}>
              {!imageFailed && (
                <div className={postStyles.image}>
                  <ImageZoomLink href={suggestion.fullsizeUrl} alt={suggestion.label}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={suggestion.fullsizeUrl} alt={suggestion.label} onError={() => setImageFailed(true)} />
                  </ImageZoomLink>
                </div>
              )}
              {suggestion.label && <span className={postStyles.label}>{suggestion.label}</span>}
              <em className={postStyles.infoLine}>
                {t('users.roulette.requested')} <TimeAgo date={suggestion.postedAt} /> {t('users.roulette.under')}{' '}
                <Link href={PATHS.EPISODE(suggestion.show)} title={suggestion.show.title}>
                  {formatShowId(suggestion.show)}
                </Link>
              </em>
              {suggestion.type && <em className={postStyles.infoLine}>{t('users.roulette.category', { category: t(`show.post.sections.${suggestion.type}`) })}</em>}
              {permission(user, 'member') ? (
                reserve.isSuccess ? (
                  <strong className="text-success">{t('users.roulette.reserved')}</strong>
                ) : (
                  <Button color="primary" className="reserve-request" disabled={reserve.isPending} onClick={() => reserve.mutate(suggestion.id)}>
                    <InlineIcon icon="plus" first />
                    {t('users.roulette.reserve')}
                  </Button>
                )
              ) : (
                <Button tag={Link} href={`/s/${suggestion.id.toString(36)}`} color="blue">
                  {t('users.roulette.viewOnPage')}
                </Button>
              )}
              {reserve.error && <div className="text-danger small">{describeApiError(reserve.error)}</div>}
            </li>
          </ul>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="link" onClick={onClose}>
          {t('users.roulette.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

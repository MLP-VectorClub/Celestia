import { useTranslations } from 'next-intl';
import { FC } from 'react';

import ExternalLink from 'src/components/shared/ExternalLink';
import LoadingRing from 'src/components/shared/LoadingRing';
import { LazyImage } from 'src/components/show/PostImages';
import { useEventFinishedImage } from 'src/hooks';
import { Status } from 'src/types';
import { createFavMeUrl } from 'src/utils/url';

/** The finished collaboration: the submission's image linking to it, or the plain link when DeviantArt does not answer */
export const EventFinishedImage: FC<{ id: number; favMeId: string }> = ({ id, favMeId }) => {
  const t = useTranslations();
  const { image, status } = useEventFinishedImage({ id }, true);
  const url = createFavMeUrl(favMeId);

  if (status === Status.LOAD) return <LoadingRing />;
  if (!image) {
    return (
      <p>
        {t('events.details.finishedImageUnavailable')} <ExternalLink href={url}>{url}</ExternalLink>
      </p>
    );
  }

  return (
    <div className="text-center">
      <a href={url} target="_blank" rel="noopener noreferrer">
        <LazyImage src={image.previewUrl} alt={image.title ?? t('events.details.finishedImage')} />
      </a>
    </div>
  );
};

import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';

import { PostItem } from '@mlp-vectorclub/api-types';
import styles from 'modules/PostList.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import LoadingRing from 'src/components/shared/LoadingRing';
import { usePostDeviation, useInView } from 'src/hooks';
import { Status } from 'src/types';
import { createFavMeUrl } from 'src/utils/url';

const ImagePromise: FC<{ deviation?: boolean }> = ({ deviation = false }) => (
  <div className={classNames(styles.promise, { [styles.promiseDeviation]: deviation })}>
    <LoadingRing className={styles.spinner} />
  </div>
);

/** An image of a post that is only requested once it is near the viewport, with a spinner in its place until it has loaded */
export const LazyImage: FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [loaded, setLoaded] = useState(false);
  return (
    <span ref={ref} className="d-block">
      {seen && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} hidden={!loaded} />
      )}
      {!loaded && <ImagePromise />}
    </span>
  );
};

/** The screencap the post was made for, linking to the full size image */
export const ScreencapImage: FC<{ post: PostItem }> = ({ post }) => (
  <div className={classNames(styles.image, styles.screencap)}>
    <a href={post.fullsizeUrl} target="_blank" rel="noopener noreferrer">
      <LazyImage src={post.previewUrl} alt={post.label} />
    </a>
  </div>
);

/** The finished submission, looked up on DeviantArt once the post is near the viewport */
export const DeviationImage: FC<{ post: PostItem; deviationId: string }> = ({ post, deviationId }) => {
  const t = useTranslations();
  const [ref, seen] = useInView<HTMLDivElement>();
  const { deviation, status } = usePostDeviation({ id: post.id }, seen);
  const [loaded, setLoaded] = useState(false);
  const link = createFavMeUrl(deviationId);

  if (status === Status.FAILURE || (status === Status.SUCCESS && !deviation?.previewUrl)) {
    return (
      <div ref={ref} className={styles.image}>
        <a className={styles.unavailable} href={link} target="_blank" rel="noopener noreferrer">
          {t('show.post.previewUnavailable')}
          <br />
          <small>{t('show.post.clickToView')}</small>
        </a>
      </div>
    );
  }

  return (
    <div ref={ref} className={classNames(styles.image, styles.deviation, { [styles.approved]: post.approved })}>
      {deviation?.previewUrl && (
        <a href={link} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={deviation.previewUrl}
            alt={deviation.title}
            title={deviation.author ? `${deviation.title} – ${deviation.author}` : deviation.title}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            hidden={!loaded}
          />
          {loaded && post.approved && (
            <span className={styles.approvedMark} title={t('show.post.approvedHint')}>
              <InlineIcon icon="check-circle" className="fa-2x" />
            </span>
          )}
        </a>
      )}
      {!(deviation?.previewUrl && loaded) && <ImagePromise deviation />}
    </div>
  );
};

import { useQuery } from '@tanstack/react-query';
import Axios from 'axios';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';
import { Button } from 'reactstrap';

import { GetAdminPostsRecentResult, GetAdminSearchStatusResult } from '@mlp-vectorclub/api-types';
import postStyles from 'modules/PostList.module.scss';
import { ADMIN_SECTIONS, AdminPage, DEVELOPER_SECTIONS } from 'src/components/admin/AdminPage';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import InlineIcon from 'src/components/shared/InlineIcon';
import { PostListItem } from 'src/components/show/PostListItem';
import { API_HOST } from 'src/config';
import { useAuth } from 'src/hooks';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';
import { permission } from 'src/utils/permission';

/** Luna's Laravel Horizon dashboard (queues), which only lets developers in; it lives on the API's own address, outside the API prefix */
const HORIZON_URL = `${API_HOST.replace(/^http:\/\/(?!localhost|127\.)/, 'https://')}/horizon`;

const SearchStatus: FC = () => {
  const t = useTranslations();
  const status = useQuery({
    queryKey: ['/admin/search-status'],
    queryFn: () => Axios.get<GetAdminSearchStatusResult>('/admin/search-status').then((r) => r.data),
  });
  return (
    <section className="elastic-status">
      <h2>
        <InlineIcon icon="search" first size="xs" />
        {t('admin.index.elasticStatus')}
      </h2>
      {status.isLoading && <p className="text-muted">{t('admin.loading')}</p>}
      {status.isError && <p className="text-danger">{t('admin.index.statusFailed')}</p>}
      {status.data?.down && <strong>{t('admin.index.serverDown')}</strong>}
      {status.data && !status.data.down && (
        <>
          <pre>
            <code>
              <strong>{t('admin.index.indices')}</strong>
              {'\n'}
              {status.data.indices.join('\n')}
            </code>
          </pre>
          <pre>
            <code>
              <strong>{t('admin.index.nodes')}</strong>
              {'\n'}
              {status.data.nodes.join('\n')}
            </code>
          </pre>
        </>
      )}
    </section>
  );
};

const AdminIndexPage: NextPage = () => {
  const t = useTranslations();
  const { user, isStaff } = useAuth();
  const recent = useQuery({
    queryKey: ['/admin/posts/recent'],
    queryFn: () => Axios.get<GetAdminPostsRecentResult>('/admin/posts/recent').then((r) => r.data.posts),
    enabled: isStaff,
  });

  return (
    <AdminPage section="index">
      <ButtonCollection>
        {ADMIN_SECTIONS.map((s) => (
          <Button key={s.href} tag={Link} href={s.href} color="guide-link">
            <InlineIcon icon={s.icon} first />
            {t(`admin.buttons.${s.key}`)}
          </Button>
        ))}
        {permission(user, 'developer') &&
          DEVELOPER_SECTIONS.map((s) => (
            <Button key={s.href} tag={Link} href={s.href} color="guide-link">
              <InlineIcon icon={s.icon} first />
              {t(`admin.buttons.${s.key}`)}
            </Button>
          ))}
        {permission(user, 'developer') && (
          <Button tag="a" href={HORIZON_URL} target="_blank" rel="noopener noreferrer" color="guide-link" className="horizon">
            <InlineIcon icon="external-link-alt" first />
            {t('admin.buttons.queues')}
          </Button>
        )}
      </ButtonCollection>
      {permission(user, 'developer') && <SearchStatus />}
      <section className="recent-posts">
        <h2>
          <InlineIcon icon="bell" first size="xs" />
          {t('admin.index.recentPosts', { count: recent.data?.length ?? 20 })}
        </h2>
        {recent.isLoading && <p className="text-muted">{t('admin.loading')}</p>}
        {recent.isError && <p className="text-danger">{t('admin.index.recentFailed')}</p>}
        <ul className={postStyles.list}>
          {recent.data?.map((post) => (
            <PostListItem key={post.id} post={post} viewOnly />
          ))}
        </ul>
      </section>
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('index');

export default AdminIndexPage;

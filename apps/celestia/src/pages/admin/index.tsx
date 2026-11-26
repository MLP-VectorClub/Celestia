import { useQuery } from '@tanstack/react-query';
import { GetAdminPostsRecentResult } from '@went.tf/mlp-vectorclub-api-types';
import Axios from 'axios';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from 'reactstrap';

import postStyles from 'modules/PostList.module.scss';
import { ADMIN_SECTIONS, AdminPage, DEVELOPER_SECTIONS } from 'src/components/admin/AdminPage';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import InlineIcon from 'src/components/shared/InlineIcon';
import { PostListItem } from 'src/components/show/PostListItem';
import { API_HOST } from 'src/config';
import { useAuth } from 'src/hooks';
import { createAdminGetServerSideProps, fetchForAdminPage } from 'src/utils/admin-page';
import { permission } from 'src/utils/permission';
import { toPublicUrl } from 'src/utils/public-url';

/** Luna's Laravel Horizon dashboard (queues), which only lets developers in; it lives on the API's own address, outside the API prefix */
const HORIZON_URL = `${toPublicUrl(API_HOST)}/horizon`;

type PropTypes = {
  /** What the server fetched with the visitor's session, null when it failed */
  initialRecent: GetAdminPostsRecentResult | null;
};

const AdminIndexPage: NextPage<PropTypes> = ({ initialRecent }) => {
  const t = useTranslations();
  const { user, isStaff } = useAuth();
  const recent = useQuery({
    queryKey: ['/admin/posts/recent'],
    queryFn: () => Axios.get<GetAdminPostsRecentResult>('/admin/posts/recent').then((r) => r.data.posts),
    enabled: isStaff,
    initialData: initialRecent?.posts,
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

export const getServerSideProps = createAdminGetServerSideProps('index', 'staff', async (ctx): Promise<PropTypes> => {
  const initialRecent = await fetchForAdminPage<GetAdminPostsRecentResult>(ctx, '/admin/posts/recent');
  return { initialRecent };
});

export default AdminIndexPage;

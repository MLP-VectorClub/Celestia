import { NextPage } from 'next';

import { ShowEntryPage, ShowEntryPageProps } from 'src/components/show/ShowEntryPage';
import { createShowGetServerSideProps } from 'src/utils/show-page';

const SpecialPage: NextPage<ShowEntryPageProps> = (props) => <ShowEntryPage {...props} />;

export const getServerSideProps = createShowGetServerSideProps('special');

export default SpecialPage;

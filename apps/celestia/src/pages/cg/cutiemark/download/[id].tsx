import { GetServerSideProps, NextPage } from 'next';

import { sendCutieMarkFile } from 'src/utils/cutiemark-file';

/** `/cg/cutiemark/download/{id}` (the old addresses also carried the appearance's name after a dash), the cutie mark as an SVG download */
const CutieMarkDownload: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const match = /^(\d+)(?:-.*)?$/.exec(String(ctx.query.id ?? ''));
  return sendCutieMarkFile(ctx, match?.[1], 'download');
};

export default CutieMarkDownload;

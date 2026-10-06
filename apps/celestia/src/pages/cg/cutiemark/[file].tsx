import { GetServerSideProps, NextPage } from 'next';

import { sendCutieMarkFile } from 'src/utils/cutiemark-file';

/** `/cg/cutiemark/{id}.svg`, the old site's address of a cutie mark file; only the server side does anything */
const CutieMarkFile: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const match = /^(\d+)\.svg$/.exec(String(ctx.query.file ?? ''));
  return sendCutieMarkFile(ctx, match?.[1], 'image');
};

export default CutieMarkFile;

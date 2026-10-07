const buildIdRegex = /^[a-f0-9]+;\d+$/i;

export type BuildIdParseResult = string | { commitId: string; commitTime: Date };

export const getBuildData: () => BuildIdParseResult = () => {
  // With a deployment ID Next.js's own build ID is a constant, the commit comes from next.config.js
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || window.__NEXT_DATA__.buildId;

  if (!buildIdRegex.test(buildId)) {
    // Spit back build ID if it does not match the expected format
    return buildId;
  }

  const [commitId, rawCommitTime] = buildId.split(';');

  return {
    commitId,
    commitTime: new Date(1e3 * Number(rawCommitTime)),
  };
};

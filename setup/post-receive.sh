#!/usr/bin/env bash
echo "##### post-receive hook #####"
read oldrev newrev refname
echo "Push triggered update to revision $newrev ($refname)"

RUN_FOR_REF="refs/heads/main"
if [[ "$refname" ==  "$RUN_FOR_REF" ]]; then
    GIT="env -i git"
    CMD_CD="cd $(readlink -nf "$PWD/..")"
    CMD_FETCH="$GIT fetch"
    CMD_INSTALL="pnpm install --frozen-lockfile"
    CMD_BUILD="nice pnpm build"
    CMD_RESTART="pnpm reload"

    echo "$ $CMD_CD"
    eval ${CMD_CD}
    echo "$ $CMD_FETCH"
    eval ${CMD_FETCH}

    echo "$ $CMD_INSTALL"
    eval $CMD_INSTALL

    echo "$ $CMD_BUILD"
    if eval $CMD_BUILD; then
      echo "Build successful"
    else
      echo "Build failed"
      exit 1
    fi

    echo "$ $CMD_RESTART"
    eval $CMD_RESTART
else
    echo "Ref does not match $RUN_FOR_REF, exiting."
fi

echo "##### end post-receive hook #####"

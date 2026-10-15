import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FC, useEffect, useMemo } from 'react';
import { Button } from 'reactstrap';

import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { useAuth, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch } from 'src/store';
import { authActions } from 'src/store/slices';
import { AuthModalSide, Translatable } from 'src/types';
import { TitleFactory } from 'src/types/title';

export const ownAccountTitleFactory: TitleFactory = () => {
  const title: Translatable = ['common.titles.account'];
  return { title, breadcrumbs: [{ label: title, active: true }] };
};

/** Where `/users/account` leads a signed in visitor: their own account page, at the section with the password form (only staff have one) */
export const ownAccountPath = (userId: number) => `${PATHS.USER_ACCOUNT(userId)}#security`;

/**
 * `/users/account` of the old site, which `/.well-known/change-password` points at. Signed in visitors are sent to their own account page (on the
 * server when it already knows them), everybody else is asked to sign in and taken there as soon as they have
 */
export const OwnAccountGate: FC = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { replace } = useRouter();
  const { signedIn, user } = useAuth();
  const titleData = useMemo(ownAccountTitleFactory, []);
  useTitleSetter(dispatch, titleData);

  useEffect(() => {
    if (signedIn && user.id !== null) void replace(ownAccountPath(user.id));
    else if (!signedIn) dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN));
  }, [dispatch, replace, signedIn, user.id]);

  return (
    <Content>
      <StandardHeading heading={t('users.account.heading')} lead={t('users.account.signInContinue')} />
      {!signedIn && (
        <div className="text-center">
          <Button color="primary" onClick={() => dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN))}>
            {t('users.account.signIn')}
          </Button>
        </div>
      )}
    </Content>
  );
};

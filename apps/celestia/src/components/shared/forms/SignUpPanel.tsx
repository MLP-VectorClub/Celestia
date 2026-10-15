import { useTranslations } from 'next-intl';
import { FC, ReactNode, useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';

import ExternalLink from 'src/components/shared/ExternalLink';
import { SOCIAL_PROVIDERS } from 'src/fancy-config';
import { useSocialSignIn } from 'src/hooks/social-signin';
import { PATHS } from 'src/paths';
import { useAppDispatch } from 'src/store';
import { authActions } from 'src/store/slices';
import { AuthModalSide } from 'src/types/auth';

/**
 * Accounts are made through DeviantArt only: the first time a DeviantArt user signs in, Luna makes their account (named after their DeviantArt
 * name), so signing up is the sign-in with DeviantArt, after accepting the privacy policy
 */
const SignUpPanel: FC = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const signInWith = useSocialSignIn();
  const [accepted, setAccepted] = useState(false);
  const { name, renderIcon: RenderIcon } = SOCIAL_PROVIDERS.deviantart;
  const text = t('common.auth.signUp.withProvider', { provider: name });

  return (
    <div id="sign-up-panel">
      <p>{t('common.auth.signUp.intro', { provider: name })}</p>
      <p className="text-muted">{t('common.auth.signUp.noPassword', { provider: name })}</p>

      <FormGroup>
        <div className="form-check">
          <Input
            type="checkbox"
            className="form-check-input"
            id="accept-privacy-policy"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <Label check htmlFor="accept-privacy-policy" className="form-check-label">
            {t.rich('common.auth.acceptPrivacyPolicy', {
              link: (chunks: ReactNode) => (
                <ExternalLink href={PATHS.PRIVACY_POLICY} icon>
                  {chunks}
                </ExternalLink>
              ),
            })}
          </Label>
        </div>
      </FormGroup>

      <div className="text-center">
        <Button
          type="button"
          color="deviantart"
          size="lg"
          id="sign-up-deviantart"
          disabled={!accepted}
          onClick={signInWith('deviantart', text)}
        >
          <RenderIcon first />
          {text}
        </Button>
      </div>

      <p className="text-center mt-3 mb-0">
        <a href="#" onClick={(e) => (e.preventDefault(), dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN)))}>
          {t('common.auth.alreadyHaveAccount')}
        </a>
      </p>
    </div>
  );
};

export default SignUpPanel;

import { useTranslations } from 'next-intl';
import { FC, RefObject, useRef } from 'react';
import { Button, UncontrolledTooltip } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import TooltipContent from 'src/components/shared/TooltipContent';

interface RevealPasswordButtonProps {
  setPasswordRevealed: (value: boolean) => void;
  passwordRevealed: boolean;
}

const RevealPasswordButton: FC<RevealPasswordButtonProps> = ({ setPasswordRevealed, passwordRevealed }) => {
  const t = useTranslations();
  const revealBtnRef = useRef<HTMLButtonElement>(null) as RefObject<HTMLButtonElement>;
  return (
    <>
      <Button color="ui" outline onClick={() => setPasswordRevealed(!passwordRevealed)} innerRef={revealBtnRef}>
        <InlineIcon icon={passwordRevealed ? 'eye-slash' : 'eye'} fixedWidth />
      </Button>
      <UncontrolledTooltip target={revealBtnRef} fade={false}>
        <TooltipContent>{passwordRevealed ? t('common.auth.hidePassword') : t('common.auth.showPassword')}</TooltipContent>
      </UncontrolledTooltip>
    </>
  );
};

export default RevealPasswordButton;

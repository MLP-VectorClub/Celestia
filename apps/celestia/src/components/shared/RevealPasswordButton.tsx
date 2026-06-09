import { Button, UncontrolledTooltip } from 'reactstrap';
import React, { FC, useRef } from 'react';
import InlineIcon from 'src/components/shared/InlineIcon';
import TooltipContent from 'src/components/shared/TooltipContent';
import { useTranslation } from 'next-i18next/pages';

interface RevealPasswordButtonProps {
  setPasswordRevealed: (value: boolean) => void;
  passwordRevealed: boolean;
}

const RevealPasswordButton: FC<RevealPasswordButtonProps> = ({ setPasswordRevealed, passwordRevealed }) => {
  const { t } = useTranslation();
  const revealBtnRef = useRef<HTMLButtonElement>(null) as React.RefObject<HTMLButtonElement>;
  return (
    <>
      <Button color="ui" outline onClick={() => setPasswordRevealed(!passwordRevealed)} innerRef={revealBtnRef}>
        <InlineIcon icon={passwordRevealed ? 'eye-slash' : 'eye'} fixedWidth />
      </Button>
      <UncontrolledTooltip target={revealBtnRef} fade={false}>
        <TooltipContent>
          {passwordRevealed ? t('common:auth.hidePassword') : t('common:auth.showPassword')}
        </TooltipContent>
      </UncontrolledTooltip>
    </>
  );
};

export default RevealPasswordButton;

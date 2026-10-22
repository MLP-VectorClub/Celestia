import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { useHydrated } from 'src/hooks/hydrated';
import { useTheme } from 'src/hooks/theme';
import { THEME_CHOICES, ThemeChoice } from 'src/utils/theme';

const ICONS: Record<ThemeChoice, IconProp> = { system: 'desktop', light: 'sun', dark: 'moon' };

/**
 * The color theme in the sidebar: a button labelled with the current theme that opens a menu of the other two. The choice is applied at once and
 * kept in a cookie (see `useTheme`)
 */
const ThemeSwitcher: FC = () => {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  // The menu needs JavaScript: until the page is running the button is only a label (and `useTheme` cannot know the saved theme yet)
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const labels: Record<ThemeChoice, string> = { system: t('common.theme.system'), light: t('common.theme.light'), dark: t('common.theme.dark') };

  return (
    <Dropdown isOpen={open} toggle={() => setOpen((o) => !o)} className="d-inline-block">
      <DropdownToggle caret size="sm" color="secondary" disabled={!hydrated} aria-label={t('common.theme.current', { theme: labels[theme] })}>
        <InlineIcon icon={ICONS[theme]} first fixedWidth />
        {labels[theme]}
      </DropdownToggle>
      <DropdownMenu container="body">
        {THEME_CHOICES.filter((choice) => choice !== theme).map((choice) => (
          <DropdownItem key={choice} onClick={() => setTheme(choice)}>
            <InlineIcon icon={ICONS[choice]} first fixedWidth />
            {labels[choice]}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default ThemeSwitcher;

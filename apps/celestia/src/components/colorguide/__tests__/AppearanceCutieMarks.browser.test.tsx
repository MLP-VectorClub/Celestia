import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { AppearanceCutieMarks } from 'src/components/colorguide/AppearanceCutieMarks';
import { RelatedAppearancesList } from 'src/components/colorguide/RelatedAppearancesList';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

vi.mock('src/hooks', () => ({ useAuth: () => ({ user: { role: 'user' } }) }));
vi.mock('src/components/shared/InlineIcon', () => ({ default: () => null }));
vi.mock('src/components/colorguide/AppearanceLink', () => ({ AppearanceLink: ({ label }: { label: string }) => <a href="/x">{label}</a> }));

const wrap = (children: React.ReactNode) => <IntlTestProvider>{children}</IntlTestProvider>;

describe('AppearanceCutieMarks', () => {
  it('shows nothing without cutie marks to visitors', async () => {
    const screen = await render(wrap(<AppearanceCutieMarks appearanceId={1} label="Pony" cutieMarks={[]} colorGroups={[]} />));

    expect(screen.container.querySelector('section')).toBeNull();
  });

  it('is a section of its own for editors even without cutie marks, ending in their buttons', async () => {
    const screen = await render(
      wrap(
        <AppearanceCutieMarks
          appearanceId={1}
          label="Pony"
          cutieMarks={[]}
          colorGroups={[]}
          actions={<button type="button">Cutie marks</button>}
        />
      )
    );

    const section = screen.container.querySelector('section.approved-cutie-mark')!;
    await expect.element(screen.getByText('This appearance has no cutie marks yet.')).toBeVisible();
    expect(section.lastElementChild?.textContent).toBe('Cutie marks');
  });
});

describe('RelatedAppearancesList', () => {
  it('lists the appearances as links', async () => {
    const screen = await render(
      <RelatedAppearancesList
        appearances={[
          { id: 1, label: 'Rainbow Dash' },
          { id: 2, label: 'Fluttershy' },
        ]}
      />
    );

    await expect.element(screen.getByRole('link', { name: 'Rainbow Dash' })).toBeVisible();
    await expect.element(screen.getByRole('link', { name: 'Fluttershy' })).toBeVisible();
    expect(screen.container.querySelectorAll('li')).toHaveLength(2);
  });
});

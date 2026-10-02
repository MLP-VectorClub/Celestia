import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { MuffinRating } from 'src/components/shared/MuffinRating';

describe('MuffinRating', () => {
  it('describes the rating and fills that share of the muffins', async () => {
    const screen = await render(<MuffinRating score={4} />);
    const image = screen.getByRole('img', { name: 'Rated 4 out of 5' });
    await expect.element(image).toBeVisible();
    await expect.element(image).toHaveAttribute('data-percent', '80');
  });

  it('rounds the spoken score and caps it at the maximum', async () => {
    const screen = await render(<MuffinRating score={7} />);
    await expect.element(screen.getByRole('img', { name: 'Rated 7 out of 5' })).toHaveAttribute('data-percent', '100');
    const second = await render(<MuffinRating score={3.14159} />);
    await expect.element(second.getByRole('img', { name: 'Rated 3.14 out of 5' })).toBeVisible();
  });

  it('shows no filled muffins before the first vote', async () => {
    const screen = await render(<MuffinRating score={null} />);
    await expect.element(screen.getByRole('img', { name: 'Not rated yet' })).toHaveAttribute('data-percent', '0');
  });

  it('gives every instance its own clip path', async () => {
    const screen = await render(
      <>
        <MuffinRating score={1} />
        <MuffinRating score={5} />
      </>
    );
    const ids = Array.from(screen.container.querySelectorAll('clipPath')).map((el) => el.id);
    expect(new Set(ids).size).toBe(2);
  });
});

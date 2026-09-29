import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import ExternalLink from 'src/components/shared/ExternalLink';

describe('ExternalLink', () => {
  it('should open in a new tab by default', async () => {
    const screen = await render(<ExternalLink href="https://example.com">Example</ExternalLink>);
    const link = screen.getByRole('link', { name: 'Example' });

    await expect.element(link).toHaveAttribute('href', 'https://example.com');
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should open in the same tab when blank is false', async () => {
    const screen = await render(
      <ExternalLink href="https://example.com" blank={false}>
        Example
      </ExternalLink>
    );
    const link = screen.getByRole('link', { name: 'Example' });

    await expect.element(link).not.toHaveAttribute('target');
    await expect.element(link).not.toHaveAttribute('rel');
  });

  it('should render with a custom tag', async () => {
    const screen = await render(
      <ExternalLink href="https://example.com" tag="span" title="Example title">
        Example
      </ExternalLink>
    );

    await expect.element(screen.getByTitle('Example title')).toHaveTextContent('Example');
    expect(screen.container.querySelector('a')).toBeNull();
  });
});

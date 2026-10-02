import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

import { BlendingReverseTool } from 'src/components/tools/blending-reverse/BlendingReverseTool';
import { BlendingTool } from 'src/components/tools/blending/BlendingTool';
import { IntlTestProvider } from 'src/test-utils/IntlTestProvider';

describe('BlendingTool', () => {
  it('shows the recovered color for the example values', async () => {
    const screen = await render(
      <IntlTestProvider>
        <BlendingTool />
      </IntlTestProvider>
    );
    await expect.element(screen.getByText('Background', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Blended color', { exact: true })).toBeVisible();
    // white and black backgrounds with #daf6f7 / #9bb5b6 blended over them
    await expect.element(screen.getByText(/% opacity/)).toBeVisible();
  });

  it('says what is missing while an input is invalid', async () => {
    const screen = await render(
      <IntlTestProvider>
        <BlendingTool />
      </IntlTestProvider>
    );
    await userEvent.fill(screen.getByLabelText('First background'), 'nonsense');
    await expect.element(screen.getByText('(no hex color)')).toBeVisible();
    await expect.element(screen.getByText('(no opacity value)')).toBeVisible();
  });

  it('opens the RGB dialog with Shift+click', async () => {
    const screen = await render(
      <IntlTestProvider>
        <BlendingTool />
      </IntlTestProvider>
    );
    await screen.getByLabelText('First background').click({ modifiers: ['Shift'] });
    await expect.element(screen.getByText('Enter RGB values')).toBeVisible();
    await expect.element(screen.getByLabelText('Red')).toBeVisible();
  });
});

describe('BlendingReverseTool', () => {
  const renderTool = () =>
    render(
      <IntlTestProvider>
        <BlendingReverseTool />
      </IntlTestProvider>
    );

  it('lists its sections and the two filter types', async () => {
    const screen = await renderTool();
    for (const heading of ['Filter type', 'Manual filter override', 'Known color pairs', 'Reverse filter on', 'Sensitivity', 'Overlay']) {
      await expect.element(screen.getByRole('heading', { name: heading })).toBeVisible();
    }
    await expect.element(screen.getByRole('option', { name: 'Normal' })).toBeInTheDocument();
    await expect.element(screen.getByRole('option', { name: 'Multiply' })).toBeInTheDocument();
  });

  it('calculates the filter from two complete color pairs', async () => {
    const screen = await renderTool();
    await expect.element(screen.getByText(/Enter at least two complete color pairs/)).toBeVisible();
    // black -> black and white -> half white is a 50% white filter in the normal blend
    await userEvent.selectOptions(screen.getByLabelText('Filter type', { exact: true }), 'normal');
    await userEvent.fill(screen.getByLabelText('Original color 1'), '#000000');
    await userEvent.fill(screen.getByLabelText('Filtered color 1'), '#808080');
    await userEvent.fill(screen.getByLabelText('Original color 2'), '#ffffff');
    await userEvent.fill(screen.getByLabelText('Filtered color 2'), '#ffffff');
    await expect.element(screen.getByText(/Enter at least two complete color pairs/)).not.toBeInTheDocument();
    await expect.element(screen.getByText('A:')).toBeVisible();
  });

  it('adds and removes color pair rows but keeps at least two', async () => {
    const screen = await renderTool();
    await expect.element(screen.getByRole('button', { name: 'Remove known color pair 1' })).toBeDisabled();
    await screen.getByRole('button', { name: 'Add known color pair' }).click();
    await expect.element(screen.getByLabelText('Original color 3')).toBeVisible();
    await screen.getByRole('button', { name: 'Remove known color pair 3' }).click();
    expect(screen.getByLabelText(/^Original color/).elements()).toHaveLength(2);
  });
});

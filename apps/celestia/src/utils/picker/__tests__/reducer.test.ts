import { describe, expect, it } from 'vitest';

import { PickerAction, PickerState, getActiveTab, initialPickerState, pickerReducer } from 'src/utils/picker/reducer';

const run = (actions: PickerAction[], start: PickerState = initialPickerState) => actions.reduce(pickerReducer, start);
const open = (name: string, hash = name): PickerAction => ({ type: 'openTab', name, hash, width: 100, height: 50, pickingSize: 25 });

describe('tabs', () => {
  it('opens a tab and makes it active', () => {
    const state = run([open('a.png')]);
    expect(state.tabs).toHaveLength(1);
    expect(getActiveTab(state)?.name).toBe('a.png');
    expect(getActiveTab(state)?.pickingSize).toBe(25);
  });

  it('activates the existing tab when the same file is opened again', () => {
    const state = run([open('a.png'), open('b.png'), open('copy-of-a.png', 'a.png')]);
    expect(state.tabs).toHaveLength(2);
    expect(getActiveTab(state)?.name).toBe('a.png');
  });

  it('closing the open tab shows its neighbour, or none when it was the last', () => {
    const three = run([open('a'), open('b'), open('c')]);
    const [a, b, c] = three.tabs.map((t) => t.id);
    expect(getActiveTab(pickerReducer({ ...three, activeId: b }, { type: 'closeTab', id: b }))?.id).toBe(c);
    expect(getActiveTab(pickerReducer(three, { type: 'closeTab', id: c }))?.id).toBe(b);
    expect(
      pickerReducer(pickerReducer(run([open('a')]), { type: 'closeTab', id: a }), { type: 'setTool', tool: 'hand' }).activeId
    ).toBeNull();
  });

  it('keeps the active tab when another one is closed', () => {
    const state = run([open('a'), open('b')]);
    const [a] = state.tabs.map((t) => t.id);
    expect(getActiveTab(pickerReducer(state, { type: 'closeTab', id: a }))?.name).toBe('b');
  });
});

describe('picking areas', () => {
  it("places an area of the tab's size, selects it and gives ids that never repeat", () => {
    const state = run([
      open('a'),
      { type: 'placeArea', shape: 'square', x: 10, y: 10 },
      { type: 'placeArea', shape: 'round', x: 20, y: 20 },
    ]);
    const tab = getActiveTab(state)!;
    expect(tab.areas.map((a) => a.shape)).toEqual(['square', 'round']);
    expect(tab.areas[0].size).toBe(25);
    expect(new Set([tab.id, ...tab.areas.map((a) => a.id)]).size).toBe(3);
    expect(tab.selected).toEqual([tab.areas[1].id]);
  });

  it('does nothing without an open tab', () => {
    expect(pickerReducer(initialPickerState, { type: 'placeArea', shape: 'square', x: 1, y: 1 })).toBe(initialPickerState);
  });

  it('uses the new picking size for areas placed afterwards only', () => {
    const state = run([
      open('a'),
      { type: 'placeArea', shape: 'square', x: 1, y: 1 },
      { type: 'setPickingSize', size: 9999 },
      { type: 'placeArea', shape: 'square', x: 2, y: 2 },
    ]);
    expect(getActiveTab(state)!.areas.map((a) => a.size)).toEqual([25, 400]);
  });

  it('selects, toggles, selects all and clears', () => {
    let state = run([open('a'), { type: 'placeArea', shape: 'square', x: 1, y: 1 }, { type: 'placeArea', shape: 'square', x: 2, y: 2 }]);
    const [first, second] = getActiveTab(state)!.areas.map((a) => a.id);
    state = pickerReducer(state, { type: 'selectAreas', ids: [first], mode: 'replace' });
    expect(getActiveTab(state)!.selected).toEqual([first]);
    state = pickerReducer(state, { type: 'selectAreas', ids: [second], mode: 'toggle' });
    expect(getActiveTab(state)!.selected).toEqual([first, second]);
    state = pickerReducer(state, { type: 'selectAreas', ids: [first, 999], mode: 'toggle' });
    expect(getActiveTab(state)!.selected).toEqual([second]);
    state = pickerReducer(state, { type: 'selectAll', selected: true });
    expect(getActiveTab(state)!.selected).toEqual([first, second]);
    state = pickerReducer(state, { type: 'selectAll', selected: false });
    expect(getActiveTab(state)!.selected).toEqual([]);
  });

  it('reshapes only the listed areas and removes areas with their selection', () => {
    let state = run([open('a'), { type: 'placeArea', shape: 'square', x: 1, y: 1 }, { type: 'placeArea', shape: 'square', x: 2, y: 2 }]);
    const [first, second] = getActiveTab(state)!.areas.map((a) => a.id);
    state = pickerReducer(state, { type: 'reshapeAreas', ids: [first], size: 7, shape: 'round' });
    expect(getActiveTab(state)!.areas.map((a) => [a.shape, a.size])).toEqual([
      ['round', 7],
      ['square', 25],
    ]);
    state = pickerReducer(state, { type: 'removeAreas', ids: [second] });
    expect(getActiveTab(state)!.areas.map((a) => a.id)).toEqual([first]);
    expect(getActiveTab(state)!.selected).toEqual([]);
  });
});

describe('per tab view state', () => {
  it('keeps viewport, levels and color on the active tab only', () => {
    let state = run([open('a'), open('b')]);
    state = pickerReducer(state, { type: 'setViewport', viewport: { zoom: 2, offsetX: 1, offsetY: 2 } });
    state = pickerReducer(state, { type: 'setLevels', levels: { low: 10, high: 5 } });
    state = pickerReducer(state, { type: 'setAreaColor', color: { red: 1, green: 2, blue: 3, alpha: 1 } });
    const [a, b] = state.tabs;
    expect(a.viewport).toBeNull();
    expect(b.viewport).toEqual({ zoom: 2, offsetX: 1, offsetY: 2 });
    expect(b.levels).toEqual({ low: 10, high: 11 });
    expect(b.areaColor.red).toBe(1);
  });
});

import { AreaShape, PickingArea, clampAreaSize, reshapeArea } from 'src/utils/picker/areas';
import { FULL_LEVELS, Levels, normalizeLevels } from 'src/utils/picker/levels';
import { Pixel } from 'src/utils/picker/pixels';
import { Viewport } from 'src/utils/picker/viewport';

export type Tool = 'hand' | 'picker' | 'zoom';

export interface TabState {
  id: number;
  /** Name of the opened file */
  name: string;
  /** Content hash of the file, used to avoid opening the same image twice */
  hash: string;
  width: number;
  height: number;
  areas: PickingArea[];
  /** IDs of the selected areas */
  selected: number[];
  /** `null` until the view has been sized and the image fitted */
  viewport: Viewport | null;
  levels: Levels;
  /** Color the areas are drawn with on this tab */
  areaColor: Pixel;
  /** Size of areas placed on this tab */
  pickingSize: number;
}

export interface PickerState {
  tabs: TabState[];
  activeId: number | null;
  tool: Tool;
  /** Used to create ids for tabs and areas */
  nextId: number;
}

export const DEFAULT_AREA_COLOR: Pixel = { red: 255, green: 0, blue: 255, alpha: 0.5 };

export const initialPickerState: PickerState = { tabs: [], activeId: null, tool: 'picker', nextId: 1 };

export type SelectMode = 'replace' | 'toggle';

export type PickerAction =
  | { type: 'openTab'; name: string; hash: string; width: number; height: number; pickingSize: number }
  | { type: 'activateTab'; id: number }
  | { type: 'closeTab'; id: number }
  | { type: 'setTool'; tool: Tool }
  | { type: 'setPickingSize'; size: number }
  | { type: 'placeArea'; shape: AreaShape; x: number; y: number }
  | { type: 'reshapeAreas'; ids: number[]; size?: number; shape?: AreaShape }
  | { type: 'removeAreas'; ids: number[] }
  | { type: 'selectAreas'; ids: number[]; mode: SelectMode }
  | { type: 'selectAll'; selected: boolean }
  | { type: 'setViewport'; viewport: Viewport }
  | { type: 'setLevels'; levels: Levels }
  | { type: 'setAreaColor'; color: Pixel };

export const getActiveTab = (state: PickerState): TabState | undefined => state.tabs.find((tab) => tab.id === state.activeId);

const updateActive = (state: PickerState, change: (tab: TabState) => TabState): PickerState => {
  if (state.activeId === null) return state;
  return { ...state, tabs: state.tabs.map((tab) => (tab.id === state.activeId ? change(tab) : tab)) };
};

export function pickerReducer(state: PickerState, action: PickerAction): PickerState {
  switch (action.type) {
    case 'openTab': {
      const existing = state.tabs.find((tab) => tab.hash === action.hash);
      if (existing) return { ...state, activeId: existing.id };
      const tab: TabState = {
        id: state.nextId,
        name: action.name,
        hash: action.hash,
        width: action.width,
        height: action.height,
        areas: [],
        selected: [],
        viewport: null,
        levels: FULL_LEVELS,
        areaColor: DEFAULT_AREA_COLOR,
        pickingSize: clampAreaSize(action.pickingSize),
      };
      return { ...state, tabs: [...state.tabs, tab], activeId: tab.id, nextId: state.nextId + 1 };
    }
    case 'activateTab':
      return state.tabs.some((tab) => tab.id === action.id) ? { ...state, activeId: action.id } : state;
    case 'closeTab': {
      const index = state.tabs.findIndex((tab) => tab.id === action.id);
      if (index === -1) return state;
      const tabs = state.tabs.filter((tab) => tab.id !== action.id);
      // Closing the open tab shows the one that took its place, or the last one when it was the rightmost
      const activeId = state.activeId === action.id ? (tabs[Math.min(index, tabs.length - 1)]?.id ?? null) : state.activeId;
      return { ...state, tabs, activeId };
    }
    case 'setTool':
      return { ...state, tool: action.tool };
    case 'setPickingSize':
      return updateActive(state, (tab) => ({ ...tab, pickingSize: clampAreaSize(action.size) }));
    case 'placeArea': {
      if (state.activeId === null) return state;
      const id = state.nextId;
      const next = updateActive(state, (tab) => ({
        ...tab,
        areas: [...tab.areas, { id, shape: action.shape, center: { x: action.x, y: action.y }, size: tab.pickingSize }],
        selected: [id],
      }));
      return { ...next, nextId: id + 1 };
    }
    case 'reshapeAreas':
      return updateActive(state, (tab) => ({
        ...tab,
        areas: tab.areas.map((area) =>
          action.ids.includes(area.id) ? reshapeArea(area, { size: action.size, shape: action.shape }) : area
        ),
      }));
    case 'removeAreas':
      return updateActive(state, (tab) => ({
        ...tab,
        areas: tab.areas.filter((area) => !action.ids.includes(area.id)),
        selected: tab.selected.filter((id) => !action.ids.includes(id)),
      }));
    case 'selectAreas':
      return updateActive(state, (tab) => {
        const valid = action.ids.filter((id) => tab.areas.some((area) => area.id === id));
        if (action.mode === 'replace') return { ...tab, selected: valid };
        const toggled = tab.selected.filter((id) => !valid.includes(id)).concat(valid.filter((id) => !tab.selected.includes(id)));
        return { ...tab, selected: toggled };
      });
    case 'selectAll':
      return updateActive(state, (tab) => ({ ...tab, selected: action.selected ? tab.areas.map((area) => area.id) : [] }));
    case 'setViewport':
      return updateActive(state, (tab) => ({ ...tab, viewport: action.viewport }));
    case 'setLevels':
      return updateActive(state, (tab) => ({ ...tab, levels: normalizeLevels(action.levels) }));
    case 'setAreaColor':
      return updateActive(state, (tab) => ({ ...tab, areaColor: action.color }));
    default:
      return state;
  }
}

# Color picker: implementation plan

Port of Winterchilla's `/cg/picker` (`assets/js/pages/colorguide/picker-frame.js`, ~2,400 lines, `picker-frame.scss`, ~1,000 lines, plus the
812-line `canvas.hdr.js`). The goal is the same tool built from small modules, as asked for the other utility pages (see `apps/celestia/CLAUDE.md`):
pure logic in `src/utils/picker/` (unit tested), one component per UI part in `src/components/tools/picker/`, CSS modules in `src/scss/modules/`.

## What the original does

- **Intake:** File → Open (Ctrl+O), Open from clipboard (Ctrl+Shift+O), drag & drop of several files at once. Each image gets a **tab** (files are
  de-duplicated by an MD5 hash), tabs can be closed and scrolled by dragging.
- **Viewport:** three stacked canvases (image, overlay for the picking areas, overlay for the mouse cursor). Zoom 0.4%–3200% (buttons, Alt+scroll,
  Ctrl+0 fit, Ctrl+1 original size, typed value), hand tool (H or hold Space) for panning, zoom tool (Z, right click zooms out).
- **Picking areas:** the eyedropper (I) places a square area on click, Alt makes it round. Size 1–400 px (typed, up/down arrows, Ctrl for single
  steps). Areas are listed in a resizable sidebar: select (Ctrl/Shift for several), select all (Ctrl+A), delete (Del), double-click to change shape
  and size. Each tab has an average color (alpha-weighted over the area's pixels) with a "copy" button and a toggle for copying the `#`.
- **Status bar:** hover hints (`data-info`), image coordinates under the pointer, color and opacity of the pixel under the pointer.
- **Settings:** a few values in `localStorage` (sidebar width, copy-hash, levels dialog enabled), cleared from the Tools menu. Tabs and their images
  are not persisted.
- **Levels (optional, off by default):** a low/high range that changes how the image *looks* without changing the colors the areas report. This is the
  only user of `canvas.hdr.js`, and the original warns about the "drastic performance decrease".
- An About dialog.

## Decisions (recommended defaults, tell me to change any)

1. **Route `/picker`, inline** (not an iframe at `/cg/picker/frame`), next to `/blending`. The iframe only isolated the old site's global scripts.
2. **No `canvas.hdr.js`.** Levels become a plain 256-entry lookup table applied with `putImageData`, which is cheap, so the "enable levels dialog /
   reload" toggle goes away and Levels is just a button in the toolbar (stage 5).
3. **Pointer Events** instead of separate mouse and touch handlers, so touch works for panning and picking from the start.
4. **SHA-256 (`crypto.subtle`)** instead of MD5 for the duplicate check, no extra library. **No noUiSlider:** range inputs.
5. State lives in one reducer (`pickerReducer`) so the tab/area logic is testable without a DOM. Only the settings are persisted.

## Module layout

```
src/utils/picker/
  pixels.ts        Pixel, alpha-weighted average color, hex/opacity formatting
  areas.ts         PickingArea (square/round), bounds, pixel selection incl. the round mask, resize, hit testing
  viewport.ts      zoom limits/steps, fit and original zoom, screen <-> image coordinates, zooming around a point
  levels.ts        low/high -> lookup table, apply to RGBA data
  file-hash.ts     SHA-256 of a File/Blob
  reducer.ts       tabs, active tab, per-tab areas/selection/zoom/pan/levels/area color, tool, picking size
  settings.ts      defaults + safe localStorage read/write/clear

src/components/tools/picker/
  PickerTool.tsx            composition only
  usePickerSettings.ts, useFileIntake.ts (open/paste/drop), usePickerShortcuts.ts, usePointerTools.ts
  MenuBar.tsx, TabBar.tsx (+Tab.tsx), Toolbar.tsx (+ToolButtons, ZoomControls, SizeControls)
  CanvasStage.tsx           the three canvases, drawing hooks only
  AreaList.tsx (+AreaListItem.tsx, AreaEditDialog.tsx), AverageColorPanel.tsx
  StatusBar.tsx (+HintContext), LevelsDialog.tsx, AboutDialog.tsx
src/scss/modules/Picker*.module.scss   one module per part that needs styles
```

## Stage 1 status: done

Pure modules and the reducer are in `src/utils/picker/` with 41 unit tests. Where the original's readings were wrong, the new ones are correct and
differ on purpose, so numbers will not match the old site exactly in these cases:

- **Opacity of an average color:** the original rounded the mean opacity (0–1) to 0 or 1, so a half-transparent area reported fully opaque. Now the exact
  mean is kept and shown as `@ 12.35%` when not fully opaque.
- **Round areas:** the original left out the leftmost pixel of every row when averaging (its filter used strict `<`), although it drew them. Now every pixel
  of the drawn circle counts.
- **Areas touching the image edge:** the original sampled from shifted coordinates there. Now the part outside the image is simply ignored.
- Settings use plain numbers (`pickerWidth: 85`), the old `"85%"` strings are still read. The levels-dialog toggle is gone (see decision 2).

## Stage 2 status: done

`/picker` page and `src/components/tools/picker/*`: `PickerTool` (composition), `MenuBar`, `TabBar`, `DropZone`, `EmptyState`, `ImagePreview` (temporary,
replaced by the canvas stage), hooks `useFileIntake` (dialog, drop, Ctrl+V, clipboard menu entry), `useImageStore`, `usePickerSettings`,
`usePickerShortcuts` (Ctrl/Cmd+O, +Shift for the clipboard). Five browser tests (`PickerTool.browser.test.tsx`, real Chromium) cover opening, duplicates,
closing and non-image files; the `modules/` alias was added to `vitest.config.mts`. A tab is only confirmed on closing when it has picking areas.
Clipboard reading through the menu needs a permission prompt and is untested; Ctrl+V pasting and drag-and-drop of real files are untested too.

## Stage 3 status: done

`CanvasStage` draws the image on one canvas sized to the stage (sharp pixels when magnified, smoothed when reduced). Hooks: `useViewSize` (callback-ref
based, the stage only exists once an image is open), `useViewportActions` (fit on first show, zoom steps, zoom to a value, pan), `usePointerTools`
(hand drag, zoom clicks, Alt/right click out), `useWheelNavigation` (Alt/Ctrl/Cmd+wheel zooms at the pointer, plain wheel pans), `useSpaceHeld`,
`useHoverInfo` (pixel and color under the pointer via the lazy `ImageStore` pixel cache). `Toolbar` (`ToolButtons`, `ZoomControls`), `StatusBar`.
Shortcuts: H/I/Z, Ctrl/Cmd+0 fit, Ctrl/Cmd+1 100%. Eleven browser tests cover fit/100%, zoom steps and typed values, tool and zoom shortcuts, the
reading under the pointer (exact pixel and color), per-tab zoom and the zoom tool. Not covered by tests: dragging with the hand tool, wheel
navigation and touch (the code paths exist). The eyedropper tool is selectable but only places areas from stage 4.

## Stage 4 status: done

Eyedropper placement (click: square, Alt+click: round, always centered on the pixel under the pointer), the white outline of the area about to be placed,
`AreaLayer` (areas filled with the tab's area color, selected ones outlined), size controls (field, buttons, up/down arrows), the area color dialog,
`AreaList` (all tabs' areas with average color and size, select with Ctrl/Shift for several, double click to edit shape and size in `AreaEditDialog`,
select all / deselect / delete, Ctrl+A, Del), `AverageColorPanel` (counts, overall average as the mean of the areas' averages, rgb text, copy with or
without `#`) and a draggable `ResizeHandle` that saves the list width. Pure parts: `area-colors.ts` (per-area cache), `formatRgb`. 22 browser tests cover placing,
exact averages (including an area over two colors and one overlapping the image edge), round areas, size changes, deleting, list selection, editing and
the per-image separation with the close confirmation. Differences from Winterchilla: select-all and delete act on the active image, not every image;
the hex/rgb display toggle is gone (both are shown); clicking an existing area with the eyedropper places a new area instead of selecting it.
The browser tests share `localStorage` with the app's settings, so they clear it first. Not covered by tests: the Copy button (needs the clipboard
permission), dragging the resize handle, and the area color dialog.

## Stage 5 status: done, except strings

- **Levels:** `LevelsDialog` (low/high range inputs, reset) and a toolbar button (highlighted when active). Applied per image as a lookup table through
  `ImageStore.getLevelled` (cached per image and range); only the picture changes, hover readings and area averages keep using the original pixels
  (browser-tested). No enable/reload toggle and no HDR library.
- **Hints:** any element with `data-hint` explains itself in the status bar while hovered or focused (`useHints`), replacing the native tooltips.
- **About** dialog from the menu bar. It repeats the original tool's thanks line.
- Shortcuts are complete (open, tools, zoom, select all, delete, size). The guide index now lists the sprite generator, blending calculator,
  blending reverser and color picker (`GuideTools`).
- **Not done:** moving the strings of the tools into the locale files. The tools (blending, reverser, picker) and the admin pages are English-only
  at the moment, so this should happen as one pass over all of them, not picker by picker.

## Stages (each ends with tsc, lint, unit tests, `pnpm build` and a commit)

1. **Pure foundations**: `pixels`, `areas`, `viewport`, `levels`, `file-hash`, `settings` and the reducer, all with unit tests. No UI. Needs a careful
   read of the original `Pixel`, `PickingArea`, `RoundedPickingArea` and `Geometry` classes (lines 46–290) so the averages match exactly.
2. **Shell and intake**: `/picker` page, `PickerTool`, menu bar, open/paste/drop, tab bar with duplicate detection and closing, empty state, settings
   persistence, image shown fitted.
3. **Viewport**: canvas stage, zoom controls and shortcuts, hand tool/Space panning, pointer coordinates and pixel color in the status bar.
4. **Picking**: eyedropper placement (square, Alt for round), size controls, overlay drawing, area list with selection/delete/edit dialog, average
   color panel with copy and the `#` toggle.
5. **Polish**: levels dialog, remaining shortcuts and hover hints, About dialog, clear settings, touch and keyboard accessibility, strings into the
   locale files, link from the guide pages and the sidebar's useful links.

## Testing

- Unit tests for everything in `src/utils/picker` (round-area masks, average colors with transparent pixels, zoom-around-point maths, reducer
  transitions, settings with unavailable storage).
- Canvas and pointer behavior: the repo already has a vitest browser project (`*.browser.test.tsx`, Playwright), I'd add a few there for the stage,
  if the Playwright browsers are installed on this machine. Otherwise those parts stay untried, as with the other tools, and I'll say so.
- Compare against the old site numerically: pick the same area in both on the same image and check the reported hex and opacity match.

## Risks

- Average color maths must match the original for the tool to be trusted; stage 1 is where that is settled.
- Large images (screencaps are 1920×1080 and up): redraw only what changed, keep `getImageData` out of pointer-move handlers (cache the pixels
  per tab).
- The original strips hover hints into `data-info`; they become a small context so any component can set the status bar text.

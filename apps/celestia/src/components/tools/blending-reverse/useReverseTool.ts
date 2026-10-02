import { useMemo, useState } from 'react';

import { OverrideState } from 'src/components/tools/blending-reverse/FilterOverride';
import { OverlayState } from 'src/components/tools/blending-reverse/OverlayControls';
import { TargetType } from 'src/components/tools/blending-reverse/ReverseTarget';
import { useKnownColorPairs } from 'src/components/tools/blending-reverse/useKnownColorPairs';
import { PreviewSource } from 'src/components/tools/blending-reverse/usePreviewCanvases';
import { FilterType, ReverseImageOptions, Rgba, parseColor, solveFilter } from 'src/utils/color';
import { loadImageFile } from 'src/utils/image-file';

/** Default highlight: magenta at 75% */
const OVERLAY_ALPHA = 0.75;
const DEFAULT_SENSITIVITY = 10;

/** All state of the reverser: inputs, the calculated or overridden filter, and what the preview should draw */
export function useReverseTool() {
  const [filterType, setFilterType] = useState<FilterType>('multiply');
  const known = useKnownColorPairs();
  const [override, setOverride] = useState<OverrideState>({ enabled: false, color: '', opacity: 100 });
  const [candidateSelected, setCandidateSelected] = useState(false);
  const [targetType, setTargetType] = useState<TargetType>('image');
  const [targetColor, setTargetColor] = useState('');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);
  const [overlay, setOverlay] = useState<OverlayState>({ show: true, color: '#ff00ff' });

  const candidate = useMemo<Rgba | null>(
    () => (known.valid.originals.length >= 2 ? solveFilter(filterType, known.valid.originals, known.valid.filtered) : null),
    [filterType, known.valid]
  );

  /** The filter that is applied: the typed one when overriding, otherwise the calculated one once the user selects it */
  const filter = useMemo<Rgba | null>(() => {
    if (override.enabled) {
      const color = parseColor(override.color);
      return color ? { ...color, alpha: override.opacity / 100 } : null;
    }
    return candidate && candidateSelected ? candidate : null;
  }, [override, candidate, candidateSelected]);

  const source = useMemo<PreviewSource | null>(() => {
    if (targetType === 'image') return image ? { kind: 'image', image } : null;
    const color = parseColor(targetColor);
    return color ? { kind: 'color', color } : null;
  }, [targetType, image, targetColor]);

  const overlayColor = useMemo(() => parseColor(overlay.color), [overlay.color]);
  const options = useMemo<ReverseImageOptions | null>(
    () =>
      filter
        ? {
            type: filterType,
            filter,
            sensitivity,
            overlay: { ...(overlayColor ?? { red: 255, green: 0, blue: 255 }), alpha: OVERLAY_ALPHA },
          }
        : null,
    [filter, filterType, sensitivity, overlayColor]
  );

  const chooseFile = (file: File) => {
    setFileError(null);
    loadImageFile(file).then(
      (loaded) => {
        setImage(loaded);
        setFileName(file.name);
      },
      (e: Error) => setFileError(e.message)
    );
  };

  return {
    filterType,
    setFilterType: (type: FilterType) => {
      setFilterType(type);
      setCandidateSelected(false);
    },
    known,
    override,
    setOverride,
    candidate,
    candidateSelected,
    toggleCandidate: () => setCandidateSelected((selected) => !selected),
    targetType,
    setTargetType,
    targetColor,
    setTargetColor,
    fileName,
    fileError,
    chooseFile,
    sensitivity,
    setSensitivity,
    overlay,
    setOverlay,
    source,
    options,
    canSave: source !== null && filter !== null,
  };
}

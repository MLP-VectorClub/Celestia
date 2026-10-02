import { FC, ReactNode } from 'react';

import styles from 'modules/BlendingReverse.module.scss';
import { FilterCandidate } from 'src/components/tools/blending-reverse/FilterCandidate';
import { FilterOverride } from 'src/components/tools/blending-reverse/FilterOverride';
import { FilterTypeSelect } from 'src/components/tools/blending-reverse/FilterTypeSelect';
import { KnownColorPairs } from 'src/components/tools/blending-reverse/KnownColorPairs';
import { OverlayControls } from 'src/components/tools/blending-reverse/OverlayControls';
import { PreviewCanvas } from 'src/components/tools/blending-reverse/PreviewCanvas';
import { ReverseTarget } from 'src/components/tools/blending-reverse/ReverseTarget';
import { SaveFilterFreeButton } from 'src/components/tools/blending-reverse/SaveFilterFreeButton';
import { SensitivitySlider } from 'src/components/tools/blending-reverse/SensitivitySlider';
import { usePreviewCanvases } from 'src/components/tools/blending-reverse/usePreviewCanvases';
import { useReverseTool } from 'src/components/tools/blending-reverse/useReverseTool';

const Section: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <section className={styles.section}>
    <h2 className="h5">{title}</h2>
    {children}
  </section>
);

/** Reverse a filter layer on an image or a single color, given pairs of known colors from before and after the filter */
export const BlendingReverseTool: FC = () => {
  const tool = useReverseTool();
  const { imageRef, overlayRef } = usePreviewCanvases(tool.source, tool.options);

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.column}>
          <Section title="Filter type">
            <FilterTypeSelect value={tool.filterType} onChange={tool.setFilterType} />
          </Section>
          <Section title="Manual filter override">
            <FilterOverride value={tool.override} onChange={tool.setOverride} />
          </Section>
          <Section title="Known color pairs">
            <KnownColorPairs pairs={tool.known.pairs} onChange={tool.known.update} onAdd={tool.known.add} onRemove={tool.known.remove} />
          </Section>
          {!tool.override.enabled && (
            <Section title="Calculated filter">
              <FilterCandidate filter={tool.candidate} selected={tool.candidateSelected} onToggle={tool.toggleCandidate} />
            </Section>
          )}
        </div>
        <div className={styles.column}>
          <Section title="Reverse filter on">
            <ReverseTarget
              type={tool.targetType}
              onTypeChange={tool.setTargetType}
              color={tool.targetColor}
              onColorChange={tool.setTargetColor}
              fileName={tool.fileName}
              onFile={tool.chooseFile}
              error={tool.fileError}
            />
          </Section>
          <Section title="Sensitivity">
            <SensitivitySlider value={tool.sensitivity} onChange={tool.setSensitivity} />
          </Section>
          <Section title="Overlay">
            <OverlayControls value={tool.overlay} onChange={tool.setOverlay} />
          </Section>
          <SaveFilterFreeButton
            imageRef={imageRef}
            overlayRef={overlayRef}
            includeOverlay={tool.overlay.show}
            fileName={tool.fileName}
            filterType={tool.filterType}
            disabled={!tool.canSave}
          />
        </div>
      </div>
      <PreviewCanvas imageRef={imageRef} overlayRef={overlayRef} showOverlay={tool.overlay.show} empty={tool.source === null} />
    </>
  );
};

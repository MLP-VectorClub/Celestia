import ClipboardJS from 'clipboard';
import { useTranslations } from 'next-intl';
import { JSX, RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { Tooltip } from 'reactstrap';

interface CopyToClipboardHook {
  enabled?: boolean;
  containerRef?: RefObject<HTMLElement>;
  targetRef: RefObject<HTMLElement>;
  copyButtonRef: RefObject<HTMLElement>;
  /** Leave the "copied" tooltip to the caller (a button that has a tooltip of its own shows both texts in it) */
  hideTooltip?: boolean;
}

interface CopyToClipboardHookResult {
  tooltip: JSX.Element | null;
  copyStatus: boolean;
  clearCopyStatus: VoidFunction;
}

export const useCopyToClipboard = ({
  enabled = true,
  copyButtonRef,
  targetRef,
  containerRef,
  hideTooltip = false,
}: CopyToClipboardHook): CopyToClipboardHookResult => {
  const t = useTranslations();
  const [copyStatus, setCopyStatus] = useState(false);
  const clearCopyStatus = useCallback(() => setCopyStatus(false), []);

  useEffect(() => {
    if (!enabled) return;

    const copyButton = copyButtonRef.current;
    const urlInput = targetRef.current;
    const modal = containerRef && containerRef.current;
    if (!copyButton || !urlInput) return;

    const clipboard = new ClipboardJS(copyButton, {
      container: modal || undefined,
      target: () => urlInput,
    });

    clipboard.on('success', (e) => {
      setCopyStatus(true);
      e.clearSelection();
    });

    return () => clipboard.destroy();
  }, [containerRef, copyButtonRef, enabled, targetRef]);

  const TooltipComponent = useMemo(
    () =>
      enabled && !hideTooltip ? (
        <Tooltip target={copyButtonRef} isOpen={copyStatus} fade={false}>
          {t('common.copied')}
        </Tooltip>
      ) : null,
    [copyButtonRef, copyStatus, enabled, hideTooltip, t]
  );

  return {
    tooltip: TooltipComponent,
    copyStatus,
    clearCopyStatus,
  };
};

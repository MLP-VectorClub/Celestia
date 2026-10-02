import { FC, PropsWithChildren, ReactNode, createContext, useContext, useEffect, useState } from 'react';

const WidgetContext = createContext<ReactNode>(null);
const SetWidgetContext = createContext<(widget: ReactNode) => void>(() => undefined);

/** Holds the one page specific widget the sidebar shows below its fixed sections */
export const SidebarWidgetProvider: FC<PropsWithChildren> = ({ children }) => {
  const [widget, setWidget] = useState<ReactNode>(null);
  return (
    <SetWidgetContext.Provider value={setWidget}>
      <WidgetContext.Provider value={widget}>{children}</WidgetContext.Provider>
    </SetWidgetContext.Provider>
  );
};

/** What the sidebar renders */
export const useSidebarWidgetSlot = (): ReactNode => useContext(WidgetContext);

/** Shows `widget` in the sidebar while the calling page is mounted. Keep the element stable (`useMemo`), a new one every render keeps replacing it */
export function useSidebarWidget(widget: ReactNode): void {
  const setWidget = useContext(SetWidgetContext);
  useEffect(() => {
    setWidget(widget);
    return () => setWidget(null);
  }, [setWidget, widget]);
}

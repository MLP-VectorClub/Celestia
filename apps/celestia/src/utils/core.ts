import { AppDispatch } from 'src/store';
import { CoreSliceMirroredState, coreActions } from 'src/store/slices';

export const titleSetter = (store: { dispatch: AppDispatch }, { title, breadcrumbs }: Partial<CoreSliceMirroredState>) => {
  if (typeof title !== 'undefined') store.dispatch(coreActions.setTitle(title));
  if (typeof breadcrumbs !== 'undefined') store.dispatch(coreActions.setBreadcrumbs(breadcrumbs));
};

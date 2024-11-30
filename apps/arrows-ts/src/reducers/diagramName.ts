import { Action } from 'redux';

export const defaultName = 'Untitled schema';

interface DiagramNameWithName
  extends Action<
    | 'SAVE_AS_LOCAL_STORAGE_DIAGRAM'
    | 'GETTING_DIAGRAM_NAME_SUCCEEDED'
    | 'RENAME_DIAGRAM'
  > {
  diagramName: string;
}

type DiagramNameAction =
  | Action<'NEW_LOCAL_STORAGE_DIAGRAM'>
  | DiagramNameWithName;

const diagramName = (
  state = defaultName,
  action: DiagramNameAction
): string => {
  switch (action.type) {
    case 'NEW_LOCAL_STORAGE_DIAGRAM':
      return defaultName;

    case 'SAVE_AS_LOCAL_STORAGE_DIAGRAM':
    case 'GETTING_DIAGRAM_NAME_SUCCEEDED':
    case 'RENAME_DIAGRAM':
      return action.diagramName;

    default:
      return state;
  }
};

export default diagramName;

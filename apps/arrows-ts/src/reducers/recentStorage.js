import { loadRecentlyAccessedDiagrams } from '../actions/localStorage';

export default function recentStorage(
  state = getStateFromLocalStorage(),
  action
) {
  if (action.type === 'UPDATE_RECENT_STORAGE') {
    const { mode, fileId, diagramName, timestamp } = action;
    return [
      { mode, fileId, diagramName, timestamp },
      ...state.filter(
        (entry) => !(entry.mode === mode && entry.fileId === fileId)
      ),
    ];
  }
  
  if (action.type === 'REMOVE_RECENT_STORAGE_ENTRY') {
    const { mode, fileId } = action;
    return state.filter(
      (entry) => !(entry.mode === mode && entry.fileId === fileId)
    );
  }

  return state;
}

const getStateFromLocalStorage = () => {
  return loadRecentlyAccessedDiagrams() || [];
};

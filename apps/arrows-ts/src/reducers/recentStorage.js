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
  const list = loadRecentlyAccessedDiagrams() || [];
  return (Array.isArray(list) ? list : [])
    .filter((e) => e && e.fileId && typeof e.diagramName === 'string')
    .map((e) => ({
      mode: e.mode || 'LOCAL_STORAGE',
      fileId: e.fileId,
      diagramName: e.diagramName,
      timestamp: e.timestamp || Date.now(),
    }));
};

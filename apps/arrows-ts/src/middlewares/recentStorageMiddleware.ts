import { updateRecentStorage } from '../actions/recentStorage';
import { saveRecentlyAccessedDiagrams } from '../actions/localStorage';
import { ArrowsState } from '../reducers';
import { Action, Dispatch, Store } from 'redux';

export const recentStorageMiddleware =
  (store: Store<ArrowsState>) => (next: Dispatch) => (action: Action) => {
    const oldState = store.getState();
    const oldStorage = oldState.storage;
    const result = next(action);
    const newState = store.getState();
    const newStorage = newState.storage;

    if (oldStorage !== newStorage && newStorage.status === 'READY') {
      store.dispatch(
        updateRecentStorage(
          newStorage.mode,
          newStorage.fileId,
          newState.diagramName
        )
      );
    }

    if (
      action.type === 'UPDATE_RECENT_STORAGE' ||
      action.type === 'REMOVE_RECENT_STORAGE_ENTRY'
    ) {
      saveRecentlyAccessedDiagrams(newState.recentStorage);
    }

    return result;
  };

export const initRecentStorage = (state: ArrowsState) => {
  const { storage, diagramName } = state;
  return updateRecentStorage(storage.mode, storage.fileId, diagramName);
};

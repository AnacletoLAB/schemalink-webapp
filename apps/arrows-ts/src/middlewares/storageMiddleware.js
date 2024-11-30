import { getPresentGraph } from '../selectors';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import {
  loadGraphFromLocalStorage,
  saveGraphToLocalStorage,
} from '../actions/localStorage';
import {
  postedFileToLocalStorage,
  puttingGraph,
  puttingGraphSucceeded,
} from '../actions/storage';

const localUpdateInterval = 500; // ms
let waiting;

const deBounce = (func, delay) => {
  clearTimeout(waiting);
  waiting = setTimeout(func, delay);
};

const historyActions = [
  UndoActionCreators.undo().type,
  UndoActionCreators.redo().type,
];

export const storageMiddleware = (store) => (next) => (action) => {
  const hideGraphHistory = (state) => ({
    ...state,
    graph: getPresentGraph(state),
  });

  const oldState = hideGraphHistory(store.getState());
  const result = next(action);
  const newState = hideGraphHistory(store.getState());
  const storage = newState.storage;
  const graph = newState.graph;
  const diagramName = newState.diagramName;

  if (action.type === 'RENAME_DIAGRAM') {
    switch (storage.mode) {
      case 'LOCAL_STORAGE':
        saveGraphToLocalStorage(storage.fileId, { graph, diagramName });
        break;
    }
  }

  if (storage.mode === 'LOCAL_STORAGE') {
    switch (storage.status) {
      case 'GET': {
        const fileId = storage.fileId;
        store.dispatch(loadGraphFromLocalStorage(fileId));
        break;
      }

      case 'POST': {
        const fileId = storage.fileId;
        saveGraphToLocalStorage(fileId, { graph, diagramName });
        store.dispatch(postedFileToLocalStorage());
        break;
      }
    }
  }

  if (action.category === 'GRAPH' || historyActions.includes(action.type)) {
    switch (storage.mode) {
      case 'LOCAL_STORAGE':
        if (oldState.graph !== newState.graph) {
          if (oldState.storage.status !== 'PUTTING') {
            store.dispatch(puttingGraph());
          }
          deBounce(() => {
            saveGraphToLocalStorage(storage.fileId, { graph, diagramName });
            store.dispatch(puttingGraphSucceeded());
          }, localUpdateInterval);
        }
        break;
    }
  }
  return result;
};

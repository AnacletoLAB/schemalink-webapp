import { ActionCreators as UndoActionCreators } from 'redux-undo';

export function newLocalStorageDiagram() {
  return function (dispatch) {
    dispatch({
      type: 'NEW_LOCAL_STORAGE_DIAGRAM',
    });
    dispatch(UndoActionCreators.clearHistory());
  };
}

export function clearGraph() {
  return function (dispatch) {
    dispatch({
      type: 'NEW_LOCAL_STORAGE_DIAGRAM',
    });
  };
}

export const saveAsNewDiagram = (newDiagramName) => (dispatch, getState) => {
  const state = getState();
  switch (state.storage.mode) {
    case 'LOCAL_STORAGE':
      dispatch({
        type: 'SAVE_AS_LOCAL_STORAGE_DIAGRAM',
        diagramName: newDiagramName,
      });
      break;
  }
};

export function openRecentFile(entry) {
  switch (entry.mode) {
    case 'LOCAL_STORAGE':
      return getFileFromLocalStorage(entry.fileId);

    default:
      return {};
  }
}

export function getFileFromLocalStorage(fileId) {
  return {
    type: 'GET_FILE_FROM_LOCAL_STORAGE',
    fileId,
  };
}

export function postedFileToLocalStorage() {
  return {
    type: 'POSTED_FILE_TO_LOCAL_STORAGE',
  };
}

export const pickDiagram = (mode) => ({
  type: 'PICK_DIAGRAM',
  mode,
});

export const pickDiagramCancel = () => ({
  type: 'PICK_DIAGRAM_CANCEL',
});

export function gettingGraph() {
  return {
    type: 'GETTING_GRAPH',
  };
}

export function gettingGraphFailed() {
  return {
    type: 'GETTING_GRAPH_FAILED',
  };
}

export function gettingGraphSucceeded(storedGraph) {
  return function (dispatch) {
    dispatch({
      category: 'GRAPH',
      type: 'GETTING_GRAPH_SUCCEEDED',
      storedGraph,
    });
    dispatch(UndoActionCreators.clearHistory());
  };
}

export function putGraph() {
  return {
    type: 'PUT_GRAPH',
  };
}

export function postingGraph() {
  return {
    type: 'POSTING_GRAPH',
  };
}

export function puttingGraph() {
  return {
    type: 'PUTTING_GRAPH',
  };
}

export function puttingGraphFailed() {
  return {
    type: 'PUTTING_GRAPH_FAILED',
  };
}

export function puttingGraphSucceeded() {
  return {
    type: 'PUTTING_GRAPH_SUCCEEDED',
  };
}

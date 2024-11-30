export const importJsonRegex = /^#\/import\/json=(.*)/;
export const localUrlNoIdRegex = /^#\/local$/;
export const localUrlRegex = /^#\/local\/id=(.*)/;

export const windowLocationHashMiddleware = (store) => (next) => (action) => {
  const oldStorage = store.getState().storage;
  const result = next(action);
  const newStorage = store.getState().storage;

  if (oldStorage !== newStorage && newStorage.status === 'READY') {
    switch (newStorage.mode) {
      case 'DATABASE':
        window.location.hash = `#/neo4j`;
        break;
      case 'LOCAL_STORAGE':
        window.location.hash = `#/local/id=${newStorage.fileId}`;
        break;
    }
  }

  return result;
};

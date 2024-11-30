import { generateLocalFileId } from '../storage/localFileId';
import {
  importJsonRegex,
  localUrlNoIdRegex,
  localUrlRegex,
} from '../middlewares/windowLocationHashMiddleware';
import { constructGraphFromFile } from '../storage/googleDriveStorage';
import {
  loadLegacyAppData,
  loadRecentlyAccessedDiagrams,
  saveGraphToLocalStorage,
} from '../actions/localStorage';
import { defaultName } from './diagramName';
import { Base64 } from 'js-base64';
import { getFileFromLocalStorage } from '../actions/storage';

export default function storage(
  state = initialiseStorageFromWindowLocationHash(),
  action
) {
  switch (action.type) {
    case 'SAVE_AS_LOCAL_STORAGE_DIAGRAM':
    case 'NEW_LOCAL_STORAGE_DIAGRAM': {
      return {
        mode: 'LOCAL_STORAGE',
        status: 'POST',
        fileId: generateLocalFileId(),
      };
    }
    case 'PICK_DIAGRAM': {
      switch (action.mode) {
        case 'LOCAL_STORAGE':
          return {
            ...state,
            status: 'PICKING_FROM_LOCAL_STORAGE',
          };
        default:
          return state;
      }
    }
    case 'PICK_DIAGRAM_CANCEL': {
      return {
        ...state,
        status: 'READY',
      };
    }
    case 'GET_FILE_FROM_LOCAL_STORAGE': {
      return {
        mode: 'LOCAL_STORAGE',
        status: 'GET',
        fileId: action.fileId,
      };
    }
    case 'GETTING_GRAPH': {
      return {
        ...state,
        status: 'GETTING',
      };
    }
    case 'GETTING_GRAPH_SUCCEEDED': {
      return {
        ...state,
        status: 'READY',
      };
    }
    case 'POSTED_FILE_TO_LOCAL_STORAGE':
      return {
        ...state,
        status: 'READY',
      };
    case 'PUT_GRAPH':
      return {
        ...state,
        status: 'PUT',
      };
    case 'POSTING_GRAPH':
      return {
        ...state,
        status: 'POSTING',
      };
    case 'PUTTING_GRAPH':
      return {
        ...state,
        status: 'PUTTING',
      };
    case 'PUTTING_GRAPH_SUCCEEDED':
      return {
        ...state,
        status: 'READY',
      };
    case 'PUTTING_GRAPH_FAILED':
      return {
        ...state,
        status: 'FAILED',
      };

    default:
      return state;
  }
}

const initialiseStorageFromWindowLocationHash = () => {
  const hash = window.location.hash;

  const importJsonMatch = importJsonRegex.exec(hash);
  const localNoIdMatch = localUrlNoIdRegex.exec(hash);
  const localMatch = localUrlRegex.exec(hash);

  if (importJsonMatch) {
    const b64Json = importJsonMatch[1];
    try {
      const data = JSON.parse(Base64.decode(b64Json));
      return storeNewDiagramInLocalStorage(data);
    } catch (e) {
      console.log(e);
      return newLocalFile();
    }
  } else if (localNoIdMatch) {
    const data = loadLegacyAppData();
    if (data) {
      return storeNewDiagramInLocalStorage(data);
    } else {
      return newLocalFile();
    }
  } else if (localMatch) {
    const fileId = localMatch[1];
    return {
      mode: 'LOCAL_STORAGE',
      status: 'GET',
      fileId,
    };
  } else {
    const recentlyAccessed = loadRecentlyAccessedDiagrams() || [];
    if (recentlyAccessed.length > 0) {
      const mostRecentlyAccessed = recentlyAccessed[0];
      return {
        mode: mostRecentlyAccessed.mode,
        status: 'GET',
        fileId: mostRecentlyAccessed.fileId,
      };
    } else {
      return newLocalFile();
    }
  }
};

const newLocalFile = () => {
  const fileId = generateLocalFileId();
  return {
    mode: 'LOCAL_STORAGE',
    status: 'POST',
    fileId,
  };
};

export const handleImportMessage = (message) => {
  if (message.origin !== 'http://localhost:8000')
    return {
      type: 'IGNORE',
    };
  const data = JSON.parse(message.data);
  const graph = constructGraphFromFile(data).graph;
  const diagramName = data.diagramName || defaultName;
  const fileId = generateLocalFileId();
  saveGraphToLocalStorage(fileId, { graph, diagramName });
  return getFileFromLocalStorage(fileId);
};

const storeNewDiagramInLocalStorage = (data) => {
  const graph = constructGraphFromFile(data).graph;
  const diagramName = data.diagramName || defaultName;
  const fileId = generateLocalFileId();
  saveGraphToLocalStorage(fileId, { graph, diagramName });
  return {
    mode: 'LOCAL_STORAGE',
    status: 'GET',
    fileId,
  };
};

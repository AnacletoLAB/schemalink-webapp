import { connect } from 'react-redux';
import Header from '../components/Header';
import { toggleInspector } from '../actions/applicationLayout';
import { renameDiagram } from '../actions/diagramName';
import {
  logout,
  delete_account,
  showAuthDialog,
  showViewUsersDialog,
  showDashboardDialog,
  showSubscribeToPolicyDialog,
  showInfoAccountDialog,
  showExportDialog,
  showHelpDialog,
  showAcknowledgementsDialog,
  showImportDialog,
  showSaveAsDialog,
  showGptModal,
} from '../actions/applicationDialogs';
import {
  newLocalStorageDiagram,
  openRecentFile,
  pickDiagram,
  clearGraph,
} from '../actions/storage';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import { nodeSeparation } from '../actions/import';
import { importNodesAndRelationships } from '../actions/graph';
import { on } from 'events';

const mapStateToProps = (state) => {
  return {
    isAuthenticated: state.applicationDialogs.isAuthenticated,
    recentStorage: state.recentStorage,
    diagramName: state.diagramName,
    undoRedoDisabled: {
      undo: state.graph.past.length < 1,
      redo: state.graph.future.length < 1,
    },
    storage: state.storage,
    graph: state.graph.present,
    ontologies: state.ontologies.ontologies,
    separation: nodeSeparation(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onNewDiagram: (mode) => {
      switch (mode) {
        case 'LOCAL_STORAGE':
          dispatch(newLocalStorageDiagram());
          break;
      }
    },
    pickFileToOpen: (mode) => {
      dispatch(pickDiagram(mode));
    },
    openRecentFile: (entry) => {
      dispatch(openRecentFile(entry));
    },
    setDiagramName: (diagramName) => {
      dispatch(renameDiagram(diagramName));
    },
    undo: () => dispatch(UndoActionCreators.undo()),
    redo: () => dispatch(UndoActionCreators.redo()),
    showInspector: () => {
      dispatch(toggleInspector());
    },
    onLogout: () => {
      dispatch(logout());
    },
    onDeleteAccount: () => {
      dispatch(delete_account());
    },
    onAuthClick: () => {
      dispatch(showAuthDialog());
    },
    onViewUsersClick: () => {
      dispatch(showViewUsersDialog());
    },
    onDashboardClick: () => {
      dispatch(showDashboardDialog());
    },
    onSubscribeToPolicyClick: () => {
      dispatch(showSubscribeToPolicyDialog());
    },
    onInfoAccountClick: () => {
      dispatch(showInfoAccountDialog());
    },
    onExportClick: () => {
      dispatch(showExportDialog());
    },
    onSaveAsClick: () => {
      dispatch(showSaveAsDialog());
    },
    onImportClick: () => {
      dispatch(showImportDialog());
    },
    onGenerateClick: (callback) => {
      dispatch(showGptModal(callback));
    },
    importNodesAndRelationships: (graph) => {
      dispatch(importNodesAndRelationships(graph));
    },
    clearGraph: () => {
      clearGraph()(dispatch);
    },
    onHelpClick: () => {
      dispatch(showHelpDialog());
    },
    onAcknowledgementsClick: () => {
      dispatch(showAcknowledgementsDialog());
    },
  };
};

const HeaderContainer = connect(mapStateToProps, mapDispatchToProps)(Header);

export default HeaderContainer;

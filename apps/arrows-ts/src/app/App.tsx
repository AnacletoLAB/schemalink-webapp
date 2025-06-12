import React, { Component } from 'react';
import GraphContainer from '../containers/GraphContainer';
import { connect } from 'react-redux';
import withKeybindings, { ignoreTarget } from '../interactions/Keybindings';
import { windowResized } from '../actions/applicationLayout';
import HeaderContainer from '../containers/HeaderContainer';
import InspectorChooser from '../containers/InspectorChooser';
import { computeCanvasSize, inspectorWidth } from '@neo4j-arrows/model';
import ExportContainer from '../containers/ExportContainer';
import AuthContainer from '../containers/AuthContainer';
import ViewUsersContainer from '../containers/ViewUsersContainer';
import SubscribeToPolicyContainer from '../containers/SubscribeToPolicyContainer';
import InfoAccountContainer from '../containers/InfoAccountContainer';
import HelpModal from '../components/HelpModal';
import AcknowledgementsModal from '../components/AcknowledgementsModal';
import LocalStoragePickerContainer from '../containers/LocalStoragePickerContainer';
import SaveAsContainer from '../containers/SaveAsContainer';
import ImportContainer from '../containers/ImportContainer';
import { handlePaste } from '../actions/import';
import { handleCopy } from '../actions/export';
import { linkToGoogleFontsCss } from '@neo4j-arrows/graphics';
import { handleImportMessage } from '../reducers/storage';
import { loginSuccess } from '../actions/applicationDialogs';

import './App.css';
import ContextMenu from '../components/ContextMenu';
import GptModal from '../components/GptModal';
import { ArrowsState } from '../reducers';
import { Dispatch } from 'redux';
import GptExplanationModal from '../components/GptExplanationModal';

export interface AppProps {
  inspectorVisible: boolean;
  showSaveAsDialog: boolean;
  showAuthDialog: boolean;
  showViewUsersDialog: boolean;
  showSubscribeToPolicyDialog: boolean;
  showInfoAccountDialog: boolean;
  showExportDialog: boolean;
  showImportDialog: boolean;
  pickingFromLocalStorage: boolean;
  onCancelPicker: any;
  canvasHeight: number;
  fireAction: any;
  handleCopy: (ev: ClipboardEvent) => void;
  handlePaste: (ev: ClipboardEvent) => void;
  handleImportMessage: (ev: MessageEvent<any>) => void;
  onWindowResized: (this: Window, ev: UIEvent) => any;

  dispatch: Dispatch<any>;
}

class App extends Component<AppProps> {
  constructor(props: AppProps) {
    super(props);
    linkToGoogleFontsCss();
    window.addEventListener(
      'keydown',
      this.fireKeyboardShortcutAction.bind(this)
    );
    window.addEventListener('copy', this.handleCopy.bind(this));
    window.addEventListener('paste', this.handlePaste.bind(this));
    // window.addEventListener('message', this.handleMessage.bind(this));
  }

  render() {
    const {
      inspectorVisible,
      showSaveAsDialog,
      showAuthDialog,
      showViewUsersDialog,
      showSubscribeToPolicyDialog,
      showInfoAccountDialog,
      showExportDialog,
      showImportDialog,
      pickingFromLocalStorage,
    } = this.props;

    const saveAsModal = showSaveAsDialog ? <SaveAsContainer /> : null;
    const exportModal = showExportDialog ? <ExportContainer /> : null;
    const authModal = showAuthDialog ? <AuthContainer /> : null;
    const viewUsersModal = showViewUsersDialog ? <ViewUsersContainer /> : null; 
    const subscribeToPolicyModal = showSubscribeToPolicyDialog ? <SubscribeToPolicyContainer /> : null; 
    const infoAccountModal = showInfoAccountDialog ? <InfoAccountContainer /> : null;
    const importModal = showImportDialog ? <ImportContainer /> : null;
    const localStorageModal = pickingFromLocalStorage ? (
      <LocalStoragePickerContainer />
    ) : null;

    const inspector = inspectorVisible ? (
      <aside
        style={{
          width: inspectorWidth,
          height: this.props.canvasHeight,
          overflowY: 'scroll',
          borderLeft: '1px solid #D4D4D5',
        }}
      >
        <InspectorChooser />
      </aside>
    ) : null;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          margin: 0,
        }}
      >
        {saveAsModal}
        {authModal}
        {viewUsersModal}
        {subscribeToPolicyModal}
        {infoAccountModal}
        {exportModal}
        {importModal}
        {localStorageModal}
        <HelpModal />
        <AcknowledgementsModal />
        <HeaderContainer userData={this.props.userData}/>
        <section
          style={{
            flex: 2,
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <GraphContainer />
          {inspector}
        </section>
        {import.meta.env.VITE_OPENAI_ENABLED && <ContextMenu userData={this.props.userData} />}
        {import.meta.env.VITE_OPENAI_ENABLED && <GptModal />}
        {import.meta.env.VITE_OPENAI_ENABLED && <GptExplanationModal />}
      </div>
    );
  }

  fireKeyboardShortcutAction(ev: KeyboardEvent) {
    if (ignoreTarget(ev)) return;

    const handled = this.props.fireAction(ev);
    if (handled) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  handleCopy(ev: ClipboardEvent) {
    if (ignoreTarget(ev)) return;
    this.props.handleCopy(ev);
  }

  handlePaste(ev: ClipboardEvent) {
    if (ignoreTarget(ev)) return;
    this.props.handlePaste(ev);
  }

  handleMessage(ev: MessageEvent<any>) {
    this.props.handleImportMessage(ev);
  }

  componentDidMount() {
    window.addEventListener('resize', this.props.onWindowResized);

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      this.props.dispatch(loginSuccess(parsedUser));
    }
  }
}

const mapStateToProps = (state: ArrowsState) => ({
  inspectorVisible: state.applicationLayout.inspectorVisible,
  canvasHeight: computeCanvasSize(state.applicationLayout).height,
  pickingFromLocalStorage:
    state.storage.status === 'PICKING_FROM_LOCAL_STORAGE',
  showSaveAsDialog: state.applicationDialogs.showSaveAsDialog,
  showAuthDialog: state.applicationDialogs.showAuthDialog,
  showViewUsersDialog: state.applicationDialogs.showViewUsersDialog,
  showSubscribeToPolicyDialog: state.applicationDialogs.showSubscribeToPolicyDialog,
  showInfoAccountDialog: state.applicationDialogs.showInfoAccountDialog,
  showExportDialog: state.applicationDialogs.showExportDialog,
  showImportDialog: state.applicationDialogs.showImportDialog,
  userData: state.applicationDialogs.userData,
});

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    dispatch,
    onWindowResized: () =>
      dispatch(windowResized(window.innerWidth, window.innerHeight)),
    onCancelPicker: () => dispatch(pickDiagramCancel()),
    handleCopy: () => dispatch(handleCopy()),
    handlePaste: (clipboardEvent: ClipboardEvent) =>
      dispatch(handlePaste(clipboardEvent)),
    handleImportMessage: (message: any) =>
      dispatch(handleImportMessage(message)),
  };
};

// NOTE: compose(a,b,c)(X) ==[BECOMES]=> a(b(c(X)))
// export default compose(
//   connect(mapStateToProps, mapDispatchToProps),
//   withKeybindings
// )(App)
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withKeybindings(App));

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
import DashboardContainer from '../containers/DashboardContainer';
import SubscribeToPolicyContainer from '../containers/SubscribeToPolicyContainer';
import InfoAccountContainer from '../containers/InfoAccountContainer';
import HelpModal from '../components/HelpModal';
import AcknowledgementsModal from '../components/AcknowledgementsModal';
import LocalStoragePickerContainer from '../containers/LocalStoragePickerContainer';
import SaveAsContainer from '../containers/SaveAsContainer';
import ImportContainer from '../containers/ImportContainer';
import EnumRegexContainer from '../containers/EnumRegexContainer';
import OntologiesContainer from '../containers/OntologiesContainer';
import { handlePaste, nodeSeparation, tryImport } from '../actions/import';
import { handleCopy } from '../actions/export';
import { clearGraph } from '../actions/storage';
import { clearSelection } from '../actions/selection';
import { getOntologies } from '../selectors';
import { SCHEMA_TEMPLATES } from '../data/schemaTemplates';
import { linkToGoogleFontsCss } from '@neo4j-arrows/graphics';
import { handleImportMessage } from '../reducers/storage';
import { loginSuccess } from '../actions/applicationDialogs';

import './App.css';
import ContextMenu from '../components/ContextMenu';
import GptModal from '../components/GptModal';
import { ArrowsState } from '../reducers';
import { Dispatch } from 'redux';
import GptExplanationModal from '../components/GptExplanationModal';
import OnboardingTour, { isTourDone } from '../components/OnboardingTour';
import anacletoLogo from '../images/anacleto_lab_logo.png';
import KeyboardShortcutsOverlay from '../components/KeyboardShortcutsOverlay';
import TemplatesModal from '../components/TemplatesModal';

export interface AppState {
  tourRunning: boolean;
  tourTemplateLoaded: boolean;
  shortcutsOpen: boolean;
  templatesOpen: boolean;
}

export interface AppProps {
  nodeCount: number;
  inspectorVisible: boolean;
  showSaveAsDialog: boolean;
  showAuthDialog: boolean;
  showViewUsersDialog: boolean;
  showDashboardDialog: boolean;
  showSubscribeToPolicyDialog: boolean;
  showInfoAccountDialog: boolean;
  showExportDialog: boolean;
  showImportDialog: boolean;
  showEnumRegexDialog: boolean;
  showOntologiesDialog: boolean;
  pickingFromLocalStorage: boolean;
  onCancelPicker: any;
  canvasHeight: number;
  fireAction: any;
  handleCopy: (ev: ClipboardEvent) => void;
  handlePaste: (ev: ClipboardEvent) => void;
  handleImportMessage: (ev: MessageEvent<any>) => void;
  onWindowResized: (this: Window, ev: UIEvent) => any;
  userData: any;
  separation: number;
  ontologies: any[];
  loadTourTemplate: (separation: number, ontologies: any[]) => Promise<void>;

  dispatch: Dispatch<any>;
}

class App extends Component<AppProps, AppState> {
  private boundFireKeyboardShortcutAction: (ev: KeyboardEvent) => void;
  private boundHandleCopy: (ev: ClipboardEvent) => void;
  private boundHandlePaste: (ev: ClipboardEvent) => void;

  state: AppState = { tourRunning: false, tourTemplateLoaded: false, shortcutsOpen: false, templatesOpen: false };

  constructor(props: AppProps) {
    super(props);
    linkToGoogleFontsCss();
    this.boundFireKeyboardShortcutAction = this.fireKeyboardShortcutAction.bind(this);
    this.boundHandleCopy = this.handleCopy.bind(this);
    this.boundHandlePaste = this.handlePaste.bind(this);
    window.addEventListener('keydown', this.boundFireKeyboardShortcutAction);
    window.addEventListener('copy', this.boundHandleCopy);
    window.addEventListener('paste', this.boundHandlePaste);
    // window.addEventListener('message', this.handleMessage.bind(this));
  }

  render() {
    const {
      inspectorVisible,
      showSaveAsDialog,
      showAuthDialog,
      showViewUsersDialog,
      showDashboardDialog,
      showSubscribeToPolicyDialog,
      showInfoAccountDialog,
      showExportDialog,
      showImportDialog,
      showEnumRegexDialog,
      showOntologiesDialog,
      pickingFromLocalStorage,
    } = this.props;

    const saveAsModal = showSaveAsDialog ? <SaveAsContainer /> : null;
    const exportModal = showExportDialog ? <ExportContainer /> : null;
    const authModal = showAuthDialog ? <AuthContainer /> : null;
    const viewUsersModal = showViewUsersDialog ? <ViewUsersContainer /> : null; 
    const showDashboardModal = showDashboardDialog ? <DashboardContainer /> : null;
    const subscribeToPolicyModal = showSubscribeToPolicyDialog ? <SubscribeToPolicyContainer /> : null; 
    const infoAccountModal = showInfoAccountDialog ? <InfoAccountContainer /> : null;
    const importModal = showImportDialog ? <ImportContainer /> : null;
    const enumRegexModal = showEnumRegexDialog ? <EnumRegexContainer /> : null;
    const ontologiesModal = showOntologiesDialog ? <OntologiesContainer /> : null;
    const localStorageModal = pickingFromLocalStorage ? (
      <LocalStoragePickerContainer />
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
        <OnboardingTour
          run={this.state.tourRunning}
          username={this.props.userData?.username}
          onFinish={this.handleTourFinish}
        />
        {saveAsModal}
        {authModal}
        {viewUsersModal}
        {showDashboardModal}
        {subscribeToPolicyModal}
        {infoAccountModal}
        {exportModal}
        {importModal}
        {enumRegexModal}
        {ontologiesModal}
        {localStorageModal}
        <HelpModal
          onStartTour={() => this.startTour()}
          username={this.props.userData?.username}
        />
        <AcknowledgementsModal />
        <HeaderContainer
          userData={this.props.userData}
          onOpenTemplates={() => this.setState({ templatesOpen: true })}
        />
        <section
          style={{
            flex: 2,
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <div data-tour="canvas" style={{ flex: 1, display: 'flex', position: 'relative' }}>
            <GraphContainer />
            {/* Empty canvas hint */}
            {this.props.nodeCount === 0 && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  textAlign: 'center', padding: '32px 40px',
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)',
                  border: '1.5px dashed #cbd5e1', borderRadius: '16px',
                  maxWidth: '360px',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>🗂️</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                    Canvas is empty
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '16px' }}>
                    Click <strong>Add Class</strong> in the right panel,<br />
                    or start from a pre-built template.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', pointerEvents: 'all' }}>
                    <button
                      onClick={() => this.setState({ templatesOpen: true })}
                      style={{ padding: '7px 20px', borderRadius: '8px', border: '1.5px solid #6366f1', background: '#eff6ff', color: '#4338ca', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      📂 Load Template
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Keyboard shortcuts button */}
            <button
              onClick={() => this.setState((s) => ({ shortcutsOpen: !s.shortcutsOpen }))}
              title="Keyboard shortcuts (?)"
              style={{
                position: 'absolute', bottom: '14px', right: '14px',
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(0,0,0,0.10)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                cursor: 'pointer', fontSize: '15px', fontWeight: 700,
                color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 100, outline: 'none',
                transition: 'box-shadow 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'white';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.92)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
              }}
            >?</button>
          </div>
          {inspectorVisible && (
            <aside
              data-tour="inspector"
              style={{
                width: inspectorWidth,
                height: this.props.canvasHeight,
                overflowY: 'scroll',
                borderLeft: '1px solid #D4D4D5',
              }}
            >
              <InspectorChooser />
            </aside>
          )}
        </section>
        {import.meta.env.VITE_OPENAI_ENABLED && <ContextMenu userData={this.props.userData} />}
        {import.meta.env.VITE_OPENAI_ENABLED && <GptModal />}
        {import.meta.env.VITE_OPENAI_ENABLED && <GptExplanationModal />}

        {/* Keyboard shortcuts overlay */}
        <KeyboardShortcutsOverlay
          open={this.state.shortcutsOpen}
          onClose={() => this.setState({ shortcutsOpen: false })}
        />

        {/* Templates modal */}
        <TemplatesModal
          open={this.state.templatesOpen}
          onClose={() => this.setState({ templatesOpen: false })}
        />

        {/* AnacletoLAB badge */}
        <a
          href="https://anacletolab.di.unimi.it/"
          target="_blank"
          rel="noopener noreferrer"
          title="AnacletoLAB — Computational Biology and Bioinformatics, University of Milan"
          style={{
            position: 'fixed', bottom: '14px', left: '14px', zIndex: 9999,
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '5px 10px 5px 8px',
            background: 'rgba(238,242,255,0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(99,102,241,0.18)',
            borderRadius: '999px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            textDecoration: 'none',
            transition: 'box-shadow 0.15s, background 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(224,231,255,0.98)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 14px rgba(99,102,241,0.18)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(238,242,255,0.92)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
          }}
        >
          {/* AnacletoLAB logo */}
          <img
            src={anacletoLogo}
            alt="AnacletoLAB"
            style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'contain', flexShrink: 0 }}
          />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.01em' }}>
              Built at AnacletoLAB
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 400 }}>
              University of Milan
            </span>
          </span>
        </a>
      </div>
    );
  }

  fireKeyboardShortcutAction(ev: KeyboardEvent) {
    // ? and Esc for the shortcuts overlay fire regardless of focused element
    if ((ev.key === '?' || (ev.keyCode === 191 && ev.shiftKey)) && !ev.metaKey && !ev.ctrlKey) {
      this.setState((s) => ({ shortcutsOpen: !s.shortcutsOpen }));
      return;
    }
    if (ev.key === 'Escape' && this.state.shortcutsOpen) {
      this.setState({ shortcutsOpen: false });
      return;
    }

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
    ev.preventDefault();
    ev.stopPropagation();
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
      // Already logged in on page load — show tour if this user has never seen it
      if (!isTourDone(parsedUser?.username)) {
        setTimeout(() => this.startTour(), 1200);
      }
    }

    // Preload server registries (single shared cache for UI and import/export)
    import('@neo4j-arrows/linkml').then(({ fetchEnumRegistry, fetchRegexRegistry }) => {
      fetchEnumRegistry().catch(err => console.warn('Failed to preload enum registry:', err));
      fetchRegexRegistry().catch(err => console.warn('Failed to preload regex registry:', err));
    });
  }

  componentDidUpdate(prevProps: AppProps) {
    const prevUser = prevProps.userData?.username;
    const curUser  = this.props.userData?.username;
    // Fires when a user logs in during this session
    if (!prevUser && curUser && !isTourDone(curUser)) {
      setTimeout(() => this.startTour(), 800);
    }
  }

  startTour = async () => {
    // Load Drug-Disease template onto the canvas for the tour
    await this.props.loadTourTemplate(this.props.separation, this.props.ontologies);
    this.setState({ tourRunning: true, tourTemplateLoaded: true });
  };

  handleTourFinish = () => {
    this.setState({ tourRunning: false });
    if (this.state.tourTemplateLoaded) {
      setTimeout(() => {
        this.props.dispatch(clearGraph() as any);
        this.setState({ tourTemplateLoaded: false });
      }, 500);
    }
  };

  componentWillUnmount() {
    window.removeEventListener('keydown', this.boundFireKeyboardShortcutAction);
    window.removeEventListener('copy', this.boundHandleCopy);
    window.removeEventListener('paste', this.boundHandlePaste);
    window.removeEventListener('resize', this.props.onWindowResized);
  }
}

const mapStateToProps = (state: ArrowsState) => ({
  nodeCount: ((state.graph as any).present || state.graph).nodes?.length ?? 0,
  inspectorVisible: state.applicationLayout.inspectorVisible,
  canvasHeight: computeCanvasSize(state.applicationLayout).height,
  pickingFromLocalStorage:
    state.storage.status === 'PICKING_FROM_LOCAL_STORAGE',
  showSaveAsDialog: state.applicationDialogs.showSaveAsDialog,
  showAuthDialog: state.applicationDialogs.showAuthDialog,
  showViewUsersDialog: state.applicationDialogs.showViewUsersDialog,
  showDashboardDialog: state.applicationDialogs.showDashboardDialog,
  showSubscribeToPolicyDialog: state.applicationDialogs.showSubscribeToPolicyDialog,
  showInfoAccountDialog: state.applicationDialogs.showInfoAccountDialog,
  showExportDialog: state.applicationDialogs.showExportDialog,
  showImportDialog: state.applicationDialogs.showImportDialog,
  showEnumRegexDialog: state.applicationDialogs.showEnumRegexDialog,
  showOntologiesDialog: state.applicationDialogs.showOntologiesDialog,
  userData: state.applicationDialogs.userData,
  separation: nodeSeparation(state),
  ontologies: getOntologies(state).ontologies,
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
    loadTourTemplate: async (separation: number, ontologies: any[]) => {
      const tpl = SCHEMA_TEMPLATES[0];
      dispatch(clearGraph() as any);
      await new Promise(r => setTimeout(r, 100));
      await tryImport(dispatch as any)(tpl.yaml, separation, ontologies, 'LinkML RDF');
      // Deselect everything so the inspector shows schema-level attributes, not the selection panel
      dispatch(clearSelection());
    },
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

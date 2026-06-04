import React, { PureComponent } from 'react';
import { Icon, Menu, Button, ButtonGroup, Dropdown, Modal, Checkbox } from 'semantic-ui-react';
import { DiagramNameEditor } from './DiagramNameEditor';
import arrows_logo from '../images/arrows_logo.svg';
import { defaultCallbackFactory } from './GptModal';
import { sanitizeInternalGraph } from '../utils/sanitizeGraph';
import { fromGraph, SpiresType, toYaml } from '@neo4j-arrows/linkml';

import {
  CommandKind
} from '@neo4j-arrows/model';

const storageNames = {
  LOCAL_STORAGE: 'Web Browser storage',
};

const storageStatusMessage = (props) => {
  const storageName = storageNames[props.storage.mode];
  if (storageName) {
    const statusMessages = {
      READY: `Saved to ${storageName}`,
      GET: `Loading from ${storageName}`,
      GETTING: `Loading from ${storageName}`,
      POSTING: `Saving to ${storageName}...`,
      PUT: `Unsaved changes`,
      PUTTING: `Saving to ${storageName}...`,
      FAILED: `Failed to save to ${storageName}, see Javascript console for details.`,
    };
    return <span>{statusMessages[props.storage.status] || ''}</span>;
  } else {
    return null;
  }
};

const storageIcon = (storageMode) => {
  switch (storageMode) {
    case 'DATABASE':
      return 'database';

    case 'LOCAL_STORAGE':
      return 'window maximize outline';

    default:
      return 'square outline';
  }
};

class Header extends PureComponent {
  state = { 
    open: false,
    canGenerate: false,
    reason: '',
    userPolicy: null,
    extractOpen: false,
    extractView: 'input',
    extractActiveTab: 'text',
    extractSchemaSource: 'canvas',
    extractSchema: '',
    extractText: '',
    extractTextSource: 'type',
    extractLoading: false,
    extractResult: null,
    extractError: null,
    extractVisibleClasses: {},
    pubmedQuery: '',
    pubmedResults: [],
    pubmedSearching: false,
    pubmedError: null,
  };

  componentDidMount() {
    this.checkGeneratePermission();

    if (this.props.userData?.username) {
      this.fetchUserPolicy();
    }
  }

  componentDidUpdate(prevProps) {
    const prevUsername = prevProps.userData?.username;
    const currentUsername = this.props.userData?.username;

    if (prevUsername !== currentUsername) {
      this.checkGeneratePermission();
    }
  }

  checkGeneratePermission = async () => {
    const { userData } = this.props;
    if (!userData || !userData.username){
      this.setState({
        canGenerate: false,
        reason: "You must register to request intelligent operations.",
      });
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_CAN_PERFORM_OPERATION_ENDPOINT}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ username: userData.username, operation: "Generate" }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    console.log("Authorization result generate", result);

    this.setState({
      canGenerate: result.allowed === true,
      reason: result.allowed !== true ? (result.reason || "You do not have permission to request intelligent operations.") : undefined,
      userPolicy: result.policy?.toLowerCase() || null
    });
  };

  toggleDropdown = () => {
    this.setState({ open: !this.state.open });
  };

  handleLogout = async () => {  
    try {
      const response = await fetch(`${import.meta.env.VITE_LOGOUT_ENDPOINT}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.ok) {
        console.log('Logout successful');
        this.props.onLogout();
        localStorage.removeItem('user');
        this.setState({
          canGenerate: false,
          reason: 'You must register to request intelligent operations.',
          userPolicy: null,
        });
      } else {
        const errorData = await response.json();
        console.error("Logout failed: ", errorData);
        alert('Logout error: ' + (errorData.detail || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Request error: ', error);
      alert('Logout error: ' + (error.message || 'Communication error with the server.'));
    }
  };

  handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account?");
    
    if (!confirmed) return;
  
    try {
      const response = await fetch(`${import.meta.env.VITE_DELETE_ACCOUNT_ENDPOINT}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.ok) {
        console.log('Delete account successful');
        this.props.onDeleteAccount();
      } else {
        const errorData = await response.json();
        console.error("Delete account failed: ", errorData);
        alert('Delete account error: ' + (errorData.detail || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Request error: ', error);
      alert('Delete account error: ' + (error.message || 'Communication error with the server.'));
    }
  };
  
  handleContribute = async () => {
    const confirmed = window.confirm("Would you like to contribute your schema to AI store?");
    
    if (!confirmed) return;
  
    try {
       const graph = this.props.graph;

      if ((!graph.nodes || graph.nodes.length === 0) && (!graph.relationships || graph.relationships.length === 0)) {
      alert('Contribute error: the graph is empty.');
      return;
    }

      const jsonGraph = JSON.stringify(sanitizeInternalGraph(this.props.graph), null, 2);

      const response = await fetch(`${import.meta.env.VITE_CONTRIBUTE_ENDPOINT}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        username: this.props.userData.username,
        diagramName: this.props.diagramName,
        graphJson: jsonGraph,
      }),
      });
  
      if (response.ok) {
        console.log('Schema sent successfully');
        alert('Your schema has been sent successfully. Thank you for your contribution!');
      } else {
        const errorData = await response.json();
        console.error("Contribute failed: ", errorData);
        alert('Contribute error: ' + (errorData.detail || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Request error: ', error);
      alert('Contribute error: ' + (error.message || 'Communication error with the server.'));
    }
  };

  generateSchemaFromCanvas = () => {
    const { graph, diagramName } = this.props;
    if (!graph || (!graph.nodes?.length && !graph.relationships?.length)) return '';
    try {
      const linkML = fromGraph(diagramName || 'schema', graph, SpiresType.RE);
      return toYaml(linkML);
    } catch (e) {
      console.error('Failed to generate schema from canvas:', e);
      return '';
    }
  };

  searchPubmed = async () => {
    const { pubmedQuery } = this.state;
    if (!pubmedQuery.trim()) return;
    this.setState({ pubmedSearching: true, pubmedError: null, pubmedResults: [] });
    try {
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(pubmedQuery)}&retmax=5&retmode=json`;
      const searchData = await fetch(searchUrl).then(r => r.json());
      const ids = searchData?.esearchresult?.idlist || [];
      if (ids.length === 0) {
        this.setState({ pubmedSearching: false, pubmedResults: [], pubmedError: 'No results found.' });
        return;
      }
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=xml`;
      const xml = await fetch(fetchUrl).then(r => r.text());
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const results = Array.from(doc.querySelectorAll('PubmedArticle')).map(article => ({
        pmid: article.querySelector('PMID')?.textContent || '',
        title: article.querySelector('ArticleTitle')?.textContent || '',
        abstract: Array.from(article.querySelectorAll('AbstractText')).map(a => a.textContent).join(' '),
      })).filter(r => r.abstract);
      this.setState({ pubmedResults: results, pubmedSearching: false });
    } catch (e) {
      this.setState({ pubmedSearching: false, pubmedError: 'PubMed search failed: ' + e.message });
    }
  };

  runExtraction = async () => {
    const { extractSchema, extractText } = this.state;
    if (!extractSchema.trim() || !extractText.trim()) {
      this.setState({ extractError: 'Please provide both a schema and an input text.' });
      return;
    }
    this.setState({ extractLoading: true, extractError: null, extractResult: null });
    try {
      const username = this.props.userData?.username;

      if (!username) {
        this.setState({ extractError: 'You must be logged in to use extractions.', extractLoading: false });
        return;
      }

      const endpoint = import.meta.env.VITE_EXTRACT_ENDPOINT;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          schema: extractSchema,
          text: extractText,
          add_dependencies: true,
          ground_mode: 'exact',
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        this.setState({ extractError: data.error || 'Extraction failed.', extractLoading: false });
        return;
      }

      const responses = data.responses || {};
      const visibleClasses = {};
      Object.keys(responses).forEach((k) => { visibleClasses[k] = true; });
      Object.keys(data.trace || {}).forEach((k) => { visibleClasses[k] = true; });
      this.setState({
        extractResult: data,
        extractVisibleClasses: visibleClasses,
        extractView: 'result',
        extractActiveTab: 'text',
        extractLoading: false,
      });
    } catch (err) {
      this.setState({ extractError: 'Network error: ' + err.message, extractLoading: false });
    }
  };

  render() {
    const {
      isAuthenticated,
      userData,
      onGenerateClick,
      graph,
      ontologies,
      separation,
      clearGraph,
      importNodesAndRelationships,
      setDiagramName,
    } = this.props;

    const newDiagramOptions = ['LOCAL_STORAGE'].map((mode) => (
      <div
        key={mode}
        role="option"
        aria-selected
        className="item"
        onClick={() => this.props.onNewDiagram(mode)}
      >
        <i aria-hidden="true" className={'icon ' + storageIcon(mode)} />
        <span>{storageNames[mode]}</span>
      </div>
    ));

    const sanitizedRecent = (this.props.recentStorage || []).filter(
      (entry) => entry && typeof entry.diagramName === 'string'
    );
    const recentlyAccessFiles = sanitizedRecent
      .slice(1, 11)
      .map((entry, i) => (
        <div
          key={'recentlyAccessFiles' + i}
          role="option"
          aria-selected
          className="item"
          onClick={() => this.props.openRecentFile(entry)}
          style={{
            maxWidth: '20em',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          <i aria-hidden="true" className={'icon ' + storageIcon(entry.mode)} />
          <span className="text">{entry.diagramName}</span>
        </div>
      ));

    const browseDiagramOptions = ['LOCAL_STORAGE'].map((mode) => (
      <div
        key={mode}
        role="option"
        aria-selected
        className="item"
        onClick={() => this.props.pickFileToOpen(mode)}
      >
        <i aria-hidden="true" className={'icon ' + storageIcon(mode)} />
        <span>{storageNames[mode]}</span>
      </div>
    ));

    return (
      <Menu attached="top" style={{ borderRadius: 0 }} borderless>
        <div
          role="listbox"
          aria-expanded="true"
          className="ui item simple dropdown"
          tabIndex="0"
        >
          <i className="icon" style={{ height: '1.5em' }}>
            <img
              src={arrows_logo}
              style={{ height: '1.5em' }}
              alt="SchemaLink logo"
            />
          </i>
          <div className="menu transition visible">
            <div role="option" aria-selected className="item">
              <i aria-hidden="true" className="dropdown icon" />
              <span className="text">New</span>
              <div className="menu transition">
                <div className="header">Store in</div>
                {newDiagramOptions}
              </div>
            </div>
            <div role="option" aria-selected className="item">
              <i aria-hidden="true" className="dropdown icon" />
              <span className="text">Open</span>
              <div className="menu transition">
                <div className="header">Recently accessed</div>
                {recentlyAccessFiles}
                <div className="divider" />
                <div className="header">Browse</div>
                {browseDiagramOptions}
              </div>
            </div>
            <div
              role="option"
              aria-selected
              className="item"
              onClick={this.props.onSaveAsClick}
            >
              Save As…
            </div>
            <div className="divider" />
            <div
              role="option"
              aria-selected
              className="item"
              onClick={this.props.onImportClick}
            >
              Import
            </div>
            {import.meta.env.VITE_OPENAI_ENABLED && (
              <div
                role="option"
                aria-selected
                className="item"
                onClick={() => {
                  if (isAuthenticated && this.state.canGenerate) {
                    onGenerateClick(
                      defaultCallbackFactory(
                        CommandKind,
                        ontologies,
                        graph,
                        separation,
                        clearGraph,
                        importNodesAndRelationships,
                        setDiagramName,
                        graph.nodes,
                        graph.relationships
                      )
                    );
                  }
                }}
                title={
                  this.state.canGenerate
                    ? ''
                    : this.state.reason || 'You do not have permission to request intelligent operations.'
                }
                style={{
                  opacity: (!isAuthenticated || !this.state.canGenerate) ? 0.5 : 1,
                }}
              >
                Generate
              </div>
            )}
            <div className="divider" />
            <div
              role="option"
              aria-selected
              className="item"
              onClick={this.props.onHelpClick}
            >
              Help
            </div>
            <div
              role="option"
              aria-selected
              className="item"
              onClick={this.props.onAcknowledgementsClick}
            >
              Acknowledgements
            </div>
          </div>
        </div>
        <DiagramNameEditor
          diagramName={this.props.diagramName}
          setDiagramName={this.props.setDiagramName}
        />
        <Menu.Item>
          <ButtonGroup>
            <Button
              icon="undo"
              disabled={this.props.undoRedoDisabled.undo}
              onClick={this.props.undo}
            />
            <Button
              icon="redo"
              disabled={this.props.undoRedoDisabled.redo}
              onClick={this.props.redo}
            />
          </ButtonGroup>
        </Menu.Item>
        <Menu.Item style={{ opacity: 0.6 }}>
          <Icon name={storageIcon(this.props.storage.mode)} />
          {storageStatusMessage(this.props)}
        </Menu.Item>
        <Menu.Menu position={'right'}>
          <Menu.Item>
          {this.props.isAuthenticated ? (
            <Dropdown
              trigger={
                <Button
                  icon="user"
                  basic
                  color="black"
                  content={userData.username}
                />
              }
              pointing="top right"
              className="link item"
            >
              <Dropdown.Menu>
                <Dropdown.Item onClick={this.props.onInfoAccountClick}>Info Account</Dropdown.Item>
                {userData.username !== "schemalink" && (
                  <Dropdown.Item onClick={this.props.onSubscribeToPolicyClick}>Subscription Plan</Dropdown.Item>
                )}
                {userData.username === "schemalink" && (
                  <Dropdown.Item onClick={this.props.onViewUsersClick}>View Users</Dropdown.Item>
                )}
                {userData.username === "schemalink" && (
                  <Dropdown.Item onClick={this.props.onDashboardClick}>Dashboard</Dropdown.Item>
                )}
                {userData.username === "schemalink" && (
                  <Dropdown.Item onClick={this.props.onOntologiesClick}>Ontologies</Dropdown.Item>
                )}
                <Dropdown.Item onClick={this.handleLogout}>Logout</Dropdown.Item>
                {userData.username !== "schemalink" && (
                    <Dropdown.Item onClick={this.handleDeleteAccount}>Delete Account</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <Button
              onClick={this.props.onAuthClick}
              icon="user"
              basic
              color="black"
              content="Login / Register"
            />
          )}
            <span style={{ marginRight: '10px' }}></span>
            <Button
              onClick={this.props.onEnumRegexClick}
              icon="list"
              basic
              color="black"
              content="Enums / Regexes"
            />
            <span style={{ marginRight: '10px' }}></span>
            <Button
              onClick={this.props.onExportClick}
              icon="download"
              basic
              color="black"
              content="Download / Export"
            />
            <div>
              <span style={{ marginRight: '10px' }}></span>
              <Button
                icon="file text"
                basic
                color="black"
                content="Extract"
                title="Extract (mock)"
                onClick={() => {
                  const canvasSchema = this.generateSchemaFromCanvas();
                  this.setState({
                    extractOpen: true,
                    extractSchemaSource: 'canvas',
                    extractSchema: canvasSchema,
                    extractTextSource: 'type',
                    pubmedQuery: '',
                    pubmedResults: [],
                    pubmedError: null,
                  });
                }}
              />

              <span style={{ marginRight: '10px' }}></span>
              <Button
                onClick={() => {
                  if (['gold', 'platinum'].includes(this.state.userPolicy)) {
                    this.handleContribute();
                  }
                }}
                icon="database"
                basic
                color="black"
                style={{
                  opacity: ['gold', 'platinum'].includes(this.state.userPolicy) ? 1 : 0.5,
                  cursor: 'pointer',
              }}
                content={
                  <span style={{ color: ['gold', 'platinum'].includes(this.state.userPolicy) ? 'inherit' : 'gray' }}>
                    Contribute
                  </span>
                }
                title={
                  !this.props.userData
                    ? 'Please log in to contribute.'
                    : !['gold', 'platinum'].includes(this.state.userPolicy)
                    ? 'Only gold and platinum users can contribute.'
                    : ''
                }
              />
            </div>
            <Modal
              open={this.state.extractOpen}
              onClose={() => this.setState({ extractOpen: false, extractView: 'input', extractResult: null, extractError: null, pubmedResults: [], pubmedQuery: '', pubmedError: null })}
              size="large"
              style={{ width: '86%', maxWidth: '1200px' }}
            >
              <Modal.Header>
                {this.state.extractView === 'result' ? 'Extraction Result' : 'Extract'}
              </Modal.Header>
              <Modal.Content>
                {this.state.extractView === 'input' ? (() => {
                  const { extractSchemaSource, extractTextSource, pubmedQuery, pubmedResults, pubmedSearching, pubmedError } = this.state;
                  const graph = this.props.graph;
                  const nodeLabels = (graph?.nodes || []).map(n => n.caption || n.labels?.[0] || '').filter(Boolean);
                  const relTypes = (graph?.relationships || []).map(r => r.type || '').filter(Boolean);
                  const canvasEmpty = nodeLabels.length === 0 && relTypes.length === 0;

                  const sourcePill = (active) => ({
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '4px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '13px',
                    fontWeight: active ? 700 : 400,
                    background: active ? '#1d4ed8' : '#f1f5f9',
                    color: active ? 'white' : '#334155',
                    border: '1px solid ' + (active ? '#1d4ed8' : '#cbd5e1'),
                    userSelect: 'none',
                  });

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                      {/* ── LEFT: Schema ── */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>Schema</div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <span style={sourcePill(extractSchemaSource === 'canvas')}
                              onClick={() => {
                                const s = this.generateSchemaFromCanvas();
                                this.setState({ extractSchemaSource: 'canvas', extractSchema: s });
                              }}>
                              <Icon name="pencil alternate" />From canvas
                            </span>
                            <span style={sourcePill(extractSchemaSource === 'upload')}
                              onClick={() => this.setState({ extractSchemaSource: 'upload', extractSchema: '' })}>
                              <Icon name="upload" />Upload YAML
                            </span>
                          </div>

                          {extractSchemaSource === 'canvas' ? (
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: canvasEmpty ? '#fff7ed' : '#f0fdf4', minHeight: '120px' }}>
                              {canvasEmpty ? (
                                <div style={{ color: '#92400e', fontSize: '13px' }}>
                                  <Icon name="warning sign" /> The canvas is empty. Draw your schema first, or switch to "Upload YAML".
                                </div>
                              ) : (
                                <>
                                  <div style={{ fontSize: '12px', color: '#166534', marginBottom: '8px', fontWeight: 600 }}>
                                    <Icon name="check circle outline" color="green" />Schema loaded from canvas
                                  </div>
                                  {nodeLabels.length > 0 && (
                                    <div style={{ marginBottom: '6px' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entities</span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                        {nodeLabels.map((l, i) => (
                                          <span key={i} style={{ background: '#dbeafe', color: '#1e40af', borderRadius: '12px', padding: '2px 8px', fontSize: '12px' }}>{l}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {relTypes.length > 0 && (
                                    <div>
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relations</span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                        {relTypes.map((t, i) => (
                                          <span key={i} style={{ background: '#f3e8ff', color: '#6b21a8', borderRadius: '12px', padding: '2px 8px', fontSize: '12px' }}>{t}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div>
                              <input
                                type="file" accept=".yaml,.yml"
                                style={{ marginBottom: '8px', fontSize: '13px' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (ev) => this.setState({ extractSchema: ev.target.result });
                                  reader.readAsText(file);
                                }}
                              />
                              <textarea
                                style={{ width: '100%', height: '150px', fontFamily: 'monospace', fontSize: '11px', border: '1px solid rgba(34,36,38,0.2)', borderRadius: '4px', padding: '8px', resize: 'vertical', boxSizing: 'border-box' }}
                                placeholder="…or paste your LinkML YAML here"
                                value={this.state.extractSchema}
                                onChange={(e) => this.setState({ extractSchema: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── RIGHT: Text ── */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>Input Text</div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <span style={sourcePill(extractTextSource === 'type')}
                              onClick={() => this.setState({ extractTextSource: 'type' })}>
                              <Icon name="keyboard outline" />Type / Paste
                            </span>
                            <span style={sourcePill(extractTextSource === 'pubmed')}
                              onClick={() => this.setState({ extractTextSource: 'pubmed' })}>
                              <Icon name="search" />Search PubMed
                            </span>
                          </div>

                          {extractTextSource === 'type' ? (
                            <textarea
                              style={{ width: '100%', height: '200px', fontFamily: 'inherit', fontSize: '13px', border: '1px solid rgba(34,36,38,0.2)', borderRadius: '4px', padding: '8px', resize: 'vertical', boxSizing: 'border-box' }}
                              placeholder="Paste or type the text to extract information from…"
                              value={this.state.extractText}
                              onChange={(e) => this.setState({ extractText: e.target.value })}
                            />
                          ) : (
                            <div>
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                <input
                                  style={{ flex: 1, padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                  placeholder="e.g. drug-induced liver injury"
                                  value={pubmedQuery}
                                  onChange={(e) => this.setState({ pubmedQuery: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && this.searchPubmed()}
                                />
                                <Button
                                  primary size="small"
                                  loading={pubmedSearching}
                                  disabled={pubmedSearching || !pubmedQuery.trim()}
                                  onClick={this.searchPubmed}
                                  icon="search"
                                  content="Search"
                                />
                              </div>
                              {pubmedError && (
                                <div style={{ color: '#b91c1c', fontSize: '12px', marginBottom: '6px' }}>{pubmedError}</div>
                              )}
                              {pubmedResults.length > 0 && (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                  {pubmedResults.map((r) => (
                                    <div key={r.pmid}
                                      style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = ''}
                                      onClick={() => this.setState({ extractText: r.abstract, extractTextSource: 'type' })}
                                    >
                                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e40af', marginBottom: '2px' }}>
                                        PMID {r.pmid} — {r.title}
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4, maxHeight: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {r.abstract.slice(0, 160)}…
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {pubmedResults.length === 0 && !pubmedSearching && !pubmedError && (
                                <div style={{ color: '#94a3b8', fontSize: '12px', padding: '8px 0' }}>
                                  Search for abstracts and click one to use it as input text.
                                </div>
                              )}
                              {this.state.extractText && (
                                <div style={{ marginTop: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '12px', maxHeight: '80px', overflowY: 'auto', color: '#334155' }}>
                                  <strong>Selected:</strong> {this.state.extractText.slice(0, 200)}{this.state.extractText.length > 200 ? '…' : ''}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {this.state.extractError && (
                          <div style={{ color: '#b91c1c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '4px', padding: '8px 12px', fontSize: '13px' }}>
                            {this.state.extractError}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })() : (() => {
                  const responses = this.state.extractResult?.responses || {};
                  const trace = this.state.extractResult?.trace || {};
                  const outputLog = this.state.extractResult?.output || '';
                  const activeTab = this.state.extractActiveTab || 'text';
                  const classColors = ['#fff1f2', '#eff6ff', '#f0fdf4', '#fdf4ff', '#fff7ed', '#f0f9ff', '#fefce8'];
                  const textColors = ['#b91c1c', '#1d4ed8', '#15803d', '#7e22ce', '#c2410c', '#0369a1', '#a16207'];

                  // Separate entity classes from relation classes
                  // Use trace: classes with RE_INIT are relations; NE_INIT are entities
                  const reTraceClasses = new Set(Object.keys(trace).filter(k => trace[k]['RE_INIT'] !== undefined || trace[k]['RE_FINAL'] !== undefined));
                  const neTraceClasses = new Set(Object.keys(trace).filter(k => trace[k]['NE_INIT'] !== undefined));
                  const entityClasses = {};
                  const relationClasses = {};
                  Object.entries(responses).forEach(([cls, data]) => {
                    const key = `${cls}Relationships`;
                    const hasRelKey = data[key] !== undefined;
                    const isRel = reTraceClasses.has(cls) || hasRelKey || cls.includes('Relationship') || cls.includes('Triple');
                    if (isRel) relationClasses[cls] = data;
                    else entityClasses[cls] = data;
                  });
                  // Also add relation classes that appear only in trace (not in responses)
                  Object.keys(trace).filter(k => reTraceClasses.has(k) && !responses[k]).forEach(k => {
                    relationClasses[k] = {};
                  });
                  const entityKeys = Object.keys(entityClasses);
                  const relationKeys = Object.keys(relationClasses);

                  // Highlight entity mentions in input text
                  const buildHighlightSegments = () => {
                    const inputText = this.state.extractText;
                    const allMentions = [];
                    entityKeys.forEach((cls, i) => {
                      if (!this.state.extractVisibleClasses[cls]) return;
                      (entityClasses[cls]?.schemaResponse?.mentions || []).forEach(m => {
                        const label = typeof m === 'string' ? m : (m?.label || m?.name || '');
                        if (label) allMentions.push({ label, color: textColors[i % textColors.length] });
                      });
                    });
                    allMentions.sort((a, b) => b.label.length - a.label.length);
                    const used = [];
                    allMentions.forEach(({ label, color }) => {
                      let idx = 0;
                      const lower = inputText.toLowerCase();
                      const lbl = label.toLowerCase();
                      while ((idx = lower.indexOf(lbl, idx)) !== -1) {
                        if (!used.some(u => u.start < idx + label.length && u.end > idx)) {
                          used.push({ start: idx, end: idx + label.length, color });
                        }
                        idx += label.length;
                      }
                    });
                    used.sort((a, b) => a.start - b.start);
                    const segs = [];
                    let cur = 0;
                    used.forEach(u => {
                      if (u.start < cur) return;
                      if (u.start > cur) segs.push({ text: inputText.slice(cur, u.start), color: null });
                      segs.push({ text: inputText.slice(u.start, u.end), color: u.color });
                      cur = u.end;
                    });
                    if (cur < inputText.length) segs.push({ text: inputText.slice(cur), color: null });
                    return segs.length ? segs : [{ text: inputText, color: null }];
                  };

                  // Parse pipeline log into structured rows
                  const parseLog = () => {
                    return outputLog
                      .split('\n')
                      .map(l => l.trim())
                      .filter(l => l &&
                        !l.match(/^\*\*Step \d/) &&
                        !l.startsWith('DEBUG') &&
                        !l.startsWith('Warning') &&
                        !l.startsWith('🚀') &&
                        l !== '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                      )
                      .map(l => {
                        if (l.includes('**Output File**')) {
                          const path = l.replace(/\*\*Output File\*\*\s*\*?\*?\s*/, '').trim();
                          return { type: 'file', step: 'Output file', outcome: path, path };
                        }
                        if (l.match(/^DAG\d/)) {
                          const [dagId, ...rest] = l.split(' ');
                          return { type: 'dag', step: dagId, outcome: rest.join(' ') };
                        }
                        const clean = l.replace(/\*\*/g, '').replace(/[✅❌⚠️🔍📊]/g, '').trim();
                        if (l.includes('->') && (l.includes('✅') || l.includes('Grounded'))) {
                          return { type: 'grounding_ok', step: 'Grounding', outcome: clean };
                        }
                        if (l.includes('❌') || l.includes('No grounding')) {
                          return { type: 'grounding_fail', step: 'Grounding', outcome: clean };
                        }
                        const colonIdx = clean.indexOf(':');
                        if (colonIdx > 0 && colonIdx < 40) {
                          return { type: 'info', step: clean.slice(0, colonIdx).trim(), outcome: clean.slice(colonIdx + 1).trim() };
                        }
                        return { type: 'info', step: clean, outcome: '' };
                      });
                  };
                  const logItems = parseLog();

                  const toggleClass = (cls) => this.setState(prev => ({
                    extractVisibleClasses: { ...prev.extractVisibleClasses, [cls]: !prev.extractVisibleClasses[cls] }
                  }));

                  const entityTotal = entityKeys.reduce((s, k) => s + (entityClasses[k]?.schemaResponse?.mentions?.length || 0), 0);
                  const relationTotal = relationKeys.reduce((s, k) => s + (relationClasses[k]?.schemaResponse?.mentions?.length || 0), 0);

                  // Render a single entity mention card
                  const renderMention = (m, j, bgColor) => (
                    <div key={j} style={{ paddingBottom: '4px', marginBottom: '4px', borderBottom: '1px dashed #e5e7eb' }}>
                      {typeof m === 'string' ? (
                        <em>{m}</em>
                      ) : typeof m === 'object' && m !== null ? (
                        Object.entries(m).map(([k, v]) => (
                          <div key={k} style={{ fontSize: '12px' }}>
                            <code>{k}</code>: <em>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</em>
                          </div>
                        ))
                      ) : null}
                    </div>
                  );

                  return (
                    <div>
                      {/* Tab bar */}
                      <div className="ui top attached tabular menu" style={{ marginBottom: 0 }}>
                        {[
                          { id: 'text', label: 'Text' },
                          { id: 'entities', label: `Entities (${entityTotal})` },
                          { id: 'relations', label: `Relations (${relationTotal})` },
                          { id: 'json', label: 'JSON' },
                        ].map(tab => (
                          <a key={tab.id}
                            className={`item${activeTab === tab.id ? ' active' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => this.setState({ extractActiveTab: tab.id })}>
                            {tab.label}
                          </a>
                        ))}
                      </div>

                      <div style={{ border: '1px solid rgba(34,36,38,0.15)', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '12px', minHeight: '420px' }}>

                        {/* ── TEXT TAB ── */}
                        {activeTab === 'text' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                              {/* All-class visibility checkboxes (NE + RE) */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <strong>Show:</strong>
                                {entityKeys.map((cls, i) => (
                                  <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                                    onClick={() => toggleClass(cls)}>
                                    <Checkbox checked={!!this.state.extractVisibleClasses[cls]} onChange={() => toggleClass(cls)} />
                                    <span style={{ color: textColors[i % textColors.length] }}>{cls}</span>
                                  </label>
                                ))}
                                {relationKeys.map((cls) => (
                                  <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                                    onClick={() => toggleClass(cls)}>
                                    <Checkbox checked={!!this.state.extractVisibleClasses[cls]} onChange={() => toggleClass(cls)} />
                                    <span style={{ color: '#555' }}>{cls}</span>
                                  </label>
                                ))}
                              </div>

                              {/* Highlighted text */}
                              <div style={{ border: '1px solid rgba(34,36,38,0.15)', borderRadius: '4px', padding: '8px', background: '#fafafa' }}>
                                <div style={{ lineHeight: 1.7, fontSize: '15px', background: 'white', padding: '8px', borderRadius: '4px', border: '1px solid rgba(34,36,38,0.1)' }}>
                                  {buildHighlightSegments().map((seg, i) =>
                                    seg.color
                                      ? <span key={i} style={{ color: seg.color, fontWeight: 700 }}>{seg.text}</span>
                                      : <span key={i}>{seg.text}</span>
                                  )}
                                </div>
                              </div>

                              {/* Dependency Trace — structured per-class */}
                              <div style={{ border: '1px solid rgba(34,36,38,0.2)', borderRadius: '4px', padding: '10px', background: '#fafafa' }}>
                                <strong>Dependency Trace</strong>
                                <div style={{ marginTop: '8px', border: '1px solid rgba(34,36,38,0.2)', borderRadius: '4px', background: 'white', maxHeight: '260px', overflowY: 'auto' }}>
                                  {(() => {
                                    // Build trace rows from structured trace data
                                    const rows = [];
                                    const allTracedClasses = Object.keys(trace);
                                    if (allTracedClasses.length === 0) {
                                      // Fallback: render raw log
                                      return logItems.length > 0 ? (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', lineHeight: 1.35 }}>
                                          <thead><tr style={{ background: '#f3f4f6' }}>
                                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(34,36,38,0.15)', width: '38%' }}>Prompt / Operation</th>
                                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(34,36,38,0.15)' }}>Outcome</th>
                                          </tr></thead>
                                          <tbody>{logItems.map((item, idx) => (
                                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
                                              <td style={{ padding: '6px 8px', borderBottom: '1px solid #ececec' }}><code>{item.step}</code></td>
                                              <td style={{ padding: '6px 8px', borderBottom: '1px solid #ececec' }}><em>{item.outcome || '—'}</em></td>
                                            </tr>
                                          ))}</tbody>
                                        </table>
                                      ) : <div style={{ padding: '12px', color: '#888', fontSize: '12px' }}>No trace data available.</div>;
                                    }

                                    // NE classes
                                    entityKeys.forEach((cls, i) => {
                                      const t = trace[cls] || {};
                                      const bg = classColors[i % classColors.length];
                                      const init = t['NE_INIT'] || [];
                                      const grounded = t['NE_GROUNDED'];
                                      const groundingRemoved = t['NE_GROUNDING_REMOVED'] || [];
                                      const filtered = t['NE_FILTERED'];
                                      const filterRemoved = t['NE_FILTER_REMOVED'] || [];
                                      const attrs = t['NE_ATTRS'];

                                      const labelOf = (m) => typeof m === 'string' ? m : (m?.label || m?.name || JSON.stringify(m));

                                      // _I row
                                      rows.push({ bg, step: `${cls}_I`, outcome: init.length === 0 ? <em style={{ color: '#888' }}>no mentions extracted</em> : <em>{init.map(labelOf).join('; ')}</em> });

                                      // algorithmic filter row
                                      if (filtered !== undefined) {
                                        rows.push({ bg, step: `${cls} constraint check`, outcome: <em>{filtered.map(labelOf).join('; ') || 'none passed'}</em> });
                                        if (filterRemoved.length > 0)
                                          rows.push({ bg: '#fff7ed', step: `${cls} pruned`, outcome: <em style={{ textDecoration: 'line-through', color: '#b91c1c' }}>{filterRemoved.map(labelOf).join('; ')}</em> });
                                      }

                                      // grounding row
                                      if (grounded !== undefined) {
                                        rows.push({
                                          bg: '#f0fdf4',
                                          step: `${cls} grounding`,
                                          outcome: (
                                            <span>
                                              {grounded.map((g, j) => <em key={j}>{labelOf(g)}{g?.id ? ` → ${g.id}` : ''}</em>).reduce((a, b) => [a, '; ', b], [])}
                                              {groundingRemoved.length > 0 && <span>; {groundingRemoved.map((r, j) => <em key={j} style={{ textDecoration: 'line-through', color: '#b91c1c' }}>{labelOf(r)}</em>).reduce((a, b) => [a, '; ', b], [])}</span>}
                                            </span>
                                          )
                                        });
                                      }

                                      // _A row
                                      if (attrs) {
                                        const attrList = Object.entries(attrs).flatMap(([, v]) =>
                                          Array.isArray(v) ? v.map(a => Object.entries(a).filter(([k]) => k !== 'id').map(([k, val]) => `${k}: ${val}`).join(', ')).filter(Boolean) : []
                                        );
                                        rows.push({ bg, step: `${cls}_A`, outcome: attrList.length > 0 ? <em>{attrList.join('; ')}</em> : <em style={{ color: '#888' }}>—</em> });
                                      }
                                    });

                                    // RE classes
                                    relationKeys.forEach((cls) => {
                                      const t = trace[cls] || {};
                                      const init = t['RE_INIT'] || [];
                                      const final = t['RE_FINAL'] || [];
                                      const removed = t['RE_FILTERED_REMOVED'] || [];

                                      const relLabel = (r) => {
                                        if (!r || typeof r !== 'object') return String(r);
                                        const s = r.subject?.id || r.subject?.name || r.subject || '';
                                        const p = r.predicate?.id || r.predicate || '';
                                        const o = r.object?.id || r.object?.name || r.object || '';
                                        return [s, p, o].filter(Boolean).join(' — ');
                                      };

                                      rows.push({ bg: '#f5f3ff', step: `${cls}_I`, outcome: init.length === 0 ? <em style={{ color: '#888' }}>no relations extracted</em> : <em>{init.map(relLabel).join('; ')}</em> });
                                      if (removed.length > 0)
                                        rows.push({ bg: '#fff1f2', step: `${cls} filtered`, outcome: <em style={{ textDecoration: 'line-through', color: '#b91c1c' }}>{removed.map(relLabel).join('; ')}</em> });
                                      if (final.length > 0)
                                        rows.push({ bg: '#f5f3ff', step: `${cls}_A`, outcome: <em>{final.map(relLabel).join('; ')}</em> });
                                    });

                                    return (
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', lineHeight: 1.35 }}>
                                        <thead>
                                          <tr style={{ background: '#f3f4f6' }}>
                                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(34,36,38,0.15)', width: '38%' }}>Prompt / Operation</th>
                                            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(34,36,38,0.15)' }}>Outcome</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {rows.map((row, idx) => (
                                            <tr key={idx} style={{ background: row.bg || (idx % 2 === 0 ? '#fafafa' : 'white') }}>
                                              <td style={{ padding: '6px 8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>{row.step}</code></td>
                                              <td style={{ padding: '6px 8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}>{row.outcome}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Right: structured output — matches mock design */}
                            <div style={{ border: '1px solid rgba(34,36,38,0.2)', borderRadius: '4px', padding: '10px', background: '#fafafa' }}>
                              <strong>Structured output</strong>
                              <div style={{ marginTop: '8px', border: '1px solid rgba(34,36,38,0.2)', borderRadius: '4px', padding: '8px', background: 'white', overflowY: 'auto', maxHeight: '460px' }}>
                                {/* Entity class cards */}
                                {entityKeys.filter(cls => this.state.extractVisibleClasses[cls]).map((cls, i) => {
                                  const mentions = entityClasses[cls]?.schemaResponse?.mentions || [];
                                  if (mentions.length === 0) return null;
                                  return mentions.map((m, j) => (
                                    <div key={`${cls}-${j}`} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px', background: classColors[i % classColors.length] }}>
                                      <div style={{ fontWeight: 700, color: textColors[i % textColors.length], marginBottom: '4px', fontSize: '13px' }}>Class: {cls}</div>
                                      {typeof m === 'string' ? (
                                        <div style={{ fontSize: '12px' }}><em>{m}</em></div>
                                      ) : typeof m === 'object' && m !== null ? (
                                        <>
                                          {m.id && <div style={{ fontSize: '12px' }}><code>ID</code>: <code>{m.id}</code></div>}
                                          {(m.label || m.name) && <div style={{ fontSize: '12px' }}><code>label</code>: <em>{m.label || m.name}</em></div>}
                                          {Object.entries(m).filter(([k]) => !['id', 'label', 'name'].includes(k)).map(([k, v]) => (
                                            <div key={k} style={{ fontSize: '12px' }}><code>{k}</code>: <em>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</em></div>
                                          ))}
                                        </>
                                      ) : null}
                                    </div>
                                  ));
                                })}
                                {/* Relation cards */}
                                {relationKeys.filter(cls => this.state.extractVisibleClasses[cls]).map((cls) => {
                                  const key = `${cls}Relationships`;
                                  const rData = responses[cls] || {};
                                  const mentions = rData[key] || (rData?.schemaResponse?.mentions) || [];
                                  if (!mentions || mentions.length === 0) return null;
                                  return mentions.filter(Boolean).map((m, j) => (
                                    <div key={`${cls}-${j}`} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px', background: '#f0f9ff' }}>
                                      <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '13px' }}>Relation: {cls}</div>
                                      {typeof m === 'object' && m !== null ? (
                                        <>
                                          {m.subject != null && <div style={{ fontSize: '12px' }}><code>source</code>: <code>{typeof m.subject === 'object' ? (m.subject.id || m.subject.name || JSON.stringify(m.subject)) : String(m.subject)}</code></div>}
                                          {m.predicate != null && <div style={{ fontSize: '12px' }}><code>predicate</code>: <code>{typeof m.predicate === 'object' ? (m.predicate.id || JSON.stringify(m.predicate)) : String(m.predicate)}</code></div>}
                                          {m.object != null && <div style={{ fontSize: '12px' }}><code>target</code>: <code>{typeof m.object === 'object' ? (m.object.id || m.object.name || JSON.stringify(m.object)) : String(m.object)}</code></div>}
                                          {Object.entries(m).filter(([k]) => !['subject', 'predicate', 'object'].includes(k)).map(([k, v]) => (
                                            <div key={k} style={{ fontSize: '12px' }}><code>{k}</code>: <em>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</em></div>
                                          ))}
                                        </>
                                      ) : <em style={{ fontSize: '12px' }}>{String(m)}</em>}
                                    </div>
                                  ));
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── ENTITIES TAB ── */}
                        {activeTab === 'entities' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {entityKeys.length === 0 && <div style={{ color: '#888' }}>No entities extracted.</div>}
                            {entityKeys.map((cls, i) => {
                              const mentions = entityClasses[cls]?.schemaResponse?.mentions || [];
                              return (
                                <div key={cls}>
                                  <div style={{ fontWeight: 700, color: textColors[i % textColors.length], marginBottom: '8px', fontSize: '14px' }}>
                                    {cls} <span style={{ fontWeight: 400, color: '#888', fontSize: '12px' }}>({mentions.length} mention{mentions.length !== 1 ? 's' : ''})</span>
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {mentions.length === 0
                                      ? <div style={{ color: '#888', fontSize: '13px' }}>No mentions extracted.</div>
                                      : mentions.map((m, j) => (
                                        <div key={j} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', background: classColors[i % classColors.length], minWidth: '120px', maxWidth: '220px' }}>
                                          {renderMention(m, 0, classColors[i % classColors.length])}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ── RELATIONS TAB ── */}
                        {activeTab === 'relations' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {relationKeys.length === 0 && <div style={{ color: '#888' }}>No relations extracted.</div>}
                            {relationKeys.map((cls) => {
                              const mentions = (relationClasses[cls]?.schemaResponse?.mentions || []).filter(Boolean);
                              return (
                                <div key={cls}>
                                  <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
                                    {cls} <span style={{ fontWeight: 400, color: '#888', fontSize: '12px' }}>({mentions.length} mention{mentions.length !== 1 ? 's' : ''})</span>
                                  </div>
                                  {mentions.length === 0
                                    ? <div style={{ color: '#888', fontSize: '13px' }}>No relations extracted.</div>
                                    : mentions.map((m, j) => (
                                      <div key={j} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', background: '#f0f9ff', marginBottom: '8px', fontSize: '13px' }}>
                                        {typeof m === 'object' ? <>
                                          {m.subject != null && <div><code>source</code>: <code>{typeof m.subject === 'object' ? (m.subject.id || JSON.stringify(m.subject)) : String(m.subject)}</code></div>}
                                          {m.predicate != null && <div><code>predicate</code>: <code>{typeof m.predicate === 'object' ? (m.predicate.id || JSON.stringify(m.predicate)) : String(m.predicate)}</code></div>}
                                          {m.object != null && <div><code>target</code>: <code>{typeof m.object === 'object' ? (m.object.id || JSON.stringify(m.object)) : String(m.object)}</code></div>}
                                          {Object.entries(m).filter(([k]) => !['subject', 'predicate', 'object'].includes(k)).map(([k, v]) => (
                                            <div key={k}><code>{k}</code>: <em>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</em></div>
                                          ))}
                                        </> : <em>{String(m)}</em>}
                                      </div>
                                    ))}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ── JSON TAB ── */}
                        {activeTab === 'json' && (
                          <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', fontSize: '11px', overflowY: 'auto', maxHeight: '500px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                            {JSON.stringify(responses, null, 2)}
                          </pre>
                        )}

                      </div>
                    </div>
                  );
                })()}
              </Modal.Content>
              <Modal.Actions>
                {this.state.extractView === 'result' && (
                  <Button
                    onClick={() => this.setState({ extractView: 'input', extractResult: null, extractError: null, extractActiveTab: 'text', pubmedResults: [], pubmedQuery: '', pubmedError: null })}
                    basic
                  >
                    Back
                  </Button>
                )}
                {this.state.extractView === 'input' && (
                  <Button
                    primary
                    loading={this.state.extractLoading}
                    disabled={this.state.extractLoading}
                    onClick={this.runExtraction}
                    icon="play"
                    content="Run Extraction"
                  />
                )}
                <Button onClick={() => this.setState({ extractOpen: false, extractView: 'input', extractResult: null, extractError: null, pubmedResults: [], pubmedQuery: '', pubmedError: null })} basic>
                  Close
                </Button>
              </Modal.Actions>
            </Modal>
          </Menu.Item>
          <Menu.Item
            title="Open/Close Inspector"
            onClick={this.props.showInspector}
          >
            <Icon name="sidebar" />
          </Menu.Item>
        </Menu.Menu>
      </Menu>
    );
  }
}

export default Header;

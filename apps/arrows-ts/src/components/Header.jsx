import React, { PureComponent } from 'react';
import { Icon, Menu, Button, ButtonGroup, Dropdown, Modal, Checkbox } from 'semantic-ui-react';
import { DiagramNameEditor } from './DiagramNameEditor';
import arrows_logo from '../images/arrows_logo.svg';
import { defaultCallbackFactory } from './GptModal';
import { sanitizeInternalGraph } from '../utils/sanitizeGraph';

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
    mockSelected: {
      Drug: true,
      InfectiousDisease: true,
      Relation: true,
    },
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

  toggleMock = (key) => {
    this.setState((prev) => ({
      mockSelected: {
        ...prev.mockSelected,
        [key]: !prev.mockSelected[key],
      },
    }));
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
                onClick={() => this.setState({ extractOpen: true })}
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
              onClose={() => this.setState({ extractOpen: false })}
              size="large"
              style={{ width: '86%', maxWidth: '1200px' }}
            >
              <Modal.Header>Extraction result</Modal.Header>
              <Modal.Content>
                <div className="ui top attached tabular menu" style={{ marginBottom: 0 }}>
                  <a className="active item">Text</a>
                  <a className="item">Entities</a>
                  <a className="item">Relations</a>
                  <a className="item">JSON</a>
                </div>

                <div
                  style={{
                    border: '1px solid rgba(34, 36, 38, 0.15)',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    padding: '12px',
                    minHeight: '420px',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 0.8fr',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <strong style={{ marginRight: '6px' }}>Show:</strong>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => this.toggleMock('Drug')}>
                            <Checkbox checked={this.state.mockSelected?.Drug} onChange={() => this.toggleMock('Drug')} />
                            <span style={{ color: '#b91c1c' }}>Drug</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => this.toggleMock('InfectiousDisease')}>
                            <Checkbox checked={this.state.mockSelected?.InfectiousDisease} onChange={() => this.toggleMock('InfectiousDisease')} />
                            <span style={{ color: '#1d4ed8' }}>InfectiousDisease</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => this.toggleMock('Relation')}>
                            <Checkbox checked={this.state.mockSelected?.Relation} onChange={() => this.toggleMock('Relation')} />
                            <span style={{ color: '#gray' }}>Drug-treats-InfectiousDisease</span>
                          </label>
                      </div>
                      <div
                        style={{
                          border: '1px solid rgba(34, 36, 38, 0.15)',
                          borderRadius: '4px',
                          padding: '8px',
                          minHeight: '90px',
                          background: '#fafafa',
                        }}
                      >
                        <div
                          style={{
                            marginTop: '6px',
                            minHeight: '60px',
                            border: '1px solid rgba(34, 36, 38, 0.12)',
                            borderRadius: '4px',
                            padding: '6px',
                            background: 'white',
                            lineHeight: 1.6,
                            fontSize: '16px',
                            overflow: 'hidden',
                          }}
                        >
                          <span style={{ color: 'red', fontWeight: 600 }}>Doxycycline</span>
                          {' '}100 mg twice daily, was administered to patients with{' '}
                          <span style={{ color: 'blue', fontWeight: 600 }}>Lyme disease</span>
                          . Joint pain improved during follow-up, and disease severity was reduced within two weeks. A transient inflammatory condition was then observed.
                        </div>
                      </div>

                      <div
                        style={{
                          border: '1px solid rgba(34, 36, 38, 0.2)',
                          borderRadius: '4px',
                          padding: '10px',
                          minHeight: '260px',
                          background: '#fafafa',
                        }}
                      >
                        <strong>Dependency Trace</strong>
                        <div
                          style={{
                            marginTop: '8px',
                            border: '1px solid rgba(34, 36, 38, 0.2)',
                            borderRadius: '4px',
                            background: 'white',
                            maxHeight: '200px',
                            overflowY: 'auto',
                          }}
                        >
                          <table
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '12px',
                              lineHeight: 1.35,
                            }}
                          >
                            <thead>
                              <tr style={{ background: '#f3f4f6' }}>
                                <th
                                  style={{
                                    textAlign: 'left',
                                    padding: '8px',
                                    borderBottom: '1px solid rgba(34, 36, 38, 0.15)',
                                  }}
                                >
                                  Prompt / Operation
                                </th>
                                <th
                                  style={{
                                    textAlign: 'left',
                                    padding: '8px',
                                    borderBottom: '1px solid rgba(34, 36, 38, 0.15)',
                                  }}
                                >
                                  Outcome
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ background: '#eff6ff' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Disease_I</code></td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><em>Lyme disease</em>; <em>transient inflammatory condition</em></td>
                              </tr>
                              <tr style={{ background: '#eff6ff' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Disease</code> constraint check</td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><em>Lyme disease</em>; <em>transient inflammatory condition</em></td>
                              </tr>
                              <tr style={{ background: '#eff6ff' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Disease</code> grounding</td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><em>Lyme disease</em> -&gt; <code>MONDO:0019632</code>; <span style={{ textDecoration: 'line-through' }}><em>transient inflammatory condition</em></span></td>
                              </tr>
                              <tr style={{ background: '#eff6ff' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Disease_A</code></td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>label</code>: <em>Lyme disease</em>; <code>symptoms</code>: <em>[joint pain]</em></td>
                              </tr>
                              <tr style={{ background: '#fff1f2' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Drug_I</code></td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><em>doxycycline</em></td>
                              </tr>
                              <tr style={{ background: '#fff1f2' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}>Drug mapping</td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><em>doxycycline</em> -&gt; <code>DrugBank:DB00254</code></td>
                              </tr>
                              <tr style={{ background: '#fff1f2' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Drug_A</code></td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>label</code>: <em>doxycycline</em></td>
                              </tr>
                              <tr style={{ background: '#f9fafb' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Virus_I</code>, <code>Bacteria_I</code></td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}>no mentions extracted</td>
                              </tr>
                              <tr style={{ background: '#f9fafb' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Pathogen</code> aggregation</td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}>skipped</td>
                              </tr>
                              <tr style={{ background: '#eff6ff' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Pathogen-causes-InfectiousDisease_I</code></td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}>removed</td>
                              </tr>
                              <tr style={{ background: '#eff6ff' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>InfectiousDisease_I</code></td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>MONDO:0019632</code></td>
                              </tr>
                              <tr style={{ background: '#f3e8ff' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>Drug-treats-InfectiousDisease_I</code></td>
                                <td style={{ padding: '8px', verticalAlign: 'top', borderBottom: '1px solid #ececec' }}><code>DrugBank:DB00254</code>-<code>treats</code>-<code>MONDO:0019632</code></td>
                              </tr>
                              <tr style={{ background: '#f3e8ff' }}>
                                <td style={{ padding: '8px', verticalAlign: 'top' }}><code>Drug-treats-InfectiousDisease_A</code></td>
                                <td style={{ padding: '8px', verticalAlign: 'top' }}><code>dosage</code>: <em>100 mg twice daily</em>; <code>time_to_response</code>: <em>two weeks</em></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        border: '1px solid rgba(34, 36, 38, 0.2)',
                        borderRadius: '4px',
                        padding: '10px',
                        minHeight: '412px',
                        background: '#fafafa',
                      }}
                    >
                      <strong>Structured output</strong>
                      <div
                        style={{
                          marginTop: '8px',
                          minHeight: '356px',
                          border: '1px solid rgba(34, 36, 38, 0.2)',
                          borderRadius: '4px',
                          padding: '10px',
                          background: 'white',
                          overflowY: 'auto',
                        }}
                      >
                       

                        {this.state.mockSelected?.Drug && (
                          <div
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '8px',
                              marginBottom: '8px',
                              background: '#fff1f2',
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#b91c1c' }}>Class: Drug</div>
                            <div><code>ID</code>: <code>DrugBank:DB00254</code></div>
                            <div><code>label</code>: <em>doxycycline</em></div>
                          </div>
                        )}

                        {this.state.mockSelected?.InfectiousDisease && (
                          <div
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '8px',
                              marginBottom: '8px',
                              background: '#eff6ff',
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#1d4ed8' }}>Class: InfectiousDisease</div>
                            <div><code>ID</code>: <code>MONDO:0019632</code></div>
                            <div><code>label</code>: <em>Lyme disease</em></div>
                            <div><code>symptoms</code>: <em>[joint pain]</em></div>
                          </div>
                        )}

                        {this.state.mockSelected?.Relation && (
                          <div
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              padding: '8px',
                              marginBottom: '8px',
                              background: '#eef6ff',
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                              Relation: Drug-treats-InfectiousDisease
                            </div>
                            <div><code>source</code>: <code>DrugBank:DB00254</code></div>
                            <div><code>predicate</code>: <code>treats</code></div>
                            <div><code>target</code>: <code>MONDO:0019632</code></div>
                            <div><code>dosage</code>: <em>100 mg twice daily</em></div>
                            <div><code>time_to_response</code>: <em>two weeks</em></div>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Content>
              <Modal.Actions>
                <Button onClick={() => this.setState({ extractOpen: false })} basic>
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

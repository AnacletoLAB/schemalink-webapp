import React, { PureComponent } from 'react';
import { Icon, Menu, Button, ButtonGroup, Dropdown } from 'semantic-ui-react';
import { DiagramNameEditor } from './DiagramNameEditor';
import arrows_logo from '../images/arrows_logo.svg';
import { defaultCallbackFactory } from './GptModal';

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
              onClick={this.props.onExportClick}
              icon="download"
              basic
              color="black"
              content="Download / Export"
            />
            <div>
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

import React, { PureComponent } from 'react';
import { Icon, Menu, Button, ButtonGroup } from 'semantic-ui-react';
import { DiagramNameEditor } from './DiagramNameEditor';
import arrows_logo from '../images/arrows_logo.svg';

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
  constructor(props) {
    super(props);
  }

  // shouldComponentUpdate(nextProps, nextState, nextContext) {
  //   console.log(this.props.storage, nextProps.storage,
  //     this.props.storage !== nextProps.storage
  //   )
  //   return (
  //     this.props.recentStorage !== nextProps.recentStorage ||
  //     this.props.diagramName !== nextProps.diagramName ||
  //     this.props.storage !== nextProps.storage
  //   )
  // }

  render() {
    const newDiagramOptions = ['LOCAL_STORAGE'].map((mode) => (
      <div
        key={mode}
        role="option"
        className="item"
        onClick={() => this.props.onNewDiagram(mode)}
      >
        <i aria-hidden="true" className={'icon ' + storageIcon(mode)} />
        <span>{storageNames[mode]}</span>
      </div>
    ));

    const recentlyAccessFiles = this.props.recentStorage
      .slice(1, 11)
      .map((entry, i) => (
        <div
          key={'recentlyAccessFiles' + i}
          role="option"
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
              alt="Arrows.app logo"
            />
          </i>
          <div className="menu transition visible">
            <div role="option" className="item">
              <i aria-hidden="true" className="dropdown icon" />
              <span className="text">New</span>
              <div className="menu transition">
                <div className="header">Store in</div>
                {newDiagramOptions}
              </div>
            </div>
            <div role="option" className="item">
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
              className="item"
              onClick={this.props.onSaveAsClick}
            >
              Save As…
            </div>
            <div className="divider" />
            <div
              role="option"
              className="item"
              onClick={this.props.onImportClick}
            >
              Import
            </div>
            <div className="divider" />
            <div
              role="option"
              className="item"
              onClick={this.props.onHelpClick}
            >
              Help
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
            <Button
              onClick={this.props.onExportClick}
              icon="download"
              basic
              color="black"
              content="Download / Export"
            />
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

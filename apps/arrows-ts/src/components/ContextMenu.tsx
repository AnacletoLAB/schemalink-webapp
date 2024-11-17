import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';
import { MenuItem, Menu } from 'semantic-ui-react';
import { EntitySelection, Graph } from '@neo4j-arrows/model';
import { hideContextMenu, showGptModal } from '../actions/applicationDialogs';

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  diagramName: string;
  graph: Graph;
  selection: EntitySelection;
  onClose: () => void;
  openGtpModal: (startingPrompt?: string) => void;
}

const ContextMenu = ({
  onClose,
  open,
  openGtpModal,
  x,
  y,
}: ContextMenuProps) => {
  return open ? (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x,
        zIndex: 9999,
      }}
    >
      <Menu vertical>
        <MenuItem
          name={`Open GPT dialog`}
          onClick={() => {
            openGtpModal();
            onClose();
          }}
        />
      </Menu>
    </div>
  ) : null;
};

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.contextMenu,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => {
      dispatch(hideContextMenu());
    },
    openGtpModal: (startingPrompt?: string) => {
      dispatch(showGptModal(startingPrompt));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);

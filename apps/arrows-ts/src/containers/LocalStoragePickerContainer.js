import { connect } from 'react-redux';
import { getFileFromLocalStorage, pickDiagramCancel } from '../actions/storage';
import { deleteGraphFromLocalStorage } from '../actions/localStorage';
import { removeFromRecentStorage } from '../actions/recentStorage';
import LocalStoragePickerModal from '../components/LocalStoragePickerModal';

const mapStateToProps = (state) => {
  return {
    recentStorage: state.recentStorage.filter(
      (entry) => entry.mode === 'LOCAL_STORAGE'
    ),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onPick: (fileId) => {
      dispatch(getFileFromLocalStorage(fileId));
    },
    onDelete: (fileId) => {
      deleteGraphFromLocalStorage(fileId);
      dispatch(removeFromRecentStorage('LOCAL_STORAGE', fileId));
    },
    onDeleteMany: (fileIds) => {
      fileIds.forEach((fileId) => {
        deleteGraphFromLocalStorage(fileId);
        dispatch(removeFromRecentStorage('LOCAL_STORAGE', fileId));
      });
    },
    onCancel: () => {
      dispatch(pickDiagramCancel());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LocalStoragePickerModal);

import { connect } from 'react-redux';
import ViewUsersModal from '../components/ViewUsersModal';
import { hideViewUsersDialog } from '../actions/applicationDialogs';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';

const mapStateToProps = (state: ArrowsState) => {
  return {
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onCancel: () => {
      dispatch(hideViewUsersDialog());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ViewUsersModal);

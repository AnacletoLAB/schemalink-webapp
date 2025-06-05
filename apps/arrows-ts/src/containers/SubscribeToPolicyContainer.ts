import { connect } from 'react-redux';
import SubscribeToPolicyModal from '../components/SubscribeToPolicyModal';
import { hideSubscribeToPolicyDialog } from '../actions/applicationDialogs';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';

const mapStateToProps = (state: ArrowsState) => {
  return {
    userData: state.applicationDialogs.userData,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onCancel: () => {
      dispatch(hideSubscribeToPolicyDialog());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SubscribeToPolicyModal);

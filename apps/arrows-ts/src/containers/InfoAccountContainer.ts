import { connect } from 'react-redux';
import InfoAccountModal from '../components/InfoAccountModal';
import { hideInfoAccountDialog } from '../actions/applicationDialogs';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';
import { updateUserData } from '../actions/applicationDialogs';

const mapStateToProps = (state: ArrowsState) => {
  return {
    userData: state.applicationDialogs.userData,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onCancel: () => {
      dispatch(hideInfoAccountDialog());
    },
    onUpdateUserData: (data: Partial<UserData>) => dispatch(updateUserData(data)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(InfoAccountModal);

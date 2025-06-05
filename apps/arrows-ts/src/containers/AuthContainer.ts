import { connect } from 'react-redux';
import AuthModal from '../components/AuthModal';
import { hideAuthDialog, loginSuccess } from '../actions/applicationDialogs';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';

const mapStateToProps = (state: ArrowsState) => {
  return {
    isAuthenticated: state.applicationDialogs.isAuthenticated,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onCancel: () => {
      dispatch(hideAuthDialog());
    },
    onLoginSuccess: (userData) => {
      dispatch(loginSuccess(userData));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthModal);

import { connect } from 'react-redux';
import DashboardModal from '../components/DashboardModal';
import { hideDashboardDialog } from '../actions/applicationDialogs';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';

const mapStateToProps = (state: ArrowsState) => {
  return {
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onCancel: () => {
      dispatch(hideDashboardDialog());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DashboardModal);
import { connect } from 'react-redux';
import OntologiesModal from '../components/OntologiesModal';
import { hideOntologiesDialog } from '../actions/applicationDialogs';
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
      dispatch(hideOntologiesDialog());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(OntologiesModal);


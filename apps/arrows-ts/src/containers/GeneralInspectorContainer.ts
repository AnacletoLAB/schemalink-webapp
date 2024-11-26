import { connect } from 'react-redux';
import {
  createNode,
  setSchemaProperties,
  setGraphStyle,
  setGraphStyles,
} from '../actions/graph';
import GeneralInspector from '../components/GeneralInspector';
import { getPresentGraph } from '../selectors';
import { styleCustomize, styleTheme } from '../actions/applicationLayout';
import { toggleSelection } from '../actions/selection';
import { ArrowsState } from '../reducers';
import { Dispatch } from 'redux';
import { Entity, SchemaProperties } from '@neo4j-arrows/model';

const mapStateToProps = (state: ArrowsState) => {
  return {
    graph: getPresentGraph(state),
    cachedImages: state.cachedImages,
    selection: state.selection,
    styleMode: state.applicationLayout.styleMode,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onSelect: (entities: Entity[]) => {
      dispatch(toggleSelection(entities, 'replace'));
    },
    onSaveGraphStyle: (key: string, value: any) => {
      dispatch(setGraphStyle(key, value));
    },
    onPlusNodeClick: () => {
      dispatch(createNode());
    },
    onStyleTheme: () => {
      dispatch(styleTheme());
    },
    onStyleCustomize: () => {
      dispatch(styleCustomize());
    },
    onApplyTheme: (style: any) => {
      dispatch(setGraphStyles(style));
    },
    onSchemaPropertiesChange: (properties: SchemaProperties) => {
      dispatch(setSchemaProperties(properties));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GeneralInspector);

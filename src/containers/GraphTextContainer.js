import {connect} from "react-redux";
import {
  setProperty, trySetNodeCaption, setRelationshipType, renameProperty, removeProperty,
  setArrowsProperty, removeArrowsProperty, reverseRelationships, addLabel, renameLabel, removeLabel
} from "../actions/graph";
import DetailInspector from "../components/DetailInspector"
import {showInspector, hideInspector} from "../actions/applicationLayout";
import { getSelectedNodes } from "../selectors/inspection";
import {getPresentGraph, getVisualGraph} from "../selectors"
import {GraphTextEditors} from "../components/GraphTextEditors";
import React from "react";

const mapStateToProps = state => {
  return {
    visualGraph: getVisualGraph(state),
    selection: state.selection,
    viewTransformation: state.viewTransformation
  }
}

const mapDispatchToProps = dispatch => {
  return {
    onAddLabel: (selection, label) => {
      dispatch(addLabel(selection, label))
    },
    onRenameLabel: (selection, oldLabel, newLabel) => {
      dispatch(renameLabel(selection, oldLabel, newLabel))
    },
    onRemoveLabel: (selection, label) => {
      dispatch(removeLabel(selection, label))
    },
    onSetNodeCaption: (selection, caption) => {
      dispatch(trySetNodeCaption(selection, caption))
    },
    onSetRelationshipType: (selection, type) => {
      dispatch(setRelationshipType(selection, type))
    },
    onSetPropertyKey: (selection, oldPropertyKey, newPropertyKey) => {
      dispatch(renameProperty(selection, oldPropertyKey, newPropertyKey))
    },
    onSetPropertyValue: (selection, key, value) => {
      dispatch(setProperty(selection, key, value))
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GraphTextEditors)
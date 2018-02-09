import { combineReducers } from 'redux'
import graph from "./graph";
import guides from "./guides";
import storageStatus from "./storageStatus";
import windowSize from "./windowSize";
import viewTransformation from "./viewTransformation";
import gestures from "./gestures";

const arrowsApp = combineReducers({
  graph,
  gestures,
  guides,
  storageStatus,
  windowSize,
  viewTransformation
})

export default arrowsApp
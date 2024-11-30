import { combineReducers } from 'redux';
import recentStorage from './recentStorage';
import storage from './storage';
import diagramName from './diagramName';
import graph from './graph';
import selection from './selection';
import mouse, { MouseState } from './mouse';
import guides from './guides';
import applicationLayout, { ApplicationLayoutState } from './applicationLayout';
import viewTransformation from './viewTransformation';
import gestures, { GesturesState } from './gestures';
import actionMemos, { ActionMemosState } from './actionMemos';
import applicationDialogs, {
  ApplicationDialogsState,
} from './applicationDialogs';
import features, { FeaturesState } from './features';
import cachedImages from './cachedImages';
import ontologies, { OntologyState } from './ontologies';
import { ImageInfo } from '@neo4j-arrows/graphics';
import { Graph, Guides, ViewTransformation } from '@neo4j-arrows/model';
import { StateWithHistory } from 'redux-undo';

export type ArrowsState = {
  recentStorage: any;
  storage: any;
  diagramName: string;
  graph: StateWithHistory<Graph>;
  selection: any;
  mouse: MouseState;
  gestures: GesturesState;
  guides: Guides;
  applicationLayout: ApplicationLayoutState;
  viewTransformation: ViewTransformation;
  actionMemos: ActionMemosState;
  applicationDialogs: ApplicationDialogsState;
  features: FeaturesState;
  cachedImages: Record<string, ImageInfo>;
  ontologies: OntologyState;
};

const arrowsApp = combineReducers<ArrowsState>({
  recentStorage,
  storage,
  diagramName,
  graph,
  selection,
  mouse,
  gestures,
  guides,
  applicationLayout,
  viewTransformation,
  actionMemos,
  applicationDialogs,
  features,
  cachedImages,
  ontologies,
});

export default arrowsApp;

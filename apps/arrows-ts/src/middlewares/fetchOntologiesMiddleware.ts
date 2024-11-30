import {
  loadOntologiesFailure,
  loadOntologiesRequest,
  loadOntologiesSuccess,
  loadOntologyExamplesFailure,
  loadOntologyExamplesRequest,
  loadOntologyExamplesSuccess,
} from '../actions/ontologies';
import { Action, Dispatch, Store } from 'redux';
import {
  Graph,
  backupOntologies,
  hardcodedOntologies,
} from '@neo4j-arrows/model';
import {
  nTerms,
  ontologies,
  properties,
  MAX_PAGE_SIZE,
} from '@neo4j-arrows/ontology-search';
import { getGraph } from '../selectors';
import { ArrowsState } from '../reducers';

export const fetchOntologiesMiddleware =
  (store: Store<ArrowsState>) => (next: Dispatch) => (action: Action) => {
    const onFailedLoadOntologies = () => {
      store.dispatch(loadOntologiesFailure());
      store.dispatch(loadOntologyExamplesRequest());
      store.dispatch(loadOntologyExamplesSuccess(backupOntologies));
    };

    const result = next(action);

    if (action.type === 'GETTING_GRAPH') {
      const hardcodedOntologiesIds = hardcodedOntologies.map(
        (ontology) => ontology.id
      );
      store.dispatch(loadOntologiesRequest());
      ontologies(MAX_PAGE_SIZE)
        .then((ontologies) => {
          store.dispatch(loadOntologiesSuccess(ontologies));
          const graph: Graph = getGraph(store.getState());
          store.dispatch(loadOntologyExamplesRequest());
          Promise.all(
            graph.nodes
              .flatMap((node) => node.ontologies ?? [])
              .filter(
                (ontology) => !hardcodedOntologiesIds.includes(ontology.id)
              )
              .map((ontology) =>
                nTerms(ontology, 10).then((terms) => {
                  return { ...ontology, terms };
                })
              )
          )
            .then((resolvedOntologies) => {
              store.dispatch(loadOntologyExamplesSuccess(resolvedOntologies));
            })
            .catch((error) => {
              console.error(error);
              store.dispatch(loadOntologyExamplesFailure());
            });
          store.dispatch(loadOntologyExamplesRequest());
          Promise.all(
            graph.relationships
              .flatMap((relationship) => relationship.ontologies ?? [])
              .filter((ontology) => !hardcodedOntologies.includes(ontology))
              .map((ontology) =>
                properties(ontology, MAX_PAGE_SIZE).then((properties) => {
                  return { ...ontology, properties };
                })
              )
          )
            .then((resolvedOntologies) => {
              store.dispatch(loadOntologyExamplesSuccess(resolvedOntologies));
            })
            .catch((error) => {
              console.error(error);
              store.dispatch(loadOntologyExamplesFailure());
            });
        })
        .catch((error) => {
          console.error(error);
          onFailedLoadOntologies();
        });
    }

    return result;
  };

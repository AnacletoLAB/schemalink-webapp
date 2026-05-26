import {
  loadOntologiesFailure,
  loadOntologiesRequest,
  loadOntologiesSuccess,
  loadOntologyExamplesFailure,
  loadOntologyExamplesRequest,
  loadOntologyExamplesSuccess,
} from '../actions/ontologies';
import { Action, Dispatch, Store } from 'redux';
import { Graph, hardcodedOntologies, Ontology } from '@neo4j-arrows/model';
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
    const result = next(action);

    if (action.type === 'GETTING_GRAPH') {
      const hardcodedOntologiesIds = hardcodedOntologies.map(
        (ontology) => ontology.id
      );
      const resolveOntology = (
        value: Ontology | string | undefined,
        ontologyMap: Map<string, Ontology>
      ): Ontology | null => {
        if (!value) return null;

        if (typeof value === 'string') {
          return (
            ontologyMap.get(value) ||
            ontologyMap.get(value.toLowerCase()) ||
            ({ id: value, name: value, description: '', namespace: '', annotator: '' } as Ontology)
          );
        }

        if (!value.id) return null;

        return (
          ontologyMap.get(value.id) ||
          ontologyMap.get(value.id.toLowerCase()) ||
          value
        );
      };

      store.dispatch(loadOntologiesRequest());
      ontologies(MAX_PAGE_SIZE)
        .then((ontologies) => {
          store.dispatch(loadOntologiesSuccess(ontologies));
          const graph: Graph = getGraph(store.getState());
          const ontologyMap = new Map<string, Ontology>([
            ...ontologies.map((ontology) => [ontology.id, ontology] as const),
            ...hardcodedOntologies.map((ontology) => [ontology.id, ontology] as const),
          ]);

          store.dispatch(loadOntologyExamplesRequest());
          Promise.all(
            graph.nodes
              .flatMap((node) => node.ontologies ?? [])
              .map((ontology) => resolveOntology(ontology, ontologyMap))
              .filter((ontology): ontology is Ontology => !!ontology)
              .filter(
                (ontology) => !hardcodedOntologiesIds.includes(ontology.id)
              )
              .map((ontology) =>
                nTerms(ontology, 10).then((terms) => ({ ...ontology, terms }))
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
              .map((ontology) => resolveOntology(ontology, ontologyMap))
              .filter((ontology): ontology is Ontology => !!ontology)
              .filter(
                (ontology) => !hardcodedOntologiesIds.includes(ontology.id)
              )
              .map((ontology) =>
                properties(ontology, MAX_PAGE_SIZE).then((properties) => ({
                  ...ontology,
                  properties,
                }))
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
          store.dispatch(loadOntologiesFailure());
        });
    }

    return result;
  };

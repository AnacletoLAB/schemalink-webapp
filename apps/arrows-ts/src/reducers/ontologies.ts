import { Ontology } from '@neo4j-arrows/model';
import { hardcodedOntologies } from '@neo4j-arrows/model';
import { Action } from 'redux';

interface OntologiesSuccessAction
  extends Action<'LOAD_ONTOLOGIES_SUCCESS' | 'LOAD_ONTOLOGY_EXAMPLES_SUCCESS'> {
  ontologies: Ontology[];
}

export type OntologiesAction =
  | Action<
      | 'LOAD_ONTOLOGIES_REQUEST'
      | 'LOAD_ONTOLOGIES_FAILURE'
      | 'LOAD_ONTOLOGY_EXAMPLES_REQUEST'
      | 'LOAD_ONTOLOGY_EXAMPLES_FAILURE'
    >
  | OntologiesSuccessAction;

export type OntologyState = {
  ontologies: Ontology[];
  isFetching: boolean;
};

const ontologies = (
  state: OntologyState = { ontologies: [], isFetching: false },
  action: OntologiesAction
): OntologyState => {
  switch (action.type) {
    case 'LOAD_ONTOLOGIES_REQUEST':
      return { ...state, isFetching: true };
    case 'LOAD_ONTOLOGIES_SUCCESS':
      return {
        ...state,
        ontologies: (() => {
          const merged = [...action.ontologies, ...hardcodedOntologies];
          const seen: Record<string, boolean> = {};
          const deduped = merged.filter((o) => {
            const key = o.id.toLocaleLowerCase();
            if (seen[key]) return false;
            seen[key] = true;
            return true;
          });
          return deduped.map((ontology) => ({
            ...ontology,
            annotator: `sqlite:obo:${ontology.id}`,
          }));
        })(),
        isFetching: false,
      };
    case 'LOAD_ONTOLOGIES_FAILURE':
      return { ...state, isFetching: false };
    case 'LOAD_ONTOLOGY_EXAMPLES_REQUEST':
      return { ...state, isFetching: true };
    case 'LOAD_ONTOLOGY_EXAMPLES_SUCCESS':
      return {
        ...state,
        ontologies: state.ontologies.map((ontology) => {
          const matching = action.ontologies.find(
            ({ id }) => id === ontology.id
          );
          if (matching?.terms) {
            return {
              ...ontology,
              terms: matching.terms,
            };
          }
          if (matching?.properties) {
            return {
              ...ontology,
              properties: matching.properties,
            };
          }
          return ontology;
        }),
        isFetching: false,
      };
    case 'LOAD_ONTOLOGY_EXAMPLES_FAILURE':
      return { ...state, isFetching: false };
    default:
      return state;
  }
};

export default ontologies;

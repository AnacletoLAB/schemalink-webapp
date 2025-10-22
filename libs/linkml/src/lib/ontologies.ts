import { Ontology } from '@neo4j-arrows/model';

export const toAnnotators = (ontologies: Ontology[]): string => {
  return ontologies
    .map((ontology) => normalizeOntologyToken(ontology.annotator))
    .filter((s) => !!s)
    .join(', ');
};

export const toPrefixes = (ontologies: Ontology[]): Record<string, string> => {
  return ontologies.reduce(
    (prefixes: Record<string, string>, ontology) => ({
      ...prefixes,
      [ontology.id.toLocaleUpperCase()]: ontology.namespace,
    }),
    {}
  );
};

// Normalize ontology specifiers so that any variant like:
//   "obo:go", "obo:sqlite:go", "sqlite:obo:go", "sqlite:obo:sqlite:cl"
// becomes a canonical form: "sqlite:obo:{id}", where {id} is the last
// alphabetic token (e.g., "go", "cl").
export const normalizeOntologyToken = (token?: string): string => {
  const raw = (token || '').trim().toLowerCase();
  if (!raw) return '';
  const tokens = raw.split(':').map((t) => t.trim()).filter((t) => !!t);
  // find last purely alphabetic token (e.g., go, cl, ro)
  let lastAlpha = '';
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^[a-z]+$/.test(tokens[i])) {
      lastAlpha = tokens[i];
      break;
    }
  }
  if (!lastAlpha) return raw;
  // If the spec references OBO in any position, normalize to sqlite:obo:{id}
  if (tokens.includes('obo') || raw.startsWith('obo:') || raw.includes(':obo:')) {
    return `sqlite:obo:${lastAlpha}`;
  }
  // Otherwise, leave as-is
  return raw;
};

// Normalize a comma-separated ontology list (e.g., annotators or source_ontology)
// to a canonical, sorted, de-duplicated string of sqlite:obo:{id} items where applicable.
export const normalizeOntologyListSpec = (spec?: string): string => {
  const parts = (spec || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => !!s)
    .map((s) => normalizeOntologyToken(s))
    .filter((s) => !!s);
  // stabilize order for string comparisons
  const uniq = Array.from(new Set(parts));
  uniq.sort();
  return uniq.join(', ');
};

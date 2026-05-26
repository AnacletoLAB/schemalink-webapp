/// <reference types="vite/client" />
import { Ontology } from '@neo4j-arrows/model';

export const MAX_PAGE_SIZE = 1000;

type CacheResponse = { ontologies: Ontology[] };

const fetchJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
};

// Returns full cached ontologies list
export const ontologies = async (_size = 20): Promise<Ontology[]> => {
  const LIST_ENDPOINT = import.meta.env['VITE_ONTOLOGIES_LIST_ENDPOINT'];
  const data = await fetchJson<CacheResponse | Ontology[]>(LIST_ENDPOINT);
  if (Array.isArray(data)) return data as Ontology[];
  if (data && Array.isArray((data as CacheResponse).ontologies)) {
    return (data as CacheResponse).ontologies;
  }
  return [];
};

// Returns label examples for terms for a given ontology (capped by n)
export const nTerms = async (ontology: Ontology, n: number): Promise<string[]> => {
  const BY_IDS_ENDPOINT = import.meta.env['VITE_ONTOLOGIES_BY_IDS_ENDPOINT'];
  const body = JSON.stringify({ ids: [ontology.id] });
  const data = await fetchJson<Ontology[] | CacheResponse>(BY_IDS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const list = Array.isArray(data)
    ? (data as Ontology[])
    : ((data as CacheResponse).ontologies ?? []);
  const found = list.find(
    (o) => o.id.toLocaleLowerCase() === ontology.id.toLocaleLowerCase()
  );
  return (found?.terms ?? []).slice(0, n);
};

// Returns property label examples for a given ontology (capped by size)
export const properties = async (
  ontology: Ontology,
  size = 20
): Promise<string[]> => {
  const BY_IDS_ENDPOINT = import.meta.env['VITE_ONTOLOGIES_BY_IDS_ENDPOINT'];
  const body = JSON.stringify({ ids: [ontology.id] });
  const data = await fetchJson<Ontology[] | CacheResponse>(BY_IDS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const list = Array.isArray(data)
    ? (data as Ontology[])
    : ((data as CacheResponse).ontologies ?? []);
  const found = list.find(
    (o) => o.id.toLocaleLowerCase() === ontology.id.toLocaleLowerCase()
  );
  return (found?.properties ?? []).slice(0, size);
};

// Optional helper: fetch by multiple IDs (not currently used by callers)
export const ontologiesByIds = async (ids: string[]): Promise<Ontology[]> => {
  if (!ids.length) return [];
  const BY_IDS_ENDPOINT = import.meta.env['VITE_ONTOLOGIES_BY_IDS_ENDPOINT'];
  const data = await fetchJson<Ontology[] | CacheResponse>(BY_IDS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  return Array.isArray(data)
    ? (data as Ontology[])
    : ((data as CacheResponse).ontologies ?? []);
};

// Fetch by multiple IDs with query params (limit, random sampling)
export const ontologiesByIdsWithOptions = async (
  ids: string[],
  options?: { limit?: number; random_sample?: boolean }
): Promise<Ontology[]> => {
  if (!ids.length) return [];
  const BY_IDS_ENDPOINT = import.meta.env['VITE_ONTOLOGIES_BY_IDS_ENDPOINT'];
  const params: string[] = [];
  if (options?.limit != null) params.push(`limit=${encodeURIComponent(String(options.limit))}`);
  if (options?.random_sample) params.push('random_sample=true');
  const url = params.length ? `${BY_IDS_ENDPOINT}?${params.join('&')}` : BY_IDS_ENDPOINT;
  const data = await fetchJson<Ontology[] | CacheResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  return Array.isArray(data)
    ? (data as Ontology[])
    : ((data as CacheResponse).ontologies ?? []);
};

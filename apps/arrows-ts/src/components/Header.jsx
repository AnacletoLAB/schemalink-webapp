import React, { PureComponent } from 'react';
import { Icon, Menu, Button, ButtonGroup, Dropdown, Modal, Checkbox, Radio } from 'semantic-ui-react';
import { DiagramNameEditor } from './DiagramNameEditor';
import arrows_logo from '../images/arrows_logo.svg';
import { defaultCallbackFactory } from './GptModal';
import { sanitizeInternalGraph } from '../utils/sanitizeGraph';
import { fromGraph, SpiresType, toYaml } from '@neo4j-arrows/linkml';

import {
  CommandKind
} from '@neo4j-arrows/model';

const storageNames = {
  LOCAL_STORAGE: 'Web Browser storage',
};

// Bio-Viber knowledge graph schemas: each KG lists which "Subject - predicate - Object"
// relation patterns it supports, grouped by class pair.
const KG_SCHEMA_RELATIONS = {
  'miRNA-KG': {
    'Gene - Disease': ['Gene - causes or contributes to condition - Disease'],
    'miRNA - miRNA': ['miRNA - in similarity relationship with - miRNA'],
    'miRNA - Disease': [
      'miRNA - causes or contributes to condition - Disease',
      'miRNA - under expressed in - Disease',
      'miRNA - over expressed in - Disease',
      'miRNA - is causal somatic mutation in - Disease',
    ],
    'Gene - Gene': ['Gene - genetically interacts with - Gene'],
    'miRNA - Gene': ['miRNA - regulates activity of - Gene'],
    'miRNA - GO': [
      'miRNA - participates in - GO',
      'miRNA - has function - GO',
      'miRNA - located in - GO',
      'miRNA - part of - GO',
    ],
  },
  'PKT-KG': {
    'Protein - Anatomy': ['Protein - located in - Anatomy'],
    'Protein - Cell': ['Protein - located in - Cell'],
    'Protein - Protein': ['Protein - molecularly interacts with - Protein'],
    'GO - GO': [
      'GO - negatively regulates - GO',
      'GO - positively regulates - GO',
      'GO - regulates - GO',
    ],
    'Chemical - GO': [
      'Chemical - participates in - GO',
      'Chemical - molecularly interacts with - GO',
    ],
    'Protein - GO': ['Protein - enables - GO', 'Protein - located in - GO'],
    'Chemical - Gene': ['Chemical - interacts with - Gene'],
    'Chemical - Protein': [
      'Chemical - interacts with - Protein',
      'Chemical - molecularly interacts with - Protein',
    ],
    'Chemical - Disease': ['Chemical - is substance that treats - Disease'],
    'Chemical - Pathway': ['Chemical - participates in - Pathway'],
    'Protein - Pathway': ['Protein - participates in - Pathway'],
    'Gene - Disease': ['Gene - causes or contributes to condition - Disease'],
    'Gene - Gene': ['Gene - genetically interacts with - Gene'],
    'Gene - Protein': ['Gene - interacts with - Protein'],
    'Gene - Pathway': ['Gene - participates in - Pathway'],
  },
  Hetionet: {
    'Anatomy - Gene': [
      'Anatomy - downregulates - Gene',
      'Anatomy - expresses - Gene',
      'Anatomy - upregulates - Gene',
    ],
    'Compund - Gene': [
      'Compound - binds - Gene',
      'Compound - downregulates - Gene',
      'Compound - upregulates - Gene',
    ],
    'Compound - Side_effect': ['Compound - causes - Side_effect'],
    'Compound - Compound': ['Compound - resembles - Compound'],
    'Disease - Gene': [
      'Disease - associates - Gene',
      'Disease - downregulates - Gene',
      'Disease - upregulates - Gene',
    ],
    'Disease - Anatomy': ['Disease - localizes - Anatomy'],
    'Disease - Symptom': ['Disease - presents - Symptom'],
    'Gene - Gene': [
      'Gene - covaries - Gene',
      'Gene - interacts - Gene',
      'Gene - regulates - Gene',
    ],
    'Gene - Biological_process': ['Gene - participates - Biological_process'],
    'Gene - Cellular_component': ['Gene - participates - Cellular_component'],
    'Gene - Molecular_function': ['Gene - participates - Molecular_function'],
    'Gene - Pathway': ['Gene - participates - Pathway'],
    'Pharmacologic_class  - Compound': ['Pharmacologic_class - includes - Compound'],
  },
  PrimeKG: {
    'Anatomy - Gene_and_or_protein': [
      'Anatomy - expression absent - Gene_and_or_protein',
      'Anatomy - expression present - Gene_and_or_protein',
    ],
    'Biological_process - Exposure': ['Biological_process - interacts with - Exposure'],
    'Biological_process - Gene_and_or_protein': [
      'Biological_process - interacts with - Gene_and_or_protein',
    ],
    'Cellular_component - Gene_and_or_protein': [
      'Cellular_component - interacts with - Gene_and_or_protein',
    ],
    'Disease - Gene_and_or_protein': ['Disease - associated with - Gene_and_or_protein'],
    'Disease - Drug': [
      'Disease - contraindication - Drug',
      'Disease - indication - Drug',
      'Disease - off label use - Drug',
    ],
    'Disease - Exposure': ['Disease - linked to - Exposure'],
    'Disease - Effect_and_or_phenotype': [
      'Disease - phenotype absent - Effect_and_or_phenotype',
      'Disease - phenotype present - Effect_and_or_phenotype',
    ],
    'Drug - Gene_and_or_protein': [
      'Drug - enzyme - Gene_and_or_protein',
      'Drug - target - Gene_and_or_protein',
      'Drug - transporter - Gene_and_or_protein',
    ],
    'Drug - Effect_and_or_phenotype': ['Drug - side effect - Effect_and_or_phenotype'],
    'Drug - Drug': ['Drug - synergistic interaction - Drug'],
    'Effect_and_or_phenotype - Gene_and_or_protein': [
      'Effect_and_or_phenotype - associated with - Gene_and_or_protein',
    ],
    'Exposure - Gene_and_or_protein': ['Exposure - interacts with - Gene_and_or_protein'],
    'Gene_and_or_protein - Molecular_function': [
      'Gene_and_or_protein - interacts with - Molecular_function',
    ],
    'Gene_and_or_protein - Pathway': ['Gene_and_or_protein - interacts with - Pathway'],
    'Gene_and_or_protein - Gene_and_or_protein': ['Gene_and_or_protein - ppi - Gene_and_or_protein'],
  },
  OptimusKG: {
    'Anatomy - Gene': [
      'Anatomy - EXPRESSION_ABSENT - Gene',
      'Anatomy - EXPRESSION_PRESENT - Gene',
    ],
    'Drug - Phenotype': [
      'Drug - ASSOCIATED_WITH - Phenotype',
      'Drug - CONTRAINDICATION - Phenotype',
      'Drug - INDICATION - Phenotype',
    ],
    'Drug - Disease': [
      'Drug - OFF_LABEL_USE - Disease',
      'Drug - CONTRAINDICATION - Disease',
      'Drug - INDICATION - Disease',
    ],
    'Drug - Gene': [
      'Drug - TARGET - Gene',
      'Drug - TRANSPORTER - Gene',
      'Drug - ENZYME - Gene',
    ],
    'Biological_process - Gene': ['Biological_process - INTERACTS_WITH - Gene'],
    'Cellular_component - Gene': ['Cellular_component - INTERACTS_WITH - Gene'],
    'Disease - Gene': ['Disease - ASSOCIATED_WITH - Gene'],
    'Pathway - Gene': ['Pathway - INTERACTS_WITH - Gene'],
    'Disease - Phenotype': ['Disease - PHENOTYPE_PRESENT - Phenotype'],
    'Drug - Drug': ['Drug - SYNERGISTIC_INTERACTION - Drug'],
    'Exposure - Biological_process': ['Exposure - INTERACTS_WITH - Biological_process'],
    'Exposure - Gene': ['Exposure - INTERACTS_WITH - Gene'],
    'Exposure - Disease': ['Exposure - LINKED_TO - Disease'],
    'Phenotype - Gene': ['Phenotype - ASSOCIATED_WITH - Gene'],
    'Gene - Gene': ['Gene - INTERACTS_WITH - Gene'],
    'Molecular_function - Gene': ['Molecular_function - INTERACTS_WITH - Gene'],
  },
};

const KG_OPTIONS = Object.keys(KG_SCHEMA_RELATIONS);

// Flatten each KG's nested class-pair → [triples] structure into one flat Set of triple
// strings, so checking whether a given "Subject - predicate - Object" string is compliant
// with a KG is an O(1) lookup. Normalized (lowercased, underscores treated as spaces) since
// formatting isn't consistent between the app's own class/predicate spelling and how a KG's
// schema happens to write it — e.g. "MiRNA" vs "miRNA", or OptimusKG's "INTERACTS_WITH" vs
// the space-separated "interacts with" the humanizer produces. Compliance should be about the
// semantic triple, not incidental capitalization/underscore choices.
const normalizeForCompliance = (s) => s.toLowerCase().replace(/_/g, ' ');
const KG_RELATION_SETS = Object.fromEntries(
  Object.entries(KG_SCHEMA_RELATIONS).map(([kg, byPair]) => [
    kg,
    new Set(Object.values(byPair).flat().map(normalizeForCompliance)),
  ])
);

const storageStatusMessage = (props) => {
  const storageName = storageNames[props.storage.mode];
  if (storageName) {
    const statusMessages = {
      READY: `Saved to ${storageName}`,
      GET: `Loading from ${storageName}`,
      GETTING: `Loading from ${storageName}`,
      POSTING: `Saving to ${storageName}...`,
      PUT: `Unsaved changes`,
      PUTTING: `Saving to ${storageName}...`,
      FAILED: `Failed to save to ${storageName}, see Javascript console for details.`,
    };
    return <span>{statusMessages[props.storage.status] || ''}</span>;
  } else {
    return null;
  }
};

const storageIcon = (storageMode) => {
  switch (storageMode) {
    case 'DATABASE':
      return 'database';

    case 'LOCAL_STORAGE':
      return 'window maximize outline';

    default:
      return 'square outline';
  }
};

class Header extends PureComponent {
  state = { 
    open: false,
    loginPromptOpen: false,
    canGenerate: false,
    reason: '',
    userPolicy: null,
    extractOpen: false,
    extractModel: 'gpt-4o-mini',
    extractView: 'input',   // 'input' | 'streaming' | 'result'
    extractActiveTab: 'text',
    hoveredMention: null,   // { cls, label } — for cross-highlighting
    extractSchemaSource: 'canvas',
    extractSchema: '',
    extractText: '',
    extractTextSource: 'type',
    extractLoading: false,
    extractResult: null,
    extractError: null,
    extractVisibleClasses: {},
    pubmedQuery: '',
    pubmedResults: [],
    pubmedSearching: false,
    pubmedError: null,
    // streaming state
    streamProgress: [],   // [{className, type, status, count, finalCount, removedByFilter, removedByGrounding, hasAnnotator}]
    streamCurrentClass: null,
    streamLog: [],        // [{id, icon, text}]
    streamLogWidth: 210,  // activity panel width in px (resizable)
    exportDropdownOpen: false,
    selectedPubmedArticle: null,  // { pmid, title, abstract, authors, year, journal }
    extractSelectedKG: null,      // 'miRNA-KG' | 'PKT-KG' | 'Hetionet' | 'PrimeKG' | 'OptimusKG' — Bio-Viber tab
    bioViberSending: false,
    bioViberError: null,
  };

  componentDidMount() {
    this.checkGeneratePermission();

    if (this.props.userData?.username) {
      this.fetchUserPolicy();
    }
  }

  componentDidUpdate(prevProps) {
    const prevUsername = prevProps.userData?.username;
    const currentUsername = this.props.userData?.username;

    if (prevUsername !== currentUsername) {
      this.checkGeneratePermission();
    }
  }

  checkGeneratePermission = async () => {
    const { userData } = this.props;
    if (!userData || !userData.username){
      this.setState({
        canGenerate: false,
        reason: "You must register to request intelligent operations.",
      });
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_CAN_PERFORM_OPERATION_ENDPOINT}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ username: userData.username, operation: "Generate" }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    console.log("Authorization result generate", result);

    this.setState({
      canGenerate: result.allowed === true,
      reason: result.allowed !== true ? (result.reason || "You do not have permission to request intelligent operations.") : undefined,
      userPolicy: result.policy?.toLowerCase() || null
    });
  };

  toggleDropdown = () => {
    this.setState({ open: !this.state.open });
  };

  handleLogout = async () => {  
    try {
      const response = await fetch(`${import.meta.env.VITE_LOGOUT_ENDPOINT}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.ok) {
        console.log('Logout successful');
        this.props.onLogout();
        localStorage.removeItem('user');
        this.setState({
          canGenerate: false,
          reason: 'You must register to request intelligent operations.',
          userPolicy: null,
        });
      } else {
        const errorData = await response.json();
        console.error("Logout failed: ", errorData);
        alert('Logout error: ' + (errorData.detail || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Request error: ', error);
      alert('Logout error: ' + (error.message || 'Communication error with the server.'));
    }
  };

  handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account?");
    
    if (!confirmed) return;
  
    try {
      const response = await fetch(`${import.meta.env.VITE_DELETE_ACCOUNT_ENDPOINT}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.ok) {
        console.log('Delete account successful');
        this.props.onDeleteAccount();
      } else {
        const errorData = await response.json();
        console.error("Delete account failed: ", errorData);
        alert('Delete account error: ' + (errorData.detail || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Request error: ', error);
      alert('Delete account error: ' + (error.message || 'Communication error with the server.'));
    }
  };
  
  handleContribute = async () => {
    const confirmed = window.confirm("Would you like to contribute your schema to AI store?");
    
    if (!confirmed) return;
  
    try {
       const graph = this.props.graph;

      if ((!graph.nodes || graph.nodes.length === 0) && (!graph.relationships || graph.relationships.length === 0)) {
      alert('Contribute error: the graph is empty.');
      return;
    }

      const jsonGraph = JSON.stringify(sanitizeInternalGraph(this.props.graph), null, 2);

      const response = await fetch(`${import.meta.env.VITE_CONTRIBUTE_ENDPOINT}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        username: this.props.userData.username,
        diagramName: this.props.diagramName,
        graphJson: jsonGraph,
      }),
      });
  
      if (response.ok) {
        console.log('Schema sent successfully');
        alert('Your schema has been sent successfully. Thank you for your contribution!');
      } else {
        const errorData = await response.json();
        console.error("Contribute failed: ", errorData);
        alert('Contribute error: ' + (errorData.detail || 'Unknown error.'));
      }
    } catch (error) {
      console.error('Request error: ', error);
      alert('Contribute error: ' + (error.message || 'Communication error with the server.'));
    }
  };

  generateSchemaFromCanvas = () => {
    const { graph, diagramName } = this.props;
    if (!graph || (!graph.nodes?.length && !graph.relationships?.length)) return '';
    try {
      const linkML = fromGraph(diagramName || 'schema', graph, SpiresType.RE);
      return toYaml(linkML);
    } catch (e) {
      console.error('Failed to generate schema from canvas:', e);
      return '';
    }
  };

  searchPubmed = async () => {
    const { pubmedQuery } = this.state;
    if (!pubmedQuery.trim()) return;
    this.setState({ pubmedSearching: true, pubmedError: null, pubmedResults: [] });
    try {
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(pubmedQuery)}&retmax=5&retmode=json`;
      const searchData = await fetch(searchUrl).then(r => r.json());
      const ids = searchData?.esearchresult?.idlist || [];
      if (ids.length === 0) {
        this.setState({ pubmedSearching: false, pubmedResults: [], pubmedError: 'No results found.' });
        return;
      }
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=xml`;
      const xml = await fetch(fetchUrl).then(r => r.text());
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const results = Array.from(doc.querySelectorAll('PubmedArticle')).map(article => {
        const authorList = Array.from(article.querySelectorAll('Author')).slice(0, 3).map(a => {
          const last = a.querySelector('LastName')?.textContent || '';
          const init = a.querySelector('Initials')?.textContent || '';
          return init ? `${last} ${init}` : last;
        });
        const authors = authorList.length > 0 ? authorList.join(', ') + (article.querySelectorAll('Author').length > 3 ? ' et al.' : '') : '';
        const year = article.querySelector('PubDate Year')?.textContent || article.querySelector('PubDate MedlineDate')?.textContent?.slice(0, 4) || '';
        const journal = article.querySelector('ISOAbbreviation')?.textContent || article.querySelector('Title')?.textContent || '';
        return {
          pmid: article.querySelector('PMID')?.textContent || '',
          title: article.querySelector('ArticleTitle')?.textContent || '',
          abstract: Array.from(article.querySelectorAll('AbstractText')).map(a => a.textContent).join(' '),
          authors,
          year,
          journal,
        };
      }).filter(r => r.abstract);
      this.setState({ pubmedResults: results, pubmedSearching: false });
    } catch (e) {
      this.setState({ pubmedSearching: false, pubmedError: 'PubMed search failed: ' + e.message });
    }
  };

  runExtraction = async () => {
    const { extractSchema, extractText, extractModel } = this.state;
    if (!extractSchema.trim() || !extractText.trim()) {
      this.setState({ extractError: 'Please provide both a schema and an input text.' });
      return;
    }

    const username = this.props.userData?.username;
    if (!username) {
      this.setState({ extractError: 'You must be logged in to use extractions.' });
      return;
    }

    // Build initial progress list from graph nodes + relationships
    const nodes = this.props.graph?.nodes || [];
    const rels  = this.props.graph?.relationships || [];
    const allClasses = [
      ...nodes.filter(n => n.caption).map(n => ({ className: n.caption, type: 'entity' })),
      ...rels.filter(r => r.type).map(r => ({ className: r.type, type: 'relation' })),
    ];
    const initialProgress = allClasses.map(c => ({
      ...c, status: 'pending', count: null, finalCount: null,
      removedByFilter: null, removedByGrounding: null,
    }));

    this.setState({
      extractError: null,
      extractResult: null,
      extractView: 'streaming',
      extractLoading: true,
      streamProgress: initialProgress,
      streamCurrentClass: null,
      streamLog: [],
    });

    const streamEndpoint = import.meta.env.VITE_EXTRACT_STREAM_ENDPOINT;

    try {
      const response = await fetch(streamEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          schema: extractSchema,
          text: extractText,
          add_dependencies: true,
          add_guidelines: true,
          ground_mode: 'exact',
          model: extractModel,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        this.setState({ extractError: err.error || 'Extraction failed.', extractView: 'input', extractLoading: false });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let _logId = 0;
      const addLog = (icon, text) => {
        const entry = { id: _logId++, icon, text };
        this.setState(prev => ({ streamLog: [...prev.streamLog.slice(-49), entry] }));
      };

      // Per-class dedup: track which state transitions have already fired
      // so old-engine fallback events don't double-fire alongside new-engine events.
      const _extractingLogged = new Set(); // className → extracting already logged
      const _doneLogged       = new Set(); // className → done already logged

      // Normalize helper (same as SVG section)
      const _norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      // Fuzzy-find a progress entry by class name, optionally restricted to a type
      const _findProg = (className, type) => {
        const n = _norm(className);
        return this.state.streamProgress.find(p => {
          if (type && p.type !== type) return false;
          const c = _norm(p.className);
          return c === n || c.includes(n) || n.includes(c);
        });
      };

      const updateProgress = (className, patch, forType) => {
        this.setState(prev => {
          const n = _norm(className);
          let found = false;
          const progress = prev.streamProgress.map(p => {
            // Only match entries of the correct type (entity vs relation)
            if (forType && p.type !== forType) return p;
            const c = _norm(p.className);
            if (c === n || c.includes(n) || n.includes(c)) {
              found = true;
              return { ...p, ...patch };
            }
            return p;
          });
          // If not in canvas at all (e.g. injected dependency class) — ignore silently
          if (!found) return prev;
          const newCurrent = patch.status === 'extracting' ? className
            : patch.status === 'done' ? (prev.streamCurrentClass && _norm(prev.streamCurrentClass) === n ? null : prev.streamCurrentClass)
            : prev.streamCurrentClass;
          return { streamProgress: progress, streamCurrentClass: newCurrent };
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim());

            if (payload.type === 'trace') {
              const cls = payload.class;
              const evt = payload.event;
              const data = payload.data;
              const cnt = Array.isArray(data) ? data.length : 0;

              const isEntityCls   = !!_findProg(cls, 'entity');
              const isRelationCls = !!_findProg(cls, 'relation');

              // ── Entity events ──────────────────────────────────────────
              if (evt === 'NE_START') {
                updateProgress(cls, { status: 'extracting' }, 'entity');
                if (!_extractingLogged.has(cls) && isEntityCls) {
                  _extractingLogged.add(cls);
                  addLog('🔵', `${cls} — calling GPT…`);
                }
              } else if (evt === 'NE_INIT') {
                updateProgress(cls, { status: 'extracting', count: cnt }, 'entity');
                if (!_extractingLogged.has(cls) && isEntityCls) {
                  _extractingLogged.add(cls);
                  addLog('🔵', `${cls} — calling GPT…`);
                }
                if (isEntityCls) addLog('📋', `  ${cls}: GPT returned ${cnt} mention${cnt !== 1 ? 's' : ''}`);
              } else if (evt === 'NE_FILTER_REMOVED') {
                if (isEntityCls && cnt > 0) addLog('✂️', `  ${cls}: ${cnt} removed by rules`);
              } else if (evt === 'NE_FILTERED') {
                if (isEntityCls) addLog('📌', `  ${cls}: ${cnt} kept after rules`);
              } else if (evt === 'NE_GROUNDING_START') {
                const info = data && typeof data === 'object' ? data : {};
                if (isEntityCls) addLog('🔍', `  ${cls}: grounding ${info.count ?? cnt} via ${info.annotator || 'ontology'}…`);
              } else if (evt === 'NE_GROUNDING_REMOVED') {
                if (isEntityCls && cnt > 0) addLog('✂️', `  ${cls}: ${cnt} removed (no ontology match)`);
              } else if (evt === 'NE_GROUNDED' || evt === 'NE_DONE') {
                updateProgress(cls, { status: 'done', finalCount: cnt }, 'entity');
                if (!_doneLogged.has(cls) && isEntityCls) {
                  _doneLogged.add(cls);
                  addLog('✅', `${cls}: done — ${cnt} grounded`);
                }

              // ── Relation events ────────────────────────────────────────
              } else if (evt === 'RE_START') {
                updateProgress(cls, { status: 'extracting' }, 'relation');
                if (!_extractingLogged.has(cls) && isRelationCls) {
                  _extractingLogged.add(cls);
                  addLog('🔵', `${cls} — calling GPT…`);
                }
              } else if (evt === 'RE_INIT') {
                updateProgress(cls, { status: 'extracting', count: cnt }, 'relation');
                if (!_extractingLogged.has(cls) && isRelationCls) {
                  _extractingLogged.add(cls);
                  addLog('🔵', `${cls} — calling GPT…`);
                }
                if (isRelationCls) addLog('📋', `  ${cls}: GPT returned ${cnt} relation${cnt !== 1 ? 's' : ''}`);
              } else if (evt === 'RE_VALIDATING') {
                const info = data && typeof data === 'object' ? data : {};
                if (isRelationCls) addLog('🔄', `  ${cls}: validating ${info.raw ?? cnt} pairs (${info.subject} ↔ ${info.object})…`);
              } else if (evt === 'RE_FILTERED_REMOVED') {
                if (isRelationCls && cnt > 0) addLog('✂️', `  ${cls}: ${cnt} removed (unmatched entities)`);
              } else if (evt === 'RE_RESOLVING') {
                const info = data && typeof data === 'object' ? data : {};
                const n = info.count ?? cnt;
                if (isRelationCls && n > 0) addLog('🔗', `  ${cls}: resolving IDs for ${n} relation${n !== 1 ? 's' : ''}…`);
              } else if (evt === 'RE_DONE') {
                if (!_doneLogged.has(cls)) {
                  _doneLogged.add(cls);
                  updateProgress(cls, { status: 'done', finalCount: cnt }, 'relation');
                  if (isRelationCls) addLog('✅', `${cls}: done — ${cnt} relation${cnt !== 1 ? 's' : ''}`);
                }
              } else if (evt === 'RE_FINAL') {
                // Old engine fallback only (RE_DONE not yet deployed)
                if (!_doneLogged.has(cls)) {
                  _doneLogged.add(cls);
                  const _cls = cls, _cnt = cnt;
                  setTimeout(() => {
                    updateProgress(_cls, { status: 'done', finalCount: _cnt }, 'relation');
                    if (_findProg(_cls, 'relation')) addLog('✅', `${_cls}: done — ${_cnt} relation${_cnt !== 1 ? 's' : ''}`);
                  }, 600);
                }
              }
            } else if (payload.type === 'done') {
              const responses = payload.responses || {};
              const trace = payload.trace || {};
              const visibleClasses = {};
              Object.keys(responses).forEach(k => { visibleClasses[k] = true; });
              Object.keys(trace).forEach(k => { visibleClasses[k] = true; });
              addLog('🎉', 'Extraction complete!');
              this.setState(prev => ({
                extractResult: payload,
                extractVisibleClasses: visibleClasses,
                extractView: 'result',
                extractActiveTab: 'text',
                extractLoading: false,
                streamCurrentClass: null,
                streamProgress: prev.streamProgress.map(p => ({ ...p, status: p.status === 'pending' ? 'skipped' : p.status })),
              }));
            } else if (payload.type === 'error') {
              const msg = payload.detail ? `${payload.message}\n\n${payload.detail}` : payload.message;
              this.setState({ extractError: msg, extractView: 'input', extractLoading: false });
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      this.setState({ extractError: 'Network error: ' + err.message, extractView: 'input', extractLoading: false });
    }
  };

  render() {
    const {
      isAuthenticated,
      userData,
      onGenerateClick,
      graph,
      ontologies,
      separation,
      clearGraph,
      importNodesAndRelationships,
      setDiagramName,
    } = this.props;

    const newDiagramOptions = ['LOCAL_STORAGE'].map((mode) => (
      <div
        key={mode}
        role="option"
        aria-selected
        className="item"
        onClick={() => this.props.onNewDiagram(mode)}
      >
        <i aria-hidden="true" className={'icon ' + storageIcon(mode)} />
        <span>{storageNames[mode]}</span>
      </div>
    ));

    const sanitizedRecent = (this.props.recentStorage || []).filter(
      (entry) => entry && typeof entry.diagramName === 'string'
    );
    const recentlyAccessFiles = sanitizedRecent
      .slice(1, 11)
      .map((entry, i) => (
        <div
          key={'recentlyAccessFiles' + i}
          role="option"
          aria-selected
          className="item"
          onClick={() => this.props.openRecentFile(entry)}
          style={{
            maxWidth: '20em',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          <i aria-hidden="true" className={'icon ' + storageIcon(entry.mode)} />
          <span className="text">{entry.diagramName}</span>
        </div>
      ));

    const browseDiagramOptions = ['LOCAL_STORAGE'].map((mode) => (
      <div
        key={mode}
        role="option"
        aria-selected
        className="item"
        onClick={() => this.props.pickFileToOpen(mode)}
      >
        <i aria-hidden="true" className={'icon ' + storageIcon(mode)} />
        <span>{storageNames[mode]}</span>
      </div>
    ));

    return (
      <>
      <Menu attached="top" style={{ borderRadius: 0 }} borderless>
        <div
          role="listbox"
          aria-expanded="true"
          className="ui item simple dropdown"
          tabIndex="0"
        >
          <i className="icon" style={{ height: '1.5em' }}>
            <img
              src={arrows_logo}
              style={{ height: '1.5em' }}
              alt="SchemaLink logo"
            />
          </i>
          <div className="menu transition visible">
            <div role="option" aria-selected className="item">
              <i aria-hidden="true" className="dropdown icon" />
              <span className="text">New</span>
              <div className="menu transition">
                <div className="header">Store in</div>
                {newDiagramOptions}
              </div>
            </div>
            <div role="option" aria-selected className="item">
              <i aria-hidden="true" className="dropdown icon" />
              <span className="text">Open</span>
              <div className="menu transition">
                <div className="header">Recently accessed</div>
                {recentlyAccessFiles}
                <div className="divider" />
                <div className="header">Browse</div>
                {browseDiagramOptions}
              </div>
            </div>
            <div
              role="option"
              aria-selected
              className="item"
              onClick={this.props.onSaveAsClick}
            >
              Save As…
            </div>
            <div className="divider" />
            <div
              role="option"
              aria-selected
              className="item"
              onClick={this.props.onImportClick}
            >
              Import
            </div>
            <div
              role="option"
              aria-selected
              className="item"
              onClick={() => this.props.onOpenTemplates && this.props.onOpenTemplates()}
            >
              <i aria-hidden="true" className="table icon" />
              Templates
            </div>
            {import.meta.env.VITE_OPENAI_ENABLED && (
              <div
                role="option"
                aria-selected
                className="item"
                onClick={() => {
                  if (!isAuthenticated) { this.setState({ loginPromptOpen: true }); return; }
                  if (isAuthenticated && this.state.canGenerate) {
                    onGenerateClick(
                      defaultCallbackFactory(
                        CommandKind,
                        ontologies,
                        graph,
                        separation,
                        clearGraph,
                        importNodesAndRelationships,
                        setDiagramName,
                        graph.nodes,
                        graph.relationships
                      )
                    );
                  }
                }}
                title={
                  this.state.canGenerate
                    ? ''
                    : this.state.reason || 'You do not have permission to request intelligent operations.'
                }
                style={{
                  opacity: (!isAuthenticated || !this.state.canGenerate) ? 0.5 : 1,
                }}
              >
                Generate
              </div>
            )}
            <div className="divider" />
            <div
              role="option"
              aria-selected
              className={`item${['gold', 'platinum'].includes(this.state.userPolicy) ? '' : ' disabled'}`}
              title={
                !this.props.userData
                  ? 'Please log in to contribute.'
                  : !['gold', 'platinum'].includes(this.state.userPolicy)
                  ? 'Upgrade to Gold or Platinum to contribute schemas'
                  : 'Contribute this schema to the AI store'
              }
              onClick={() => {
                if (!isAuthenticated) { this.setState({ loginPromptOpen: true }); return; }
                if (['gold', 'platinum'].includes(this.state.userPolicy)) {
                  this.handleContribute();
                }
              }}
              style={{ opacity: ['gold', 'platinum'].includes(this.state.userPolicy) ? 1 : 0.45 }}
            >
              Contribute
            </div>
            <div className="divider" />
            <div
              role="option"
              aria-selected
              className="item"
              onClick={this.props.onHelpClick}
            >
              Help
            </div>
            <div
              role="option"
              aria-selected
              className="item"
              onClick={this.props.onAcknowledgementsClick}
            >
              Acknowledgements
            </div>
          </div>
        </div>
        <DiagramNameEditor
          diagramName={this.props.diagramName}
          setDiagramName={this.props.setDiagramName}
        />
        <Menu.Item>
          <ButtonGroup>
            <Button
              icon="undo"
              disabled={this.props.undoRedoDisabled.undo}
              onClick={this.props.undo}
            />
            <Button
              icon="redo"
              disabled={this.props.undoRedoDisabled.redo}
              onClick={this.props.redo}
            />
          </ButtonGroup>
        </Menu.Item>
        <Menu.Item style={{ opacity: 0.6 }}>
          {(() => {
            const mode = this.props.storage?.mode;
            const status = this.props.storage?.status;
            const isLocal = mode === 'LOCAL_STORAGE';
            const isFailed = status === 'FAILED';
            return (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '12px',
                color: isFailed ? '#b45309' : isLocal ? '#92400e' : '#64748b',
                background: isFailed ? '#fff7ed' : isLocal ? '#fffbeb' : 'transparent',
                border: (isFailed || isLocal) ? `1px solid ${isFailed ? '#fcd34d' : '#fde68a'}` : 'none',
                borderRadius: '6px',
                padding: (isFailed || isLocal) ? '2px 8px' : '0',
              }}>
                <Icon name={storageIcon(mode)} style={{ margin: 0 }} />
                {storageStatusMessage(this.props)}
              </span>
            );
          })()}
        </Menu.Item>
        <Menu.Menu position={'right'}>
          <Menu.Item>
          {this.props.isAuthenticated ? (
            <Dropdown
              trigger={
                <Button
                  icon="user"
                  basic
                  color="black"
                  content={userData.username}
                />
              }
              pointing="top right"
              className="link item"
            >
              <Dropdown.Menu>
                <Dropdown.Item onClick={this.props.onInfoAccountClick}>Info Account</Dropdown.Item>
                {userData.username !== "schemalink" && (
                  <Dropdown.Item onClick={this.props.onSubscribeToPolicyClick}>Subscription Plan</Dropdown.Item>
                )}
                {userData.username === "schemalink" && (
                  <Dropdown.Item onClick={this.props.onViewUsersClick}>View Users</Dropdown.Item>
                )}
                {userData.username === "schemalink" && (
                  <Dropdown.Item onClick={this.props.onDashboardClick}>Dashboard</Dropdown.Item>
                )}
                {userData.username === "schemalink" && (
                  <Dropdown.Item onClick={this.props.onOntologiesClick}>Ontologies</Dropdown.Item>
                )}
                <Dropdown.Divider />
                <Dropdown.Item onClick={this.handleLogout}>Logout</Dropdown.Item>
                {userData.username !== "schemalink" && (
                    <Dropdown.Item onClick={this.handleDeleteAccount}>Delete Account</Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <Button
              onClick={this.props.onAuthClick}
              icon="user"
              basic
              color="black"
              content="Login / Register"
            />
          )}
            <span style={{ marginRight: '10px' }}></span>
            <Button
              onClick={this.props.onEnumRegexClick}
              icon="list"
              basic
              color="black"
              content="Enums"
            />
            <span style={{ marginRight: '10px' }}></span>
            <Button
              onClick={this.props.onExportClick}
              icon="download"
              basic
              color="black"
              content="Download"
              data-tour="export-btn"
            />
            <div>
              <span style={{ marginRight: '10px' }}></span>
              <Button
                icon="share alternate"
                basic
                color="black"
                content="Contribute"
                title={
                  !isAuthenticated
                    ? 'Please log in to contribute.'
                    : !['gold', 'platinum'].includes(this.state.userPolicy)
                    ? 'Upgrade to Gold or Platinum to contribute schemas'
                    : 'Contribute this schema to the AI store'
                }
                style={{ opacity: isAuthenticated && ['gold', 'platinum'].includes(this.state.userPolicy) ? 1 : 0.6, cursor: 'pointer' }}
                onClick={() => {
                  if (!isAuthenticated) { this.setState({ loginPromptOpen: true }); return; }
                  if (['gold', 'platinum'].includes(this.state.userPolicy)) {
                    this.handleContribute();
                  }
                }}
              />
              <span style={{ marginRight: '10px' }}></span>
              <Button
                icon="file text"
                basic
                color="black"
                content="Extract"
                data-tour="extract-btn"
                title={!isAuthenticated ? 'Please log in to use extraction.' : 'Extract'}
                style={{ opacity: isAuthenticated ? 1 : 0.7, cursor: 'pointer' }}
                onClick={() => {
                  if (!isAuthenticated) { this.setState({ loginPromptOpen: true }); return; }
                  const canvasSchema = this.generateSchemaFromCanvas();
                  this.setState({
                    extractOpen: true,
                    extractSchemaSource: 'canvas',
                    extractSchema: canvasSchema,
                    extractTextSource: 'type',
                    pubmedQuery: '',
                    pubmedResults: [],
                    pubmedError: null,
                  });
                }}
              />

            </div>
            <Modal
              open={this.state.extractOpen}
                onClose={() => this.setState({ extractOpen: false, extractView: 'input', extractResult: null, extractError: null, pubmedResults: [], pubmedQuery: '', pubmedError: null, extractModel: 'gpt-4o-mini', streamProgress: [], streamCurrentClass: null, streamLog: [], extractSelectedKG: null })}
              closeOnDimmerClick={false}
              closeOnEscape={false}
              size="large"
              style={{ width: '86%', maxWidth: '1200px' }}
            >
              <Modal.Header>
                {this.state.extractView === 'result' ? 'Extraction Result' : this.state.extractView === 'streaming' ? 'Extracting…' : 'Extract'}
              </Modal.Header>
              <Modal.Content>
                {this.state.extractView === 'input' && (() => {
                  const { extractSchemaSource, extractTextSource, pubmedQuery, pubmedResults, pubmedSearching, pubmedError } = this.state;
                  const graph = this.props.graph;
                  const nodeLabels = (graph?.nodes || []).map(n => n.caption || n.labels?.[0] || '').filter(Boolean);
                  const relTypes = (graph?.relationships || []).map(r => r.type || '').filter(Boolean);
                  const canvasEmpty = nodeLabels.length === 0 && relTypes.length === 0;

                  const sourcePill = (active) => ({
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '4px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '13px',
                    fontWeight: active ? 700 : 400,
                    background: active ? '#1d4ed8' : '#f1f5f9',
                    color: active ? 'white' : '#334155',
                    border: '1px solid ' + (active ? '#1d4ed8' : '#cbd5e1'),
                    userSelect: 'none',
                  });

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                      {/* ── LEFT: Schema ── */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>Schema <span style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>— auto-generated from your canvas</span></div>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: canvasEmpty ? '#fff7ed' : '#f0fdf4', minHeight: '120px' }}>
                            {canvasEmpty ? (
                              <div style={{ color: '#92400e', fontSize: '13px' }}>
                                <Icon name="warning sign" /> The canvas is empty. Draw your schema on the canvas first.
                              </div>
                            ) : (
                              <>
                                <div style={{ fontSize: '12px', color: '#166534', marginBottom: '8px', fontWeight: 600 }}>
                                  <Icon name="check circle outline" color="green" />Schema loaded from canvas
                                </div>
                                {nodeLabels.length > 0 && (
                                  <div style={{ marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entities</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                      {nodeLabels.map((l, i) => (
                                        <span key={i} style={{ background: '#dbeafe', color: '#1e40af', borderRadius: '12px', padding: '2px 8px', fontSize: '12px' }}>{l}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {relTypes.length > 0 && (
                                  <div>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Relations</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                      {relTypes.map((t, i) => (
                                        <span key={i} style={{ background: '#f3e8ff', color: '#6b21a8', borderRadius: '12px', padding: '2px 8px', fontSize: '12px' }}>{t}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── RIGHT: Text ── */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>Input Text</div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <span style={sourcePill(extractTextSource === 'type')}
                              onClick={() => this.setState({ extractTextSource: 'type' })}>
                              <Icon name="keyboard outline" />Type / Paste
                            </span>
                            <span style={sourcePill(extractTextSource === 'pubmed')}
                              onClick={() => this.setState({ extractTextSource: 'pubmed' })}>
                              <Icon name="search" />Search PubMed
                            </span>
                          </div>

                          {extractTextSource === 'type' ? (
                            <textarea
                              style={{ width: '100%', height: '200px', fontFamily: 'inherit', fontSize: '13px', border: '1px solid rgba(34,36,38,0.2)', borderRadius: '4px', padding: '8px', resize: 'vertical', boxSizing: 'border-box' }}
                              placeholder="Paste or type the text to extract information from…"
                              value={this.state.extractText}
                              onChange={(e) => this.setState({ extractText: e.target.value, selectedPubmedArticle: null })}
                            />
                          ) : (
                            <div>
                              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                <input
                                  style={{ flex: 1, padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}
                                  placeholder="e.g. drug-induced liver injury"
                                  value={pubmedQuery}
                                  onChange={(e) => this.setState({ pubmedQuery: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && this.searchPubmed()}
                                />
                                <Button
                                  primary size="small"
                                  loading={pubmedSearching}
                                  disabled={pubmedSearching || !pubmedQuery.trim()}
                                  onClick={this.searchPubmed}
                                  icon="search"
                                  content="Search"
                                />
                              </div>
                              {pubmedError && (
                                <div style={{ color: '#b91c1c', fontSize: '12px', marginBottom: '6px' }}>{pubmedError}</div>
                              )}
                              {pubmedResults.length > 0 && (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                  {pubmedResults.map((r) => (
                                    <div key={r.pmid}
                                      style={{ padding: '9px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = ''}
                                      onClick={() => this.setState({ extractText: r.abstract, extractTextSource: 'type', selectedPubmedArticle: r })}
                                    >
                                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e40af', marginBottom: '3px', lineHeight: 1.3 }}>
                                        {r.title}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                                        {r.authors && <span style={{ fontSize: '10px', color: '#475569' }}>{r.authors}</span>}
                                        {r.year && <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', borderRadius: '4px', padding: '1px 5px' }}>{r.year}</span>}
                                        {r.journal && <span style={{ fontSize: '10px', color: '#6366f1', fontStyle: 'italic' }}>{r.journal}</span>}
                                        <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto' }}>PMID {r.pmid}</span>
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4, maxHeight: '32px', overflow: 'hidden' }}>
                                        {r.abstract.slice(0, 150)}…
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {pubmedResults.length === 0 && !pubmedSearching && !pubmedError && (
                                <div style={{ color: '#94a3b8', fontSize: '12px', padding: '8px 0' }}>
                                  Search for abstracts and click one to use it as input text.
                                </div>
                              )}
                              {this.state.extractText && (
                                <div style={{ marginTop: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '12px', maxHeight: '80px', overflowY: 'auto', color: '#334155' }}>
                                  <strong>Selected:</strong> {this.state.extractText.slice(0, 200)}{this.state.extractText.length > 200 ? '…' : ''}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {this.state.extractError && (
                          <div style={{ color: '#b91c1c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '4px', padding: '8px 12px', fontSize: '13px' }}>
                            {this.state.extractError}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {this.state.extractView === 'result' && (() => {
                  const responses = this.state.extractResult?.responses || {};
                  const trace = this.state.extractResult?.trace || {};
                  const outputLog = this.state.extractResult?.output || '';
                  const activeTab = this.state.extractActiveTab || 'text';
                  // Palette — must match trace accentColors order exactly
                  const classColors = ['#fff1f2', '#eff6ff', '#fdf4ff', '#fff7ed', '#f0f9ff', '#fefce8'];
                  const textColors  = ['#b91c1c', '#1d4ed8', '#7e22ce', '#c2410c', '#0369a1', '#a16207'];

                  // Separate entity classes from relation classes
                  // Use trace: classes with RE_INIT are relations; NE_INIT are entities
                  const reTraceClasses = new Set(Object.keys(trace).filter(k => trace[k]['RE_INIT'] !== undefined || trace[k]['RE_FINAL'] !== undefined));
                  const neTraceClasses = new Set(Object.keys(trace).filter(k => trace[k]['NE_INIT'] !== undefined));
                  const entityClasses = {};
                  const relationClasses = {};
                  Object.entries(responses).forEach(([cls, data]) => {
                    const key = `${cls}Relationships`;
                    const hasRelKey = data[key] !== undefined;
                    const isRel = reTraceClasses.has(cls) || hasRelKey || cls.includes('Relationship') || cls.includes('Triple');
                    if (isRel) relationClasses[cls] = data;
                    else entityClasses[cls] = data;
                  });
                  // Also add relation classes that appear only in trace (not in responses)
                  Object.keys(trace).filter(k => reTraceClasses.has(k) && !responses[k]).forEach(k => {
                    relationClasses[k] = {};
                  });
                  const entityKeys = Object.keys(entityClasses);
                  const relationKeys = Object.keys(relationClasses);

                    // Turn a schema relation class name like "GeneGeneticallyInteractsWithGeneRelationship"
                    // into a readable "Gene - genetically interacts with - Gene". Relies on the known
                    // entity class names (entityKeys) to figure out where subject/object begin and end,
                    // since the class name is just those concatenated with the predicate in PascalCase.
                    const splitWords = (s) =>
                      s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').trim();
                    const humanizeRelationClass = (cls) => {
                      let base = cls.replace(/Relationship$/, '').replace(/Triple$/, '');
                      const byLengthDesc = [...entityKeys].sort((a, b) => b.length - a.length);
                      const subjectCls = byLengthDesc.find((e) => base.startsWith(e));
                      const rest = subjectCls ? base.slice(subjectCls.length) : base;
                      const objectCls = byLengthDesc.find((e) => rest.endsWith(e));
                      const predicate = objectCls ? rest.slice(0, rest.length - objectCls.length) : rest;
                      const predicateWords = splitWords(predicate).toLowerCase();
                      if (subjectCls && objectCls && predicateWords) {
                        return `${subjectCls} - ${predicateWords} - ${objectCls}`;
                      }
                      return splitWords(cls); // fallback: can't confidently split, just space it out
                    };

                  // Highlight entity mentions in input text
                  const buildHighlightSegments = () => {
                    const inputText = this.state.extractText;
                    const allMentions = [];
                    entityKeys.forEach((cls, i) => {
                      if (!this.state.extractVisibleClasses[cls]) return;
                      (entityClasses[cls]?.schemaResponse?.mentions || []).forEach(m => {
                        const label = typeof m === 'string' ? m : (m?.label || m?.name || '');
                        if (label) allMentions.push({ label, cls, color: textColors[i % textColors.length] });
                      });
                    });
                    allMentions.sort((a, b) => b.label.length - a.label.length);
                    const used = [];
                    allMentions.forEach(({ label, cls, color }) => {
                      let idx = 0;
                      const lower = inputText.toLowerCase();
                      const lbl = label.toLowerCase();
                      while ((idx = lower.indexOf(lbl, idx)) !== -1) {
                        if (!used.some(u => u.start < idx + label.length && u.end > idx)) {
                          used.push({ start: idx, end: idx + label.length, color, cls, label });
                        }
                        idx += label.length;
                      }
                    });
                    used.sort((a, b) => a.start - b.start);
                    const segs = [];
                    let cur = 0;
                    used.forEach(u => {
                      if (u.start < cur) return;
                      if (u.start > cur) segs.push({ text: inputText.slice(cur, u.start), color: null, cls: null, label: null });
                      segs.push({ text: inputText.slice(u.start, u.end), color: u.color, cls: u.cls, label: u.label });
                      cur = u.end;
                    });
                    if (cur < inputText.length) segs.push({ text: inputText.slice(cur), color: null, cls: null, label: null });
                    return segs.length ? segs : [{ text: inputText, color: null, cls: null, label: null }];
                  };

                  // Parse pipeline log into structured rows
                  const parseLog = () => {
                    return outputLog
                      .split('\n')
                      .map(l => l.trim())
                      .filter(l => l &&
                        !l.match(/^\*\*Step \d/) &&
                        !l.startsWith('DEBUG') &&
                        !l.startsWith('Warning') &&
                        !l.startsWith('🚀') &&
                        l !== '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                      )
                      .map(l => {
                        if (l.includes('**Output File**')) {
                          const path = l.replace(/\*\*Output File\*\*\s*\*?\*?\s*/, '').trim();
                          return { type: 'file', step: 'Output file', outcome: path, path };
                        }
                        if (l.match(/^DAG\d/)) {
                          const [dagId, ...rest] = l.split(' ');
                          return { type: 'dag', step: dagId, outcome: rest.join(' ') };
                        }
                        const clean = l.replace(/\*\*/g, '').replace(/[✅❌⚠️🔍📊]/g, '').trim();
                        if (l.includes('->') && (l.includes('✅') || l.includes('Grounded'))) {
                          return { type: 'grounding_ok', step: 'Grounding', outcome: clean };
                        }
                        if (l.includes('❌') || l.includes('No grounding')) {
                          return { type: 'grounding_fail', step: 'Grounding', outcome: clean };
                        }
                        const colonIdx = clean.indexOf(':');
                        if (colonIdx > 0 && colonIdx < 40) {
                          return { type: 'info', step: clean.slice(0, colonIdx).trim(), outcome: clean.slice(colonIdx + 1).trim() };
                        }
                        return { type: 'info', step: clean, outcome: '' };
                      });
                  };
                  const logItems = parseLog();

                  const toggleClass = (cls) => this.setState(prev => ({
                    extractVisibleClasses: { ...prev.extractVisibleClasses, [cls]: !prev.extractVisibleClasses[cls] }
                  }));

                  // ── Export helpers ─────────────────────────────────────────
                  const _triggerDownload = (content, filename, mime) => {
                    const blob = new Blob([content], { type: mime });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                    a.download = filename; a.click(); URL.revokeObjectURL(a.href);
                  };

                  const downloadJSON = () => {
                    _triggerDownload(JSON.stringify(responses, null, 2), 'schemalink_extraction.json', 'application/json');
                  };

                  const _buildEntityRows = () => {
                    const rows = [];
                    entityKeys.forEach(cls => {
                      (entityClasses[cls]?.schemaResponse?.mentions || []).forEach(m => {
                        rows.push({
                          cls,
                          label: typeof m === 'string' ? m : (m?.label || m?.name || ''),
                          id:    typeof m === 'object' ? (m?.id || '') : '',
                          ids:   typeof m === 'object' && Array.isArray(m?.ids) ? m.ids : [],
                        });
                      });
                    });
                    return rows;
                  };
                  const _buildRelRows = () => {
                    const rows = [];
                    relationKeys.forEach(cls => {
                      const rKey = `${cls}Relationships`;
                      const rData = responses[cls] || {};
                      (rData[rKey] || rData?.schemaResponse?.mentions || []).filter(Boolean).forEach(m => {
                        const subj = typeof m.subject === 'object' ? (m.subject?.id || JSON.stringify(m.subject)) : String(m.subject ?? '');
                        const pred = typeof m.predicate === 'object' ? (m.predicate?.id || JSON.stringify(m.predicate)) : String(m.predicate ?? '');
                        const obj  = typeof m.object === 'object' ? (m.object?.id || JSON.stringify(m.object)) : String(m.object ?? '');
                        rows.push({ cls, subj, pred, obj });
                      });
                    });
                    return rows;
                  };

                  const downloadCSV = () => {
                    const rows = [['type', 'class', 'label', 'id', 'ids', 'subject', 'predicate', 'object']];
                    _buildEntityRows().forEach(({ cls, label, id, ids }) => rows.push(['entity', cls, label, id, ids.join('|'), '', '', '']));
                    _buildRelRows().forEach(({ cls, subj, pred, obj }) => rows.push(['relation', cls, '', '', '', subj, pred, obj]));
                    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                    _triggerDownload(csv, 'schemalink_extraction.csv', 'text/csv');
                  };

                  // Helper: convert OBO underscore ID (CHEBI_15765) → CURIE (CHEBI:15765).
                  // Only replaces the FIRST underscore so numeric parts remain intact.
                  const _toCurie = id => (id || '').replace(/^([A-Za-z]+)_/, '$1:');

                  // PubMed article selected by the user (null if text was typed manually)
                  const _pubmed = this.state.selectedPubmedArticle;
                  const _docId   = _pubmed ? String(_pubmed.pmid) : 'schemalink_extraction';
                  const _title   = _pubmed ? (_pubmed.title   || '') : '';
                  const _abstract = this.state.extractText || '';
                  const _fname   = _pubmed ? _pubmed.pmid : 'schemalink_extraction';

                  const downloadBiocJSON = () => {
                    let annId = 1, relId = 1;
                    const passages = [];

                    // Title passage (only when from PubMed)
                    if (_title) {
                      const titleInfons = { type: 'title' };
                      if (_pubmed.journal) titleInfons.journal = _pubmed.journal;
                      if (_pubmed.year)    titleInfons.year    = String(_pubmed.year);
                      if (_pubmed.authors) titleInfons.authors = _pubmed.authors;
                      passages.push({ infons: titleInfons, offset: 0, text: _title, annotations: [], relations: [] });
                    }

                    // Abstract / text passage — all annotations go here
                    const abstractOffset = _title ? _title.length + 1 : 0;
                    const annotations = [];
                    _buildEntityRows().forEach(({ cls, label, id }) => {
                      if (!label) return;
                      const identifier = id ? _toCurie(id) : '-';
                      annotations.push({
                        id: String(annId++),
                        infons: { identifier, type: cls },
                        text: label,
                        locations: [{ offset: abstractOffset, length: label.length }],
                      });
                    });
                    passages.push({ infons: { type: 'abstract' }, offset: abstractOffset, text: _abstract, annotations, relations: [] });

                    // Relations at document level
                    const relations = _buildRelRows().map(({ cls, subj, pred, obj }, i) => ({
                      id: `R${relId++}`,
                      infons: {
                        type: pred || cls,
                        role1: { identifier: _toCurie(subj), type: cls },
                        role2: { identifier: _toCurie(obj),  type: cls },
                      },
                      nodes: [{ refid: String(i), role: '0,1' }],
                    }));

                    const doc = {
                      PubTator3: [{
                        _id: `${_docId}|None`,
                        id: _docId,
                        infons: {},
                        passages,
                        relations,
                        pmid: _pubmed ? _pubmed.pmid : null,
                        pmcid: null,
                        meta: {},
                        date: '',
                        journal: _pubmed?.journal || '',
                        authors: _pubmed?.authors || '',
                      }],
                    };
                    _triggerDownload(JSON.stringify(doc, null, 2), `${_fname}.bioc.json`, 'application/json');
                  };

                  const downloadPubTator = () => {
                    const lines = [];
                    // Header lines
                    if (_title) lines.push(`${_docId}|t|${_title}`);
                    lines.push(`${_docId}|a|${_abstract}`);
                    // Entity annotations: ID \t start \t end \t text \t type \t identifier
                    _buildEntityRows().forEach(({ cls, label, id }) => {
                      if (!label) return;
                      const identifier = id ? _toCurie(id) : '-';
                      lines.push(`${_docId}\t0\t${label.length}\t${label}\t${cls}\t${identifier}`);
                    });
                    // Relation annotations: ID \t type \t role1_identifier \t role2_identifier
                    _buildRelRows().forEach(({ cls, subj, pred, obj }) => {
                      const s = _toCurie(subj) || '-';
                      const o = _toCurie(obj)  || '-';
                      lines.push(`${_docId}\t${pred || cls}\t${s}\t${o}`);
                    });
                    _triggerDownload(lines.join('\n'), `${_fname}.pubtator.txt`, 'text/plain');
                  };

                  const downloadBiocXML = () => {
                    let annId = 1, relId = 1;
                    const esc = s => String(s ?? '')
                      .replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;');

                    const makeAnnotation = ({ cls, label, id }, offset) => {
                      const identifier = esc(id ? _toCurie(id) : '-');
                      return [
                        `    <annotation id="${annId++}">`,
                        `      <infon key="identifier">${identifier}</infon>`,
                        `      <infon key="type">${esc(cls)}</infon>`,
                        `      <location offset="${offset}" length="${label.length}" />`,
                        `      <text>${esc(label)}</text>`,
                        `    </annotation>`,
                      ].join('\n');
                    };

                    const abstractOffset = _title ? _title.length + 1 : 0;
                    const entityRows = _buildEntityRows().filter(r => r.label);

                    const passages = [];
                    if (_title) {
                      const titleInfons = [
                        `      <infon key="type">title</infon>`,
                        _pubmed?.journal ? `      <infon key="journal">${esc(_pubmed.journal)}</infon>` : '',
                        _pubmed?.year    ? `      <infon key="year">${esc(String(_pubmed.year))}</infon>` : '',
                        _pubmed?.authors ? `      <infon key="authors">${esc(_pubmed.authors)}</infon>` : '',
                      ].filter(Boolean).join('\n');
                      passages.push([
                        `  <passage>`,
                        titleInfons,
                        `      <offset>0</offset>`,
                        `      <text>${esc(_title)}</text>`,
                        `  </passage>`,
                      ].join('\n'));
                    }

                    const abstractAnnotations = entityRows.map(r => makeAnnotation(r, abstractOffset)).join('\n');
                    passages.push([
                      `  <passage>`,
                      `      <infon key="type">abstract</infon>`,
                      `      <offset>${abstractOffset}</offset>`,
                      `      <text>${esc(_abstract)}</text>`,
                      abstractAnnotations,
                      `  </passage>`,
                    ].join('\n'));

                    const relationsXml = _buildRelRows().map(({ cls, subj, pred, obj }) => {
                      const s = esc(`${cls}|${_toCurie(subj) || '-'}`);
                      const o = esc(`${cls}|${_toCurie(obj)  || '-'}`);
                      return [
                        `  <relation id="R${relId++}">`,
                        `    <infon key="score">1.0</infon>`,
                        `    <infon key="role1">${s}</infon>`,
                        `    <infon key="role2">${o}</infon>`,
                        `    <infon key="type">${esc(pred || cls)}</infon>`,
                        `    <node refid="0" role="0,1" />`,
                        `  </relation>`,
                      ].join('\n');
                    }).join('\n');

                    const xml = [
                      `<?xml version='1.0' encoding='UTF-8'?>`,
                      `<!DOCTYPE collection SYSTEM 'BioC.dtd'>`,
                      `<collection>`,
                      `  <source>SchemaLink</source>`,
                      `  <date></date>`,
                      `  <key>BioC.key</key>`,
                      `  <document>`,
                      `    <id>${esc(_docId)}</id>`,
                      ...passages,
                      relationsXml,
                      `  </document>`,
                      `</collection>`,
                    ].join('\n');

                    _triggerDownload(xml, `${_fname}.bioc.xml`, 'application/xml');
                  };

                  // ── Cross-highlight state ───────────────────────────────────
                  const hoveredMention = this.state.hoveredMention; // { cls, label }
                  const setHover = (cls, label) => this.setState({ hoveredMention: cls && label ? { cls, label } : null });

                  // Build a clickable URL for a grounded entity ID.
                  // Handles both CURIE format (CHEBI:15765) and OBO underscore format (CHEBI_15765).
                  // Dedicated portals for the most common biomedical ontologies;
                  // everything else falls back to OLS4.
                  const getEntityUrl = (rawId) => {
                    if (!rawId || typeof rawId !== 'string') return null;
                    const id = rawId.trim();
                    if (!id) return null;

                    // Normalize: detect separator — colon (CHEBI:15765) or underscore (CHEBI_15765)
                    let prefix = '';
                    let local  = id;
                    const colonIdx = id.indexOf(':');
                    if (colonIdx > 0) {
                      prefix = id.slice(0, colonIdx).toUpperCase();
                      local  = id.slice(colonIdx + 1);
                    } else {
                      // OBO underscore style: split on first underscore where left part is all letters
                      const m = id.match(/^([A-Za-z]+)[_](.+)$/);
                      if (m) {
                        prefix = m[1].toUpperCase();
                        local  = m[2];
                      }
                    }

                    const oboBase = 'http://purl.obolibrary.org/obo';
                    switch (prefix) {
                      case 'CHEBI':
                        return `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:${local}`;
                      case 'GO':
                        return `https://amigo.geneontology.org/amigo/term/GO:${local}`;
                      case 'MONDO':
                        return `https://monarchinitiative.org/disease/MONDO:${local}`;
                      case 'HP':
                        return `https://hpo.jax.org/app/term/HP:${local}`;
                      case 'HGNC':
                        return `https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:${local}`;
                      case 'MESH':
                      case 'MSH':
                        return `https://meshb.nlm.nih.gov/record/ui?ui=${local}`;
                      case 'DOID':
                        return `https://disease-ontology.org/term/DOID:${local}`;
                      case 'NCIT':
                        return `https://ncit.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_Thesaurus&code=${local}`;
                      case 'DRUGBANK':
                      case 'DB':
                        return `https://go.drugbank.com/drugs/${local}`;
                      case 'PR':
                        return `https://www.ebi.ac.uk/ols4/ontologies/pr/terms?iri=${encodeURIComponent(`${oboBase}/PR_${local}`)}`;
                      case 'PW':
                        return `https://www.ebi.ac.uk/ols4/ontologies/pw/terms?iri=${encodeURIComponent(`${oboBase}/PW_${local}`)}`;
                      case 'UBERON':
                        return `https://www.ebi.ac.uk/ols4/ontologies/uberon/terms?iri=${encodeURIComponent(`${oboBase}/UBERON_${local}`)}`;
                      case 'CL':
                        return `https://www.ebi.ac.uk/ols4/ontologies/cl/terms?iri=${encodeURIComponent(`${oboBase}/CL_${local}`)}`;
                      case 'RO':
                        return `https://www.ebi.ac.uk/ols4/ontologies/ro/terms?iri=${encodeURIComponent(`${oboBase}/RO_${local}`)}`;
                      case 'SO':
                        return `https://www.ebi.ac.uk/ols4/ontologies/so/terms?iri=${encodeURIComponent(`${oboBase}/SO_${local}`)}`;
                      default:
                        // Pure numeric → likely HGNC lookup-table result (no CURIE prefix)
                        if (/^\d+$/.test(id)) {
                          return `https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/HGNC:${id}`;
                        }
                        // Generic OBO ontology → OLS4 fallback
                        if (prefix) {
                          const onto = prefix.toLowerCase();
                          return `https://www.ebi.ac.uk/ols4/ontologies/${onto}/terms?iri=${encodeURIComponent(`${oboBase}/${prefix}_${local.replace(':', '_')}`)}`;
                        }
                        return null;
                    }
                  };

                  const entityTotal = entityKeys.reduce((s, k) => s + (entityClasses[k]?.schemaResponse?.mentions?.length || 0), 0);
                  const relationTotal = relationKeys.reduce((s, k) => {
                    const rKey = `${k}Relationships`;
                    const rData = responses[k] || {};
                    return s + ((rData[rKey] || rData?.schemaResponse?.mentions || []).length);
                  }, 0);

                  // Render a single entity mention card
                  const renderMention = (m, j, bgColor) => (
                    <div key={j} style={{ paddingBottom: '4px', marginBottom: '4px', borderBottom: '1px dashed #e5e7eb' }}>
                      {typeof m === 'string' ? (
                        <em>{m}</em>
                      ) : typeof m === 'object' && m !== null ? (
                        Object.entries(m).map(([k, v]) => (
                          <div key={k} style={{ fontSize: '12px' }}>
                            <code>{k}</code>: <em>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</em>
                          </div>
                        ))
                      ) : null}
                    </div>
                  );

                  return (
                    <div>
                      {/* Tab bar + export buttons */}
                      <div className="ui top attached tabular menu" style={{ marginBottom: 0, display: 'flex', alignItems: 'center' }}>
                        {[
                          { id: 'text', label: 'Text' },
                          { id: 'entities', label: `Entities (${entityTotal})` },
                          { id: 'relations', label: `Relations (${relationTotal})` },
                          { id: 'json', label: 'JSON' },
                        ].map(tab => (
                          <a key={tab.id}
                            className={`item${activeTab === tab.id ? ' active' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => this.setState({ extractActiveTab: tab.id })}>
                            {tab.label}
                          </a>
                        ))}
                        {/* Spacer */}
                        <div style={{ flex: 1 }} />
                        {/* Export dropdown */}
                        <div style={{ position: 'relative', padding: '0 8px' }}>
                          <button
                            onClick={() => this.setState(s => ({ exportDropdownOpen: !s.exportDropdownOpen }))}
                            style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 11px', fontSize:'11px', fontWeight:600, borderRadius:'6px', border:'1px solid #e2e8f0', background:'#f8fafc', color:'#334155', cursor:'pointer', outline:'none' }}
                          >
                            ⬇ Export <span style={{ fontSize:'9px', opacity:0.6 }}>▼</span>
                          </button>
                          {this.state.exportDropdownOpen && (
                            <>
                              {/* Click-away overlay */}
                              <div onClick={() => this.setState({ exportDropdownOpen: false })} style={{ position:'fixed', inset:0, zIndex:999 }} />
                              <div style={{ position:'absolute', right:8, top:'calc(100% + 4px)', zIndex:1000, background:'white', border:'1px solid #e2e8f0', borderRadius:'8px', boxShadow:'0 4px 16px rgba(0,0,0,0.12)', minWidth:'160px', overflow:'hidden' }}>
                                {[
                                  { label: 'JSON',      desc: 'SchemaLink native',  fn: downloadJSON },
                                  { label: 'CSV',       desc: 'Spreadsheet',        fn: downloadCSV },
                                  { label: 'BioC JSON', desc: 'BioC / PubTator3',   fn: downloadBiocJSON },
                                  { label: 'PubTator',  desc: 'PubTator flat text', fn: downloadPubTator },
                                  { label: 'BioC XML',  desc: 'BioC XML',           fn: downloadBiocXML },
                                ].map(({ label, desc, fn }, i, arr) => (
                                  <button
                                    key={label}
                                    onClick={() => { fn(); this.setState({ exportDropdownOpen: false }); }}
                                    style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', width:'100%', padding:'8px 14px', fontSize:'12px', fontWeight:600, color:'#0f172a', background:'none', border:'none', borderBottom: i < arr.length-1 ? '1px solid #f1f5f9' : 'none', cursor:'pointer', textAlign:'left' }}
                                    onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background='none'}
                                  >
                                    {label}
                                    <span style={{ fontSize:'10px', color:'#94a3b8', fontWeight:400 }}>{desc}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ border: '1px solid rgba(34,36,38,0.15)', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '12px', minHeight: '420px' }}>

                        {/* ── TEXT TAB ── */}
                        {activeTab === 'text' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                              {/* All-class visibility checkboxes (NE + RE) */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <strong>Show:</strong>
                                {entityKeys.map((cls, i) => (
                                  <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                                    onClick={() => toggleClass(cls)}>
                                    <Checkbox checked={!!this.state.extractVisibleClasses[cls]} onChange={() => toggleClass(cls)} />
                                    <span style={{ color: textColors[i % textColors.length] }}>{cls}</span>
                                  </label>
                                ))}
                                {relationKeys.map((cls) => (
                                  <label key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                                    onClick={() => toggleClass(cls)}>
                                    <Checkbox checked={!!this.state.extractVisibleClasses[cls]} onChange={() => toggleClass(cls)} />
                                      <span style={{ color: '#555' }}>{humanizeRelationClass(cls)}</span>
                                  </label>
                                ))}
                              </div>

                              {/* Highlighted text */}
                              <div style={{ border: '1px solid rgba(34,36,38,0.15)', borderRadius: '4px', padding: '8px', background: '#fafafa' }}>
                                <div style={{ lineHeight: 1.7, fontSize: '15px', background: 'white', padding: '8px', borderRadius: '4px', border: '1px solid rgba(34,36,38,0.1)' }}>
                                  {buildHighlightSegments().map((seg, i) =>
                                    seg.color
                                      ? <span
                                          key={i}
                                          onMouseEnter={() => setHover(seg.cls, seg.label)}
                                          onMouseLeave={() => setHover(null, null)}
                                          style={{
                                            color: seg.color, fontWeight: 700,
                                            borderRadius: '3px', padding: '0 2px', cursor: 'default',
                                            background: hoveredMention?.label?.toLowerCase() === seg.label?.toLowerCase() ? `${seg.color}22` : 'transparent',
                                            outline: hoveredMention?.label?.toLowerCase() === seg.label?.toLowerCase() ? `2px solid ${seg.color}55` : 'none',
                                            transition: 'background 0.15s',
                                          }}
                                        >{seg.text}</span>
                                      : <span key={i}>{seg.text}</span>
                                  )}
                                </div>
                              </div>

                              {/* Dependency Trace — rich grouped timeline */}
                              {(() => {
                                const meta = trace['pipeline'] || {};
                                const metaModel = meta['META']?.model || null;
                                const metaTextLen = meta['META']?.text_length || null;
                                const labelOf = (m) => typeof m === 'string' ? m : (m?.label || m?.name || JSON.stringify(m));
                                const relLabel = (r) => {
                                  if (!r || typeof r !== 'object') return String(r);
                                  const s = r.subject?.id || r.subject?.name || String(r.subject || '');
                                  const p = r.predicate?.id || String(r.predicate || '');
                                  const o = r.object?.id || r.object?.name || String(r.object || '');
                                  return [s, p, o].filter(Boolean).join(' → ');
                                };

                                // Helper: render a badge pill
                                const Badge = ({ children, color = '#e2e8f0', text = '#334155', title }) => (
                                  <span title={title} style={{ display:'inline-flex', alignItems:'center', gap:'2px', background:color, color:text, borderRadius:'999px', padding:'1px 7px', fontSize:'10px', fontWeight:600, whiteSpace:'nowrap', lineHeight:'16px' }}>
                                    {children}
                                  </span>
                                );

                                // Helper: render a class row
                                const ClassRow = ({ step, stepTitle, status, outcome, timing, removedItems, expandedItems, accentBg, accentBorder, accentText, stepKey }) => {
                                  const isExpanded = !!this.state[`traceExpand_${stepKey}`];
                                  const durationMs = timing?.duration_ms || timing?.total_ms;
                                  const promptTok = timing?.prompt_tokens;
                                  const compTok = timing?.completion_tokens;
                                  return (
                                    <div style={{ borderLeft: `3px solid ${accentBorder}`, marginBottom:'2px', background: accentBg }}>
                                      <div
                                        style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'7px 10px', cursor: expandedItems?.length > 0 ? 'pointer' : 'default' }}
                                        onClick={() => expandedItems?.length > 0 && this.setState({ [`traceExpand_${stepKey}`]: !isExpanded })}
                                      >
                                        {/* Status icon */}
                                        <span style={{ fontSize:'13px', marginTop:'1px', flexShrink:0 }}>{status}</span>

                                        {/* Step name */}
                                        <div style={{ flex:1, minWidth:0 }}>
                                          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                                            <code style={{ fontSize:'11px', color: accentText, fontWeight:700 }}>{step}</code>
                                            {stepTitle && <span style={{ fontSize:'11px', color:'#64748b' }}>{stepTitle}</span>}
                                          </div>
                                          {/* Outcome summary */}
                                          <div style={{ fontSize:'11px', color:'#475569', marginTop:'2px', lineHeight:1.4 }}>{outcome}</div>
                                          {/* Removed items */}
                                          {removedItems?.length > 0 && (
                                            <div style={{ fontSize:'11px', color:'#b91c1c', marginTop:'2px' }}>
                                              ✂️ removed: <span style={{ textDecoration:'line-through' }}>{removedItems.map(labelOf).join(', ')}</span>
                                            </div>
                                          )}
                                          {/* Expanded raw items */}
                                          {isExpanded && expandedItems?.length > 0 && (
                                            <div style={{ marginTop:'6px', display:'flex', flexWrap:'wrap', gap:'4px' }}>
                                              {expandedItems.map((m, i) => {
                                                const eId = typeof m === 'object' ? m?.id : null;
                                                const eUrl = getEntityUrl(eId);
                                                return (
                                                  <span key={i} style={{ background:'white', border:'1px solid #cbd5e1', borderRadius:'4px', padding:'2px 6px', fontSize:'10px', color:'#334155', display:'inline-flex', alignItems:'center', gap:'3px' }}>
                                                    {labelOf(m)}
                                                    {eId && (eUrl ? (
                                                      <a href={eUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="sl-entity-chip" style={{ color:'#1d4ed8', marginLeft:'3px', textDecoration:'none', fontFamily:'monospace', display:'inline-flex', alignItems:'center', gap:'2px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'4px', padding:'1px 5px' }} title="Open in ontology portal">
                                                        🔗 {eId}
                                                      </a>
                                                    ) : (
                                                      <span style={{ color:'#64748b', marginLeft:'3px' }}>{eId}</span>
                                                    ))}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>

                                        {/* Right-side badges */}
                                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'3px', flexShrink:0 }}>
                                          {durationMs != null && <Badge color='#f1f5f9' text='#475569' title='GPT call duration'>⏱ {durationMs < 1000 ? `${durationMs}ms` : `${(durationMs/1000).toFixed(1)}s`}</Badge>}
                                          {promptTok != null && <Badge color='#eff6ff' text='#1d4ed8' title='Prompt + completion tokens'>↑{promptTok} ↓{compTok}</Badge>}
                                          {expandedItems?.length > 0 && (
                                            <span style={{ fontSize:'10px', color:'#94a3b8' }}>{isExpanded ? '▲ collapse' : '▼ expand'}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                };

                                const allTracedClasses = Object.keys(trace).filter(k => k !== 'pipeline');
                                const noTrace = allTracedClasses.length === 0;

                                return (
                                  <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', background:'#f8fafc', overflow:'hidden' }}>
                                    {/* Header */}
                                    <div style={{ padding:'10px 14px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', background:'white' }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                        <strong style={{ fontSize:'13px', color:'#0f172a' }}>🔬 Dependency Trace</strong>
                                        {metaModel && <Badge color='#f0fdf4' text='#15803d'>model: {metaModel}</Badge>}
                                        {metaTextLen && <Badge color='#eff6ff' text='#1d4ed8'>{metaTextLen} chars</Badge>}
                                        <Badge color='#f5f3ff' text='#6d28d9'>{entityKeys.length} entities · {relationKeys.length} relations</Badge>
                                      </div>
                                    </div>

                                    {noTrace ? (
                                      <div style={{ padding:'16px', color:'#94a3b8', fontSize:'12px', textAlign:'center' }}>
                                        No trace data available.
                                        {logItems.length > 0 && (
                                          <details style={{ marginTop:'8px', textAlign:'left' }}>
                                            <summary style={{ cursor:'pointer', color:'#64748b' }}>Raw log ({logItems.length} lines)</summary>
                                            <pre style={{ fontSize:'10px', color:'#475569', marginTop:'6px', whiteSpace:'pre-wrap', maxHeight:'180px', overflowY:'auto' }}>
                                              {logItems.map(l => `${l.step}: ${l.outcome}`).join('\n')}
                                            </pre>
                                          </details>
                                        )}
                                      </div>
                                    ) : (
                                      <div style={{ maxHeight:'320px', overflowY:'auto', padding:'8px' }}>

                                        {/* ── ENTITY EXTRACTION section ── */}
                                        {entityKeys.length > 0 && (
                                          <div style={{ marginBottom:'10px' }}>
                                            <div style={{ fontSize:'10px', fontWeight:700, color:'#64748b', letterSpacing:'0.08em', textTransform:'uppercase', padding:'4px 6px 6px', borderBottom:'1px dashed #e2e8f0', marginBottom:'4px' }}>
                                              Entity Extraction
                                            </div>
                                            {entityKeys.map((cls, i) => {
                                              const t = trace[cls] || {};
                                              const init = t['NE_INIT'] || [];
                                              const grounded = t['NE_GROUNDED'];
                                              const groundingRemoved = t['NE_GROUNDING_REMOVED'] || [];
                                              const filtered = t['NE_FILTERED'];
                                              const filterRemoved = t['NE_FILTER_REMOVE'] || t['NE_FILTER_REMOVED'] || [];
                                              const timing = t['NE_TIMING'] || (typeof t['NE_DONE'] === 'object' && t['NE_DONE']?.total_ms != null ? t['NE_DONE'] : null);
                                              const accentColors = [
                                                { bg:'#fff1f2', border:'#fca5a5', text:'#b91c1c' },
                                                { bg:'#eff6ff', border:'#93c5fd', text:'#1d4ed8' },
                                                { bg:'#fdf4ff', border:'#d8b4fe', text:'#7e22ce' },
                                                { bg:'#fff7ed', border:'#fdba74', text:'#c2410c' },
                                                { bg:'#f0f9ff', border:'#7dd3fc', text:'#0369a1' },
                                                { bg:'#fefce8', border:'#fde047', text:'#a16207' },
                                              ];
                                              const ac = accentColors[i % accentColors.length];

                                              // GPT extraction step
                                              const gptOutcome = init.length === 0
                                                ? <span style={{ color:'#94a3b8' }}>no mentions extracted</span>
                                                : <span><strong style={{ color: ac.text }}>{init.length}</strong> mention{init.length !== 1 ? 's' : ''} extracted: <em style={{ color:'#475569' }}>{init.slice(0,4).map(labelOf).join(', ')}{init.length > 4 ? ` +${init.length-4} more` : ''}</em></span>;

                                              const isTraceHighlighted = hoveredMention?.cls?.toLowerCase() === cls?.toLowerCase();
                                              return (
                                                <div key={cls} style={{
                                                  borderRadius: '6px',
                                                  outline: isTraceHighlighted ? `2px solid ${ac.border}` : 'none',
                                                  background: isTraceHighlighted ? `${ac.bg}` : 'transparent',
                                                  boxShadow: isTraceHighlighted ? `0 0 0 3px ${ac.bg}` : 'none',
                                                  transition: 'outline 0.15s, background 0.15s, box-shadow 0.15s',
                                                  marginBottom: '2px',
                                                }}>
                                                  <ClassRow
                                                    stepKey={`ne_gpt_${cls}`}
                                                    step={`${cls} — GPT extraction`}
                                                    status={init.length > 0 ? '🔵' : '⚪'}
                                                    outcome={gptOutcome}
                                                    timing={timing}
                                                    expandedItems={init}
                                                    accentBg={ac.bg}
                                                    accentBorder={ac.border}
                                                    accentText={ac.text}
                                                  />

                                                  {/* Algorithmic rules step */}
                                                  {filtered !== undefined && (
                                                    <ClassRow
                                                      stepKey={`ne_filter_${cls}`}
                                                      step={`${cls} — rule filter`}
                                                      status={filterRemoved.length > 0 ? '✂️' : '✅'}
                                                      outcome={
                                                        filterRemoved.length > 0
                                                          ? <span><strong style={{ color: ac.text }}>{filtered.length}</strong> kept, <strong style={{ color:'#b91c1c' }}>{filterRemoved.length}</strong> removed by algorithmic rules</span>
                                                          : <span>all <strong style={{ color: ac.text }}>{filtered.length}</strong> passed rules</span>
                                                      }
                                                      removedItems={filterRemoved}
                                                      accentBg={ac.bg}
                                                      accentBorder={ac.border}
                                                      accentText={ac.text}
                                                    />
                                                  )}

                                                  {/* Grounding step */}
                                                  {grounded !== undefined && (
                                                    <ClassRow
                                                      stepKey={`ne_ground_${cls}`}
                                                      step={`${cls} — ontology grounding`}
                                                      status={grounded.length > 0 ? '✅' : '⚠️'}
                                                      outcome={
                                                        <span>
                                                          <strong style={{ color: ac.text }}>{grounded.length}</strong> grounded
                                                          {groundingRemoved.length > 0 && <span>, <strong style={{ color:'#b91c1c' }}>{groundingRemoved.length}</strong> unmatched</span>}
                                                          {grounded.length > 0 && <span>: <em style={{ color:'#475569' }}>{grounded.slice(0,3).map(g => `${labelOf(g)}${g?.id ? ` (${g.id})` : ''}`).join(', ')}{grounded.length > 3 ? ` +${grounded.length-3} more` : ''}</em></span>}
                                                        </span>
                                                      }
                                                      removedItems={groundingRemoved}
                                                      expandedItems={grounded}
                                                      accentBg={ac.bg}
                                                      accentBorder={ac.border}
                                                      accentText={ac.text}
                                                    />
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}

                                        {/* ── RELATION EXTRACTION section ── */}
                                        {relationKeys.length > 0 && (
                                          <div>
                                            <div style={{ fontSize:'10px', fontWeight:700, color:'#64748b', letterSpacing:'0.08em', textTransform:'uppercase', padding:'4px 6px 6px', borderBottom:'1px dashed #e2e8f0', marginBottom:'4px' }}>
                                              Relation Extraction
                                            </div>
                                            {relationKeys.map((cls, ri) => {
                                              const t = trace[cls] || {};
                                              const init = t['RE_INIT'] || [];
                                              const final = t['RE_FINAL'] || [];
                                              const removed = t['RE_FILTERED_REMOVED'] || [];
                                              const timing = t['RE_TIMING'] || (typeof t['RE_DONE'] === 'object' && t['RE_DONE']?.total_ms != null ? t['RE_DONE'] : null);
                                              const validating = t['RE_VALIDATING'];
                                              const reDone = typeof t['RE_DONE'] === 'object' ? t['RE_DONE'] : null;
                                              const finalItems = reDone?.items || final;
                                              // Relation classes get their own palette offset after entity classes
                                              const reAccentColors = [
                                                { bg:'#f5f3ff', border:'#c4b5fd', text:'#6d28d9' },
                                                { bg:'#fdf2f8', border:'#f0abfc', text:'#86198f' },
                                                { bg:'#fff8f1', border:'#fed7aa', text:'#9a3412' },
                                                { bg:'#f0fdfa', border:'#5eead4', text:'#0f766e' },
                                              ];
                                              const rac = reAccentColors[ri % reAccentColors.length];

                                              const isRelTraceHighlighted = hoveredMention?.cls?.toLowerCase() === cls?.toLowerCase();
                                              return (
                                                <div key={cls} style={{
                                                  borderRadius: '6px',
                                                  outline: isRelTraceHighlighted ? `2px solid ${rac.border}` : 'none',
                                                  background: isRelTraceHighlighted ? rac.bg : 'transparent',
                                                  boxShadow: isRelTraceHighlighted ? `0 0 0 3px ${rac.bg}` : 'none',
                                                  transition: 'outline 0.15s, background 0.15s, box-shadow 0.15s',
                                                  marginBottom: '2px',
                                                }}>
                                                  <ClassRow
                                                    stepKey={`re_gpt_${cls}`}
                                                      step={`${humanizeRelationClass(cls)} — GPT extraction`}
                                                    status={init.length > 0 ? '🔵' : '⚪'}
                                                    outcome={
                                                      init.length === 0
                                                        ? <span style={{ color:'#94a3b8' }}>no relations extracted</span>
                                                        : <span><strong style={{ color: rac.text }}>{init.length}</strong> relation{init.length !== 1 ? 's' : ''} extracted</span>
                                                    }
                                                    timing={timing}
                                                    expandedItems={init}
                                                    accentBg={rac.bg}
                                                    accentBorder={rac.border}
                                                    accentText={rac.text}
                                                  />

                                                  {/* Validation step */}
                                                  {validating && (
                                                    <ClassRow
                                                      stepKey={`re_val_${cls}`}
                                                        step={`${humanizeRelationClass(cls)} — entity validation`}
                                                      status={removed.length > 0 ? '✂️' : '✅'}
                                                      outcome={
                                                        <span>
                                                          checking <strong style={{ color: rac.text }}>{validating.raw ?? init.length}</strong> pairs
                                                          {validating.subject && <span> ({validating.subject} ↔ {validating.object})</span>}
                                                          {removed.length > 0 && <span>, <strong style={{ color:'#b91c1c' }}>{removed.length}</strong> removed (unmatched entities)</span>}
                                                        </span>
                                                      }
                                                      removedItems={removed.map(relLabel)}
                                                      accentBg={rac.bg}
                                                      accentBorder={rac.border}
                                                      accentText={rac.text}
                                                    />
                                                  )}

                                                  {/* Final resolved relations */}
                                                  {finalItems.length > 0 && (
                                                    <ClassRow
                                                      stepKey={`re_final_${cls}`}
                                                        step={`${humanizeRelationClass(cls)} — resolved`}
                                                      status='✅'
                                                      outcome={
                                                        <span><strong style={{ color: rac.text }}>{finalItems.length}</strong> relation{finalItems.length !== 1 ? 's' : ''}: <em style={{ color:'#475569' }}>{finalItems.slice(0,2).map(relLabel).join('; ')}{finalItems.length > 2 ? ` +${finalItems.length-2} more` : ''}</em></span>
                                                      }
                                                      expandedItems={finalItems}
                                                      accentBg={rac.bg}
                                                      accentBorder={rac.border}
                                                      accentText={rac.text}
                                                    />
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Right: structured output — rich cards */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                              <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <strong style={{ fontSize: '13px', color: '#0f172a' }}>📦 Structured Output</strong>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  {entityKeys.reduce((s, k) => s + (entityClasses[k]?.schemaResponse?.mentions?.length || 0), 0)} entities · {relationKeys.reduce((s, k) => { const rk = `${k}Relationships`; return s + ((responses[k]?.[rk] || responses[k]?.schemaResponse?.mentions || []).length); }, 0)} relations
                                </span>
                              </div>
                              <div style={{ overflowY: 'auto', maxHeight: '460px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {/* Entity cards */}
                                {entityKeys.filter(cls => this.state.extractVisibleClasses[cls]).map((cls, i) => {
                                  const mentions = entityClasses[cls]?.schemaResponse?.mentions || [];
                                  if (mentions.length === 0) return null;
                                  const accentColor = textColors[i % textColors.length];
                                  const bgColor = classColors[i % classColors.length];
                                    return mentions.map((m, j) => {
                                    const label = typeof m === 'string' ? m : (m?.label || m?.name || '');
                                    const id = typeof m === 'object' ? m?.id : null;
                                    const ids = typeof m === 'object' ? m?.ids : null;
                                    const extra = typeof m === 'object' ? Object.entries(m).filter(([k]) => !['id','ids','label','name'].includes(k)) : [];
                                    const isCardHovered = hoveredMention?.label?.toLowerCase() === label?.toLowerCase();
                                    return (
                                      <div
                                        key={`${cls}-${j}`}
                                        onMouseEnter={() => setHover(cls, label)}
                                        onMouseLeave={() => setHover(null, null)}
                                        style={{ background: bgColor, border: `1px solid ${accentColor}33`, borderLeft: `4px solid ${accentColor}`, borderRadius: '8px', padding: '10px 12px', outline: isCardHovered ? `2px solid ${accentColor}88` : 'none', boxShadow: isCardHovered ? `0 0 0 3px ${accentColor}22` : 'none', transition: 'box-shadow 0.15s' }}
                                      >
                                        {/* Class type badge + label */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                                          <div>
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cls}</span>
                                            {label && <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginTop: '2px', lineHeight: 1.3 }}>{label}</div>}
                                          </div>
                                          {id && (() => {
                                            const idUrl = getEntityUrl(id);
                                            return idUrl ? (
                                              <a href={idUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="sl-entity-link" style={{ flexShrink: 0, background: accentColor, color: 'white', borderRadius: '999px', padding: '2px 8px', fontSize: '10px', fontWeight: 600, fontFamily: 'monospace', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                title="Open in ontology portal">
                                                🔗 {id}
                                              </a>
                                            ) : (
                                              <span style={{ flexShrink: 0, background: accentColor, color: 'white', borderRadius: '999px', padding: '2px 8px', fontSize: '10px', fontWeight: 600, fontFamily: 'monospace' }}>{id}</span>
                                            );
                                          })()}
                                        </div>
                                        {/* IDs chips */}
                                        {ids && Array.isArray(ids) && ids.length > 0 && (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: extra.length > 0 ? '6px' : 0 }}>
                                            {ids.map((oid, k) => {
                                              const oidUrl = getEntityUrl(oid);
                                              return oidUrl ? (
                                                <a key={k} href={oidUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="sl-entity-chip" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontFamily: 'monospace', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                                  title="Open in ontology portal">
                                                  🔗 {oid}
                                                </a>
                                              ) : (
                                                <span key={k} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '1px 6px', fontSize: '10px', fontFamily: 'monospace' }}>{oid}</span>
                                              );
                                            })}
                                          </div>
                                        )}
                                        {/* Extra attributes */}
                                        {extra.map(([k, v]) => (
                                          <div key={k} style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                            <span style={{ fontWeight: 600 }}>{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  });
                                })}

                                {/* Relation cards */}
                                {relationKeys.filter(cls => this.state.extractVisibleClasses[cls]).map((cls, ri) => {
                                  const rKey = `${cls}Relationships`;
                                  const rData = responses[cls] || {};
                                  const mentions = rData[rKey] || rData?.schemaResponse?.mentions || [];
                                  if (!mentions || mentions.length === 0) return null;
                                  const reCardColors = [
                                    { bg:'#f5f3ff', border:'#6d28d9' },
                                    { bg:'#fdf2f8', border:'#86198f' },
                                    { bg:'#fff8f1', border:'#9a3412' },
                                    { bg:'#f0fdfa', border:'#0f766e' },
                                  ];
                                  const rcc = reCardColors[ri % reCardColors.length];
                                  return mentions.filter(Boolean).map((m, j) => {
                                    const subj = typeof m.subject === 'object' ? (m.subject?.id || m.subject?.name || JSON.stringify(m.subject)) : String(m.subject ?? '');
                                    const pred = typeof m.predicate === 'object' ? (m.predicate?.id || JSON.stringify(m.predicate)) : String(m.predicate ?? '');
                                    const obj  = typeof m.object === 'object' ? (m.object?.id || m.object?.name || JSON.stringify(m.object)) : String(m.object ?? '');
                                    const extra = Object.entries(m).filter(([k]) => !['subject','predicate','object'].includes(k));
                                    return (
                                      <div key={`${cls}-${j}`} style={{ background: rcc.bg, border: `1px solid ${rcc.border}33`, borderLeft: `4px solid ${rcc.border}`, borderRadius: '8px', padding: '10px 12px' }}>
                                          <span style={{ fontSize: '11px', fontWeight: 700, color: rcc.border }}>{humanizeRelationClass(cls)}</span>
                                        {/* Arrow display */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                          <span style={{ background: `${rcc.border}18`, color: rcc.border, borderRadius: '6px', padding: '3px 8px', fontSize: '12px', fontWeight: 600, fontFamily: 'monospace' }}>{subj}</span>
                                          {pred && <span style={{ fontSize: '11px', color: rcc.border, fontStyle: 'italic' }}>—[{pred}]→</span>}
                                          <span style={{ background: `${rcc.border}18`, color: rcc.border, borderRadius: '6px', padding: '3px 8px', fontSize: '12px', fontWeight: 600, fontFamily: 'monospace' }}>{obj}</span>
                                        </div>
                                        {extra.map(([k, v]) => (
                                          <div key={k} style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                                            <span style={{ fontWeight: 600 }}>{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  });
                                })}

                                {/* Empty state */}
                                {entityKeys.filter(cls => this.state.extractVisibleClasses[cls]).every(cls => (entityClasses[cls]?.schemaResponse?.mentions || []).length === 0) &&
                                 relationKeys.filter(cls => this.state.extractVisibleClasses[cls]).every(cls => { const rk = `${cls}Relationships`; return ((responses[cls]?.[rk] || responses[cls]?.schemaResponse?.mentions || []).length === 0); }) && (
                                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '24px' }}>No results to display. Try toggling class filters above.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── ENTITIES TAB ── */}
                        {activeTab === 'entities' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {entityKeys.length === 0 && <div style={{ color: '#888' }}>No entities extracted.</div>}
                            {entityKeys.map((cls, i) => {
                              const mentions = entityClasses[cls]?.schemaResponse?.mentions || [];
                              return (
                                <div key={cls}>
                                  <div style={{ fontWeight: 700, color: textColors[i % textColors.length], marginBottom: '8px', fontSize: '14px' }}>
                                    {cls} <span style={{ fontWeight: 400, color: '#888', fontSize: '12px' }}>({mentions.length} mention{mentions.length !== 1 ? 's' : ''})</span>
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {mentions.length === 0
                                      ? <div style={{ color: '#888', fontSize: '13px' }}>No mentions extracted.</div>
                                      : mentions.map((m, j) => (
                                        <div key={j} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 12px', background: classColors[i % classColors.length], minWidth: '120px', maxWidth: '220px' }}>
                                          {renderMention(m, 0, classColors[i % classColors.length])}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ── RELATIONS TAB ── */}
                          {activeTab === 'relations' && (() => {
                            const selectedKG = this.state.extractSelectedKG;

                            const sendToBioViber = async () => {
                              const triples = _buildRelRows().map(({ cls, subj, pred, obj }) => ({
                                class: cls, subject: subj, predicate: pred, object: obj,
                              }));
                              const apiUrl = new URL('https://bio-viber.biodata.di.unimi.it/api/schemalink');
                              apiUrl.searchParams.set('json', JSON.stringify(triples));
                              apiUrl.searchParams.set('kg', selectedKG);

                              this.setState({ bioViberSending: true, bioViberError: null });
                              try {
                                const res = await fetch(apiUrl.toString());
                                if (!res.ok) throw new Error(`Bio-Viber returned ${res.status}`);
                                window.open('https://bio-viber.biodata.di.unimi.it/homePage', '_blank', 'noopener,noreferrer');
                                this.setState({ bioViberSending: false });
                              } catch (e) {
                                this.setState({ bioViberSending: false, bioViberError: e.message });
                              }
                            };

                            // For each extracted relation class, humanize it to "Subject - predicate -
                            // Object" and check which KGs' schemas contain that pattern (case-insensitive,
                            // since e.g. the app's "MiRNA" class vs a KG's "miRNA" spelling shouldn't
                            // count as a mismatch).
                            const relationHumanized = relationKeys.map(cls => ({ cls, humanized: humanizeRelationClass(cls) }));
                            const kgCompliance = KG_OPTIONS.map(kg => ({
                              kg,
                              compliant: relationHumanized.filter(r => KG_RELATION_SETS[kg].has(normalizeForCompliance(r.humanized))),
                              total: relationHumanized.length,
                            }));

                            return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {relationKeys.length === 0 && <div style={{ color: '#888' }}>No relations extracted.</div>}
                            {relationKeys.map((cls, ri) => {
                              const rKey = `${cls}Relationships`;
                              const rData = responses[cls] || {};
                              const mentions = (rData[rKey] || rData?.schemaResponse?.mentions || []).filter(Boolean);
                              const reTabColors = [
                                { bg:'#f5f3ff', border:'#6d28d9', text:'#6d28d9' },
                                { bg:'#fdf2f8', border:'#86198f', text:'#86198f' },
                                { bg:'#fff8f1', border:'#9a3412', text:'#9a3412' },
                                { bg:'#f0fdfa', border:'#0f766e', text:'#0f766e' },
                              ];
                              const rcc = reTabColors[ri % reTabColors.length];
                              return (
                                <div key={cls}>
                                  <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px', color: rcc.text }}>
                                        {humanizeRelationClass(cls)} <span style={{ fontWeight: 400, color: '#888', fontSize: '12px' }}>({mentions.length} mention{mentions.length !== 1 ? 's' : ''})</span>
                                  </div>
                                  {mentions.length === 0
                                    ? <div style={{ color: '#888', fontSize: '13px' }}>No relations extracted.</div>
                                    : mentions.map((m, j) => (
                                      <div key={j} style={{ border: `1px solid ${rcc.border}33`, borderLeft: `4px solid ${rcc.border}`, borderRadius: '6px', padding: '8px 12px', background: rcc.bg, marginBottom: '8px', fontSize: '13px' }}>
                                        {typeof m === 'object' ? <>
                                          {m.subject != null && <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', marginBottom:'4px' }}>
                                            <span style={{ background:`${rcc.border}18`, color:rcc.border, borderRadius:'6px', padding:'2px 8px', fontSize:'12px', fontWeight:600, fontFamily:'monospace' }}>{typeof m.subject === 'object' ? (m.subject.id || JSON.stringify(m.subject)) : String(m.subject)}</span>
                                            {m.predicate != null && <span style={{ fontSize:'11px', color:rcc.border, fontStyle:'italic' }}>—[{typeof m.predicate === 'object' ? (m.predicate.id || JSON.stringify(m.predicate)) : String(m.predicate)}]→</span>}
                                            {m.object != null && <span style={{ background:`${rcc.border}18`, color:rcc.border, borderRadius:'6px', padding:'2px 8px', fontSize:'12px', fontWeight:600, fontFamily:'monospace' }}>{typeof m.object === 'object' ? (m.object.id || JSON.stringify(m.object)) : String(m.object)}</span>}
                                          </div>}
                                          {Object.entries(m).filter(([k]) => !['subject', 'predicate', 'object'].includes(k)).map(([k, v]) => (
                                            <div key={k} style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}><span style={{fontWeight:600}}>{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</div>
                                          ))}
                                        </> : <em>{String(m)}</em>}
                                      </div>
                                    ))}
                                </div>
                              );
                            })}

                                {/* ── Bio-Viber: KG compliance + send ── */}
                                <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                                    Please choose your Knowledge Graph:
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                                    Compliance is checked against the relation types extracted above.
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                    {kgCompliance.map(({ kg, compliant, total }) => {
                                      const isSelected = selectedKG === kg;
                                      return (
                                        <div key={kg} style={{
                                          border: `1px solid ${isSelected ? '#1d4ed8' : '#e2e8f0'}`,
                                          borderRadius: '8px', padding: '10px 12px',
                                          background: isSelected ? '#eff6ff' : 'white',
                                        }}>
                                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <Radio
                                              name="bioViberKG"
                                              value={kg}
                                              checked={isSelected}
                                              onChange={() => this.setState({ extractSelectedKG: kg })}
                                            />
                                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{kg}</span>
                                            <span style={{
                                              marginLeft: 'auto', fontSize: '11px', fontWeight: 700,
                                              padding: '2px 8px', borderRadius: '999px',
                                              background: compliant.length > 0 ? '#dcfce7' : '#fee2e2',
                                              color: compliant.length > 0 ? '#15803d' : '#b91c1c',
                                            }}>
                                              {compliant.length}/{total} compliant
                                            </span>
                                          </label>
                                          {total > 0 && (
                                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '26px' }}>
                                              {relationHumanized.map(({ cls, humanized }) => {
                                                const ok = compliant.some(c => c.cls === cls);
                                                return (
                                                  <div key={cls} style={{ fontSize: '11px', color: ok ? '#15803d' : '#94a3b8' }}>
                                                    {ok ? '✅' : '—'} {humanized}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div style={{ marginTop: '16px' }}>
                                    <Button
                                      primary
                                      disabled={!selectedKG}
                                      loading={this.state.bioViberSending}
                                      onClick={sendToBioViber}
                                      content="Send to Bio-Viber"
                                    />
                                  </div>
                                  {this.state.bioViberError && (
                                    <div style={{ marginTop: '8px', color: '#b91c1c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '4px', padding: '8px 12px', fontSize: '13px', maxWidth: '480px' }}>
                                      {this.state.bioViberError}
                          </div>
                        )}
                                </div>
                              </div>
                            );
                          })()}

                        {/* ── JSON TAB ── */}
                        {activeTab === 'json' && (
                          <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', fontSize: '11px', overflowY: 'auto', maxHeight: '500px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                            {JSON.stringify(responses, null, 2)}
                          </pre>
                        )}

                      </div>
                    </div>
                  );
                })()}

                {/* ── Streaming progress view ── */}
                {this.state.extractView === 'streaming' && (() => {
                  const { streamProgress, streamCurrentClass, streamLog } = this.state;
                  const graph = this.props.graph;
                  const nodes = graph?.nodes || [];
                  const rels  = graph?.relationships || [];

                  // Normalize: lowercase alphanumeric only
                  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

                  // Type-aware fuzzy match: nodes only match 'entity', edges only match 'relation'
                  const findProgress = (name, type) => {
                    const n = norm(name);
                    return streamProgress.find(p => {
                      if (p.type !== type) return false;
                      const c = norm(p.className);
                      return c === n || c.includes(n) || n.includes(c);
                    });
                  };
                  const statusOf = (name, type) => findProgress(name, type)?.status || 'pending';

                  // ── Layout ──────────────────────────────────────────────
                  const W = 520, H = 200, PAD = 44;
                  const validNodes = nodes.filter(n => n.caption && n.position);
                  const xs = validNodes.map(n => n.position.x);
                  const ys = validNodes.map(n => n.position.y);
                  const minX = Math.min(...xs), maxX = Math.max(...xs);
                  const minY = Math.min(...ys), maxY = Math.max(...ys);
                  const DEFAULT_R = 50;
                  const rangeX = Math.max(maxX - minX, DEFAULT_R * 5);
                  const rangeY = Math.max(maxY - minY, DEFAULT_R * 5);
                  const scale  = Math.min((W - PAD * 2) / rangeX, (H - PAD * 2) / rangeY);
                  const R      = Math.max(16, Math.min(22, DEFAULT_R * scale));
                  const px = x => PAD + (x - minX) * scale + (W - PAD*2 - rangeX*scale) / 2;
                  const py = y => PAD + (y - minY) * scale + (H - PAD*2 - rangeY*scale) / 2;
                  const nodeById = Object.fromEntries(validNodes.map(n => [n.id, n]));

                  const edgePts = (from, to) => {
                    if (from.id === to.id) return null;
                    const fx = px(from.position.x), fy = py(from.position.y);
                    const tx = px(to.position.x),   ty = py(to.position.y);
                    const d  = Math.sqrt((tx-fx)**2+(ty-fy)**2) || 1;
                    const ux = (tx-fx)/d, uy = (ty-fy)/d;
                    return { x1:fx+ux*R, y1:fy+uy*R, x2:tx-ux*R, y2:ty-uy*R, mx:(fx+tx)/2, my:(fy+ty)/2 };
                  };

                  const doneCount = streamProgress.filter(p => p.status === 'done').length;
                  const total     = streamProgress.length;
                  const pct       = total > 0 ? Math.round(doneCount / total * 100) : 0;
                  const isFinished = doneCount === total && total > 0;

                  const curProgEntry = streamCurrentClass
                    ? streamProgress.find(p => p.className === streamCurrentClass) : null;
                  const curType = curProgEntry?.type || 'entity';
                  const statusLabel = (() => {
                    if (!streamCurrentClass) return isFinished ? 'All done ✓' : 'Waiting for engine…';
                    const st = statusOf(streamCurrentClass, curType);
                    if (st === 'extracting') return curType === 'relation'
                      ? `Extracting relation ${streamCurrentClass}…`
                      : `Extracting ${streamCurrentClass}…`;
                    return `Processing ${streamCurrentClass}…`;
                  })();

                  return (
                    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                      <style>{`
                        @keyframes sl-spin      { to { transform: rotate(360deg); } }
                        @keyframes sl-glow      { 0%,100%{filter:drop-shadow(0 0 3px #60a5fa)} 50%{filter:drop-shadow(0 0 9px #3b82f6)} }
                        @keyframes sl-edge-glow { 0%,100%{opacity:.7} 50%{opacity:1} }
                        @keyframes sl-log-in    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
                        @keyframes sl-pulse     { 0%,100%{opacity:.55} 50%{opacity:1} }

                        /* Clickable entity ID badges */
                        .sl-entity-link {
                          cursor: pointer;
                          transition: filter 0.15s, transform 0.1s, box-shadow 0.15s;
                          position: relative;
                        }
                        .sl-entity-link:hover {
                          filter: brightness(0.88);
                          transform: translateY(-1px);
                          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
                          text-decoration: underline;
                          text-underline-offset: 2px;
                        }
                        .sl-entity-link:active {
                          transform: translateY(0px);
                          filter: brightness(0.78);
                        }
                        /* Chip-style IDs (blue bordered) */
                        .sl-entity-chip {
                          cursor: pointer;
                          transition: background 0.15s, border-color 0.15s, transform 0.1s;
                        }
                        .sl-entity-chip:hover {
                          background: #dbeafe !important;
                          border-color: #3b82f6 !important;
                          transform: translateY(-1px);
                          text-decoration: underline;
                          text-underline-offset: 2px;
                        }
                        .sl-entity-chip:active { transform: translateY(0); }
                      `}</style>

                      {/* ── Two-column layout ── */}
                      <div style={{ display:'flex', gap:'14px', alignItems:'stretch' }}>

                      {/* ── LEFT: Graph + status bar ── */}
                      <div style={{ flex:'1 1 0', minWidth:0, display:'flex', flexDirection:'column', gap:'8px' }}>

                      {/* Graph SVG */}
                      <div style={{
                        border: '1px solid #e5e7eb', borderRadius: '10px',
                        background: '#fafafa', flex:1,
                        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)'
                      }}>
                        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
                          <defs>
                            <marker id="sl-arr-grey" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
                              <path d="M0,0 L0,6 L7,3 z" fill="#d1d5db"/>
                            </marker>
                            <marker id="sl-arr-blue" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
                              <path d="M0,0 L0,6 L7,3 z" fill="#3b82f6"/>
                            </marker>
                            <marker id="sl-arr-green" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto">
                              <path d="M0,0 L0,6 L7,3 z" fill="#22c55e"/>
                            </marker>
                            <marker id="sl-arr-inh" markerWidth="10" markerHeight="10" refX="1" refY="5" orient="auto">
                              <path d="M0,0 L10,5 L0,10 z" fill="none" stroke="#d1d5db" strokeWidth="1.2"/>
                            </marker>
                          </defs>

                          {/* ── Edges ── */}
                          {rels.map((rel, i) => {
                            const from = nodeById[rel.fromId], to = nodeById[rel.toId];
                            if (!from || !to) return null;
                            const pts = edgePts(from, to);
                            if (!pts) return null;
                            const { x1,y1,x2,y2,mx,my } = pts;
                            const isInherit = rel.relationshipType === 'INHERITANCE';
                            if (isInherit) {
                              return (
                                <g key={i}>
                                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke="#d1d5db" strokeWidth={1.2} strokeDasharray="5,3"
                                    markerEnd="url(#sl-arr-inh)" />
                                </g>
                              );
                            }
                            const st = statusOf(rel.type, 'relation');
                            const isDone       = st === 'done';
                            const isExtracting = st === 'extracting';
                            const edgeColor = isDone ? '#22c55e' : isExtracting ? '#3b82f6' : '#d1d5db';
                            const markerId  = isDone ? 'url(#sl-arr-green)' : isExtracting ? 'url(#sl-arr-blue)' : 'url(#sl-arr-grey)';
                            const fs = Math.max(6, R * 0.3);
                            return (
                              <g key={i} style={isExtracting ? { animation:'sl-edge-glow 1.2s ease-in-out infinite' } : undefined}>
                                {/* glow shadow line for extracting */}
                                {isExtracting && (
                                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke="#93c5fd" strokeWidth={6} strokeLinecap="round"
                                    style={{ opacity:.4, filter:'blur(3px)' }} />
                                )}
                                <line x1={x1} y1={y1} x2={x2} y2={y2}
                                  stroke={edgeColor}
                                  strokeWidth={isDone || isExtracting ? 2.2 : 1.2}
                                  markerEnd={markerId}
                                  style={{ transition:'stroke .35s, stroke-width .25s' }}
                                />
                                {/* edge type label */}
                                {rel.type && (
                                  <text x={mx} y={my - 5} textAnchor="middle"
                                    fontSize={fs}
                                    fill={isDone ? '#16a34a' : isExtracting ? '#1d4ed8' : '#9ca3af'}
                                    fontWeight={isDone || isExtracting ? 600 : 400}
                                    style={{ pointerEvents:'none', transition:'fill .35s' }}>
                                    {rel.type}
                                  </text>
                                )}
                                {/* "Extracting" tag on active edge */}
                                {isExtracting && (
                                  <text x={mx} y={my + 8} textAnchor="middle"
                                    fontSize={Math.max(5, fs * 0.85)}
                                    fill="#3b82f6" fontStyle="italic"
                                    style={{ pointerEvents:'none' }}>
                                    Extracting…
                                  </text>
                                )}
                              </g>
                            );
                          })}

                          {/* ── Nodes ── */}
                          {validNodes.map((node, i) => {
                            const st         = statusOf(node.caption, 'entity');
                            const isDone       = st === 'done';
                            const isExtracting = st === 'extracting';
                            const isPending    = st === 'pending';
                            // Pulse all pending nodes when no extraction has started yet
                            const allPending   = streamProgress.every(p => p.status === 'pending');
                            const nx = px(node.position.x), ny = py(node.position.y);
                            const fs = Math.max(7, Math.min(11, R * 0.42));

                            // Colors: 3 states only
                            const fill   = isDone ? '#f0fdf4' : isExtracting ? '#eff6ff' : '#f9fafb';
                            const stroke = isDone ? '#22c55e' : isExtracting ? '#3b82f6' : '#d1d5db';
                            const tFill  = isDone ? '#15803d' : isExtracting ? '#1d4ed8' : '#9ca3af';

                            return (
                              <g key={i}
                                style={
                                  isExtracting ? { animation:'sl-glow 1.4s ease-in-out infinite' }
                                  : (isPending && allPending) ? { animation:`sl-pulse 1.8s ease-in-out infinite`, animationDelay:`${i * 0.18}s` }
                                  : undefined
                                }>
                                {/* Spinning outer ring when extracting */}
                                {isExtracting && (
                                  <circle cx={nx} cy={ny} r={R + 5}
                                    fill="none" stroke="#93c5fd" strokeWidth="2"
                                    strokeDasharray={`${(R+5)*2*Math.PI*0.65} ${(R+5)*2*Math.PI*0.35}`}
                                    style={{ animation:'sl-spin .9s linear infinite', transformOrigin:`${nx}px ${ny}px` }}
                                  />
                                )}
                                {/* Main circle */}
                                <circle cx={nx} cy={ny} r={R}
                                  fill={fill} stroke={stroke}
                                  strokeWidth={isDone || isExtracting ? 2.5 : 1.5}
                                  strokeDasharray={node.abstract ? '4,2.5' : undefined}
                                  style={{ transition:'fill .35s, stroke .35s' }}
                                />
                                {/* Class name */}
                                <text x={nx} y={ny + (isExtracting ? -fs * 0.6 : fs * 0.38)}
                                  textAnchor="middle" fontSize={fs}
                                  fontWeight={isDone || isExtracting ? 700 : 500}
                                  fill={tFill}
                                  style={{ pointerEvents:'none', transition:'fill .35s' }}>
                                  {node.caption}
                                </text>
                                {/* "Extracting" sub-tag */}
                                {isExtracting && (
                                  <text x={nx} y={ny + fs * 0.85} textAnchor="middle"
                                    fontSize={Math.max(5.5, fs * 0.72)}
                                    fill="#3b82f6" fontWeight={600}
                                    style={{ pointerEvents:'none' }}>
                                    Extracting
                                  </text>
                                )}
                                {/* Checkmark when done */}
                                {isDone && (
                                  <text x={nx + R - 4} y={ny - R + 8}
                                    textAnchor="middle" fontSize={fs * 0.9} fill="#16a34a">✓</text>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* ── Status bar ── */}
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ flexShrink:0, width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {streamCurrentClass && statusOf(streamCurrentClass, curType) === 'extracting' ? (
                                  <span style={{
                                    display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
                              border:'2.5px solid #3b82f6', borderTopColor:'transparent',
                                    animation: 'sl-spin .7s linear infinite'
                                  }} />
                          ) : isFinished ? (
                            <span style={{ color:'#16a34a', fontSize:14, fontWeight:800 }}>✓</span>
                          ) : (
                                  <span style={{
                                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                    background: '#9ca3af', animation: 'sl-pulse 1.2s ease-in-out infinite'
                                  }} />
                          )}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:3 }}>
                                  <span style={{
                                    fontSize: 12, fontWeight: 600,
                                    color: streamCurrentClass ? '#1d4ed8' : isFinished ? '#15803d' : '#6b7280'
                                  }}>
                              {statusLabel}
                            </span>
                            <span style={{ fontSize:11, color:'#9ca3af' }}>{doneCount}/{total}</span>
                          </div>
                          <div style={{ height:4, borderRadius:4, background:'#e5e7eb', overflow:'hidden' }}>
                                  <div style={{
                                    height: '100%', borderRadius: 4,
                              background:'linear-gradient(90deg,#4ade80,#22c55e)',
                                    width: `${pct}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)'
                                  }} />
                          </div>
                        </div>
                      </div>

                      </div>{/* end left column */}

                      {/* ── RIGHT: Activity log (resizable) ── */}
                      <div style={{
                        width: `${this.state.streamLogWidth}px`, flexShrink: 0,
                        display: 'flex', flexDirection: 'row',
                        position: 'relative',
                      }}>
                      {/* Drag handle */}
                      <div
                        title="Drag to resize"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startWidth = this.state.streamLogWidth;
                          const onMove = (ev) => {
                            const delta = startX - ev.clientX;
                            this.setState({ streamLogWidth: Math.max(140, Math.min(480, startWidth + delta)) });
                          };
                          const onUp = () => {
                            document.removeEventListener('mousemove', onMove);
                            document.removeEventListener('mouseup', onUp);
                            document.body.style.cursor = '';
                            document.body.style.userSelect = '';
                          };
                          document.body.style.cursor = 'col-resize';
                          document.body.style.userSelect = 'none';
                          document.addEventListener('mousemove', onMove);
                          document.addEventListener('mouseup', onUp);
                        }}
                        style={{
                          width: '6px', flexShrink: 0, cursor: 'col-resize',
                          background: 'transparent',
                          borderLeft: '2px dashed #e2e8f0',
                          transition: 'border-color .15s',
                          marginRight: '2px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#94a3b8'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                      />
                      {/* Panel */}
                      <div style={{
                        flex: 1, minWidth: 0,
                        display: 'flex', flexDirection: 'column',
                        border: '1px solid #e2e8f0', borderRadius: '10px',
                        background: '#f8fafc', overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                      }}>
                        {/* Log header */}
                        <div style={{
                          padding: '8px 12px 6px',
                          borderBottom: '1px solid #e2e8f0',
                          fontSize: '11px', fontWeight: 700,
                          color: '#64748b', letterSpacing: '.04em',
                          textTransform: 'uppercase', background: '#f1f5f9',
                        }}>
                          Activity
                        </div>
                        {/* Log entries */}
                        <div style={{
                          flex: 1, overflowY: 'auto',
                          padding: '6px 0',
                          maxHeight: '230px',
                        }}>
                          {streamLog.length === 0 ? (
                            <div style={{ padding:'8px 12px', color:'#94a3b8', fontSize:'12px', fontStyle:'italic' }}>
                              Waiting for engine…
                            </div>
                          ) : (
                            streamLog.map(entry => {
                              const isSub = entry.text.startsWith('  ');
                              const isDone = entry.icon === '✅';
                              const isStart = entry.icon === '🔵';
                              return (
                                <div key={entry.id} style={{
                                  padding: isSub ? '2px 12px 2px 22px' : '4px 12px',
                                  fontSize: isSub ? '11px' : '12px',
                                  color: isDone ? '#15803d' : isStart ? '#1d4ed8' : '#475569',
                                  background: isDone ? '#f0fdf4' : isStart ? '#eff6ff' : 'transparent',
                                  borderLeft: isStart ? '3px solid #3b82f6'
                                    : isDone ? '3px solid #22c55e' : '3px solid transparent',
                                  animation: 'sl-log-in .2s ease',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                  fontFamily: isSub ? 'monospace' : 'inherit',
                                }}>
                                  {entry.icon} {entry.text.trim()}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>{/* end panel */}
                      </div>{/* end resizable wrapper */}

                      </div>{/* end two-column wrapper */}
                    </div>
                  );
                })()}
              </Modal.Content>
              <Modal.Actions style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                {/* Left side — model selector (input view) or Back button (result view) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {this.state.extractView === 'result' && (
                    <Button
                      icon="arrow left"
                      content="Back"
                        onClick={() => this.setState({ extractView: 'input', extractResult: null, extractError: null, extractActiveTab: 'text', pubmedResults: [], pubmedQuery: '', pubmedError: null, extractSelectedKG: null })}
                      basic
                    />
                  )}
                  {this.state.extractView === 'input' && (() => {
                    const sel = this.state.extractModel;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Model:</span>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center',
                          background: '#f1f5f9', borderRadius: '8px', padding: '3px',
                          gap: '2px',
                        }}>
                          {[
                            { id: 'gpt-4o-mini', label: 'GPT-4o mini', tip: 'Faster and half the cost of GPT-4o — recommended for most extractions' },
                            { id: 'gpt-4o',      label: 'GPT-4o',      tip: null },
                          ].map(m => {
                            const active = sel === m.id;
                            return (
                              <button
                                key={m.id}
                                onClick={() => this.setState({ extractModel: m.id })}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                                  padding: '5px 13px', borderRadius: '6px', border: 'none',
                                  cursor: 'pointer', outline: 'none', fontSize: '13px',
                                  fontWeight: active ? 600 : 400,
                                  background: active ? 'white' : 'transparent',
                                  color: active ? '#0f172a' : '#64748b',
                                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {m.label}
                                {m.tip && (
                                  <span
                                    title={m.tip}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      width: '13px', height: '13px', borderRadius: '50%',
                                      fontSize: '9px', fontWeight: 700, lineHeight: 1,
                                      background: active ? '#e2e8f0' : '#cbd5e1',
                                      color: '#475569', cursor: 'default', flexShrink: 0,
                                    }}
                                  >i</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right side — primary action + close */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {this.state.extractView === 'input' && (
                    <Button
                      primary
                      loading={this.state.extractLoading}
                      disabled={this.state.extractLoading}
                      onClick={this.runExtraction}
                      icon="play"
                      content="Run Extraction"
                    />
                  )}
                    <Button onClick={() => this.setState({ extractOpen: false, extractView: 'input', extractResult: null, extractError: null, pubmedResults: [], pubmedQuery: '', pubmedError: null, extractModel: 'gpt-4o-mini', streamProgress: [], streamCurrentClass: null, streamLog: [], extractSelectedKG: null })} basic>
                    Close
                  </Button>
                </div>
              </Modal.Actions>
            </Modal>
          </Menu.Item>
          <Menu.Item
            title="Open/Close Inspector"
            onClick={this.props.showInspector}
          >
            <Icon name="sidebar" />
          </Menu.Item>
        </Menu.Menu>
      </Menu>

      {/* Login-required prompt */}
      {this.state.loginPromptOpen && (
        <div
          onClick={() => this.setState({ loginPromptOpen: false })}
          style={{
            position: 'fixed', inset: 0, zIndex: 20000,
            background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '14px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.20)',
              width: '360px', padding: '32px 28px', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔐</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Login required
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              You must be logged in to use this feature.<br />
              Create a free account to get started.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => { this.setState({ loginPromptOpen: false }); this.props.onAuthClick(); }}
                style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Log in / Register
              </button>
              <button
                onClick={() => this.setState({ loginPromptOpen: false })}
                style={{ padding: '9px 22px', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', color: '#475569', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }
}

export default Header;

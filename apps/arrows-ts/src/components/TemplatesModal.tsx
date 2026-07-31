import React, { useState } from 'react';
import { connect } from 'react-redux';
import { SCHEMA_TEMPLATES } from '../data/schemaTemplates';
import { nodeSeparation, tryImport } from '../actions/import';
import { clearGraph } from '../actions/storage';
import { getOntologies } from '../selectors';
import { ArrowsState } from '../reducers';
import { Dispatch } from 'redux';
import { Ontology } from '@neo4j-arrows/model';

interface TemplatesModalProps {
  open: boolean;
  onClose: () => void;
  separation: number;
  ontologies: Ontology[];
  clearGraph: () => void;
  tryImport: (text: string, separation: number, ontologies: Ontology[], format?: string) => Promise<{ errorMessage?: string }>;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({
  open, onClose, separation, ontologies, clearGraph, tryImport,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleLoad = async (tpl: typeof SCHEMA_TEMPLATES[0]) => {
    setLoading(tpl.name);
    setError(null);
    clearGraph();
    // Small delay to let the graph clear before importing
    await new Promise(r => setTimeout(r, 80));
    const result = await tryImport(tpl.yaml, separation, ontologies, 'LinkML RDF');
    setLoading(null);
    if (result?.errorMessage) {
      setError(result.errorMessage);
    } else {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(15,23,42,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '14px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.20)',
          width: '480px', maxWidth: '95vw',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Schema Templates</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Click a template to load it onto the canvas</div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Templates list */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SCHEMA_TEMPLATES.map(tpl => (
            <button
              key={tpl.name}
              disabled={loading === tpl.name}
              onClick={() => handleLoad(tpl)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                border: '1.5px solid #e2e8f0', background: loading === tpl.name ? '#f8fafc' : 'white',
                textAlign: 'left', transition: 'all 0.15s', outline: 'none',
              }}
              onMouseEnter={e => { if (loading !== tpl.name) (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.background = '#fafafa'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.background = 'white'; }}
            >
              <span style={{ fontSize: '28px', flexShrink: 0 }}>{tpl.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>{tpl.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{tpl.description}</div>
              </div>
              {loading === tpl.name ? (
                <span style={{ fontSize: '12px', color: '#6366f1' }}>Loading…</span>
              ) : (
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>→</span>
              )}
            </button>
          ))}
          {error && (
            <div style={{ padding: '8px 12px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', fontSize: '12px', color: '#b91c1c' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: ArrowsState) => ({
  separation: nodeSeparation(state),
  ontologies: getOntologies(state).ontologies,
});

const mapDispatchToProps = (dispatch: any) => ({
  clearGraph: () => dispatch(clearGraph()),
  tryImport: tryImport(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(TemplatesModal);

import React from 'react';
import { isMac } from '../interactions/Keybindings';

interface Props {
  open: boolean;
  onClose: () => void;
}

const cmd = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS = [
  {
    group: 'Canvas',
    items: [
      { keys: ['Scroll wheel'],      desc: 'Pan the canvas' },
      { keys: [cmd, 'Scroll'],       desc: 'Zoom in / out' },
      { keys: ['Click + drag'],      desc: 'Move a node' },
    ],
  },
  {
    group: 'Selection',
    items: [
      { keys: [cmd, 'A'],            desc: 'Select all nodes' },
      { keys: ['Click'],             desc: 'Select a node or relationship' },
      { keys: ['Esc'],               desc: 'Deselect everything' },
    ],
  },
  {
    group: 'Editing',
    items: [
      { keys: ['Enter'],             desc: 'Start editing label' },
      { keys: ['Esc'],               desc: 'Stop editing' },
      { keys: [cmd, 'D'],            desc: 'Duplicate selected' },
      { keys: ['⌫'],                desc: 'Delete selected' },
    ],
  },
  {
    group: 'Move nodes',
    items: [
      { keys: ['←', '→', '↑', '↓'], desc: 'Nudge selected nodes' },
      { keys: ['⇧', '+ arrow'],     desc: 'Nudge by larger step' },
    ],
  },
  {
    group: 'History',
    items: [
      { keys: [cmd, 'Z'],            desc: 'Undo' },
      { keys: [cmd, '⇧', 'Z'],      desc: 'Redo' },
    ],
  },
  {
    group: 'Other',
    items: [
      { keys: ['?'],                 desc: 'Open this shortcuts overlay' },
    ],
  },
];

const KeyboardShortcutsOverlay: React.FC<Props> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '14px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.22)',
          width: '560px', maxWidth: '95vw', maxHeight: '85vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Keyboard Shortcuts</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Press <kbd style={kbdStyle}>?</kbd> anytime to open this overlay</div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '16px 22px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: '8px' }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {group.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#334155' }}>{item.desc}</span>
                    <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                      {item.keys.map((k, ki) => (
                        <kbd key={ki} style={kbdStyle}>{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 22px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
          Click anywhere outside or press <kbd style={{ ...kbdStyle, fontSize: '10px' }}>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: '22px', height: '22px', padding: '0 5px',
  background: '#f1f5f9', border: '1px solid #e2e8f0',
  borderBottom: '2px solid #cbd5e1',
  borderRadius: '5px', fontSize: '11px', fontWeight: 600,
  fontFamily: 'ui-monospace, monospace', color: '#334155',
  whiteSpace: 'nowrap',
};

export default KeyboardShortcutsOverlay;

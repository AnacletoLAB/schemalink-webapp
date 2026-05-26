import { PatternDefinition, PatternRule } from '@neo4j-arrows/model';

// Convert PatternDefinition to a single regex suitable for annotations.algorithmic_rules
export const patternDefinitionToAlgorithmicRules = (def?: PatternDefinition): string | undefined => {
  if (!def || !def.rules || def.rules.length === 0) return undefined;
  const lookaheads: string[] = [];
  for (const r of def.rules) {
    const v = escapeForRegex(r.value);
    switch (r.operator) {
      case 'equals':
        lookaheads.push(`(?=^${v}$)`);
        break;
      case 'not_equals':
        lookaheads.push(`(?!^${v}$)`);
        break;
      case 'starts_with':
        lookaheads.push(`(?=^${v})`);
        break;
      case 'not_starts_with':
        lookaheads.push(`(?!^${v})`);
        break;
      case 'ends_with':
        lookaheads.push(`(?=.*${v}$)`);
        break;
      case 'not_ends_with':
        lookaheads.push(`(?!.*${v}$)`);
        break;
      case 'contains':
        lookaheads.push(`(?=.*${v})`);
        break;
      case 'not_contains':
        lookaheads.push(`(?!.*${v})`);
        break;
      case 'regex':
        lookaheads.push(`(?=${r.value})`);
        break;
      case 'not_regex':
        lookaheads.push(`(?!${r.value})`);
        break;
      default:
        break;
    }
  }
  return `^${lookaheads.join('')}.*$`;
};

// Parse algorithmic_rules produced by patternDefinitionToAlgorithmicRules back into PatternDefinition
export const algorithmicRulesToPatternDefinition = (s?: string): PatternDefinition | undefined => {
  if (!s) return undefined;
  const rules: PatternRule[] = [] as any;
  // find all lookaheads (?=...) and negative lookaheads (?!...)
  const re = /(\(\?=|\(\?!)([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const kind = m[1];
    const inner = m[2];
    // detect forms
    if (/^\^(.+)\$$/.test(inner)) {
      const val = inner.replace(/^\^|\$$/g, '');
      if (kind === '(?=') rules.push({ operator: 'equals', value: unescapeFromRegex(val) } as any);
      else rules.push({ operator: 'not_equals', value: unescapeFromRegex(val) } as any);
      continue;
    }
    if (/^\^/.test(inner)) {
      const val = inner.replace(/^\^/, '');
      if (kind === '(?=') rules.push({ operator: 'starts_with', value: unescapeFromRegex(val) } as any);
      else rules.push({ operator: 'not_starts_with', value: unescapeFromRegex(val) } as any);
      continue;
    }
    if (/\$$/.test(inner)) {
      const val = inner.replace(/\$$/, '').replace(/^\.\*/, '');
      if (kind === '(?=') rules.push({ operator: 'ends_with', value: unescapeFromRegex(val) } as any);
      else rules.push({ operator: 'not_ends_with', value: unescapeFromRegex(val) } as any);
      continue;
    }
    if (/^\.\*/.test(inner) || /\.\*/.test(inner)) {
      const val = inner.replace(/^\.\*/,'').replace(/\.\*$/,'');
      if (kind === '(?=') rules.push({ operator: 'contains', value: unescapeFromRegex(val) } as any);
      else rules.push({ operator: 'not_contains', value: unescapeFromRegex(val) } as any);
      continue;
    }
    // fallback: regex / not_regex
    if (kind === '(?=') rules.push({ operator: 'regex', value: inner } as any);
    else rules.push({ operator: 'not_regex', value: inner } as any);
  }
  if (rules.length === 0) return undefined;
  return { rules } as PatternDefinition;
};

const escapeForRegex = (v: string) => {
  // Escape regex specials, but keep simple
  return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const unescapeFromRegex = (v: string) => {
  return v.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
};

export default {};

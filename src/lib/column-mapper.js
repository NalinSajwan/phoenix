import { LABEL_MAP } from './constants.js';

function _matchKeywords(text) {
  const lower = (text || '').toLowerCase();
  for (const { keywords, col } of LABEL_MAP) {
    if (keywords.some((k) => lower.includes(k))) return col;
  }
  return null;
}

export function assignColumn(issue) {
  // Prefer GitHub Projects v2 Status field if available
  if (issue._projectStatus?.statusName) {
    const col = _matchKeywords(issue._projectStatus.statusName);
    if (col) return col;
  }
  // Fall back to label-based assignment
  const names = (issue.labels || []).map((l) => l.name.toLowerCase());
  for (const { keywords, col } of LABEL_MAP) {
    if (names.some((n) => keywords.some((k) => n.includes(k)))) return col;
  }
  return issue.assignees?.length > 0 ? 'todo' : 'triage';
}

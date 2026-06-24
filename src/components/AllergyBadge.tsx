import React from 'react';
import { getSeverityLabel } from '../utils/allergyEngine';

interface AllergyBadgeProps {
  severity: 'low' | 'medium' | 'high';
  name: string;
  type?: string;
  onRemove?: () => void;
}

export function AllergyBadge({ severity, name, type, onRemove }: AllergyBadgeProps) {
  const label = severity === 'high' ? '🔴' : severity === 'medium' ? '🟠' : '🟡';

  return (
    <span
      className={`badge-${severity}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
        padding: '0.25rem 0.625rem', borderRadius: '9999px',
        fontSize: '0.75rem', fontWeight: 500,
      }}
    >
      {label} {name}
      {type && <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>({type})</span>}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'currentColor', opacity: 0.7 }}
        >
          ×
        </button>
      )}
    </span>
  );
}

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md';
}

export function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const labels = { high: 'High Risk', medium: 'Medium Risk', low: 'Low Risk' };
  const paddings = { sm: '0.2rem 0.5rem', md: '0.3rem 0.75rem' };
  const fontSizes = { sm: '0.7rem', md: '0.75rem' };

  return (
    <span
      className={`badge-${level}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
        padding: paddings[size], borderRadius: '9999px',
        fontSize: fontSizes[size], fontWeight: 600,
      }}
    >
      <span className={`risk-dot risk-dot-${level}`} />
      {labels[level]}
    </span>
  );
}

interface MealStatusBadgeProps {
  status: 'safe' | 'warning' | 'blocked';
}

export function MealStatusBadge({ status }: MealStatusBadgeProps) {
  const labels = { safe: '✅ SAFE', warning: '⚠️ WARNING', blocked: '⛔ BLOCKED' };
  return (
    <span
      className={`badge-${status}`}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '0.3rem 0.75rem', borderRadius: '9999px',
        fontSize: '0.75rem', fontWeight: 700,
      }}
    >
      {labels[status]}
    </span>
  );
}

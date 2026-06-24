import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon, iconBg = '#2563eb', trend, trendUp, subtitle, onClick }: StatCardProps) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem' }}>{subtitle}</div>
          )}
          {trend && (
            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: trendUp ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {trendUp ? '↑' : '↓'} {trend}
            </div>
          )}
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: '0.625rem',
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, opacity: 0.9,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: '80%' }} />
        </div>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '0.625rem' }} />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4,5].map(i => (
        <td key={i} style={{ padding: '0.875rem 1rem' }}>
          <div className="skeleton" style={{ height: 16, width: `${60 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

import React, { useEffect, useState } from 'react';
import { Printer, AlertTriangle, ShieldOff, Bell, CheckCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { toast } from '../hooks/useToast';
import { timeAgo } from '../utils/allergyEngine';

export default function DailyDigest() {
  const [data, setData] = useState<any>(null);
  const [allAlerts, setAllAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [digestRes, alertsRes] = await Promise.all([
          api.get('/alerts/daily-summary'),
          api.get('/alerts'),
        ]);
        setData(digestRes.data);
        setAllAlerts(alertsRes.data);
      } catch { toast('Failed to load digest', 'error'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const cards = [
    { label: 'Total Alerts Today', value: data?.total || 0, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Bell size={22} color="white" /> },
    { label: '⛔ Blocked Meals', value: data?.blocked || 0, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <ShieldOff size={22} color="white" /> },
    { label: '⚠️ Warnings', value: data?.warnings || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <AlertTriangle size={22} color="white" /> },
    { label: '✅ All-Clear Meals', value: Math.max(0, (data?.total || 0) === 0 ? 5 : 5 - (data?.blocked || 0)), color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: <CheckCircle size={22} color="white" /> },
  ];

  const severityColor = (s: string) => s === 'high' ? '#f87171' : s === 'medium' ? '#fbbf24' : '#94a3b8';
  const typeIcon = (t: string) => t === 'blocked' ? '⛔' : t === 'warning' ? '⚠️' : t === 'emergency' ? '🚨' : 'ℹ️';

  return (
    <div id="daily-digest-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Daily Alert Digest</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{today}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => window.print()}>
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: '0.75rem' }} />)
          : cards.map(card => (
            <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}20`, borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '0.5rem', background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>{card.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>{card.label}</div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Severity breakdown */}
      {data?.by_severity?.length > 0 && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>📊 Breakdown by Severity</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {data.by_severity.map((row: any) => (
              <div key={`${row.type}-${row.severity}`} style={{ background: '#0f172a', borderRadius: '0.5rem', padding: '0.875rem 1.25rem', textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: severityColor(row.severity) }}>{row.count}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', textTransform: 'capitalize' }}>{typeIcon(row.type)} {row.type} / {row.severity}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert timeline */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1e293b' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>📋 Today's Alert Timeline</h3>
        </div>
        {loading ? (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: '0.5rem' }} />)}
          </div>
        ) : allAlerts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCircle size={40} style={{ color: '#22c55e', margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#4ade80', fontWeight: 600 }}>All clear today — no allergy alerts!</p>
          </div>
        ) : (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {allAlerts.map((alert: any) => (
              <div key={alert.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', background: '#0f172a', borderRadius: '0.5rem',
                borderLeft: `3px solid ${alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f59e0b' : '#334155'}`,
                opacity: alert.is_read ? 0.6 : 1,
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: severityColor(alert.severity) }}>
                    {typeIcon(alert.type)} {alert.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.2rem', display: 'flex', gap: '0.5rem' }}>
                    {alert.child_name && <span>👤 {alert.child_name}</span>}
                    {alert.classroom_name && <span>🏫 {alert.classroom_name}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: '#475569' }}>{timeAgo(alert.created_at)}</div>
                  <div style={{ marginTop: '0.25rem' }}>
                    {alert.is_read
                      ? <span style={{ fontSize: '0.65rem', color: '#22c55e' }}>✓ Read</span>
                      : <span style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 600 }}>● Unread</span>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print footer */}
      <div className="print-only" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #334155', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        AllergyGuard Daily Digest — {today} — Confidential
      </div>
    </div>
  );
}

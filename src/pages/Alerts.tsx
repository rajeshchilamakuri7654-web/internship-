import React, { useEffect, useState } from 'react';
import { AlertTriangle, Filter, CheckCheck, X, Bell, BellOff } from 'lucide-react';
import api from '../services/api';
import { EmptyState } from '../components/Modal';
import { MealStatusBadge } from '../components/AllergyBadge';
import { toast } from '../hooks/useToast';
import { timeAgo } from '../utils/allergyEngine';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', severity: '', is_read: '' });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter.type) params.type = filter.type;
      if (filter.severity) params.severity = filter.severity;
      if (filter.is_read !== '') params.is_read = filter.is_read;
      const res = await api.get('/alerts', { params });
      setAlerts(res.data);
    } catch { toast('Failed to load alerts', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch { toast('Failed to mark as read', 'error'); }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/alerts/read-all');
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      toast('All alerts marked as read', 'success');
    } catch { toast('Failed', 'error'); }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const severityBorderColor = (s: string) => s === 'high' ? '#ef4444' : s === 'medium' ? '#f59e0b' : '#64748b';
  const typeIcon = (t: string) => t === 'blocked' ? '⛔' : t === 'warning' ? '⚠️' : t === 'emergency' ? '🚨' : 'ℹ️';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Alert Center</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {unreadCount > 0 ? <span style={{ color: '#f87171' }}>{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</span> : 'All alerts read'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={markAllRead} style={{ fontSize: '0.8rem' }}>
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))} className="input-field" style={{ width: 160 }}>
          <option value="">All Types</option>
          <option value="blocked">⛔ Blocked</option>
          <option value="warning">⚠️ Warning</option>
          <option value="emergency">🚨 Emergency</option>
          <option value="info">ℹ️ Info</option>
        </select>
        <select value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))} className="input-field" style={{ width: 160 }}>
          <option value="">All Severity</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟠 Medium</option>
          <option value="low">🟡 Low</option>
        </select>
        <select value={filter.is_read} onChange={e => setFilter(f => ({ ...f, is_read: e.target.value }))} className="input-field" style={{ width: 160 }}>
          <option value="">All Status</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
        {(filter.type || filter.severity || filter.is_read) && (
          <button className="btn btn-ghost" onClick={() => setFilter({ type: '', severity: '', is_read: '' })} style={{ fontSize: '0.8rem' }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton glass-card" style={{ height: 90, borderRadius: '0.75rem' }} />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<BellOff size={48} />}
            title="No alerts found"
            description="No safety alerts match your current filters"
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="glass-card animate-fade-in"
              style={{
                padding: '1rem 1.25rem',
                borderLeft: `4px solid ${severityBorderColor(alert.severity)}`,
                opacity: alert.is_read ? 0.65 : 1,
                cursor: 'pointer',
              }}
              onClick={() => { if (!alert.is_read) markRead(alert.id); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>{typeIcon(alert.type)}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: alert.is_read ? '#64748b' : '#f1f5f9' }}>
                      {alert.title}
                    </span>
                    {!alert.is_read && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                    {alert.message}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#475569', alignItems: 'center' }}>
                    {alert.child_name && <span>👤 {alert.child_name}</span>}
                    {alert.classroom_name && <span>🏫 {alert.classroom_name}</span>}
                    {alert.meal_name && <span>🍽️ {alert.meal_name}</span>}
                    <span>🕐 {timeAgo(alert.created_at)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                  <MealStatusBadge status={alert.type === 'blocked' ? 'blocked' : alert.type === 'warning' ? 'warning' : 'safe'} />
                  {!alert.is_read && (
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      onClick={e => { e.stopPropagation(); markRead(alert.id); }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

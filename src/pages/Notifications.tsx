import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, BellOff, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import api from '../services/api';
import { EmptyState } from '../components/Modal';
import { toast } from '../hooks/useToast';
import { timeAgo } from '../utils/allergyEngine';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info size={16} color="#60a5fa" />,
  success: <CheckCircle size={16} color="#4ade80" />,
  warning: <AlertTriangle size={16} color="#fbbf24" />,
  error: <XCircle size={16} color="#f87171" />,
};

const typeBg: Record<string, string> = {
  info: 'rgba(37,99,235,0.1)', success: 'rgba(22,163,74,0.1)', warning: 'rgba(217,119,6,0.1)', error: 'rgba(220,38,38,0.1)',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch { toast('Failed to load notifications', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast('All notifications read', 'success');
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Notifications</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {unreadCount > 0 ? <span style={{ color: '#fbbf24' }}>{unreadCount} unread</span> : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={markAllRead} style={{ fontSize: '0.8rem' }}>
            <CheckCheck size={14} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton glass-card" style={{ height: 72 }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<BellOff size={48} />}
            title="No notifications"
            description="You'll be notified here about meal assignments and safety alerts"
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notifications.map(n => (
            <div
              key={n.id}
              className="glass-card"
              style={{
                padding: '0.875rem 1rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                opacity: n.is_read ? 0.6 : 1,
                cursor: !n.is_read ? 'pointer' : 'default',
                background: !n.is_read ? typeBg[n.type] || 'rgba(30,41,59,0.8)' : undefined,
              }}
              onClick={() => { if (!n.is_read) markRead(n.id); }}
            >
              <div style={{ flexShrink: 0, marginTop: 2 }}>{typeIcons[n.type] || typeIcons.info}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: n.is_read ? '#64748b' : '#f1f5f9', marginBottom: '0.2rem' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{n.message}</div>
                <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.375rem' }}>{timeAgo(n.created_at)}</div>
              </div>
              {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

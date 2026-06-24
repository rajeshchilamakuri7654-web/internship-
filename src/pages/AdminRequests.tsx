import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, ClipboardList, Clock } from 'lucide-react';
import api from '../services/api';
import { EmptyState } from '../components/Modal';
import { toast } from '../hooks/useToast';
import { timeAgo } from '../utils/allergyEngine';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    high: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: '🔴 High' },
    medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: '🟠 Medium' },
    low: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: '🟡 Low' },
  };
  const s = map[severity] || map.medium;
  return <span style={{ fontSize: '0.72rem', fontWeight: 600, color: s.color, background: s.bg, padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>{s.label}</span>;
};

export default function AdminRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/parent/approval-requests');
      setRequests(res.data);
    } catch { toast('Failed to load requests', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      await api.patch(`/parent/approval-requests/${id}`, { status });
      toast(status === 'approved' ? '✅ Request approved and allergy record created!' : '❌ Request rejected.', status === 'approved' ? 'success' : 'info');
      await fetchRequests();
    } catch { toast('Action failed', 'error'); }
    finally { setProcessing(null); }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      pending: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: '⏳ Pending' },
      approved: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: '✅ Approved' },
      rejected: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: '❌ Rejected' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: s.color, background: s.bg, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
        {s.label}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Parent Allergy Requests</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
          {pending.length} pending review{pending.length !== 1 ? 's' : ''} — approve to create the allergy record automatically
        </p>
      </div>

      {/* Pending requests */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton glass-card" style={{ height: 110, borderRadius: '0.75rem' }} />)}
        </div>
      ) : pending.length === 0 ? (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <EmptyState icon={<ClipboardList size={48} />} title="No Pending Requests" description="All parent allergy update requests have been reviewed" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {pending.map(req => (
            <div key={req.id} className="glass-card animate-fade-in" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>{req.allergy_name}</span>
                    <SeverityBadge severity={req.severity} />
                    {statusBadge(req.status)}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.375rem' }}>
                    <span>👶 Child ID: {req.child_id?.slice(0, 8)}...</span>
                    <span>👤 Parent: {req.parent_id?.slice(0, 8)}...</span>
                    <span><Clock size={12} style={{ display: 'inline', marginRight: 3 }} />{timeAgo(req.created_at)}</span>
                  </div>
                  {req.symptoms && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Symptoms: {req.symptoms}</div>}
                  {req.notes && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', fontStyle: 'italic' }}>"{req.notes}"</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    className="btn btn-success"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.875rem' }}
                    disabled={processing === req.id}
                    onClick={() => handleAction(req.id, 'approved')}
                  >
                    {processing === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.875rem' }}
                    disabled={processing === req.id}
                    onClick={() => handleAction(req.id, 'rejected')}
                  >
                    {processing === req.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolved requests */}
      {resolved.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem 0' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>📋 Resolved Requests</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Allergy</th><th>Severity</th><th>Symptoms</th><th>Status</th><th>Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{req.allergy_name}</td>
                    <td><SeverityBadge severity={req.severity} /></td>
                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{req.symptoms || '—'}</td>
                    <td>{statusBadge(req.status)}</td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{req.reviewed_at ? timeAgo(req.reviewed_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

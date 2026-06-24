import React, { useEffect, useState } from 'react';
import { ShieldAlert, Loader2, AlertTriangle, CheckCircle, Utensils, Bell, Plus, Send } from 'lucide-react';
import api from '../services/api';
import { RiskBadge, MealStatusBadge } from '../components/AllergyBadge';
import { toast } from '../hooks/useToast';
import { timeAgo, checkMealSafety } from '../utils/allergyEngine';
import { authService } from '../services/auth';

const SEVERITY_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const SEVERITY_BG: Record<string, string> = { high: 'rgba(239,68,68,0.12)', medium: 'rgba(245,158,11,0.12)', low: 'rgba(34,197,94,0.12)' };

export default function ParentPortal() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({ allergy_name: '', severity: 'medium', symptoms: '', notes: '' });
  const user = authService.getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/parent/my-child');
        setData(res.data);
      } catch (err: any) {
        toast(err.response?.data?.error || 'Failed to load data', 'error');
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.child?.id) return;
    setSubmitting(true);
    try {
      await api.post('/parent/allergy-request', { child_id: data.child.id, ...requestForm });
      toast('✅ Allergy update request submitted! Admin will review shortly.', 'success');
      setShowRequestForm(false);
      setRequestForm({ allergy_name: '', severity: 'medium', symptoms: '', notes: '' });
    } catch (err: any) {
      toast(err.response?.data?.error || 'Submission failed', 'error');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem', color: '#64748b' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: '#2563eb' }} />
      <span>Loading your child's information...</span>
    </div>
  );

  if (!data?.child) return (
    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
      <ShieldAlert size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
      <p>No child linked to your account. Please contact the daycare administrator.</p>
    </div>
  );

  const { child, allergies, todays_meals, recent_alerts } = data;
  const highRiskAllergies = allergies.filter((a: any) => a.severity === 'high');

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          Parent Portal 👋
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Welcome, {user?.name || 'Parent'}</p>
      </div>

      {/* Critical allergy banner */}
      {highRiskAllergies.length > 0 && (
        <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} color="#f87171" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f87171' }}>Critical Allergy Alert</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {child.name} has high-severity allergies: {highRiskAllergies.map((a: any) => a.name).join(', ')}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Child Profile */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>👤 Child Profile</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: child.risk_level === 'high' ? 'rgba(239,68,68,0.2)' : child.risk_level === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 700,
              color: child.risk_level === 'high' ? '#f87171' : child.risk_level === 'medium' ? '#fbbf24' : '#4ade80',
            }}>
              {child.name?.[0]}
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{child.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{child.age} years • {child.gender}</div>
              <div style={{ marginTop: '0.375rem' }}><RiskBadge level={child.risk_level as any} size="sm" /></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { label: 'Classroom', value: child.classroom_name || '—' },
              { label: 'Parent Contact', value: child.parent_contact || '—' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.375rem 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#64748b' }}>{row.label}</span>
                <span style={{ color: '#e2e8f0' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Allergy Profile */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>🚨 Allergy Profile</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{allergies.length} record{allergies.length !== 1 ? 's' : ''}</span>
          </div>
          {allergies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#4ade80', fontSize: '0.875rem' }}>✅ No food allergies on record</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {allergies.map((allergy: any) => (
                <div key={allergy.id} style={{ background: SEVERITY_BG[allergy.severity] || '#1e293b', border: `1px solid ${SEVERITY_COLOR[allergy.severity] || '#334155'}30`, borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>{allergy.name}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: SEVERITY_COLOR[allergy.severity] || '#94a3b8', background: SEVERITY_BG[allergy.severity] || '#1e293b', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>
                      {allergy.severity === 'high' ? '🔴 High' : allergy.severity === 'medium' ? '🟠 Medium' : '🟡 Low'}
                    </span>
                  </div>
                  {allergy.symptoms && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{allergy.symptoms}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Today's Meals */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>
            🍽️ Today's Meals — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </h3>
          {todays_meals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>No meals scheduled for today</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {todays_meals.map((meal: any) => {
                const foodAllergies = allergies.filter((a: any) => a.type === 'food');
                const safety = meal.ingredients ? checkMealSafety(meal.ingredients, foodAllergies) : { status: 'safe' };
                return (
                  <div key={meal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: '#0f172a', borderRadius: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>{meal.meal_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>{meal.meal_type}</div>
                    </div>
                    <MealStatusBadge status={safety.status as any} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>🔔 Recent Alerts</h3>
          {recent_alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#4ade80', fontSize: '0.875rem' }}>✅ No recent alerts</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recent_alerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: alert.severity === 'high' ? '#f87171' : '#fbbf24' }}>{alert.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.2rem' }}>{timeAgo(alert.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Allergy Update Request */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showRequestForm ? '1rem' : 0 }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>📋 Request Allergy Update</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>Submit a new allergy or medical note for admin review</p>
          </div>
          <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => setShowRequestForm(f => !f)}>
            {showRequestForm ? 'Cancel' : <><Plus size={14} /> New Request</>}
          </button>
        </div>

        {showRequestForm && (
          <form onSubmit={handleSubmitRequest}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>Allergy Name *</label>
                <input className="input-field" value={requestForm.allergy_name} onChange={e => setRequestForm(f => ({ ...f, allergy_name: e.target.value }))} placeholder="e.g. Peanuts, Dairy" required />
              </div>
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>Severity</label>
                <select className="input-field" value={requestForm.severity} onChange={e => setRequestForm(f => ({ ...f, severity: e.target.value }))}>
                  <option value="low">🟡 Low</option>
                  <option value="medium">🟠 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>Symptoms</label>
              <input className="input-field" value={requestForm.symptoms} onChange={e => setRequestForm(f => ({ ...f, symptoms: e.target.value }))} placeholder="e.g. Hives, difficulty breathing" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.375rem' }}>Additional Notes</label>
              <textarea className="input-field" rows={3} value={requestForm.notes} onChange={e => setRequestForm(f => ({ ...f, notes: e.target.value }))} placeholder="Doctor's notes, special instructions..." style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : <><Send size={14} /> Submit Request</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, User, AlertTriangle, Pill, UtensilsCrossed,
  Plus, Loader2, Shield, BookOpen, Trash2,
} from 'lucide-react';
import api from '../services/api';
import { AllergyBadge, RiskBadge, MealStatusBadge } from '../components/AllergyBadge';
import { Modal, FormField, EmptyState } from '../components/Modal';
import { toast } from '../hooks/useToast';
import { timeAgo, checkMealSafety } from '../utils/allergyEngine';
import { authService } from '../services/auth';

export default function ChildDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'allergies' | 'contacts' | 'medicines' | 'alerts'>('overview');
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allergyForm, setAllergyForm] = useState({ type: 'food', name: '', severity: 'medium', symptoms: '', notes: '' });
  const [contactForm, setContactForm] = useState({ name: '', relationship: '', phone: '', email: '', is_primary: false, medical_notes: '' });
  const isAdmin = authService.getRole() === 'admin';

  const fetchChild = async () => {
    try {
      const res = await api.get(`/children/${id}`);
      setChild(res.data);
    } catch { toast('Failed to load child profile', 'error'); navigate('/children'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchChild(); }, [id]);

  const submitAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/children/${id}/allergies`, allergyForm);
      toast('Allergy added', 'success');
      setShowAllergyModal(false);
      fetchChild();
    } catch (err: any) { toast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setSubmitting(false); }
  };

  const deleteAllergy = async (allergyId: string) => {
    try {
      await api.delete(`/children/${id}/allergies/${allergyId}`);
      toast('Allergy removed', 'success');
      fetchChild();
    } catch { toast('Failed to remove', 'error'); }
  };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/children/${id}/emergency-contacts`, contactForm);
      toast('Emergency contact added', 'success');
      setShowContactModal(false);
      fetchChild();
    } catch (err: any) { toast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader2 size={32} color="#2563eb" className="animate-spin" />
    </div>
  );

  if (!child) return null;

  const foodAllergies = child.allergies?.filter((a: any) => a.type === 'food') || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User size={14} /> },
    { id: 'allergies', label: `Allergies (${child.allergies?.length || 0})`, icon: <Shield size={14} /> },
    { id: 'contacts', label: 'Emergency Contacts', icon: <Phone size={14} /> },
    { id: 'medicines', label: 'Medicines', icon: <Pill size={14} /> },
    { id: 'alerts', label: `Alerts (${child.recent_alerts?.length || 0})`, icon: <AlertTriangle size={14} /> },
  ];

  return (
    <div>
      {/* Back button */}
      <button className="btn btn-ghost" style={{ marginBottom: '1.25rem', fontSize: '0.8rem' }} onClick={() => navigate('/children')}>
        <ArrowLeft size={14} /> Back to Children
      </button>

      {/* Profile Header */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: child.risk_level === 'high' ? 'linear-gradient(135deg, #dc2626, #f59e0b)' : child.risk_level === 'medium' ? 'linear-gradient(135deg, #d97706, #2563eb)' : 'linear-gradient(135deg, #16a34a, #0891b2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 800, color: 'white',
            flexShrink: 0,
          }}>
            {child.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{child.name}</h2>
              <RiskBadge level={child.risk_level} />
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>Age: <strong style={{ color: '#e2e8f0' }}>{child.age} years</strong></span>
              <span>Gender: <strong style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{child.gender}</strong></span>
              <span>Classroom: <strong style={{ color: '#e2e8f0' }}>{child.classroom_name || 'Not assigned'}</strong></span>
            </div>
            {child.notes && (
              <div style={{ marginTop: '0.625rem', padding: '0.5rem 0.75rem', background: '#0f172a', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                📝 {child.notes}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
            <div>Parent: <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{child.parent_name || '—'}</span></div>
            <div>{child.parent_contact || ''}</div>
          </div>
        </div>

        {/* High-risk warning banner */}
        {child.risk_level === 'high' && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>⚠️ HIGH RISK CHILD</div>
              <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.2rem' }}>
                This child has one or more high-severity allergies. Extra caution required during all meal times. Emergency action plan should be readily available.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid #334155', marginBottom: '1.25rem', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.625rem 1rem', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.id ? '#60a5fa' : '#64748b',
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>🔬 Active Allergies</h3>
              {child.allergies?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {child.allergies.map((a: any) => (
                    <AllergyBadge key={a.id} severity={a.severity} name={a.name} type={a.type} />
                  ))}
                </div>
              ) : (
                <p style={{ color: '#4ade80', fontSize: '0.875rem' }}>✅ No allergies on record</p>
              )}
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>💊 Medications</h3>
              {child.medicines?.length > 0 ? (
                child.medicines.map((m: any) => (
                  <div key={m.id} style={{ marginBottom: '0.625rem', padding: '0.5rem', background: '#0f172a', borderRadius: '0.375rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{m.name}</div>
                    {m.dosage && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Dosage: {m.dosage}</div>}
                    {m.frequency && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Frequency: {m.frequency}</div>}
                  </div>
                ))
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No medications recorded</p>
              )}
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>📞 Primary Emergency Contact</h3>
              {child.emergency_contacts?.find((c: any) => c.is_primary) ? (() => {
                const ec = child.emergency_contacts.find((c: any) => c.is_primary);
                return (
                  <div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>{ec.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{ec.relationship}</div>
                    <div style={{ fontSize: '0.875rem', color: '#60a5fa', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Phone size={13} /> {ec.phone}
                    </div>
                    {ec.medical_notes && <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(245,158,11,0.1)', borderRadius: '0.375rem' }}>⚠️ {ec.medical_notes}</div>}
                  </div>
                );
              })() : (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No primary contact set</p>
              )}
            </div>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>🚨 Recent Alerts</h3>
              {child.recent_alerts?.length > 0 ? (
                child.recent_alerts.slice(0, 3).map((alert: any) => (
                  <div key={alert.id} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#0f172a', borderRadius: '0.375rem', borderLeft: `3px solid ${alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f59e0b' : '#64748b'}` }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>{alert.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{timeAgo(alert.created_at)}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#4ade80', fontSize: '0.875rem' }}>✅ No alerts for this child</p>
              )}
            </div>
          </div>
        )}

        {/* Allergies Tab */}
        {activeTab === 'allergies' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' }}>Allergy Records</h3>
              {isAdmin && (
                <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => setShowAllergyModal(true)}>
                  <Plus size={14} /> Add Allergy
                </button>
              )}
            </div>
            {child.allergies?.length === 0 ? (
              <div className="glass-card">
                <EmptyState icon={<Shield size={40} />} title="No allergies recorded" description="Add allergy records for this child to enable safety checks" action={isAdmin ? <button className="btn btn-primary" onClick={() => setShowAllergyModal(true)}><Plus size={14} /> Add Allergy</button> : undefined} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {child.allergies.map((allergy: any) => (
                  <div key={allergy.id} className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>{allergy.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{allergy.type} allergy</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <AllergyBadge severity={allergy.severity} name={allergy.severity} />
                        {isAdmin && <button onClick={() => deleteAllergy(allergy.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0.25rem' }}><Trash2 size={13} /></button>}
                      </div>
                    </div>
                    {allergy.symptoms && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.375rem' }}>Symptoms: {allergy.symptoms}</div>}
                    {allergy.notes && <div style={{ fontSize: '0.75rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.375rem 0.5rem', borderRadius: '0.375rem' }}>📌 {allergy.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Emergency Contacts */}
        {activeTab === 'contacts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' }}>Emergency Contacts</h3>
              {isAdmin && (
                <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => setShowContactModal(true)}>
                  <Plus size={14} /> Add Contact
                </button>
              )}
            </div>
            {child.emergency_contacts?.length === 0 ? (
              <div className="glass-card">
                <EmptyState icon={<Phone size={40} />} title="No emergency contacts" description="Add emergency contacts for quick access during incidents" action={isAdmin ? <button className="btn btn-primary" onClick={() => setShowContactModal(true)}><Plus size={14} /> Add Contact</button> : undefined} />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {child.emergency_contacts.map((ec: any) => (
                  <div key={ec.id} className="glass-card" style={{ padding: '1rem', borderColor: ec.is_primary ? 'rgba(37, 99, 235, 0.4)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>{ec.name}</div>
                      {ec.is_primary && <span style={{ fontSize: '0.65rem', background: 'rgba(37,99,235,0.2)', color: '#60a5fa', padding: '0.15rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(37,99,235,0.3)' }}>PRIMARY</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.375rem' }}>{ec.relationship}</div>
                    <div style={{ fontSize: '0.875rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}>
                      <Phone size={13} /> {ec.phone}
                    </div>
                    {ec.email && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{ec.email}</div>}
                    {ec.medical_notes && <div style={{ fontSize: '0.75rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.375rem 0.5rem', borderRadius: '0.375rem', marginTop: '0.5rem' }}>⚠️ {ec.medical_notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>Medication Records</h3>
            {child.medicines?.length === 0 ? (
              <div className="glass-card"><EmptyState icon={<Pill size={40} />} title="No medications recorded" description="No medication records for this child" /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {child.medicines.map((med: any) => (
                  <div key={med.id} className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', marginBottom: '0.375rem' }}>{med.name}</div>
                    {med.dosage && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dosage: {med.dosage}</div>}
                    {med.frequency && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Frequency: {med.frequency}</div>}
                    {med.notes && <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '0.375rem', borderRadius: '0.375rem', marginTop: '0.5rem' }}>📋 {med.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>Alert History</h3>
            {child.recent_alerts?.length === 0 ? (
              <div className="glass-card"><EmptyState icon={<AlertTriangle size={40} />} title="No alerts" description="No safety alerts for this child" /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {child.recent_alerts.map((alert: any) => (
                  <div key={alert.id} className="glass-card" style={{ padding: '1rem', borderLeft: `3px solid ${alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f59e0b' : '#64748b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem', marginBottom: '0.375rem' }}>{alert.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{alert.message}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{timeAgo(alert.created_at)}</div>
                        <MealStatusBadge status={alert.type === 'blocked' ? 'blocked' : alert.type === 'warning' ? 'warning' : 'safe'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Allergy Modal */}
      <Modal isOpen={showAllergyModal} onClose={() => setShowAllergyModal(false)} title="Add Allergy Record" maxWidth={500}>
        <form onSubmit={submitAllergy}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FormField label="Allergy Type" required>
              <select className="input-field" value={allergyForm.type} onChange={e => setAllergyForm(f => ({ ...f, type: e.target.value }))}>
                <option value="food">Food Allergy</option>
                <option value="medicine">Medicine Allergy</option>
                <option value="environmental">Environmental</option>
              </select>
            </FormField>
            <FormField label="Severity" required>
              <select className="input-field" value={allergyForm.severity} onChange={e => setAllergyForm(f => ({ ...f, severity: e.target.value }))}>
                <option value="low">🟡 Low</option>
                <option value="medium">🟠 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </FormField>
          </div>
          <FormField label="Allergen Name" required>
            <input className="input-field" value={allergyForm.name} onChange={e => setAllergyForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Peanuts, Dairy, Shellfish..." />
          </FormField>
          <FormField label="Symptoms">
            <input className="input-field" value={allergyForm.symptoms} onChange={e => setAllergyForm(f => ({ ...f, symptoms: e.target.value }))} placeholder="e.g. Hives, anaphylaxis, stomach pain" />
          </FormField>
          <FormField label="Notes / Action Plan">
            <textarea className="input-field" value={allergyForm.notes} onChange={e => setAllergyForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="What to do in case of exposure..." style={{ resize: 'vertical' }} />
          </FormField>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAllergyModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null} Save Allergy
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Contact Modal */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="Add Emergency Contact" maxWidth={500}>
        <form onSubmit={submitContact}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FormField label="Full Name" required>
              <input className="input-field" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} required placeholder="John Smith" />
            </FormField>
            <FormField label="Relationship" required>
              <input className="input-field" value={contactForm.relationship} onChange={e => setContactForm(f => ({ ...f, relationship: e.target.value }))} required placeholder="Father, Mother, Guardian..." />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FormField label="Phone" required>
              <input className="input-field" type="tel" value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} required placeholder="+1-555-0100" />
            </FormField>
            <FormField label="Email">
              <input className="input-field" type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </FormField>
          </div>
          <FormField label="Medical Notes">
            <textarea className="input-field" value={contactForm.medical_notes} onChange={e => setContactForm(f => ({ ...f, medical_notes: e.target.value }))} rows={2} placeholder="EpiPen location, special instructions..." style={{ resize: 'vertical' }} />
          </FormField>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="checkbox" id="is-primary" checked={contactForm.is_primary} onChange={e => setContactForm(f => ({ ...f, is_primary: e.target.checked }))} />
            <label htmlFor="is-primary" style={{ fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer' }}>Set as primary emergency contact</label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowContactModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null} Save Contact
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

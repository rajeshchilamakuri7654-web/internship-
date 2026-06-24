import React, { useEffect, useState } from 'react';
import { Phone, User, Users, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { EmptyState } from '../components/Modal';
import { RiskBadge } from '../components/AllergyBadge';
import { useNavigate } from 'react-router-dom';

export default function EmergencyContacts() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get('/children', { params: { limit: 100 } });
        const allChildren = res.data.data || [];
        // Fetch full data for each child to get emergency contacts
        const detailed = await Promise.all(
          allChildren.map((c: any) => api.get(`/children/${c.id}`).then(r => r.data).catch(() => c))
        );
        setChildren(detailed.filter((c: any) => c.emergency_contacts?.length > 0 || c.risk_level === 'high'));
      } catch {} finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Emergency Contacts</h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Quick access to parent and guardian contacts</p>
      </div>

      {/* High Risk Alert Banner */}
      <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.625rem', padding: '0.875rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
        <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
          <strong>Emergency Protocol:</strong> In case of severe allergic reaction, call 911 immediately, then contact the primary guardian. Administer EpiPen if available and prescribed.
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton glass-card" style={{ height: 180 }} />)}
        </div>
      ) : children.length === 0 ? (
        <div className="glass-card">
          <EmptyState icon={<Users size={48} />} title="No emergency contacts" description="Add children and emergency contacts from the Children section" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {children.map(child => {
            const primaryContact = child.emergency_contacts?.find((c: any) => c.is_primary) || child.emergency_contacts?.[0];
            return (
              <div key={child.id} className="glass-card" style={{ padding: '1.125rem', cursor: 'pointer' }} onClick={() => navigate(`/children/${child.id}`)}>
                {/* Child Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem', paddingBottom: '0.875rem', borderBottom: '1px solid #334155' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: child.risk_level === 'high' ? 'rgba(220,38,38,0.2)' : child.risk_level === 'medium' ? 'rgba(217,119,6,0.2)' : 'rgba(22,163,74,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 700,
                    color: child.risk_level === 'high' ? '#f87171' : child.risk_level === 'medium' ? '#fbbf24' : '#4ade80',
                  }}>
                    {child.name?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.875rem' }}>{child.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Age {child.age} • {child.classroom_name || 'No classroom'}</div>
                  </div>
                  <RiskBadge level={child.risk_level} size="sm" />
                </div>

                {/* Primary Contact */}
                {primaryContact ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.875rem' }}>{primaryContact.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{primaryContact.relationship}</div>
                      </div>
                      {primaryContact.is_primary && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(37,99,235,0.2)', color: '#60a5fa', padding: '0.15rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(37,99,235,0.3)' }}>PRIMARY</span>
                      )}
                    </div>
                    <a
                      href={`tel:${primaryContact.phone}`}
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: '#4ade80', fontSize: '1rem', fontWeight: 700, textDecoration: 'none',
                        background: 'rgba(34,197,94,0.1)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                        border: '1px solid rgba(34,197,94,0.2)', marginBottom: '0.5rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Phone size={16} /> {primaryContact.phone}
                    </a>
                    {primaryContact.medical_notes && (
                      <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245,158,11,0.1)', padding: '0.375rem 0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(245,158,11,0.15)' }}>
                        ⚠️ {primaryContact.medical_notes}
                      </div>
                    )}
                    {child.emergency_contacts?.length > 1 && (
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem' }}>
                        +{child.emergency_contacts.length - 1} more contact{child.emergency_contacts.length - 1 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No emergency contact on file</div>
                )}

                {/* Allergy summary */}
                {child.allergies?.filter((a: any) => a.severity === 'high').length > 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(220,38,38,0.1)', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#f87171' }}>
                    🔴 HIGH RISK: {child.allergies.filter((a: any) => a.severity === 'high').map((a: any) => a.name).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

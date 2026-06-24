import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, Users, Loader2, X } from 'lucide-react';
import api from '../services/api';
import { RiskBadge, AllergyBadge } from '../components/AllergyBadge';
import { Modal, FormField, EmptyState } from '../components/Modal';
import { SkeletonRow } from '../components/StatCard';
import { toast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { authService } from '../services/auth';

interface Child {
  id: string; name: string; age: number; gender: string;
  classroom_name: string; parent_name: string; parent_contact: string;
  risk_level: string; allergy_count: number; allergies: any[];
  notes: string; created_at: string;
}

interface ChildFormData {
  name: string; age: string; gender: string; classroom_id: string;
  parent_name: string; parent_contact: string; notes: string; risk_level: string;
}

const initialForm: ChildFormData = {
  name: '', age: '', gender: 'male', classroom_id: '',
  parent_name: '', parent_contact: '', notes: '', risk_level: 'low',
};

export default function Children() {
  const [children, setChildren] = useState<Child[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [form, setForm] = useState<ChildFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const debouncedSearch = useDebounce(search, 350);
  const isAdmin = authService.getRole() === 'admin';

  useEffect(() => {
    if (searchParams.get('search')) setSearch(searchParams.get('search')!);
    if (searchParams.get('risk_level')) setFilterRisk(searchParams.get('risk_level')!);
    api.get('/classrooms').then(r => setClassrooms(r.data)).catch(() => {});
  }, []);

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterRisk) params.risk_level = filterRisk;
      const res = await api.get('/children', { params });
      setChildren(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast('Failed to load children', 'error'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filterRisk]);

  useEffect(() => { fetchChildren(); }, [fetchChildren]);

  const openAdd = () => { setEditChild(null); setForm(initialForm); setShowModal(true); };
  const openEdit = (child: Child) => {
    setEditChild(child);
    setForm({
      name: child.name, age: String(child.age), gender: child.gender || 'male',
      classroom_id: '', parent_name: child.parent_name || '',
      parent_contact: child.parent_contact || '', notes: child.notes || '',
      risk_level: child.risk_level,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, age: parseInt(form.age) || 0 };
      if (editChild) {
        await api.put(`/children/${editChild.id}`, payload);
        toast('Child updated successfully', 'success');
      } else {
        await api.post('/children', payload);
        toast('Child added successfully', 'success');
      }
      setShowModal(false);
      fetchChildren();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Operation failed', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/children/${deleteId}`);
      toast('Child removed', 'success');
      setDeleteId(null);
      fetchChildren();
    } catch { toast('Failed to delete', 'error'); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Children Registry</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{total} children enrolled</p>
        </div>
        {isAdmin && (
          <button id="add-child-btn" className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Child
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', flex: 1, minWidth: 200 }}>
          <Search size={16} color="#64748b" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or parent..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.875rem', flex: 1 }}
          />
          {search && <button onClick={() => { setSearch(''); setPage(1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={14} /></button>}
        </div>
        <select
          value={filterRisk}
          onChange={e => { setFilterRisk(e.target.value); setPage(1); }}
          className="input-field"
          style={{ width: 160 }}
        >
          <option value="">All Risk Levels</option>
          <option value="high">🔴 High Risk</option>
          <option value="medium">🟠 Medium Risk</option>
          <option value="low">🟡 Low Risk</option>
        </select>
        {(search || filterRisk) && (
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setFilterRisk(''); setPage(1); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Child</th>
                <th>Age / Gender</th>
                <th>Classroom</th>
                <th>Parent Contact</th>
                <th>Risk Level</th>
                <th>Allergies</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : children.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Users size={48} />}
                      title="No children found"
                      description={search || filterRisk ? "Try adjusting your search filters" : "Add your first child to get started"}
                      action={isAdmin ? <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Child</button> : undefined}
                    />
                  </td>
                </tr>
              ) : (
                children.map(child => (
                  <tr key={child.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: child.risk_level === 'high' ? 'rgba(239,68,68,0.2)' : child.risk_level === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: 700,
                          color: child.risk_level === 'high' ? '#f87171' : child.risk_level === 'medium' ? '#fbbf24' : '#4ade80',
                        }}>
                          {child.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem' }}>{child.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#94a3b8' }}>
                      {child.age}y • <span style={{ textTransform: 'capitalize' }}>{child.gender}</span>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{child.classroom_name || '—'}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{child.parent_name || '—'}</div>
                      {child.parent_contact && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{child.parent_contact}</div>}
                    </td>
                    <td><RiskBadge level={child.risk_level as any} size="sm" /></td>
                    <td>
                      {child.allergy_count > 0 ? (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>
                          {child.allergy_count} allerg{child.allergy_count !== 1 ? 'ies' : 'y'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>None</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button id={`view-child-${child.id}`} className="btn btn-ghost" style={{ padding: '0.375rem', minWidth: 'auto' }} onClick={() => navigate(`/children/${child.id}`)}>
                          <Eye size={15} />
                        </button>
                        {isAdmin && (<>
                          <button className="btn btn-ghost" style={{ padding: '0.375rem', minWidth: 'auto' }} onClick={() => openEdit(child)}>
                            <Edit size={15} />
                          </button>
                          <button className="btn btn-ghost" style={{ padding: '0.375rem', minWidth: 'auto', color: '#f87171' }} onClick={() => setDeleteId(child.id)}>
                            <Trash2 size={15} />
                          </button>
                        </>)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderTop: '1px solid #334155' }}>
            <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>← Prev</button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', padding: '0 0.5rem' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>Next →</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editChild ? `Edit: ${editChild.name}` : 'Add New Child'}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FormField label="Full Name" required>
              <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Emma Williams" />
            </FormField>
            <FormField label="Age" required>
              <input
                className="input-field"
                type="number"
                min={1}
                max={10}
                value={form.age}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') { setForm(f => ({ ...f, age: '' })); return; }
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num >= 1 && num <= 10) {
                    setForm(f => ({ ...f, age: String(num) }));
                  }
                }}
                onKeyDown={e => {
                  // Block non-numeric keys except control keys
                  if (!/[0-9]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                required
                placeholder="e.g. 4"
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Age must be between 1 and 10 years
              </span>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FormField label="Gender">
              <select className="input-field" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Classroom">
              <select className="input-field" value={form.classroom_id} onChange={e => setForm(f => ({ ...f, classroom_id: e.target.value }))}>
                <option value="">Select classroom...</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FormField label="Parent Name">
              <input className="input-field" value={form.parent_name} onChange={e => setForm(f => ({ ...f, parent_name: e.target.value }))} placeholder="Lisa Williams" />
            </FormField>
            <FormField label="Parent Contact">
              <input className="input-field" value={form.parent_contact} onChange={e => setForm(f => ({ ...f, parent_contact: e.target.value }))} placeholder="+1-555-0101" />
            </FormField>
          </div>
          <FormField label="Risk Level">
            <select className="input-field" value={form.risk_level} onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))}>
              <option value="low">🟡 Low Risk</option>
              <option value="medium">🟠 Medium Risk</option>
              <option value="high">🔴 High Risk</option>
            </select>
          </FormField>
          <FormField label="Notes">
            <textarea className="input-field" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes about the child..." rows={3} style={{ resize: 'vertical' }} />
          </FormField>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editChild ? 'Update Child' : 'Add Child'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete" maxWidth={400}>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
          Are you sure you want to remove this child? All associated allergy data, emergency contacts, and alerts will be deleted. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete Child</button>
        </div>
      </Modal>
    </div>
  );
}

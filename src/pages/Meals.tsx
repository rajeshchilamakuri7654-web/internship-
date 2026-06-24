import React, { useEffect, useState } from 'react';
import { Plus, UtensilsCrossed, Edit, Trash2, Search, X, Loader2 } from 'lucide-react';
import api from '../services/api';
import { Modal, FormField, EmptyState } from '../components/Modal';
import { toast } from '../hooks/useToast';
import { authService } from '../services/auth';

interface Meal {
  id: string; name: string; meal_type: string; ingredients: string[];
  description: string; created_by_name: string; created_at: string;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

const initialForm = { name: '', meal_type: 'lunch', ingredients: '', description: '' };

export default function Meals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isAdmin = authService.getRole() === 'admin';

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/meals');
      setMeals(res.data);
    } catch { toast('Failed to load meals', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMeals(); }, []);

  const openAdd = () => { setEditMeal(null); setForm(initialForm); setShowModal(true); };
  const openEdit = (meal: Meal) => {
    setEditMeal(meal);
    setForm({ name: meal.name, meal_type: meal.meal_type, ingredients: meal.ingredients.join(', '), description: meal.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        meal_type: form.meal_type,
        ingredients: form.ingredients.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
        description: form.description,
      };
      if (editMeal) {
        await api.put(`/meals/${editMeal.id}`, payload);
        toast('Meal updated', 'success');
      } else {
        await api.post('/meals', payload);
        toast('Meal created', 'success');
      }
      setShowModal(false);
      fetchMeals();
    } catch (err: any) { toast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/meals/${deleteId}`);
      toast('Meal deleted', 'success');
      setDeleteId(null);
      fetchMeals();
    } catch { toast('Failed to delete', 'error'); }
  };

  const mealTypeColors: Record<string, string> = {
    breakfast: '#f59e0b', lunch: '#2563eb', snack: '#16a34a', dinner: '#7c3aed',
  };

  const filtered = meals.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.ingredients.some(i => i.includes(search.toLowerCase()));
    const matchType = !filterType || m.meal_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Meal Library</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{filtered.length} meals available</p>
        </div>
        {isAdmin && (
          <button id="add-meal-btn" className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Meal
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', flex: 1, minWidth: 200 }}>
          <Search size={16} color="#64748b" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search meals or ingredients..."
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.875rem', flex: 1 }}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={14} /></button>}
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field" style={{ width: 160 }}>
          <option value="">All Types</option>
          {MEAL_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {/* Meal Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: '1rem' }}>
              <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 60, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 12, width: '80%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            icon={<UtensilsCrossed size={48} />}
            title="No meals found"
            description={search || filterType ? "Try adjusting your search" : "Add your first meal to the library"}
            action={isAdmin ? <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Meal</button> : undefined}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(meal => (
            <div key={meal.id} className="glass-card animate-fade-in" style={{ padding: '1.125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#f1f5f9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meal.name}</h3>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                    color: mealTypeColors[meal.meal_type] || '#64748b',
                    background: `${mealTypeColors[meal.meal_type]}20`,
                    padding: '0.15rem 0.5rem', borderRadius: '9999px', marginTop: '0.375rem', display: 'inline-block',
                  }}>
                    {meal.meal_type}
                  </span>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ padding: '0.3rem', minWidth: 'auto' }} onClick={() => openEdit(meal)}><Edit size={13} /></button>
                    <button className="btn btn-ghost" style={{ padding: '0.3rem', minWidth: 'auto', color: '#f87171' }} onClick={() => setDeleteId(meal.id)}><Trash2 size={13} /></button>
                  </div>
                )}
              </div>

              {meal.description && (
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.5 }}>{meal.description}</p>
              )}

              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>Ingredients</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {meal.ingredients.slice(0, 6).map((ing, i) => (
                    <span key={i} style={{ fontSize: '0.7rem', background: '#0f172a', color: '#94a3b8', border: '1px solid #1e3a5f', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                      {ing}
                    </span>
                  ))}
                  {meal.ingredients.length > 6 && (
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>+{meal.ingredients.length - 6} more</span>
                  )}
                </div>
              </div>

              {meal.created_by_name && (
                <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.75rem', borderTop: '1px solid #1e293b', paddingTop: '0.5rem' }}>
                  Added by {meal.created_by_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editMeal ? `Edit: ${editMeal.name}` : 'Add New Meal'}>
        <form onSubmit={handleSubmit}>
          <FormField label="Meal Name" required>
            <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Chicken Rice Bowl" />
          </FormField>
          <FormField label="Meal Type" required>
            <select className="input-field" value={form.meal_type} onChange={e => setForm(f => ({ ...f, meal_type: e.target.value }))}>
              {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </FormField>
          <FormField label="Ingredients (comma-separated)" required>
            <textarea
              className="input-field"
              value={form.ingredients}
              onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
              required
              placeholder="chicken breast, white rice, carrots, peas, olive oil, salt"
              rows={3}
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
              Separate each ingredient with a comma. These will be matched against child allergies.
            </div>
          </FormField>
          <FormField label="Description">
            <textarea className="input-field" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={2} style={{ resize: 'vertical' }} />
          </FormField>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null} {editMeal ? 'Update Meal' : 'Create Meal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete" maxWidth={400}>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Delete this meal? Associated assignments and alerts may be affected.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete Meal</button>
        </div>
      </Modal>
    </div>
  );
}

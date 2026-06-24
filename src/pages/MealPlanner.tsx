import React, { useEffect, useState } from 'react';
import { Calendar, UtensilsCrossed, Shield, CheckCircle, AlertTriangle, XCircle, Loader2, Plus, ChevronLeft, ChevronRight, Copy, List } from 'lucide-react';
import api from '../services/api';
import { Modal, FormField, EmptyState } from '../components/Modal';
import { MealStatusBadge, AllergyBadge } from '../components/AllergyBadge';
import { toast } from '../hooks/useToast';
import { checkMealSafety } from '../utils/allergyEngine';
import { authService } from '../services/auth';

interface Meal { id: string; name: string; meal_type: string; ingredients: string[]; }
interface Classroom { id: string; name: string; child_count: number; }

const MEAL_TYPES = ['breakfast', 'lunch', 'snack'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getWeekDates(offset: number): Date[] {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function MealPlanner() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [prefillDate, setPrefillDate] = useState('');
  const [form, setForm] = useState({ meal_id: '', classroom_id: '', assigned_date: new Date().toISOString().split('T')[0], notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copying, setCopying] = useState(false);
  const isAdmin = authService.getRole() === 'admin';

  const weekDates = getWeekDates(weekOffset);
  const weekStart = toDateStr(weekDates[0]);
  const weekEnd = toDateStr(weekDates[4]);
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const fetchData = async () => {
    try {
      const [mealsRes, classroomsRes, assignRes, alertsRes] = await Promise.all([
        api.get('/meals'),
        api.get('/classrooms'),
        api.get('/meal-assignments'),
        api.get('/alerts'),
      ]);
      setMeals(mealsRes.data);
      setClassrooms(classroomsRes.data);
      setAssignments(assignRes.data);
      setAlerts(alertsRes.data);
    } catch { toast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const weekAssignments = assignments.filter(a => {
    if (!a.assigned_date) return false;
    const d = a.assigned_date;
    const inWeek = d >= weekStart && d <= weekEnd;
    const inClass = !selectedClassroom || a.classroom_id === selectedClassroom;
    return inWeek && inClass;
  });

  const getCellAssignments = (dateStr: string, mealType: string) =>
    weekAssignments.filter(a => a.assigned_date === dateStr && a.meal_type === mealType);

  const getAssignmentColor = (assignment: any) => {
    const relatedAlerts = alerts.filter(al => al.meal_assignment_id === assignment.id || (al.meal_name === assignment.meal_name && al.classroom_name === assignment.classroom_name));
    if (relatedAlerts.some(al => al.type === 'blocked')) return { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#f87171', label: '⛔ Blocked' };
    if (relatedAlerts.some(al => al.type === 'warning')) return { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fbbf24', label: '⚠️ Warning' };
    return { bg: 'rgba(34,197,94,0.1)', border: '#22c55e', text: '#4ade80', label: '✅ Safe' };
  };

  const previewSafety = async () => {
    if (!form.meal_id || !form.classroom_id) return;
    setPreviewLoading(true);
    try {
      const childrenRes = await api.get('/children', { params: { classroom_id: form.classroom_id, limit: 50 } });
      const children = childrenRes.data.data || [];
      const selectedMeal = meals.find(m => m.id === form.meal_id);
      if (!selectedMeal) return;
      const results = children.map((child: any) => {
        const foodAllergies = (child.allergies || []).filter((a: any) => a.type === 'food');
        return { child_name: child.name, child_id: child.id, ...checkMealSafety(selectedMeal.ingredients, foodAllergies) };
      });
      setPreviewResult({ meal: selectedMeal, children: results });
    } catch { toast('Preview failed', 'error'); }
    finally { setPreviewLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/meal-assignments', form);
      toast(`Meal assigned! ${res.data.alerts_generated} alert(s) generated.`, res.data.alerts_generated > 0 ? 'warning' : 'success');
      setShowAssignModal(false);
      setPreviewResult(null);
      setForm({ meal_id: '', classroom_id: '', assigned_date: new Date().toISOString().split('T')[0], notes: '' });
      await fetchData();
    } catch (err: any) { toast(err.response?.data?.error || 'Assignment failed', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleCopyWeek = async () => {
    const currentWeekAssignments = assignments.filter(a => a.assigned_date >= weekStart && a.assigned_date <= weekEnd);
    if (currentWeekAssignments.length === 0) { toast('No meals to copy from this week', 'warning'); return; }
    setCopying(true);
    try {
      let copied = 0;
      for (const a of currentWeekAssignments) {
        const nextDate = new Date(a.assigned_date);
        nextDate.setDate(nextDate.getDate() + 7);
        await api.post('/meal-assignments', {
          meal_id: a.meal_id, classroom_id: a.classroom_id,
          assigned_date: toDateStr(nextDate), notes: a.notes,
        });
        copied++;
      }
      toast(`✅ ${copied} meals copied to next week!`, 'success');
      setShowCopyModal(false);
      await fetchData();
    } catch { toast('Copy failed', 'error'); }
    finally { setCopying(false); }
  };

  const openAssign = (date: string) => {
    setPrefillDate(date);
    setForm(f => ({ ...f, assigned_date: date }));
    setPreviewResult(null);
    setShowAssignModal(true);
  };

  const mealTypeColors: Record<string, string> = { breakfast: '#f59e0b', lunch: '#2563eb', snack: '#16a34a', dinner: '#7c3aed' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Meal Planner</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Assign and manage meals with safety checks</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', overflow: 'hidden' }}>
            {(['calendar', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '0.4rem 0.875rem', fontSize: '0.8rem', fontWeight: 500, border: 'none', cursor: 'pointer',
                background: view === v ? '#2563eb' : 'transparent',
                color: view === v ? 'white' : '#64748b',
                display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.2s',
              }}>
                {v === 'calendar' ? <Calendar size={14} /> : <List size={14} />}
                {v === 'calendar' ? 'Calendar' : 'History'}
              </button>
            ))}
          </div>
          {isAdmin && (
            <>
              <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => setShowCopyModal(true)}>
                <Copy size={14} /> Copy Week
              </button>
              <button id="assign-meal-btn" className="btn btn-primary" onClick={() => openAssign(weekStart)}>
                <Plus size={16} /> Assign Meal
              </button>
            </>
          )}
        </div>
      </div>

      {view === 'calendar' ? (
        <>
          {/* Calendar controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button className="btn btn-ghost" style={{ padding: '0.4rem' }} onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', minWidth: 200, textAlign: 'center' }}>{weekLabel}</span>
              <button className="btn btn-ghost" style={{ padding: '0.4rem' }} onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={16} /></button>
              {weekOffset !== 0 && <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => setWeekOffset(0)}>Today</button>}
            </div>
            <select className="input-field" style={{ width: 180 }} value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)}>
              <option value="">All Classrooms</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Calendar grid */}
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ width: 90, padding: '0.75rem', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                      Meal Type
                    </th>
                    {weekDates.map((d, i) => {
                      const isToday = toDateStr(d) === toDateStr(new Date());
                      return (
                        <th key={i} style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: isToday ? '#60a5fa' : '#94a3b8', borderBottom: '1px solid #334155', textAlign: 'center', background: isToday ? 'rgba(37,99,235,0.08)' : 'transparent' }}>
                          <div>{DAYS[i]}</div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 400, color: isToday ? '#60a5fa' : '#475569' }}>{d.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {MEAL_TYPES.map(mealType => (
                    <tr key={mealType} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize', color: mealTypeColors[mealType] || '#64748b', background: `${mealTypeColors[mealType]}15`, padding: '0.2rem 0.5rem', borderRadius: '9999px', border: `1px solid ${mealTypeColors[mealType]}30` }}>
                          {mealType}
                        </span>
                      </td>
                      {weekDates.map((d, i) => {
                        const dateStr = toDateStr(d);
                        const cellItems = getCellAssignments(dateStr, mealType);
                        const isToday = dateStr === toDateStr(new Date());
                        return (
                          <td key={i} style={{ padding: '0.5rem', verticalAlign: 'top', minHeight: 80, background: isToday ? 'rgba(37,99,235,0.04)' : 'transparent' }}>
                            <div style={{ minHeight: 70, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {loading ? <div className="skeleton" style={{ height: 40, borderRadius: '0.375rem' }} /> : (
                                <>
                                  {cellItems.map(a => {
                                    const c = getAssignmentColor(a);
                                    return (
                                      <div key={a.id} title={`${a.meal_name} — ${a.classroom_name}\n${c.label}`} style={{ background: c.bg, border: `1px solid ${c.border}40`, borderRadius: '0.375rem', padding: '0.35rem 0.5rem', cursor: 'default' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.3 }}>{a.meal_name}</div>
                                        <div style={{ fontSize: '0.62rem', color: c.text }}>{c.label}</div>
                                      </div>
                                    );
                                  })}
                                  {isAdmin && cellItems.length === 0 && (
                                    <button onClick={() => openAssign(dateStr)} style={{ background: 'transparent', border: '1px dashed #334155', borderRadius: '0.375rem', padding: '0.375rem', color: '#475569', cursor: 'pointer', fontSize: '0.7rem', width: '100%', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155')}>
                                      + Add
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid #1e293b', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {[{ color: '#22c55e', label: '✅ Safe' }, { color: '#f59e0b', label: '⚠️ Warning' }, { color: '#ef4444', label: '⛔ Blocked' }].map(l => (
                <span key={l.label} style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '2px', background: `${l.color}40`, border: `1px solid ${l.color}` }} />{l.label}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* List / History view */
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.25rem 0' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>📋 Assignment History</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Meal</th><th>Type</th><th>Classroom</th><th>Date</th><th>Assigned By</th><th>Notes</th></tr></thead>
              <tbody>
                {loading ? Array(4).fill(0).map((_, i) => <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>)}</tr>)
                  : assignments.length === 0 ? <tr><td colSpan={6}><EmptyState icon={<UtensilsCrossed size={40} />} title="No assignments yet" description="Assign meals to classrooms to see history" /></td></tr>
                  : assignments.slice(0, 30).map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{a.meal_name}</td>
                      <td><span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: mealTypeColors[a.meal_type] || '#64748b' }}>{a.meal_type}</span></td>
                      <td style={{ color: '#94a3b8' }}>{a.classroom_name || '—'}</td>
                      <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{a.assigned_date ? new Date(a.assigned_date).toLocaleDateString() : '—'}</td>
                      <td style={{ color: '#94a3b8' }}>{a.assigned_by_name || '—'}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{a.notes || '—'}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Meal Modal */}
      <Modal isOpen={showAssignModal} onClose={() => { setShowAssignModal(false); setPreviewResult(null); }} title="Assign Meal to Classroom" maxWidth={700}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <FormField label="Select Meal" required>
              <select className="input-field" value={form.meal_id} onChange={e => { setForm(f => ({ ...f, meal_id: e.target.value })); setPreviewResult(null); }} required>
                <option value="">Choose a meal...</option>
                {meals.map(m => <option key={m.id} value={m.id}>{m.name} ({m.meal_type})</option>)}
              </select>
            </FormField>
            <FormField label="Select Classroom" required>
              <select className="input-field" value={form.classroom_id} onChange={e => { setForm(f => ({ ...f, classroom_id: e.target.value })); setPreviewResult(null); }} required>
                <option value="">Choose a classroom...</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} ({c.child_count} children)</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Date" required>
            <input className="input-field" type="date" value={form.assigned_date} onChange={e => setForm(f => ({ ...f, assigned_date: e.target.value }))} required />
          </FormField>
          <FormField label="Notes">
            <input className="input-field" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Morning snack, lunch, etc." />
          </FormField>
          {form.meal_id && form.classroom_id && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-ghost" onClick={previewSafety} disabled={previewLoading} style={{ width: '100%', justifyContent: 'center', borderColor: '#3b82f6', color: '#60a5fa' }}>
                {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                {previewLoading ? 'Checking Safety...' : '🔍 Preview Safety Check'}
              </button>
            </div>
          )}
          {previewResult && (
            <div style={{ marginBottom: '1rem', background: '#0f172a', borderRadius: '0.625rem', padding: '1rem', border: '1px solid #334155' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>🧪 Safety Preview: {previewResult.meal.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {previewResult.children.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#64748b' }}>No children in this classroom</p>
                  : previewResult.children.map((r: any) => (
                    <div key={r.child_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.625rem', background: '#1e293b', borderRadius: '0.375rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>{r.child_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {r.matches.length > 0 && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.matches.map((m: any) => m.allergy).join(', ')}</span>}
                        <MealStatusBadge status={r.status} />
                      </div>
                    </div>
                  ))}
              </div>
              {previewResult.children.some((r: any) => r.status === 'blocked') && (
                <div style={{ marginTop: '0.75rem', padding: '0.625rem', background: 'rgba(220,38,38,0.1)', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#f87171', border: '1px solid rgba(220,38,38,0.2)' }}>
                  ⛔ BLOCKED: One or more children have severe allergies. Alerts will be auto-generated.
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => { setShowAssignModal(false); setPreviewResult(null); }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <UtensilsCrossed size={14} />}
              {submitting ? 'Assigning...' : 'Assign Meal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Copy Week Confirmation Modal */}
      <Modal isOpen={showCopyModal} onClose={() => setShowCopyModal(false)} title="Copy This Week's Meals" maxWidth={420}>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
          This will duplicate all <strong style={{ color: '#e2e8f0' }}>{weekAssignments.length} meal assignments</strong> from the current week ({weekLabel}) to the same days next week.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setShowCopyModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCopyWeek} disabled={copying}>
            {copying ? <><Loader2 size={14} className="animate-spin" /> Copying...</> : <><Copy size={14} /> Copy to Next Week</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, Cell } from 'recharts';
import { Download, TrendingUp, ShieldAlert, CalendarCheck, AlertTriangle, BarChart2, Loader2 } from 'lucide-react';
import api from '../services/api';
import { StatCard, SkeletonCard } from '../components/StatCard';
import { toast } from '../hooks/useToast';
import { timeAgo } from '../utils/allergyEngine';

const ALLERGEN_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f97316', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', fontSize: '0.75rem' }}>
        <p style={{ color: '#94a3b8', margin: 0 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill, fontWeight: 600, margin: '0.25rem 0 0' }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [mainData, setMainData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [main, trends, weekly] = await Promise.all([
          api.get('/analytics'),
          api.get('/analytics/trends'),
          api.get('/analytics/weekly-safety'),
        ]);
        setMainData(main.data);
        setTrendsData(trends.data);
        setWeeklyData(weekly.data);
      } catch {
        toast('Failed to load analytics', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handlePrint = () => window.print();

  const allergens = (mainData?.allergen_distribution || []).slice(0, 8);
  const classrooms = mainData?.classroom_distribution || [];
  const enrollment = (trendsData?.monthly_enrollment || []).map((r: any) => ({
    month: new Date(r.month).toLocaleDateString('en-US', { month: 'short' }),
    enrolled: parseInt(r.count),
  }));
  const alertSeverity = trendsData?.alert_severity || [];
  const weekly = weeklyData;

  return (
    <div ref={printRef} id="analytics-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Analytics Dashboard</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Allergy trends, meal safety, and enrollment insights</p>
        </div>
        <button className="btn btn-ghost" onClick={handlePrint} style={{ gap: '0.5rem' }}>
          <Download size={16} /> Export / Print Report
        </button>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : (<>
          <StatCard title="Total Allergy Records" value={mainData?.total_allergy_records || 0} icon={<ShieldAlert size={22} color="white" />} iconBg="#7c3aed" subtitle="Across all children" />
          <StatCard title="Unique Allergens" value={allergens.length} icon={<AlertTriangle size={22} color="white" />} iconBg="#dc2626" subtitle="Distinct allergy types" />
          <StatCard title="This Week's Meals" value={weekly?.total_assignments || 0} icon={<CalendarCheck size={22} color="white" />} iconBg="#0891b2" subtitle="Scheduled assignments" />
          <StatCard title="Safe Meals" value={weekly?.safe_meals || 0} icon={<TrendingUp size={22} color="white" />} iconBg="#16a34a" subtitle="No conflicts this week" />
        </>)}
      </div>

      {/* Row 1: Allergen Heatmap + Classroom Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Allergen Heatmap */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={16} color="#8b5cf6" /> Allergen Distribution
          </h3>
          {loading ? <div className="skeleton" style={{ height: 220 }} /> : allergens.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {allergens.map((a: any, i: number) => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 80, fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>{a.name}</div>
                  <div style={{ flex: 1, background: '#0f172a', borderRadius: '9999px', height: 20, overflow: 'hidden' }}>
                    <div style={{
                      width: `${a.percentage}%`, height: '100%',
                      background: ALLERGEN_COLORS[i % ALLERGEN_COLORS.length],
                      borderRadius: '9999px',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
                      transition: 'width 0.8s ease',
                      minWidth: 24,
                    }}>
                      <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: 700 }}>{a.percentage}%</span>
                    </div>
                  </div>
                  <div style={{ width: 32, fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>{a.count}</div>
                </div>
              ))}
            </div>
          ) : <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No allergy data</div>}
        </div>

        {/* Classroom Distribution */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>🏫 Classroom Allergy Breakdown</h3>
          {loading ? <div className="skeleton" style={{ height: 220 }} /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={classrooms.map((c: any) => ({ name: c.name?.replace(' Room', '') || 'Room', total: parseInt(c.child_count), allergic: parseInt(c.allergic_count) }))} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{v}</span>} />
                <Bar dataKey="total" name="Total Children" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="allergic" name="With Allergies" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Enrollment Trend */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '1rem' }}>📈 Monthly Enrollment Trend</h3>
        {loading ? <div className="skeleton" style={{ height: 180 }} /> : (
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={enrollment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="enrolled" name="New Enrollments" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Weekly Meal Safety Report */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
            📋 Weekly Meal Safety Report {weekly ? `(${weekly.week_start} — ${weekly.week_end})` : ''}
          </h3>
        </div>
        {loading ? <div className="skeleton" style={{ height: 120 }} /> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { label: 'Total Scheduled', value: weekly?.total_assignments || 0, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                { label: '✅ Safe Meals', value: weekly?.safe_meals || 0, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
                { label: '⚠️ Warnings', value: weekly?.warning_meals || 0, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
                { label: '⛔ Blocked', value: weekly?.blocked_meals || 0, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
              ].map(card => (
                <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}30`, borderRadius: '0.625rem', padding: '0.875rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{card.label}</div>
                </div>
              ))}
            </div>

            {weekly?.recent_alerts?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Recent Alerts This Week
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {weekly.recent_alerts.map((alert: any) => (
                    <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#0f172a', borderRadius: '0.375rem', borderLeft: `3px solid ${alert.severity === 'high' ? '#ef4444' : '#f59e0b'}` }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{alert.title}</span>
                        {alert.child_name && <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '0.5rem' }}>— {alert.child_name}</span>}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#475569' }}>{timeAgo(alert.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Print-only footer */}
      <div className="print-only" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #334155', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        AllergyGuard — Daycare Food Safety Report — Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

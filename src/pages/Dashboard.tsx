import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShieldAlert, UtensilsCrossed, AlertTriangle,
  TrendingUp, Activity, Plus, ArrowRight, Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { StatCard, SkeletonCard } from '../components/StatCard';
import { RiskBadge } from '../components/AllergyBadge';
import { timeAgo, formatDate } from '../utils/allergyEngine';

const PIE_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = data?.stats || {};
  const pieData = (data?.allergy_distribution || []).map((d: any) => ({
    name: d.severity.charAt(0).toUpperCase() + d.severity.slice(1),
    value: parseInt(d.count),
    color: PIE_COLORS[d.severity as keyof typeof PIE_COLORS],
  }));
  const classroomData = (data?.classroom_stats || []).map((c: any) => ({
    name: c.name?.replace(' Room', '') || 'Unknown',
    total: parseInt(c.child_count || 0),
    allergic: parseInt(c.allergic_count || 0),
  }));

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.25rem' }}>
          Good morning, Admin 👋
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {loading ? (
          Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (<>
          <StatCard
            title="Total Children"
            value={stats.total_children || 0}
            icon={<Users size={22} color="white" />}
            iconBg="#2563eb"
            subtitle="Enrolled in daycare"
            onClick={() => navigate('/children')}
          />
          <StatCard
            title="With Allergies"
            value={stats.children_with_allergies || 0}
            icon={<ShieldAlert size={22} color="white" />}
            iconBg="#7c3aed"
            subtitle="Food allergy records"
            onClick={() => navigate('/children?risk_level=high')}
          />
          <StatCard
            title="High Risk"
            value={stats.high_risk_children || 0}
            icon={<AlertTriangle size={22} color="white" />}
            iconBg="#dc2626"
            subtitle="Require close monitoring"
            onClick={() => navigate('/children?risk_level=high')}
          />
          <StatCard
            title="Today's Meals"
            value={stats.today_meals || 0}
            icon={<UtensilsCrossed size={22} color="white" />}
            iconBg="#0891b2"
            subtitle="Meals scheduled today"
            onClick={() => navigate('/meal-planner')}
          />
          <StatCard
            title="Active Alerts"
            value={stats.unread_alerts || 0}
            icon={<Activity size={22} color="white" />}
            iconBg={stats.unread_alerts > 0 ? '#dc2626' : '#16a34a'}
            subtitle="Unread safety alerts"
            onClick={() => navigate('/alerts')}
          />
        </>)}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Allergy distribution pie */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>
            🎯 Allergy Risk Distribution
          </h3>
          {loading ? (
            <div className="skeleton" style={{ height: 180 }} />
          ) : pieData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <ResponsiveContainer width="60%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {pieData.map((d: any) => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                      <span style={{ color: '#94a3b8' }}>{d.name}</span>
                    </span>
                    <span style={{ fontWeight: 700, color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
              No allergy data yet
            </div>
          )}
        </div>

        {/* Classroom chart */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>
            🏫 Classroom Overview
          </h3>
          {loading ? (
            <div className="skeleton" style={{ height: 180 }} />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={classroomData} barSize={20}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', fontSize: '0.75rem' }} />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="allergic" fill="#dc2626" radius={[4, 4, 0, 0]} name="Allergic" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Today's Meals */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>🍽️ Today's Meals</h3>
            <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }} onClick={() => navigate('/meal-planner')}>
              View All <ArrowRight size={12} />
            </button>
          </div>
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: '0.5rem' }} />)
          ) : data?.today_meals?.length > 0 ? (
            data.today_meals.map((meal: any) => (
              <div key={meal.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{meal.meal_name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{meal.classroom_name}</div>
                </div>
                <span style={{ fontSize: '0.7rem', background: '#1e3a5f', color: '#60a5fa', padding: '0.2rem 0.5rem', borderRadius: '9999px', height: 'fit-content', textTransform: 'capitalize' }}>
                  {meal.meal_type}
                </span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
              No meals scheduled today
              <div style={{ marginTop: '0.75rem' }}>
                <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }} onClick={() => navigate('/meal-planner')}>
                  <Plus size={14} /> Assign Meal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>🚨 Recent Alerts</h3>
            <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }} onClick={() => navigate('/alerts')}>
              View All <ArrowRight size={12} />
            </button>
          </div>
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 50, marginBottom: 8, borderRadius: '0.5rem' }} />)
          ) : data?.recent_alerts?.length > 0 ? (
            data.recent_alerts.map((alert: any) => (
              <div key={alert.id} style={{ padding: '0.625rem 0', borderBottom: '1px solid rgba(51,65,85,0.4)', cursor: 'pointer' }} onClick={() => navigate('/alerts')}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: alert.severity === 'high' ? '#f87171' : alert.severity === 'medium' ? '#fbbf24' : '#e2e8f0' }}>
                  {alert.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Clock size={10} />
                  {timeAgo(alert.created_at)}
                  {alert.child_name && <span>• {alert.child_name}</span>}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#4ade80', fontSize: '0.875rem' }}>
              ✅ No active alerts — all clear!
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/children')}>
            <Plus size={16} /> Add Child
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/meals')}>
            <UtensilsCrossed size={16} /> Add Meal
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/meal-planner')}>
            <TrendingUp size={16} /> Assign Meal
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/alerts')}>
            <AlertTriangle size={16} /> View Alerts
          </button>
        </div>
      </div>
    </div>
  );
}

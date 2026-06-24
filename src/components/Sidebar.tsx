import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UtensilsCrossed, Bell, AlertTriangle,
  LogOut, ShieldAlert, BookOpen, Phone, ChevronRight, BarChart2,
  ClipboardList, FileText, Baby,
} from 'lucide-react';
import { authService } from '../services/auth';
import { toast } from '../hooks/useToast';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const role = authService.getRole();

  const handleLogout = () => {
    authService.logout();
    toast('Logged out successfully', 'success');
    navigate('/login');
  };

  // Role-based nav items
  const adminItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/children', icon: Users, label: 'Children' },
    { to: '/meals', icon: UtensilsCrossed, label: 'Meals' },
    { to: '/meal-planner', icon: BookOpen, label: 'Meal Planner' },
    { to: '/alerts', icon: AlertTriangle, label: 'Alert Center' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/digest', icon: FileText, label: 'Daily Digest' },
    { to: '/admin-requests', icon: ClipboardList, label: 'Parent Requests' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/emergency', icon: Phone, label: 'Emergency Contacts' },
  ];

  const teacherItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/children', icon: Users, label: 'Children' },
    { to: '/meals', icon: UtensilsCrossed, label: 'Meals' },
    { to: '/meal-planner', icon: BookOpen, label: 'Meal Planner' },
    { to: '/alerts', icon: AlertTriangle, label: 'Alert Center' },
    { to: '/digest', icon: FileText, label: 'Daily Digest' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/emergency', icon: Phone, label: 'Emergency Contacts' },
  ];

  const parentItems = [
    { to: '/parent-portal', icon: Baby, label: 'My Child' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
  ];

  const navItems = role === 'parent' ? parentItems : role === 'admin' ? adminItems : teacherItems;

  // Group labels for admin
  const getGroupLabel = (index: number) => {
    if (role !== 'admin') return null;
    if (index === 0) return 'Main';
    if (index === 5) return 'Insights';
    if (index === 8) return 'Communication';
    return null;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <ShieldAlert size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>AllergyGuard</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Daycare Safety System</div>
            </div>
          </div>
        </div>

        {/* Role badge */}
        {role === 'parent' && (
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(74,222,128,0.2)' }}>
              👨‍👩‍👧 Parent Account
            </span>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label }, index) => {
            const groupLabel = getGroupLabel(index);
            return (
              <React.Fragment key={to}>
                {groupLabel && (
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.75rem 1.5rem 0.25rem' }}>
                    {groupLabel}
                  </div>
                )}
                {index === 0 && !groupLabel && (
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 1.5rem 0.25rem' }}>
                    Menu
                  </div>
                )}
                <NavLink
                  to={to}
                  end={to === '/' || to === '/parent-portal'}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <Icon size={18} />
                  <span style={{ flex: 1 }}>{label}</span>
                  <ChevronRight size={14} style={{ opacity: 0.4 }} />
                </NavLink>
              </React.Fragment>
            );
          })}
        </nav>

        {/* User section */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid #1e293b' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.625rem', borderRadius: '0.5rem', background: '#1e293b', marginBottom: '0.5rem',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: role === 'parent'
                ? 'linear-gradient(135deg, #16a34a, #0891b2)'
                : role === 'admin'
                  ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                  : 'linear-gradient(135deg, #7c3aed, #db2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'capitalize' }}>
                {user?.role || 'staff'}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleLogout}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

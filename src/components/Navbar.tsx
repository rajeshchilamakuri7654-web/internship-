import React, { useEffect, useState } from 'react';
import { Bell, Menu, Search, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface NavbarProps {
  onMenuToggle: () => void;
  title: string;
}

export function Navbar({ onMenuToggle, title }: NavbarProps) {
  const [alertCount, setAlertCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [alertsRes, notifRes] = await Promise.all([
          api.get('/alerts?is_read=false'),
          api.get('/notifications'),
        ]);
        setAlertCount(alertsRes.data.length);
        setNotifCount(notifRes.data.filter((n: any) => !n.is_read).length);
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-ghost lg:hidden"
          style={{ padding: '0.5rem', minWidth: 'auto' }}
          onClick={onMenuToggle}
        >
          <Menu size={20} />
        </button>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{title}</h1>
        </div>

        {/* Search */}
        {searchOpen ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', minWidth: 240 }}>
            <Search size={16} color="#64748b" />
            <input
              autoFocus
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchValue.trim()) {
                  navigate(`/children?search=${encodeURIComponent(searchValue)}`);
                  setSearchOpen(false); setSearchValue('');
                }
                if (e.key === 'Escape') { setSearchOpen(false); setSearchValue(''); }
              }}
              placeholder="Search children..."
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.875rem', flex: 1 }}
            />
            <button onClick={() => { setSearchOpen(false); setSearchValue(''); }}>
              <X size={14} color="#64748b" />
            </button>
          </div>
        ) : (
          <button
            className="btn btn-ghost"
            style={{ padding: '0.5rem', minWidth: 'auto' }}
            onClick={() => setSearchOpen(true)}
          >
            <Search size={18} />
          </button>
        )}

        {/* Alerts badge */}
        <button
          className="btn btn-ghost"
          style={{ padding: '0.5rem', minWidth: 'auto', position: 'relative' }}
          onClick={() => navigate('/alerts')}
          title="Alert Center"
        >
          <AlertTriangle size={18} color={alertCount > 0 ? '#f87171' : undefined} />
          {alertCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              background: '#dc2626', color: 'white',
              fontSize: '0.6rem', fontWeight: 700,
              width: 16, height: 16, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* Notifications badge */}
        <button
          className="btn btn-ghost"
          style={{ padding: '0.5rem', minWidth: 'auto', position: 'relative' }}
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          <Bell size={18} color={notifCount > 0 ? '#fbbf24' : undefined} />
          {notifCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2,
              background: '#d97706', color: 'white',
              fontSize: '0.6rem', fontWeight: 700,
              width: 16, height: 16, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

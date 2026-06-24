import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

let lastAlertCount = -1;

export function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showBanner, setShowBanner] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);
    if (Notification.permission === 'default') {
      setShowBanner(true);
    }
    if (Notification.permission === 'granted') {
      startPolling();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    setShowBanner(false);
    if (result === 'granted') {
      startPolling();
      new Notification('AllergyGuard Alerts Active 🛡️', {
        body: 'You will now receive real-time allergy safety notifications.',
        icon: '/favicon.ico',
      });
    }
  };

  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        const res = await api.get('/alerts', { params: { is_read: 'false' } });
        const unread: any[] = res.data;
        const count = unread.length;
        if (lastAlertCount >= 0 && count > lastAlertCount) {
          const newAlerts = unread.slice(0, count - lastAlertCount);
          newAlerts.forEach((alert: any) => {
            new Notification(alert.title, {
              body: alert.message || `Severity: ${alert.severity}`,
              icon: '/favicon.ico',
              tag: alert.id,
            });
          });
        }
        lastAlertCount = count;
      } catch { /* silent fail */ }
    }, 60000); // Poll every 60 seconds
  };

  if (!showBanner || permission !== 'default') return null;

  return (
    <div style={{
      position: 'fixed', bottom: '5rem', right: '1.5rem', zIndex: 9000,
      background: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem',
      padding: '1rem 1.25rem', maxWidth: 320, boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      animation: 'slideInRight 0.3s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e2e8f0' }}>🔔 Enable Alerts</span>
        <button onClick={() => setShowBanner(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
      </div>
      <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 0.875rem', lineHeight: 1.5 }}>
        Get real-time browser notifications when allergy conflicts are detected, even when this tab is in the background.
      </p>
      <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={requestPermission}>
        Allow Notifications
      </button>
    </div>
  );
}

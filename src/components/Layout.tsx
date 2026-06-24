import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ToastContainer } from './ToastContainer';
import { PushNotificationManager } from './PushNotificationManager';
import { VoiceAgent } from './VoiceAgent';

interface LayoutProps {
  title?: string;
}

export function Layout({ title = 'Dashboard' }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar onMenuToggle={() => setSidebarOpen(prev => !prev)} title={title} />
        <main style={{ flex: 1, padding: '1.5rem 2rem', maxWidth: '100%', overflowX: 'hidden' }} className="animate-fade-in">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <PushNotificationManager />
      <VoiceAgent />
    </div>
  );
}

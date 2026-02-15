import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    MessageSquare,
    Package,
    Settings,
    Menu,
    X,
    LogOut,
    Wifi,
    WifiOff
} from 'lucide-react';
import styles from './Shell.module.css';

interface ShellProps {
    children: React.ReactNode;
    whatsappConnected?: boolean;
    currentView: 'dashboard' | 'crm' | 'catalog' | 'settings';
    onViewChange: (view: 'dashboard' | 'crm' | 'catalog' | 'settings') => void;
    onGenerateReport?: () => void;
}

export function Shell({ children, whatsappConnected = false, currentView, onViewChange, onGenerateReport }: ShellProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    // const pathname = usePathname(); // Not used in SPA mode

    const navItems = [
        { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
        { name: 'CRM & Chat', id: 'crm', icon: MessageSquare },
        { name: 'Catalog', id: 'catalog', icon: Package },
        { name: 'Settings', id: 'settings', icon: Settings },
    ] as const;

    return (
        <div className={styles.container}>
            {/* Mobile Header */}
            <div className={styles.mobileHeader}>
                <div className={styles.brand}>
                    <div className={styles.logo}>U</div>
                    <span className={styles.brandName}>UrbanClay</span>
                </div>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <X size={24} color="#E5E0D6" /> : <Menu size={24} color="#E5E0D6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
                {/* Brand Header */}
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>U</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className={styles.brandName}>UrbanClay</span>
                        <span style={{ fontSize: '10px', color: '#9f9a94', textTransform: 'uppercase' }}>Sales OS</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.name}
                                onClick={() => {
                                    onViewChange(item.id);
                                    setSidebarOpen(false);
                                }}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                {/* Boss Report Button */}
                <div style={{ padding: '0 16px', marginTop: '16px' }}>
                    <button
                        onClick={onGenerateReport}
                        className={styles.navItem}
                        style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontWeight: 600,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                    >
                        <LayoutDashboard size={20} />
                        Boss Report 📊
                    </button>
                </div>

                {/* System Status Footer */}
                <div className={styles.statusFooter}>
                    <div className={styles.systemStatus}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={`${styles.statusIndicator} ${whatsappConnected ? styles.connected : styles.disconnected}`} />
                            <span style={{ fontSize: '12px', color: '#9f9a94' }}>WhatsApp System</span>
                        </div>
                        {whatsappConnected ? <Wifi size={14} color="var(--success)" /> : <WifiOff size={14} color="var(--error)" />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', color: '#9f9a94', cursor: 'pointer' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(to right, #334155, #475569)', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'white', fontSize: '12px' }}>Rahul Verma</span>
                            <span style={{ fontSize: '10px' }}>Sales Manager</span>
                        </div>
                        <LogOut size={14} style={{ marginLeft: 'auto' }} />
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className={styles.mobileBottomNav}>
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.name}
                            onClick={() => onViewChange(item.id)}
                            className={`${styles.mobileNavItem} ${isActive ? styles.active : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.name}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Main Content Area */}
            <main className={styles.main}>
                {/* Desktop Top Bar */}
                <header className={styles.desktopTopBar}>
                    <h2 style={{ fontFamily: 'var(--font-outfit)', fontWeight: 600, fontSize: '1.25rem', textTransform: 'capitalize' }}>
                        {navItems.find(item => item.id === currentView)?.name || 'Dashboard'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--warm-white)', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            🔔
                        </button>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className={styles.contentArea}>
                    {children}
                </div>
            </main>
        </div>
    );
}

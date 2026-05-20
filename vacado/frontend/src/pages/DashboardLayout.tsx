import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Video, Sparkles,
  LineChart, User, Crown, Bell, Search, LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { group: 'Main', items: [
    { id: '', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'shorts', label: 'My Shorts', icon: Video },
    { id: 'generate', label: 'Generate New', icon: Sparkles, ext: 'AI' },
  ]},
  { group: 'Analytics', items: [
    { id: 'analytics', label: 'Performance', icon: LineChart },
  ]},
  { group: 'Settings', items: [
    { id: 'settings', label: 'Account', icon: User },
    { id: 'subscription', label: 'Subscription', icon: Crown },
  ]},
];

const TITLES: Record<string, { title: string; crumb: string }> = {
  '': { title: 'Dashboard', crumb: 'Overview · last 30 days' },
  generate: { title: 'Generate New', crumb: 'Create a new automated Short' },
  shorts: { title: 'My Shorts', crumb: 'All generated Shorts' },
  subscription: { title: 'Subscription', crumb: 'Manage plan, billing, and usage' },
  analytics: { title: 'Performance', crumb: 'Views, languages, and revenue' },
  settings: { title: 'Account', crumb: 'Profile, security, API keys' },
};

export default function DashboardLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const seg = loc.pathname.replace(/^\/dashboard\/?/, '');
  const meta = TITLES[seg] ?? { title: 'Vacado', crumb: 'Workspace' };
  const initials = (user?.name ?? 'MR').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const plan = user?.subscription?.plan
    ? `${user.subscription.plan[0]}${user.subscription.plan.slice(1).toLowerCase()} Plan`
    : 'Trial';

  const go = async (id: string) => {
    if (id === 'logout') { await logout(); nav('/'); return; }
    nav(id ? `/dashboard/${id}` : '/dashboard');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <a className="sb-logo" onClick={() => nav('/')} style={{ cursor: 'pointer' }}>
          <span className="v">V</span>acado
        </a>
        <nav className="sb-nav">
          {NAV.map((g) => (
            <div className="sb-group" key={g.group}>
              <h6>{g.group}</h6>
              {g.items.map((it) => {
                const Icon = it.icon;
                const active = seg === it.id;
                return (
                  <div key={it.label} className={`sb-item ${active ? 'active' : ''}`} onClick={() => go(it.id)}>
                    <Icon size={19} />
                    <span>{it.label}</span>
                    {'ext' in it && it.ext && <span className="ext">{it.ext}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sb-foot">
          <div className="av">{initials}</div>
          <div className="info">
            <div className="nm">{user?.name ?? 'Marco Reyes'}</div>
            <div className="plan">{plan}</div>
          </div>
          <a className="lo" title="Sign out" onClick={() => go('logout')} style={{ cursor: 'pointer' }}>
            <LogOut size={18} />
          </a>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div><h1>{meta.title}</h1></div>
          <div className="crumb"><b>{meta.crumb}</b></div>
          <div className="right">
            <div className="search">
              <Search size={18} />
              <input placeholder="Search Shorts, movies..." />
            </div>
            <button className="icon-btn" title="Notifications">
              <Bell size={18} />
              <span className="dot">3</span>
            </button>
            <div className="tb-av">{initials}</div>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

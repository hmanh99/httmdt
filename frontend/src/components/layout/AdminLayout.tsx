import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  Ticket,
  ExternalLink,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();

  // Guard check: Must be authenticated and an admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-white">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold font-display">Administrator Access Required</h2>
          <p className="text-xs text-slate-400">
            You must be logged in with verified staff credentials to access the STRIDE administrative console.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="px-5 py-2.5 bg-white text-slate-900 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Staff Sign In
            </button>
            <Link
              to="/"
              className="px-5 py-2.5 bg-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Sneaker Archive', path: '/admin/products', icon: Package },
    { label: 'Client Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Review Moderation', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Promo Coupons', path: '/admin/coupons', icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Dark Luxury Sidebar */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col flex-shrink-0 border-r border-slate-800">
        <div className="p-6 border-b border-slate-800/80">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-white font-display">
              STRIDE
            </span>
            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded">
              ADMIN
            </span>
          </Link>
          <p className="text-[11px] text-slate-400 mt-1">Editorial Footwear Operations</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-white text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Live Storefront
            </span>
            <span className="text-[10px] text-slate-400">Preview ↗</span>
          </Link>

          <div className="pt-2 flex items-center justify-between px-2 text-xs text-slate-400">
            <div className="truncate max-w-[130px]">
              <div className="font-bold text-white truncate">{user.first_name} {user.last_name}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-slate-900">Console</span>
            <span>/</span>
            <span className="capitalize">
              {location.pathname.replace('/admin', '').replace('/', '') || 'Overview'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </span>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

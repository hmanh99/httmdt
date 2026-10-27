import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { Dropdown, Badge } from 'antd';
import type { MenuProps } from 'antd';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { SearchOverlay } from './SearchOverlay';
import { AnnouncementBar } from './AnnouncementBar';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const { getTotalItems, openCart } = useCartStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const totalCartCount = getTotalItems();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenuItems: MenuProps['items'] = isAuthenticated
    ? [
        {
          key: 'header',
          label: (
            <div className="px-2 py-1.5 border-b border-slate-100 font-sans">
              <p className="text-xs font-semibold text-slate-900">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              {isAdmin && (
                <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-900 text-[10px] text-white font-bold rounded">
                  Admin Access
                </span>
              )}
            </div>
          ),
        },
        ...(isAdmin
          ? [
              {
                key: 'admin',
                icon: <ShieldCheck className="w-4 h-4 text-slate-700" />,
                label: <Link to="/admin">Admin Dashboard</Link>,
              },
            ]
          : []),
        {
          key: 'orders',
          icon: <Package className="w-4 h-4 text-slate-700" />,
          label: <Link to="/account/orders">Order History</Link>,
        },
        {
          key: 'profile',
          icon: <Settings className="w-4 h-4 text-slate-700" />,
          label: <Link to="/account/profile">Account Settings</Link>,
        },
        {
          type: 'divider',
        },
        {
          key: 'logout',
          icon: <LogOut className="w-4 h-4 text-rose-600" />,
          label: <span className="text-rose-600 font-medium">Log out</span>,
          onClick: handleLogout,
        },
      ]
    : [
        {
          key: 'login',
          label: <Link to="/login" className="font-semibold text-slate-900">Sign in to STRIDE</Link>,
        },
        {
          key: 'register',
          label: <Link to="/register" className="text-slate-600">Create an account</Link>,
        },
      ];

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-slate-700 hover:text-slate-900 focus:outline-none"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tighter text-slate-950 font-display">
                STRIDE
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                Footwear
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-medium tracking-tight">
              <Link
                to="/catalog"
                className="text-slate-700 hover:text-slate-950 transition-colors py-1"
              >
                All Footwear
              </Link>
              <Link
                to="/catalog?gender=men"
                className="text-slate-700 hover:text-slate-950 transition-colors py-1"
              >
                Men
              </Link>
              <Link
                to="/catalog?gender=women"
                className="text-slate-700 hover:text-slate-950 transition-colors py-1"
              >
                Women
              </Link>
              <Link
                to="/catalog?sort=newest"
                className="text-slate-700 hover:text-slate-950 transition-colors py-1 flex items-center gap-1.5"
              >
                <span>New Releases</span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
              </Link>
              <Link
                to="/catalog?category=performance-running"
                className="text-slate-700 hover:text-slate-950 transition-colors py-1"
              >
                Running
              </Link>
              <Link
                to="/catalog?category=trail-outdoor"
                className="text-slate-700 hover:text-slate-950 transition-colors py-1"
              >
                Outdoor
              </Link>
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-4">
            {/* Desktop Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-full text-xs text-slate-500 font-medium transition-colors border border-slate-200"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search sneakers...</span>
              <kbd className="bg-white border border-slate-300 text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* User Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <button
                className="flex items-center gap-1.5 p-2 text-slate-700 hover:text-slate-950 transition-colors focus:outline-none"
                aria-label="Account menu"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                  <UserIcon className="w-4 h-4 text-slate-700" />
                </div>
                {isAuthenticated && (
                  <span className="hidden xl:inline-block text-xs font-semibold text-slate-800 max-w-[90px] truncate">
                    {user?.first_name}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400 hidden xl:inline-block" />
              </button>
            </Dropdown>

            {/* Shopping Bag Button */}
            <button
              onClick={openCart}
              className="relative p-2 text-slate-800 hover:text-slate-950 transition-colors focus:outline-none flex items-center gap-2"
              aria-label="Shopping bag"
            >
              <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-slate-950 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {totalCartCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <Link
              to="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-semibold text-slate-900 border-b border-slate-100"
            >
              All Footwear
            </Link>
            <Link
              to="/catalog?gender=men"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-700 border-b border-slate-100"
            >
              Men
            </Link>
            <Link
              to="/catalog?gender=women"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-700 border-b border-slate-100"
            >
              Women
            </Link>
            <Link
              to="/catalog?sort=newest"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-700 border-b border-slate-100"
            >
              New Releases
            </Link>
            <Link
              to="/catalog?category=performance-running"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-700 border-b border-slate-100"
            >
              Running
            </Link>
            <Link
              to="/catalog?category=trail-outdoor"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-700"
            >
              Outdoor &amp; Trail
            </Link>

            {isAuthenticated ? (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <p className="text-xs text-slate-500 font-semibold uppercase">Signed in as {user?.email}</p>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-bold text-slate-900"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/account/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-slate-700"
                >
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block text-sm font-semibold text-rose-600"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-lg border border-slate-300 text-sm font-bold text-slate-800"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-lg bg-slate-900 text-sm font-bold text-white"
                >
                  Join Us
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

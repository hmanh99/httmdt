import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { fetchAdminStats } from '../../api/admin';

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Gross Revenue',
      value: stats ? `$${stats.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      color: 'text-sky-600',
      bg: 'bg-sky-50 border-sky-200',
    },
    {
      label: 'Pending Fulfill',
      value: stats?.pending_orders || 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
    },
    {
      label: 'Catalog Items',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-200',
    },
    {
      label: 'Registered Clients',
      value: stats?.total_customers || 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200',
    },
    {
      label: 'Low Stock Alerts',
      value: stats?.low_stock_count || 0,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-200',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">Paid</span>;
      case 'processing':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 uppercase">Processing</span>;
      case 'shipped':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">Shipped</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 uppercase">Delivered</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 uppercase">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Analytics &amp; Fulfillment
        </span>
        <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight uppercase">
          Operations Overview
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time transactional metrics, inventory alerts, and customer activity.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-950 font-display tracking-tight">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Split section: Recent Orders & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                Recent Orders
              </h2>
              <p className="text-xs text-slate-400">Latest customer checkouts awaiting fulfillment</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-slate-900 hover:text-slate-600 flex items-center gap-1 uppercase tracking-wider"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recent_orders && stats.recent_orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Placed At</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recent_orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-slate-900">
                        {ord.order_number}
                      </td>
                      <td className="py-3.5">{getStatusBadge(ord.status)}</td>
                      <td className="py-3.5 font-bold text-slate-900">
                        ${Number(ord.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(ord.created_at).toLocaleDateString()}{' '}
                        {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to="/admin/orders"
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No orders placed yet. Orders will appear here in real-time.
            </div>
          )}
        </div>

        {/* Quick Operations Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-950 text-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Fast Navigation</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintain the luxury catalog, replenish depleted sizes, or create marketing promo discount codes.
            </p>
            <div className="space-y-2 pt-2">
              <Link
                to="/admin/products"
                className="block w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center uppercase tracking-wider transition-colors"
              >
                + Add or Edit Shoes
              </Link>
              <Link
                to="/admin/coupons"
                className="block w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center uppercase tracking-wider transition-colors"
              >
                Manage Promo Coupons
              </Link>
              <Link
                to="/admin/reviews"
                className="block w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center uppercase tracking-wider transition-colors"
              >
                Moderate Client Reviews
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Database Invariants
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Concurrency Protection</span>
                <span className="font-bold text-emerald-600">Pessimistic Locking</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Media Storage</span>
                <span className="font-bold text-slate-900">Local Uploads</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auth Protocol</span>
                <span className="font-bold text-slate-900">JWT + Auto-Refresh</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

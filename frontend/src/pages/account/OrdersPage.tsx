import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Calendar, Truck, ArrowRight, ExternalLink } from 'lucide-react';
import { Pagination, Tag } from 'antd';
import { fetchUserOrders } from '../../api/orders';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
    case 'delivered':
      return <Tag color="success" className="font-bold uppercase tracking-wider">{status}</Tag>;
    case 'shipped':
    case 'processing':
      return <Tag color="processing" className="font-bold uppercase tracking-wider">{status}</Tag>;
    case 'cancelled':
      return <Tag color="error" className="font-bold uppercase tracking-wider">{status}</Tag>;
    case 'pending':
    default:
      return <Tag color="warning" className="font-bold uppercase tracking-wider">{status}</Tag>;
  }
};

export const OrdersPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['user-orders', page],
    queryFn: () => fetchUserOrders(page, 10),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6 font-sans">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-44 bg-slate-200 rounded-2xl" />
        <div className="h-44 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const orders = orderData?.items || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans space-y-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
          Account Management
        </span>
        <h1 className="text-3xl font-black text-slate-950 font-display uppercase tracking-tight">
          ORDER HISTORY &amp; TRACKING
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your previous sneaker purchases and live courier transit statuses.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Orders Yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            You haven&apos;t placed any orders with STRIDE yet. Check out our latest drops!
          </p>
          <Link
            to="/catalog"
            className="inline-block px-6 py-2.5 bg-slate-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs"
            >
              {/* Order Card Header */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">
                      Order Reference
                    </span>
                    <span className="text-slate-900 font-bold font-mono text-sm">
                      {order.order_number}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">
                      Placed On
                    </span>
                    <span className="text-slate-800 font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block">
                      Total
                    </span>
                    <span className="text-slate-900 font-black">
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                  <Link
                    to={`/order-confirmation/${order.order_number}`}
                    className="text-xs font-bold text-slate-900 hover:text-slate-600 flex items-center gap-1"
                  >
                    <span>View Receipt</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Order Items List */}
              <div className="p-6 divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                            Shoe
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.product_name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Size: <span className="font-semibold text-slate-800">{item.size}</span> •{' '}
                          Color: {item.color_name} • Qty: {item.quantity}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {item.sku}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        ${Number(item.total_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {orderData && orderData.total > 10 && (
            <div className="pt-6 flex justify-center">
              <Pagination
                current={page}
                total={orderData.total}
                pageSize={10}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

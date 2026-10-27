import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Package, Truck, Calendar, MapPin, CreditCard, ArrowRight, Copy } from 'lucide-react';
import { notification } from 'antd';
import { fetchOrderDetail } from '../../api/orders';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-confirmation', orderNumber],
    queryFn: () => fetchOrderDetail(orderNumber!),
    enabled: !!orderNumber,
  });

  const handleCopy = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      notification.success({
        message: 'Copied to Clipboard',
        description: `Order number ${orderNumber} copied.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse space-y-6 font-sans">
        <div className="h-12 bg-slate-200 rounded-xl w-1/3 mx-auto" />
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center font-sans space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Order Not Located</h2>
        <p className="text-sm text-slate-500">
          We could not find the order details for &quot;{orderNumber}&quot;.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider"
        >
          Return to STRIDE Home
        </Link>
      </div>
    );
  }

  const addr = order.shipping_address_snapshot;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 font-sans space-y-8">
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-950 font-display uppercase tracking-tight">
          ORDER CONFIRMED
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Thank you for choosing STRIDE. Your footwear has been secured in our vaults and is being prepared for express physical verification.
        </p>
      </div>

      {/* Order Identity Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Order Reference
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-black text-slate-900 font-mono">
                {order.order_number}
              </span>
              <button
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-700 p-1"
                title="Copy reference number"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
              Status
            </span>
            <span className="inline-block px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider rounded-md mt-0.5">
              {order.status}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2.5 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Order Placed</p>
              <p>{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-600">
            <Truck className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Delivery Method</p>
              <p className="capitalize">{order.shipping_method} Shipping</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-600">
            <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Payment</p>
              <p className="uppercase">{order.payment?.payment_method || 'COD'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
          Items Ordered ({order.items.length})
        </h3>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
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
                    Size: <span className="font-semibold text-slate-800">{item.size}</span> • Qty:{' '}
                    <span className="font-semibold text-slate-800">{item.quantity}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">SKU: {item.sku}</p>
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

        {/* Pricing Math */}
        <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Promo Discount</span>
              <span>-${Number(order.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>${Number(order.shipping_fee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${Number(order.tax_amount).toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-slate-950 font-display">
            <span>Total Paid</span>
            <span>${Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Destination Address */}
      {addr && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <MapPin className="w-4 h-4 text-slate-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900 uppercase tracking-wider mb-1">
              Shipping Destination
            </p>
            <p className="font-semibold text-slate-800">{addr.recipient_name} ({addr.phone})</p>
            <p>{addr.street_line1} {addr.street_line2 || ''}</p>
            <p>{addr.city}, {addr.state} {addr.postal_code}, {addr.country}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Link
          to="/account/orders"
          className="flex-1 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors text-center flex items-center justify-center gap-2 shadow-sm"
        >
          <span>View in Order History</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/catalog"
          className="flex-1 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

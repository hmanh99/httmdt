import React from 'react';
import { Drawer } from 'antd';
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

export const CartDrawer: React.FC = () => {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal, getTotalItems } =
    useCartStore();
  const navigate = useNavigate();

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();
  const freeShippingThreshold = 100;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between font-sans">
          <span className="text-base font-bold tracking-tight uppercase">Shopping Bag ({totalItems})</span>
        </div>
      }
      placement="right"
      onClose={closeCart}
      open={isOpen}
      width={440}
      styles={{
        body: { padding: '1.25rem', display: 'flex', flexDirection: 'column' },
        header: { borderBottom: '1px solid #e2e8f0' },
      }}
    >
      {/* Free Shipping Progress */}
      <div className="bg-slate-100 rounded-lg p-3.5 mb-4 border border-slate-200">
        <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
          {amountToFreeShipping > 0 ? (
            <span>
              Add <span className="font-bold text-slate-900">${amountToFreeShipping.toFixed(2)}</span> more for Free Shipping
            </span>
          ) : (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              🎉 You unlocked FREE standard shipping!
            </span>
          )}
          <span className="text-[11px] text-slate-500 font-semibold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progressPercent >= 100 ? 'bg-emerald-600' : 'bg-slate-900'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Cart Items List */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Your bag is empty</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">
            Explore our curated footwear drops and timeless silhouettes.
          </p>
          <button
            onClick={() => {
              closeCart();
              navigate('/catalog');
            }}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
          {items.map((item) => (
            <div key={item.variantId} className="py-4 flex gap-3.5 items-start">
              {/* Product Thumbnail */}
              <div className="w-20 h-20 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-slate-200">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.productSlug}`}
                  onClick={closeCart}
                  className="text-sm font-semibold text-slate-900 hover:text-slate-700 truncate block transition-colors"
                >
                  {item.productName}
                </Link>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                    {item.size}
                  </span>
                  <span>•</span>
                  <span className="truncate">{item.colorName}</span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-slate-300 rounded-md bg-white">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 text-xs font-semibold text-slate-900 min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= item.stockLimit}
                      className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer Footer */}
      {items.length > 0 && (
        <div className="pt-4 border-t border-slate-200 mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-slate-600">Subtotal</span>
            <span className="text-base font-bold text-slate-900">${subtotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Taxes, shipping, and promotional discounts calculated during checkout.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 bg-slate-950 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={closeCart}
              className="w-full py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
};

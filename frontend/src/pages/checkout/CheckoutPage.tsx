import React, { useState, useEffect } from 'react';
import { Steps, Radio, Input, Button, notification, Alert } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
} from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { createOrder, validateCouponCode, fetchSavedAddresses, AddressSnapshot } from '../../api/orders';

export const CheckoutPage: React.FC = () => {
  const { items, getSubtotal, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

  // Shipping Address State
  const [shippingAddress, setShippingAddress] = useState<AddressSnapshot>({
    recipient_name: user?.full_name || '',
    phone: user?.phone || '',
    street_line1: '',
    street_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  });

  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'stripe'>('cod');

  // Customer Notes
  const [customerNotes, setCustomerNotes] = useState('');

  // Promo Code State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Autofill user details
  useEffect(() => {
    if (user && !shippingAddress.recipient_name) {
      setShippingAddress((prev) => ({
        ...prev,
        recipient_name: user.full_name,
        phone: user.phone || '',
      }));
    }
  }, [user]);

  // Load saved addresses if logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedAddresses().then((addrs) => {
        if (addrs.length > 0) {
          const defaultAddr = addrs.find((a) => a.is_default_shipping) || addrs[0];
          setShippingAddress({
            recipient_name: defaultAddr.recipient_name,
            phone: defaultAddr.phone,
            street_line1: defaultAddr.street_line1,
            street_line2: defaultAddr.street_line2 || '',
            city: defaultAddr.city,
            state: defaultAddr.state,
            postal_code: defaultAddr.postal_code,
            country: defaultAddr.country,
          });
        }
      });
    }
  }, [isAuthenticated]);

  const subtotal = getSubtotal();
  const shippingFee =
    shippingMethod === 'express' ? 25 : subtotal >= 100 ? 0 : 15;
  const estimatedTax = Math.round((subtotal - discountAmount) * 0.08 * 100) / 100;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee + estimatedTax);

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');

    try {
      const res = await validateCouponCode(couponCode.trim(), subtotal);
      if (res.is_valid) {
        setAppliedCoupon(couponCode.trim().toUpperCase());
        setDiscountAmount(Number(res.discount_amount));
        notification.success({
          message: 'Promo Code Applied',
          description: res.message,
        });
      } else {
        setCouponError(res.message);
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.detail || 'Failed to validate promo code.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
    setCouponError('');
  };

  // Place Order
  const handlePlaceOrder = async () => {
    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        shipping_address: shippingAddress,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon || undefined,
        customer_notes: customerNotes || undefined,
        items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      };

      const order = await createOrder(payload);
      clearCart();
      navigate(`/order-confirmation/${order.order_number}`);
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || 'An unexpected error occurred during checkout.';

      if (status === 409) {
        setErrorMessage(
          `Inventory Conflict: ${detail} Please adjust your cart before trying again.`
        );
      } else {
        setErrorMessage(detail);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center font-sans space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Your bag is empty</h2>
        <p className="text-sm text-slate-500">
          Add pairs to your shopping bag before proceeding to checkout.
        </p>
        <Link
          to="/catalog"
          className="inline-block px-6 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
        >
          Explore Footwear Archive
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      {/* Top Header */}
      <div className="pb-6 border-b border-slate-200 mb-8 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
            Express Secure Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-display">
            COMPLETE YOUR ORDER
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-bit Encrypted</span>
        </div>
      </div>

      {/* Guest Login Banner */}
      {!isAuthenticated && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div>
            <span className="font-bold">Already a STRIDE Club member?</span>{' '}
            <span>Sign in to use your saved addresses and track rewards.</span>
          </div>
          <Link
            to="/login"
            state={{ from: { pathname: '/checkout' } }}
            className="font-bold text-slate-950 underline underline-offset-2 hover:text-slate-700"
          >
            Sign in
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6">
          <Alert
            message="Checkout Issue"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage('')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Multi-Step Checkout Form */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <Steps
              current={currentStep}
              onChange={(step) => setCurrentStep(step)}
              items={[
                { title: 'Shipping' },
                { title: 'Delivery' },
                { title: 'Payment' },
              ]}
              className="mb-8 font-sans"
            />

            {/* Step 0: Shipping Address */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Shipping Address
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.recipient_name}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, recipient_name: e.target.value })
                      }
                      placeholder="Marcus Aurelius"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, phone: e.target.value })
                      }
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.street_line1}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, street_line1: e.target.value })
                    }
                    placeholder="742 Evergreen Terrace"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apartment, suite, unit (optional)
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.street_line2 || ''}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, street_line2: e.target.value })
                    }
                    placeholder="Apt 4B"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      placeholder="Springfield"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      placeholder="OR"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.postal_code}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, postal_code: e.target.value })
                      }
                      placeholder="97477"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={
                      !shippingAddress.recipient_name ||
                      !shippingAddress.street_line1 ||
                      !shippingAddress.city ||
                      !shippingAddress.state ||
                      !shippingAddress.postal_code
                    }
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-40 transition-all flex items-center gap-1.5"
                  >
                    <span>Continue to Delivery</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Shipping Method */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Delivery Method
                </h3>

                <div className="space-y-3">
                  <label
                    onClick={() => setShippingMethod('standard')}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      shippingMethod === 'standard'
                        ? 'border-slate-950 bg-slate-50/50 ring-1 ring-slate-950'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Radio checked={shippingMethod === 'standard'} />
                      <div>
                        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Standard Ground Delivery
                        </div>
                        <div className="text-xs text-slate-500">
                          3–5 business days • Fully insured &amp; tracked
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {subtotal >= 100 ? (
                        <span className="text-emerald-600 font-bold uppercase">Free</span>
                      ) : (
                        '$15.00'
                      )}
                    </span>
                  </label>

                  <label
                    onClick={() => setShippingMethod('express')}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      shippingMethod === 'express'
                        ? 'border-slate-950 bg-slate-50/50 ring-1 ring-slate-950'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Radio checked={shippingMethod === 'express'} />
                      <div>
                        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span>Express Priority Air</span>
                          <span className="bg-orange-100 text-orange-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                            Fastest
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          1–2 business days • Priority vault dispatch
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900">$25.00</span>
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(0)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Shipping</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Payment Method
                </h3>

                <div className="space-y-3">
                  {/* Cash on Delivery */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-slate-950 bg-slate-50/50 ring-1 ring-slate-950'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Radio checked={paymentMethod === 'cod'} />
                      <div>
                        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span>Cash on Delivery (COD)</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Inspect pairs at your door upon courier delivery before payment.
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Credit / Debit Card (Stripe-ready Stub) */}
                  <label
                    onClick={() => setPaymentMethod('stripe')}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'stripe'
                        ? 'border-slate-950 bg-slate-50/50 ring-1 ring-slate-950'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Radio checked={paymentMethod === 'stripe'} />
                      <div>
                        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-sky-600" />
                          <span>Credit / Debit Card (Stripe Verified)</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Immediate instant confirmation via Visa, Mastercard, or Amex.
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Delivery Notes */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Leave with doorman or ring gate code #1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Delivery</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handlePlaceOrder}
                    className="px-8 py-3.5 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-850 active:scale-[0.99] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Place Order • ${totalAmount.toFixed(2)}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Order Summary ({items.length} items)
            </h3>

            {/* Items Mini List */}
            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.variantId} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                        Shoe
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-[11px] text-slate-500">
                      Size: {item.size} • Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Promotional Code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{appliedCoupon}</span>
                    <span className="text-emerald-600 font-normal">
                      (-${discountAmount.toFixed(2)})
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10, STRIDE20"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs uppercase text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                  <button
                    type="button"
                    disabled={validatingCoupon || !couponCode.trim()}
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  >
                    {validatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-rose-600 mt-1.5">{couponError}</p>}
            </div>

            {/* Financial Math */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Promotional Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Shipping ({shippingMethod})</span>
                <span>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (8%)</span>
                <span>${estimatedTax.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-slate-950 font-display">
                <span>Total Due</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

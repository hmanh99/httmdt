import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-16 border-b border-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">100% Authentic Guaranteed</h4>
              <p className="text-xs text-slate-400 mt-0.5">Every pair verified by our master footwear specialists.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800">
              <Truck className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Express Dispatch</h4>
              <p className="text-xs text-slate-400 mt-0.5">Same-day packaging &amp; fully insured global tracking.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 border border-slate-800">
              <RotateCcw className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Hassle-Free 30-Day Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">Complimentary returns on unworn shoes in original box.</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 py-16">
          {/* Brand Manifesto & Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="text-2xl font-black tracking-tight text-white font-display block">
              STRIDE
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Curated sneaker culture and high-performance technical footwear. Defining the intersection of street craft, archive retros, and modern running engineering.
            </p>

            <div className="pt-2">
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Join the STRIDE Club for Exclusive Drops
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>You&apos;re in. Check your inbox for your 10% welcome voucher.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-white text-slate-950 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Shop</h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/catalog" className="hover:text-white transition-colors">All Sneakers</Link></li>
              <li><Link to="/catalog?gender=men" className="hover:text-white transition-colors">Men&apos;s Footwear</Link></li>
              <li><Link to="/catalog?gender=women" className="hover:text-white transition-colors">Women&apos;s Footwear</Link></li>
              <li><Link to="/catalog?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link to="/catalog?featured=true" className="hover:text-white transition-colors">Featured Drops</Link></li>
              <li><Link to="/catalog?category=performance-running" className="hover:text-white transition-colors">Marathon &amp; Running</Link></li>
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Brands</h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/catalog?brand=nike" className="hover:text-white transition-colors">Nike</Link></li>
              <li><Link to="/catalog?brand=jordan" className="hover:text-white transition-colors">Air Jordan</Link></li>
              <li><Link to="/catalog?brand=adidas" className="hover:text-white transition-colors">Adidas Originals</Link></li>
              <li><Link to="/catalog?brand=new-balance" className="hover:text-white transition-colors">New Balance</Link></li>
              <li><Link to="/catalog?brand=asics" className="hover:text-white transition-colors">Asics Running</Link></li>
              <li><Link to="/catalog?brand=salomon" className="hover:text-white transition-colors">Salomon Advanced</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Client Care</h5>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/account/orders" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/account/profile" className="hover:text-white transition-colors">Account Details</Link></li>
              <li><span className="text-slate-500 cursor-default">Size Guide &amp; Fit</span></li>
              <li><span className="text-slate-500 cursor-default">Shipping Information</span></li>
              <li><span className="text-slate-500 cursor-default">Authenticity Guarantee</span></li>
              <li><span className="text-slate-500 cursor-default">Help &amp; FAQs</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} STRIDE Footwear Inc. All rights reserved. Built with precision.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Cookie Settings</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

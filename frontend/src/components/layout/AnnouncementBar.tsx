import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-slate-950 text-slate-100 text-xs tracking-wider uppercase py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AUTHENTICITY GUARANTEED ON EVERY PAIR</span>
        </div>
        <div className="mx-auto sm:mx-0 flex items-center gap-2">
          <span className="font-medium text-slate-200">
            USE CODE <span className="text-amber-400 font-bold">WELCOME10</span> FOR 10% OFF YOUR FIRST ORDER
          </span>
          <Link
            to="/catalog"
            className="hidden md:inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors underline underline-offset-2 ml-2"
          >
            <span>Shop Now</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="hidden lg:flex items-center gap-4 text-slate-400 text-[11px]">
          <span>FREE DOMESTIC SHIPPING OVER $100</span>
          <span>•</span>
          <span>EASY 30-DAY RETURNS</span>
        </div>
      </div>
    </div>
  );
};

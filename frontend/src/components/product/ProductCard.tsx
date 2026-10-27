import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Star } from 'lucide-react';
import { ProductListItem } from '../../types';

interface ProductCardProps {
  product: ProductListItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const isSoldOut = product.total_stock <= 0;
  const isLowStock = product.total_stock > 0 && product.total_stock <= 5;

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Product Image Frame */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-square bg-slate-100 overflow-hidden">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
            No image available
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {product.is_featured && (
            <span className="px-2 py-0.5 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>Featured</span>
            </span>
          )}
          {isSoldOut ? (
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider rounded">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded">
              Only {product.total_stock} Left
            </span>
          ) : null}
        </div>

        {/* Gender Badge */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-semibold uppercase tracking-wider rounded border border-slate-200">
            {product.gender}
          </span>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Brand & Rating */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
            {product.brand.name}
          </span>
          {product.rating_average > 0 && (
            <div className="flex items-center gap-1 text-slate-700 font-semibold text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{Number(product.rating_average).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <Link
          to={`/products/${product.slug}`}
          className="text-sm font-bold text-slate-900 hover:text-slate-700 line-clamp-1 mb-1 transition-colors"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Available Sizes Pills */}
        <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-3 line-clamp-1">
          <span>{product.available_sizes.length} Sizes</span>
          <span>•</span>
          <span className="text-slate-400 truncate">{product.category.name}</span>
        </div>

        {/* Price & Action */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-base font-black text-slate-950 font-display">
              ${Number(product.base_price).toFixed(2)}
            </span>
          </div>

          <Link
            to={`/products/${product.slug}`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 rounded-md text-xs font-bold transition-all"
          >
            Select Size
          </Link>
        </div>
      </div>
    </div>
  );
};

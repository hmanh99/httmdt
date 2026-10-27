import React, { useState, useMemo } from 'react';
import { ShoppingBag, Check, AlertCircle, Sparkles } from 'lucide-react';
import { ProductDetail, ProductVariant } from '../../types';
import { useCartStore } from '../../store/cartStore';

interface VariantSelectorProps {
  product: ProductDetail;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({ product }) => {
  const { addItem } = useCartStore();

  // Distinct colors
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    product.variants.forEach((v) => {
      if (!map.has(v.color_name)) {
        map.set(v.color_name, v.color_hex);
      }
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product.variants]);

  const [selectedColor, setSelectedColor] = useState<string>(
    colors[0]?.name || product.variants[0]?.color_name || ''
  );

  // Available sizes for the selected color
  const colorVariants = useMemo(() => {
    return product.variants.filter((v) => v.color_name === selectedColor);
  }, [product.variants, selectedColor]);

  // Selected variant
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    colorVariants.find((v) => v.stock_quantity > 0)?.id || colorVariants[0]?.id || null
  );

  const activeVariant = useMemo(() => {
    return product.variants.find((v) => v.id === selectedVariantId) || colorVariants[0];
  }, [product.variants, selectedVariantId, colorVariants]);

  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAddToCart = () => {
    if (!activeVariant || activeVariant.stock_quantity <= 0) return;

    addItem({
      variantId: activeVariant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      sku: activeVariant.sku,
      size: activeVariant.size,
      colorName: activeVariant.color_name,
      colorHex: activeVariant.color_hex,
      price: Number(activeVariant.effective_price),
      imageUrl: product.primary_image || (product.images[0] ? product.images[0].image_url : undefined),
      quantity: 1,
      stockLimit: activeVariant.stock_quantity,
    });

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1800);
  };

  const isOutOfStock = !activeVariant || activeVariant.stock_quantity <= 0;
  const isLowStock = activeVariant && activeVariant.stock_quantity > 0 && activeVariant.stock_quantity <= 5;

  return (
    <div className="space-y-6 font-sans">
      {/* Price & SKU */}
      <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-3xl font-black text-slate-950 font-display">
            ${Number(activeVariant?.effective_price || product.base_price).toFixed(2)}
          </span>
          <span className="text-xs text-slate-400 ml-2">USD</span>
        </div>
        {activeVariant?.sku && (
          <span className="text-xs text-slate-400 font-mono tracking-wider">
            SKU: {activeVariant.sku}
          </span>
        )}
      </div>

      {/* Color Selection */}
      {colors.length > 1 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
            <span>Colorway</span>
            <span className="text-slate-500 font-medium normal-case">{selectedColor}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((c) => {
              const isSelected = c.name === selectedColor;
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    setSelectedColor(c.name);
                    const match = product.variants.find(
                      (v) => v.color_name === c.name && v.stock_quantity > 0
                    );
                    if (match) setSelectedVariantId(match.id);
                  }}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider">
          <span>Select Size (US)</span>
          <span className="text-xs text-slate-500 font-medium underline cursor-pointer hover:text-slate-900">
            Size Guide
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {colorVariants.map((variant) => {
            const isSelected = variant.id === activeVariant?.id;
            const soldOut = variant.stock_quantity <= 0;
            const lowStock = variant.stock_quantity > 0 && variant.stock_quantity <= 4;

            return (
              <button
                key={variant.id}
                disabled={soldOut}
                onClick={() => setSelectedVariantId(variant.id)}
                className={`relative py-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  soldOut
                    ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                    : isSelected
                    ? 'border-slate-950 bg-slate-950 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-slate-900'
                }`}
              >
                <span className="text-sm font-bold">{variant.size}</span>
                {lowStock && (
                  <span
                    className={`text-[9px] font-bold uppercase mt-0.5 ${
                      isSelected ? 'text-amber-300' : 'text-amber-600'
                    }`}
                  >
                    {variant.stock_quantity} left
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stock Status Notice */}
      <div className="flex items-center gap-2 text-xs font-medium">
        {isOutOfStock ? (
          <div className="flex items-center gap-1.5 text-rose-600">
            <AlertCircle className="w-4 h-4" />
            <span>Currently sold out in this size</span>
          </div>
        ) : isLowStock ? (
          <div className="flex items-center gap-1.5 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>Hurry! Only {activeVariant.stock_quantity} pairs remaining in inventory</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <Check className="w-4 h-4" />
            <span>In Stock — Ships within 24 hours</span>
          </div>
        )}
      </div>

      {/* Add To Bag CTA Button */}
      <div className="pt-2">
        <button
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-sm ${
            isOutOfStock
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : addedAnimation
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-950 text-white hover:bg-slate-850 active:scale-[0.99]'
          }`}
        >
          {addedAnimation ? (
            <>
              <Check className="w-5 h-5 animate-bounce" />
              <span>Added to Your Shopping Bag!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
            </>
          )}
        </button>
      </div>

      {/* Perks summary */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Authenticity Verified</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>Free Returns in 30 Days</span>
        </div>
      </div>
    </div>
  );
};

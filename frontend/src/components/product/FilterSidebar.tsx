import React from 'react';
import { Slider, Switch } from 'antd';
import { RotateCcw, Filter, Check } from 'lucide-react';
import { CatalogFacets } from '../../types';

interface FilterSidebarProps {
  facets: CatalogFacets | null;
  selectedBrands: string[];
  setSelectedBrands: (brands: string[]) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedGenders: string[];
  setSelectedGenders: (genders: string[]) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  facets,
  selectedBrands,
  setSelectedBrands,
  selectedCategories,
  setSelectedCategories,
  selectedGenders,
  setSelectedGenders,
  selectedSizes,
  setSelectedSizes,
  priceRange,
  setPriceRange,
  inStockOnly,
  setInStockOnly,
  onReset,
}) => {
  const toggleBrand = (slug: string) => {
    if (selectedBrands.includes(slug)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== slug));
    } else {
      setSelectedBrands([...selectedBrands, slug]);
    }
  };

  const toggleCategory = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== slug));
    } else {
      setSelectedCategories([...selectedCategories, slug]);
    }
  };

  const toggleGender = (gender: string) => {
    if (selectedGenders.includes(gender)) {
      setSelectedGenders(selectedGenders.filter((g) => g !== gender));
    } else {
      setSelectedGenders([...selectedGenders, gender]);
    }
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedCategories.length > 0 ||
    selectedGenders.length > 0 ||
    selectedSizes.length > 0 ||
    inStockOnly ||
    priceRange[0] > (facets?.min_price || 0) ||
    priceRange[1] < (facets?.max_price || 500);

  return (
    <aside className="w-full bg-white rounded-xl border border-slate-200 p-5 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-900" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* In Stock Only Switch */}
      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">In Stock Only</span>
        <Switch
          size="small"
          checked={inStockOnly}
          onChange={(checked) => setInStockOnly(checked)}
        />
      </div>

      {/* Gender Filter */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
          Gender
        </label>
        <div className="flex flex-wrap gap-1.5">
          {['men', 'women', 'unisex'].map((g) => {
            const isSelected = selectedGenders.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGender(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                  isSelected
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Pills Grid */}
      {facets?.sizes && facets.sizes.length > 0 && (
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            Shoe Size (US)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {facets.sizes.map((size) => {
              const isSelected = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`py-1.5 text-xs font-bold rounded-md border text-center transition-all ${
                    isSelected
                      ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {size.replace('US ', '')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brand Selection List */}
      {facets?.brands && facets.brands.length > 0 && (
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            Brand
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {facets.brands.map((b) => {
              const isSelected = selectedBrands.includes(b.slug);
              return (
                <label
                  key={b.id}
                  onClick={() => toggleBrand(b.slug)}
                  className="flex items-center justify-between text-xs cursor-pointer group select-none py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-slate-950 border-slate-950 text-white'
                          : 'border-slate-300 bg-white group-hover:border-slate-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={`text-slate-800 ${isSelected ? 'font-bold' : 'font-medium'}`}>
                      {b.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">{b.count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Selection List */}
      {facets?.categories && facets.categories.length > 0 && (
        <div className="space-y-2.5 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            Category
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {facets.categories.map((c) => {
              const isSelected = selectedCategories.includes(c.slug);
              return (
                <label
                  key={c.id}
                  onClick={() => toggleCategory(c.slug)}
                  className="flex items-center justify-between text-xs cursor-pointer group select-none py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-slate-950 border-slate-950 text-white'
                          : 'border-slate-300 bg-white group-hover:border-slate-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={`text-slate-800 ${isSelected ? 'font-bold' : 'font-medium'}`}>
                      {c.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">{c.count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range Slider */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Price Range
          </label>
          <span className="text-xs font-bold text-slate-900">
            ${priceRange[0]} — ${priceRange[1]}
          </span>
        </div>
        <Slider
          range
          min={facets ? Math.floor(facets.min_price) : 0}
          max={facets ? Math.ceil(facets.max_price) : 500}
          value={priceRange}
          onChange={(val) => setPriceRange(val as [number, number])}
          trackStyle={[{ backgroundColor: '#0f172a' }]}
          handleStyle={[
            { borderColor: '#0f172a', backgroundColor: '#ffffff' },
            { borderColor: '#0f172a', backgroundColor: '#ffffff' },
          ]}
        />
      </div>
    </aside>
  );
};

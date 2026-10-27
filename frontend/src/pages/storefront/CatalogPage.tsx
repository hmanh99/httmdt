import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pagination, Select, Drawer } from 'antd';
import { Filter, SlidersHorizontal, X, ShoppingBag } from 'lucide-react';
import { fetchCatalogFacets, fetchProducts } from '../../api/products';
import { ProductCard } from '../../components/product/ProductCard';
import { FilterSidebar } from '../../components/product/FilterSidebar';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse state from URL
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'featured';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const selectedBrands = searchParams.getAll('brand');
  const selectedCategories = searchParams.getAll('category');
  const selectedGenders = searchParams.getAll('gender');
  const selectedSizes = searchParams.getAll('size');
  const inStockOnly = searchParams.get('in_stock') === 'true';

  const minPriceParam = searchParams.get('min_price');
  const maxPriceParam = searchParams.get('max_price');

  // Fetch live facets
  const { data: facets } = useQuery({
    queryKey: ['catalog-facets'],
    queryFn: fetchCatalogFacets,
  });

  const [priceRange, setPriceRange] = useState<[number, number]>([
    minPriceParam ? parseFloat(minPriceParam) : 0,
    maxPriceParam ? parseFloat(maxPriceParam) : 500,
  ]);

  useEffect(() => {
    if (facets && !minPriceParam && !maxPriceParam) {
      setPriceRange([facets.min_price, facets.max_price]);
    }
  }, [facets, minPriceParam, maxPriceParam]);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch filtered products
  const { data: catalogData, isLoading } = useQuery({
    queryKey: [
      'products',
      search,
      sort,
      page,
      selectedBrands,
      selectedCategories,
      selectedGenders,
      selectedSizes,
      inStockOnly,
      priceRange,
    ],
    queryFn: () =>
      fetchProducts({
        search: search || undefined,
        sort,
        page,
        page_size: 12,
        brand: selectedBrands.length > 0 ? selectedBrands : undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        gender: selectedGenders.length > 0 ? selectedGenders : undefined,
        size: selectedSizes.length > 0 ? selectedSizes : undefined,
        in_stock: inStockOnly || undefined,
        min_price: priceRange[0],
        max_price: priceRange[1],
      }),
  });

  // URL State Updater Helper
  const updateQuery = (key: string, values: string[] | string | null) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    if (Array.isArray(values)) {
      values.forEach((v) => next.append(key, v));
    } else if (values !== null && values !== '') {
      next.set(key, values);
    }
    next.set('page', '1'); // reset page on filter change
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    setSearchParams(next);
    if (facets) {
      setPriceRange([facets.min_price, facets.max_price]);
    }
  };

  const totalResults = catalogData?.total || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Top Banner & Breadcrumb Header */}
      <div className="pb-6 border-b border-slate-200 mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-950 font-display uppercase">
          {search ? `Results for "${search}"` : 'The Footwear Archive'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Showing {totalResults} curated sneaker models matching your criteria
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <FilterSidebar
            facets={facets || null}
            selectedBrands={selectedBrands}
            setSelectedBrands={(b) => updateQuery('brand', b)}
            selectedCategories={selectedCategories}
            setSelectedCategories={(c) => updateQuery('category', c)}
            selectedGenders={selectedGenders}
            setSelectedGenders={(g) => updateQuery('gender', g)}
            selectedSizes={selectedSizes}
            setSelectedSizes={(s) => updateQuery('size', s)}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            inStockOnly={inStockOnly}
            setInStockOnly={(val) => updateQuery('in_stock', val ? 'true' : null)}
            onReset={handleResetFilters}
          />
        </div>

        {/* Mobile Filter Drawer */}
        <Drawer
          title="Filters"
          placement="left"
          onClose={() => setMobileFilterOpen(false)}
          open={mobileFilterOpen}
          width={320}
        >
          <FilterSidebar
            facets={facets || null}
            selectedBrands={selectedBrands}
            setSelectedBrands={(b) => updateQuery('brand', b)}
            selectedCategories={selectedCategories}
            setSelectedCategories={(c) => updateQuery('category', c)}
            selectedGenders={selectedGenders}
            setSelectedGenders={(g) => updateQuery('gender', g)}
            selectedSizes={selectedSizes}
            setSelectedSizes={(s) => updateQuery('size', s)}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            inStockOnly={inStockOnly}
            setInStockOnly={(val) => updateQuery('in_stock', val ? 'true' : null)}
            onReset={handleResetFilters}
          />
        </Drawer>

        {/* Catalog Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar: Mobile filter button + Sort Selector */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-800"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <span className="text-xs text-slate-500 hidden sm:inline-block">
              Page <span className="font-bold text-slate-900">{page}</span> of{' '}
              <span className="font-bold text-slate-900">{catalogData?.total_pages || 1}</span>
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-semibold text-slate-500">Sort by:</span>
              <Select
                value={sort}
                onChange={(val) => updateQuery('sort', val)}
                className="w-44 text-xs"
                options={[
                  { value: 'featured', label: 'Featured Drops' },
                  { value: 'newest', label: 'Newest Arrivals' },
                  { value: 'price_asc', label: 'Price: Low to High' },
                  { value: 'price_desc', label: 'Price: High to Low' },
                ]}
              />
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          {(selectedBrands.length > 0 ||
            selectedCategories.length > 0 ||
            selectedGenders.length > 0 ||
            selectedSizes.length > 0 ||
            inStockOnly) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active:
              </span>
              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/80 text-slate-800 rounded-full text-xs font-medium"
                >
                  <span className="uppercase">{b}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-600"
                    onClick={() =>
                      updateQuery(
                        'brand',
                        selectedBrands.filter((item) => item !== b)
                      )
                    }
                  />
                </span>
              ))}
              {selectedCategories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/80 text-slate-800 rounded-full text-xs font-medium"
                >
                  <span className="capitalize">{c.replace('-', ' ')}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-600"
                    onClick={() =>
                      updateQuery(
                        'category',
                        selectedCategories.filter((item) => item !== c)
                      )
                    }
                  />
                </span>
              ))}
              {selectedSizes.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/80 text-slate-800 rounded-full text-xs font-medium"
                >
                  <span>{s}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-600"
                    onClick={() =>
                      updateQuery(
                        'size',
                        selectedSizes.filter((item) => item !== s)
                      )
                    }
                  />
                </span>
              ))}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                  <span>In Stock Only</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-emerald-950"
                    onClick={() => updateQuery('in_stock', null)}
                  />
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-900 hover:text-slate-600 underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse space-y-4"
                >
                  <div className="w-full aspect-square bg-slate-200 rounded-lg" />
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-6 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : catalogData && catalogData.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalogData.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No sneakers found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                We couldn&apos;t find any pairs matching your current filters. Try expanding your price
                range or clearing active brand and size filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {catalogData && catalogData.total > 12 && (
            <div className="pt-8 flex justify-center">
              <Pagination
                current={page}
                total={catalogData.total}
                pageSize={12}
                onChange={(p) => updateQuery('page', String(p))}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Sparkles, TrendingUp, Compass, Award } from 'lucide-react';
import { fetchBrands, fetchCategories, fetchFeaturedProducts } from '../../api/products';
import { ProductCard } from '../../components/product/ProductCard';

export const HomePage: React.FC = () => {
  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => fetchFeaturedProducts(8),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  return (
    <div className="space-y-20 pb-20 font-sans">
      {/* Editorial Hero Section */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 bg-radial from-slate-900 via-slate-950 to-black opacity-90" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fall / Winter 2026 Curated Selection</span>
            </div>

            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] font-display">
              ICONIC DROPS.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                TIMELESS CRAFT.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
              Discover authenticated rare retros, high-performance marathon champions, and technical trail silhouettes from the world&apos;s most influential footwear houses.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/catalog?sort=newest"
                className="px-8 py-4 bg-white text-slate-950 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-slate-200 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
              >
                <span>Shop New Releases</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/catalog"
                className="px-8 py-4 bg-slate-900/80 border border-slate-800 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-slate-800 transition-all"
              >
                Browse All Footwear
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="pt-8 border-t border-slate-900/80 grid grid-cols-3 gap-6 max-w-lg text-xs">
              <div>
                <p className="text-2xl font-black text-white font-display">30+</p>
                <p className="text-slate-500 uppercase tracking-wider mt-0.5">Iconic Models</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white font-display">100%</p>
                <p className="text-slate-500 uppercase tracking-wider mt-0.5">Verified Genuine</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white font-display">24H</p>
                <p className="text-slate-500 uppercase tracking-wider mt-0.5">Dispatch Time</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1000&auto=format&fit=crop&q=80"
                alt="Air Jordan 1 Chicago Lost & Found"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded w-max border border-amber-400/30">
                  Spotlight Drop
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Air Jordan 1 Retro High OG</h3>
                <p className="text-xs text-slate-300">Chicago &apos;Lost &amp; Found&apos; Reimagined</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-black text-white font-display">$180.00</span>
                  <Link
                    to="/products/air-jordan-1-retro-high-og-chicago-lost-found"
                    className="px-3.5 py-1.5 bg-white text-slate-950 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    View Drop
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Drops Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">
              <Flame className="w-4 h-4 fill-orange-600" />
              <span>Trending Releases</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 font-display">
              FEATURED DROPS
            </h2>
          </div>
          <Link
            to="/catalog?featured=true"
            className="text-sm font-bold text-slate-900 hover:text-slate-600 flex items-center gap-1 group"
          >
            <span>View All Featured</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse space-y-4">
                <div className="w-full aspect-square bg-slate-200 rounded-lg" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Category Spotlight Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            <Compass className="w-4 h-4" />
            <span>Curated Silhouettes</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 font-display">
            SHOP BY CATEGORY
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories?.slice(0, 3).map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className="group relative h-96 rounded-2xl overflow-hidden border border-slate-200 block shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800'}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-xs uppercase font-bold tracking-widest text-slate-300">
                  Category
                </span>
                <h3 className="text-2xl font-black tracking-tight mt-1 mb-2 font-display">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-2 max-w-xs mb-4">
                  {cat.description}
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Brand Showcase */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-black tracking-tight text-slate-950 font-display uppercase">
              Premier Footwear Houses
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Curated official partnerships and archival heritage brands.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {brands?.map((brand) => (
              <Link
                key={brand.id}
                to={`/catalog?brand=${brand.slug}`}
                className="bg-white p-6 rounded-xl border border-slate-200 text-center hover:border-slate-950 hover:shadow-md transition-all flex flex-col items-center justify-center group"
              >
                <span className="text-base font-black tracking-wider uppercase text-slate-900 group-hover:text-slate-950 font-display">
                  {brand.name}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                  Explore
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Story / Brand Manifesto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-slate-950 text-white rounded-3xl p-8 sm:p-14 lg:p-20 overflow-hidden">
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative max-w-2xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>The STRIDE Standard</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight font-display">
              ENGINEERED FOR MOTION.<br />
              AUTHENTICATED FOR LIFE.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              We reject counterfeit culture, artificial scarcity games, and cheap imitation materials. Every sneaker that enters our vaults undergoes rigorous multi-point physical verification before it reaches your doorstep.
            </p>
            <div className="pt-2">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-colors shadow-md"
              >
                <span>Experience the Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

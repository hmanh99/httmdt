import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../api/products';
import { ProductListItem } from '../../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetchProducts({ search: keyword, page_size: 6 });
        setResults(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSelectProduct = (slug: string) => {
    onClose();
    navigate(`/products/${slug}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onClose();
      navigate(`/catalog?search=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={640}
      styles={{
        content: { padding: '1.5rem', borderRadius: '1rem', overflow: 'hidden' },
      }}
    >
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by sneaker name, silhouette, brand (e.g. Jordan, Samba, XT-6)..."
            autoFocus
            className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin flex-shrink-0" />
          ) : keyword ? (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Suggested Quick Searches */}
      {!keyword && (
        <div className="py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Popular Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {['Air Jordan 1', 'Samba OG', 'New Balance 550', 'Salomon XT-6', 'Air Force 1', 'Vaporfly'].map(
              (term) => (
                <button
                  key={term}
                  onClick={() => {
                    setKeyword(term);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-full transition-colors"
                >
                  {term}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Live Results List */}
      {results.length > 0 && (
        <div className="mt-4 max-h-96 overflow-y-auto divide-y divide-slate-100 pr-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Matching Sneakers ({results.length})
          </p>
          {results.map((product) => (
            <div
              key={product.id}
              onClick={() => handleSelectProduct(product.slug)}
              className="py-2.5 flex items-center justify-between gap-3 cursor-pointer group hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                  {product.primary_image && (
                    <img
                      src={product.primary_image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {product.brand.name}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 truncate">
                    {product.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-slate-900">
                  ${Number(product.base_price).toFixed(2)}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}

          <div className="pt-3 text-center">
            <button
              onClick={handleSearchSubmit}
              className="text-xs font-bold text-slate-900 hover:text-slate-700 underline underline-offset-4"
            >
              View all results for &quot;{keyword}&quot; &rarr;
            </button>
          </div>
        </div>
      )}

      {keyword && !loading && results.length === 0 && (
        <div className="py-8 text-center text-slate-500 text-sm">
          No shoes found matching &quot;{keyword}&quot;. Try another brand or model name.
        </div>
      )}
    </Modal>
  );
};
